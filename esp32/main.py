# main.py - ESP32 (MicroPython). Cargar con Thonny. Servidor web con datos en JSON para el dashboard.
import network, socket, time, json
from machine import Pin, ADC, PWM, time_pulse_us
import dht

SSID, CLAVE = 'TU_WIFI', 'TU_CLAVE'      # <-- cambiar
LUZ_INVERTIDA = True                     # True si el módulo LDR baja el valor con más luz
UMBRAL_LLUVIA = 30                       # % de humedad del sensor para considerar lluvia

sensor = dht.DHT11(Pin(4))
pir = Pin(27, Pin.IN)
trig, echo = Pin(13, Pin.OUT), Pin(33, Pin.IN)   # ECHO con divisor de tensión
def adc(p):
    a = ADC(Pin(p)); a.atten(ADC.ATTN_11DB); return a
ldr, mq, lluvia_adc = adc(34), adc(35), adc(36)
servo = PWM(Pin(17), freq=50)

estado = {'cubierta': 'abierta', 'modo': 'auto'}
def mover(c):
    estado['cubierta'] = c
    servo.duty(26 if c == 'abierta' else 77)     # 0° abierta, 90° cerrada (ajustar)

def prom(a):
    return sum(a.read() for _ in range(10)) // 10
def distancia():
    trig.value(0); time.sleep_us(2); trig.value(1); time.sleep_us(10); trig.value(0)
    t = time_pulse_us(echo, 1, 30000)
    return round(t / 58, 1) if t > 0 else -1

datos = {'temp': 0, 'hum': 0}
ultimo_dht = 0
def leer():
    global ultimo_dht
    if time.ticks_diff(time.ticks_ms(), ultimo_dht) > 2500:
        try:
            sensor.measure(); datos['temp'] = sensor.temperature(); datos['hum'] = sensor.humidity()
        except OSError:
            pass
        ultimo_dht = time.ticks_ms()
    luz = prom(ldr) * 100 // 4095
    if LUZ_INVERTIDA: luz = 100 - luz
    llueve = int((4095 - prom(lluvia_adc)) * 100 // 4095 > UMBRAL_LLUVIA)
    if llueve and estado['modo'] == 'auto' and estado['cubierta'] != 'cerrada':
        mover('cerrada')                        # protege el producto aunque no haya dashboard
    return {'temp': datos['temp'], 'hum': datos['hum'], 'gas': prom(mq), 'luz': luz,
            'lluvia': llueve, 'pir': pir.value(), 'dist': distancia(),
            'cubierta': estado['cubierta'], 'modo': estado['modo']}

wlan = network.WLAN(network.STA_IF); wlan.active(True); wlan.connect(SSID, CLAVE)
while not wlan.isconnected(): time.sleep(0.5)
print('IP del ESP32:', wlan.ifconfig()[0])      # escribir esta IP en el dashboard

mover('abierta')
srv = socket.socket(); srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind(('', 80)); srv.listen(3); srv.settimeout(1)

while True:
    d = leer()
    try:
        cl, _ = srv.accept()
    except OSError:
        continue
    try:
        ruta = cl.recv(512).decode().split(' ')[1]
        if ruta.startswith('/cubierta?accion='):
            mover('abierta' if 'abrir' in ruta else 'cerrada'); estado['modo'] = 'manual'
        elif ruta.startswith('/modo?valor='):
            estado['modo'] = 'auto' if 'auto' in ruta else 'manual'
        d = leer()
        cl.send('HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n' + json.dumps(d))
    except Exception as e:
        print('error:', e)
    cl.close()