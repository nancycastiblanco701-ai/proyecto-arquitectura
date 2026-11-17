# main.py - ESP32 (MicroPython). Abrir en Thonny y ejecutar en la placa.
import json
import network
import socket
import time
from machine import ADC, PWM, Pin, time_pulse_us
import dht

SSID = 'TU_WIFI'                         # Configurar localmente en Thonny
CLAVE = 'TU_CLAVE'                       # Configurar localmente en Thonny
TIEMPO_WIFI_MS = 20000
LLUVIA_ACTIVA_BAJA = False              # Este HW-038 indica lluvia con DO en HIGH

sensor = dht.DHT11(Pin(4))
pir = Pin(27, Pin.IN)
trig = Pin(13, Pin.OUT)
echo = Pin(33, Pin.IN)                  # ECHO requiere divisor de tensión


def adc(p):
    a = ADC(Pin(p))
    a.atten(ADC.ATTN_11DB)
    return a


fotoresistencia_adc, mq = adc(35), adc(34)
lluvia_do = Pin(26, Pin.IN, Pin.PULL_UP)  # HW-038 DO; alimentar el módulo a 3V3
servo = PWM(Pin(17), freq=50)


estado = {'cubierta': 'abierta', 'modo': 'auto'}


def mover(c):
    estado['cubierta'] = c
    servo.duty(26 if c == 'abierta' else 77)  # Ajustar al recorrido del servo


mover('abierta')


def prom(a):
    total = 0
    for _ in range(10):
        total += a.read()
    return total // 10


def distancia():
    trig.value(0)
    time.sleep_us(2)
    trig.value(1)
    time.sleep_us(10)
    trig.value(0)
    t = time_pulse_us(echo, 1, 30000)
    return round(t / 58, 1) if t > 0 else -1


datos = {'temp': 0, 'hum': 0}
ultimo_dht = time.ticks_ms() - 3000


def leer():
    global ultimo_dht
    if time.ticks_diff(time.ticks_ms(), ultimo_dht) > 2500:
        try:
            sensor.measure()
            datos['temp'] = sensor.temperature()
            datos['hum'] = sensor.humidity()
        except OSError as error:
            print('Error leyendo el DHT11:', error)
        ultimo_dht = time.ticks_ms()

    # Lectura directa de la fotorresistencia (aumenta al recibir luz)
    lectura_cruda = prom(fotoresistencia_adc)
    luz = lectura_cruda * 100 // 4095

    nivel_lluvia = 0 if LLUVIA_ACTIVA_BAJA else 1
    llueve = int(lluvia_do.value() == nivel_lluvia)
    if llueve and estado['modo'] == 'auto' and estado['cubierta'] != 'cerrada':
        mover('cerrada')

    return {'temp': datos['temp'], 'hum': datos['hum'], 'gas': prom(mq), 'luz': luz,
            'lluvia': llueve, 'pir': pir.value(), 'dist': distancia(),
            'cubierta': estado['cubierta'], 'modo': estado['modo']}


def responder(cliente, codigo, contenido):
    cuerpo = json.dumps(contenido).encode()
    encabezado = ('HTTP/1.1 %s\r\n'
                  'Content-Type: application/json\r\n'
                  'Content-Length: %d\r\n'
                  'Access-Control-Allow-Origin: *\r\n'
                  'Connection: close\r\n\r\n') % (codigo, len(cuerpo))
    cliente.sendall(encabezado.encode() + cuerpo)


if SSID == 'TU_WIFI' or CLAVE == 'TU_CLAVE':
    raise ValueError('Edita SSID y CLAVE en main.py antes de conectarte.')

# Inicialización limpia de la red Wi-Fi
wlan = network.WLAN(network.STA_IF)
wlan.active(False)
time.sleep(1)
wlan.active(True)
wlan.connect(SSID, CLAVE)

inicio_wifi = time.ticks_ms()
while not wlan.isconnected():
    if time.ticks_diff(time.ticks_ms(), inicio_wifi) >= TIEMPO_WIFI_MS:
        raise RuntimeError('No se pudo conectar al Wi-Fi. Revisa SSID y CLAVE.')
    time.sleep_ms(250)
print('IP del ESP32:', wlan.ifconfig()[0])

srv = socket.socket()
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind(('', 80))
srv.listen(3)
srv.settimeout(1)

while True:
    try:
        cl, _ = srv.accept()
    except OSError:
        continue

    try:
        peticion = cl.recv(512).decode().split('\r\n', 1)[0].split()
        if len(peticion) < 2:
            responder(cl, '400 Bad Request', {'error': 'Solicitud no válida'})
            continue

        ruta = peticion[1]
        if ruta.startswith('/cubierta?accion='):
            accion = ruta.split('=', 1)[1]
            if accion not in ('abrir', 'cerrar'):
                responder(cl, '400 Bad Request', {'error': 'Acción no válida'})
                continue
            mover('abierta' if accion == 'abrir' else 'cerrada')
            estado['modo'] = 'manual'
        elif ruta.startswith('/modo?valor='):
            modo = ruta.split('=', 1)[1]
            if modo not in ('auto', 'manual'):
                responder(cl, '400 Bad Request', {'error': 'Modo no válido'})
                continue
            estado['modo'] = modo
        elif ruta != '/datos':
            responder(cl, '404 Not Found', {'error': 'Ruta no encontrada'})
            continue

        responder(cl, '200 OK', leer())
    except (OSError, IndexError, ValueError) as error:
        print('Error procesando la solicitud:', error)
    finally:
        cl.close()