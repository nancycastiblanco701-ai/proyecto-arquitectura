# AgroSecado IoT

### Monitoreo y protección de granos durante el secado y almacenamiento

Prototipo académico de **Ingeniería de Sistemas y Computación** de la
**Universidad de Cundinamarca, Seccional Ubaté**. El proyecto integra sensores,
un ESP32 y una página web para visualizar variables del entorno y apoyar el
cuidado poscosecha de los granos.

---

## ¿Qué hace?

- Presenta las mediciones del prototipo en una consola web.
- Permite usar datos de demostración o conectarse al ESP32 por la red local.
- Muestra alertas según las condiciones configuradas.
- Permite consultar el historial y descargar mediciones en formato CSV.
- Contempla el cierre de una cubierta cuando el HW-038 detecta lluvia.

> Es un prototipo académico. Las lecturas de luz y gas son relativas y no
> sustituyen instrumentos calibrados. El DHT11 mide la humedad del aire, no la
> humedad interna del grano.

## Componentes del prototipo

| Componente | Función |
| --- | --- |
| ESP32 | Lee entradas y comunica los datos con la consola web por Wi-Fi. |
| DHT11 | Mide temperatura y humedad relativa del aire. |
| Fotoresistencia (LDR) | Estima la iluminación en una escala relativa. |
| HW-038 | Detecta agua sobre la placa de lluvia. |
| PIR | Detecta movimiento en el área vigilada. |
| MQ-135 | Registra cambios relativos en la composición del aire. |
| HC-SR04 | Estima el nivel del producto mediante distancia. |
| Servomotor | Acciona la cubierta del patio en el prototipo. |

La asignación de pines, precauciones eléctricas e instrucciones para ejecutar
el firmware están en [`esp32/README.md`](esp32/README.md).

## Abrir la página web

1. Clona o descarga este repositorio.
2. Abre una terminal en la carpeta del proyecto.
3. Inicia un servidor local:

   ```powershell
   py -m http.server 8000
   ```

4. Abre <http://localhost:8000> en el navegador.
5. Usa **Modo demostración** o conecta la consola a la dirección IP del ESP32
   en la misma red local.

La página usa archivos locales de `css/`, `js/`, `img/` y `video/`. La foto de
Ubaté de la sección de contexto se sirve desde Wikimedia Commons y requiere
conexión a Internet; su autoría y licencia aparecen junto a la imagen.

## Ejecutar el ESP32 con Thonny

1. Abre [`esp32/main.py`](esp32/main.py) en Thonny y selecciona MicroPython
   para ESP32.
2. Configura `SSID` y `CLAVE` localmente para la red Wi-Fi de 2.4 GHz. No
   publiques credenciales en GitHub.
3. Ejecuta el programa y anota la IP que aparece en la consola.
4. Escribe esa IP en la consola web y selecciona **Conectar**.

Consulta [`esp32/README.md`](esp32/README.md) antes de conectar los sensores:
algunas salidas necesitan adaptación para no aplicar más de 3.3 V a los GPIO
del ESP32. No se debe alimentar el servomotor desde el pin 3V3 de la placa.

## Equipo

Estudiantes de cuarto semestre de Ingeniería de Sistemas y Computación:

- **Nancy Castiblanco**
- **Yeiner Sánchez**
- **Juan Corredor**
- **Junior Ballesteros**

## Agradecimiento

Expresamos nuestro agradecimiento al profesor por su orientación,
acompañamiento y dedicación durante el desarrollo de este proyecto. Sus
enseñanzas y recomendaciones fueron importantes para convertir nuestras ideas
en un prototipo, aprender durante el proceso y fortalecer nuestro trabajo en
equipo. Gracias por compartir su conocimiento y motivarnos a seguir
aprendiendo.

---

**AgroSecado IoT** · Proyecto académico · Universidad de Cundinamarca,
Seccional Ubaté.
