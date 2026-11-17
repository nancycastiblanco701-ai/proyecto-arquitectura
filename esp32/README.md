# ESP32 + Thonny: secado y almacenamiento de granos

El archivo `main.py` se ejecuta en una placa ESP32 con MicroPython. Publica
las mediciones como JSON en `http://IP_DEL_ESP32/datos` y permite controlar
un servo desde el panel web.

## Conexiones

Usa los números GPIO impresos en la placa, no los números de pin físicos.
Todas las tierras (GND) deben compartir referencia. **Ningún GPIO del ESP32
tolera 5 V.**

| Componente / señal | ESP32 | Alimentación y notas |
| --- | --- | --- |
| DHT11 DATA | GPIO 4 | VCC a 3V3 y GND. El sensor suelto necesita una resistencia pull-up de 4.7–10 kΩ entre DATA y 3V3; muchos módulos ya la incluyen. |
| PIR OUT | GPIO 27 | GND común. Alimenta el módulo según su modelo; un HC-SR501 normalmente admite 5 V. Verifica que OUT no supere 3.3 V. |
| HC-SR04 TRIG | GPIO 13 | VCC a 5 V y GND común. |
| HC-SR04 ECHO | GPIO 33 | **No conectar ECHO directamente.** Usa divisor: ECHO → resistencia de 1 kΩ → nodo GPIO 33; del nodo conecta 1.8 kΩ a GND. |
| Fotoresistencia LDR | GPIO 35 | Si es el componente suelto, forma un divisor: conecta 3V3 → resistencia fija de 10 kΩ → nodo GPIO 35 → LDR → GND. No conectes el GPIO directamente a 3V3. |
| Salida analógica del MQ (por ejemplo MQ-2) | GPIO 34 | Muchos módulos MQ requieren 5 V. Si AO puede llegar a 5 V, usa divisor: AO → 10 kΩ → nodo GPIO 34; del nodo conecta 15 kΩ a GND. GND común. |
| HW-038, salida digital DO | GPIO 26 | Alimenta el módulo comparador a 3V3 y conecta GND a GND. Usa DO para la detección; AO queda sin conectar. Ajusta el potenciómetro del módulo para definir la sensibilidad. |
| Señal del servo | GPIO 17 | Alimenta el servo desde una fuente regulada externa de 5 V con corriente suficiente; une el GND de esa fuente al GND del ESP32. No alimentes el servo desde el pin 3V3. |

GPIO 34 y 35 son entradas solamente; por eso se usan para lecturas analógicas.
El pin GPIO 26 queda como entrada digital del HW-038. Alimenta el comparador
del HW-038 a 3V3 para que su salida DO no aplique 5 V al ESP32. Todas las
tierras (GND) deben estar conectadas en común.

El divisor del HC-SR04 reduce el ECHO de 5 V a un nivel seguro para el ESP32.
El servo de ejemplo es un servo posicional pequeño: ajusta `mover()` para el
recorrido de tu mecanismo y comprueba primero que no fuerce topes. No conectes
un motor, relé o actuador de potencia directamente a un GPIO; requiere su
etapa de control y protecciones adecuadas.

## Preparar y ejecutar en Thonny

1. Instala/selecciona MicroPython para ESP32 en **Herramientas → Opciones →
   Intérprete** y elige el puerto COM de la placa.
2. Abre `esp32/main.py`. Cambia `SSID` y `CLAVE` por las credenciales de tu
   red de 2.4 GHz. No publiques ni subas esas credenciales al repositorio.
3. Pulsa **Ejecutar**. La consola debe mostrar `IP del ESP32: ...`. Si aparece
   un error de Wi-Fi, revisa las credenciales, la cobertura y que la red sea
   compatible con ESP32.
4. Para ejecutarlo automáticamente al encender, guarda el archivo en la placa
   con el nombre `main.py` desde Thonny. Para detenerlo, usa el botón **Stop**.
5. Conecta el computador y el ESP32 a la misma red. Desde la carpeta raíz del
   proyecto, sirve el panel con `py -m http.server 8000` y abre
   `http://localhost:8000` en el navegador.
6. Escribe la IP que mostró Thonny en el campo del panel y pulsa **Conectar**.

El panel espera estos campos JSON: `temp`, `hum`, `gas`, `luz`, `lluvia`,
`pir`, `dist`, `cubierta` y `modo`. Si el ultrasonido no devuelve una lectura,
el nivel se muestra como no disponible y el panel genera una alerta, en vez de
interpretar el error como un silo lleno.

## Ajustes y límites de las lecturas

- El DHT11 mide temperatura y humedad del aire; no mide directamente el
  porcentaje de humedad dentro del grano. Para decidir si un lote está seco,
  hace falta un medidor de humedad para granos adecuado al cultivo.
- `LUZ_INVERTIDA`: déjalo en `True` si la lectura ADC disminuye al aumentar
  la luz; de lo contrario cámbialo a `False`. Con el divisor recomendado
  (3V3 → 10 kΩ → GPIO 35 → LDR → GND), más luz reduce la resistencia del LDR y
  disminuye la lectura ADC, por lo que corresponde `True`.
- La lectura de la fotoresistencia se convierte a una escala relativa de 0 a
  100 %. No representa lux ni una medición calibrada de iluminancia; para
  obtener lux se necesita un sensor calibrado y una conversión específica.
- El HW-038 detecta lluvia por su salida digital `DO`; ajusta el potenciómetro
  del comparador hasta que cambie de estado al mojar la placa. En la instalación
  actual, `DO` pasa a HIGH cuando detecta agua.
- El valor `gas` es una lectura ADC sin calibrar, **no** una concentración en
  ppm ni un medidor certificado de calidad del aire. Ajusta el umbral del
  panel observando lecturas reales; los sensores MQ necesitan calentamiento.
- Ajusta en el panel las distancias de silo vacío y lleno a la instalación real.
  La distancia se mide desde el ultrasonido hacia la superficie del grano.
- La detección automática de lluvia cierra el servo, pero el cierre mecánico y
  la posición segura deben probarse antes de dejar el equipo sin supervisión.
