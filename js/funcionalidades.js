// funcionalidades.js - interacciones de AgroSecado IoT
const WHATSAPP = '57XXXXXXXXXX';   // <-- pon aquí el número con indicativo, sin + ni espacios (ej. 573001234567)
(function(){
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const st = document.createElement('style');
st.textContent = '.subir{position:fixed;right:22px;bottom:22px;z-index:1500;width:46px;height:46px;padding:0;border-radius:50%;opacity:0;pointer-events:none;transition:opacity .3s,transform .2s}.subir.ver{opacity:1;pointer-events:auto}.zoom{position:fixed;inset:0;z-index:3000;display:none;place-items:center;padding:24px;background:rgba(28,38,34,.88);cursor:zoom-out}.zoom.abierto{display:grid;animation:ap .3s}.zoom img{max-width:min(1000px,100%);max-height:88vh;border-radius:12px;background:#fff}.media img,.destacado img{cursor:zoom-in}';
document.head.appendChild(st);
const wa = t => 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(t);
  // Menú, subir, progreso y sección activa
$('#navToggle').onclick = () => $('#navLinks').classList.toggle('open');
$$('#navLinks a').forEach(a => a.onclick = () => $('#navLinks').classList.remove('open'));
const sub = document.createElement('button'); sub.className = 'subir'; sub.setAttribute('aria-label', 'Volver arriba'); sub.innerHTML = '&#8593;';
sub.onclick = () => scrollTo({top:0, behavior:'smooth'}); document.body.appendChild(sub);
const secs = $$('section[id]'), links = $$('#navLinks a');
addEventListener('scroll', () => {
    const h = document.documentElement;
    $('#progreso').style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
    let a = secs[0].id; secs.forEach(s => { if (s.getBoundingClientRect().top < 140) a = s.id; });
    links.forEach(l => l.classList.toggle('activo', l.getAttribute('href') === '#' + a));
    sub.classList.toggle('ver', h.scrollTop > 600);
}, {passive:true});
  // Aparición al hacer scroll y contadores animados
const cuenta = el => { const n = +el.dataset.n, pre = el.dataset.pre || '', suf = el.dataset.suf || ''; let v = 0;
    const id = setInterval(() => { v += Math.max(1, n / 40); if (v >= n){ v = n; clearInterval(id); } el.textContent = pre + Math.round(v) + suf; }, 30); };
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('visible'); e.target.querySelectorAll('[data-n]').forEach(cuenta); io.unobserve(e.target); } }), {threshold:.15});
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 80 + 'ms'; io.observe(el); });
  // Palabra que cambia en el título
const pal = ['cosecha', 'esfuerzo', 'trabajo', 'ganancia', 'tranquilidad']; let pi = 0;
setInterval(() => { pi = (pi + 1) % pal.length; $('#rot').textContent = pal[pi]; }, 2400);
  // Carrusel
const slides = $$('.slide'), dots = $$('.dot'); let n = 0, t;
const ir = i => { n = (i + slides.length) % slides.length; slides.forEach((s, k) => s.classList.toggle('active', k === n)); dots.forEach((d, k) => d.classList.toggle('active', k === n)); };
const auto = () => { clearInterval(t); t = setInterval(() => ir(n + 1), 5000); };
$('#sliderPrev').onclick = () => { ir(n - 1); auto(); }; $('#sliderNext').onclick = () => { ir(n + 1); auto(); };
dots.forEach((d, k) => d.onclick = () => { ir(k); auto(); });
$('#heroSlider').onmouseenter = () => clearInterval(t); $('#heroSlider').onmouseleave = auto; auto();
  // Pestañas
$$('.tab-btn').forEach(b => b.onclick = () => {
    $$('.tab-btn').forEach(x => x.classList.remove('active')); $$('.tab-panel').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); document.getElementById(b.dataset.tab).classList.add('active');
});
  // Metodología Design Thinking
const pasos = [
    ['Empatizar', 'Conocemos a quien vive el problema: productores que secan y almacenan granos en Ubaté. Entrevistas, observación en campo y mapa de empatía para entender qué pierden y por qué.'],
    ['Definir', 'Convertimos lo aprendido en un problema claro: los productores necesitan saber en tiempo real el estado de su grano para no perder calidad ni ingresos por humedad, moho, lluvia o plagas.'],
    ['Idear', 'Lluvia de ideas con muchas alternativas de sensores y soluciones. Priorizamos las más útiles, económicas y fáciles de conseguir, y descartamos las que complicaban el prototipo.'],
    ['Prototipar', 'Construimos el sistema con ESP32, sensores de temperatura, humedad, aire, luz, lluvia, movimiento y nivel, un servomotor para la cubierta y un panel de control web.'],
    ['Evaluar', 'Probamos el prototipo con mediciones, simulaciones de lluvia y humedad y opiniones de usuarios. Con los resultados ajustamos umbrales y mejoramos el diseño.']];
$$('.paso').forEach(b => b.onclick = () => {
    $$('.paso').forEach(x => x.classList.remove('active')); b.classList.add('active');
    const p = pasos[+b.dataset.p], c = $('.paso-info'); $('#pasoT').textContent = p[0]; $('#pasoD').textContent = p[1]; $('#pasoImg').src = 'img/' + ['empatizar', 'definirjpg', 'idear', 'prototipar', 'Evaluar'][+b.dataset.p] + '.jpg';
    c.classList.remove('cambia'); void c.offsetWidth; c.classList.add('cambia');
});
$('.paso.active').click();
  // Imágenes: ampliar al hacer clic y reparar las que no cargan
const zoom = document.createElement('div'); zoom.className = 'zoom'; zoom.innerHTML = '<img alt="">'; document.body.appendChild(zoom);
$$('.media img, .destacado img').forEach(im => im.onclick = () => { zoom.firstChild.src = im.src; zoom.firstChild.alt = im.alt; zoom.classList.add('abierto'); });
zoom.onclick = () => zoom.classList.remove('abierto');
const exts = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'PNG'];
const reparar = im => { const k = +(im.dataset.t || 0), base = im.getAttribute('src').replace(/\.[a-zA-Z]+$/, '');
    if (k < exts.length){ im.dataset.t = k + 1; im.src = base + '.' + exts[k]; }
    else { const d = document.createElement('div'); d.className = 'sin-foto'; d.textContent = 'Falta la foto: revisa img/' + base.split('/').pop(); im.replaceWith(d); } };
$$('img').forEach(im => { im.addEventListener('error', () => reparar(im)); if (im.complete && im.naturalWidth === 0) reparar(im); });
  // WhatsApp
$$('[data-wa]').forEach(a => { a.href = wa(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener'; });
const flota = document.createElement('a'); flota.className = 'wa-flota'; flota.textContent = 'WA'; flota.setAttribute('aria-label', 'Escribir por WhatsApp');
flota.href = wa('Hola, quiero información sobre AgroSecado IoT'); flota.target = '_blank'; flota.rel = 'noopener'; document.body.appendChild(flota);
  // Chatbot
const btn = document.createElement('button'); btn.className = 'chat-btn'; btn.textContent = 'Chatea con nosotros';
const chat = document.createElement('div'); chat.className = 'chat';
chat.innerHTML = '<div class="chat-top">Asistente AgroSecado<small>Respuestas al instante</small></div><div class="chat-msgs"></div><div class="rapidas"></div><form class="chat-in"><input placeholder="Escribe tu pregunta" aria-label="Pregunta"><button>Enviar</button></form>';
document.body.append(btn, chat);
const msgs = chat.querySelector('.chat-msgs'), rap = chat.querySelector('.rapidas'), inp = chat.querySelector('input');
const norm = x => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const val = id => ($(id) ? $(id).textContent : '--');
const R = [
    [['que es', 'agrosecado', 'sistema', 'proyecto', 'funciona'], 'AgroSecado IoT es un sistema que vigila el grano en el patio de secado y en la bodega, cierra la cubierta cuando llueve y muestra todo en un panel de control con alertas.'],
    [['sensor', 'componente', 'hardware', 'esp32', 'mide'], 'Usamos un ESP32 con sensores de temperatura y humedad (DHT11), calidad del aire (MQ-135), luz (LDR), lluvia, movimiento (PIR) y nivel del producto (ultrasonico), mas un servomotor para la cubierta.'],
    [['lluvia', 'llueve', 'cubierta', 'techo', 'tejado'], 'Si el sensor detecta lluvia, el servomotor cierra la cubierta en pocos segundos para proteger el grano, incluso si no hay nadie presente.'],
    [['humedad', 'moho', 'hongo', 'fermenta', 'gases'], 'El DHT11 vigila la humedad y el MQ-135 detecta gases asociados al moho. Si pasan los umbrales, el panel muestra una alerta.'],
    [['ahora', 'actual', 'temperatura', 'estado', 'como esta'], () => 'Ahora mismo el panel marca: temperatura ' + val('#vTemp') + ' C, humedad ' + val('#vHum') + ' %, aire ' + val('#vGas') + ', lluvia: ' + val('#vLluvia') + ', cubierta: ' + val('#vCub') + '.'],
    [['consola', 'panel', 'probar', 'demo', 'dashboard', 'conectar', 'ip'], 'En la seccion Consola puedes usar el modo demostracion o escribir la IP de tu ESP32 y pulsar Conectar.'],
    [['integrante', 'equipo', 'quien', 'nombre', 'nosotros', 'autores'], 'El equipo: Nancy Castiblanco, Yeiner Sánchez, Juan Corredor y Junior Ballesteros. Los cuatro cursan cuarto semestre de Ingeniería de Sistemas y Computación.'],
    [['universidad', 'ubate', 'seccional', 'estudian'], 'Somos estudiantes de la Universidad de Cundinamarca, Seccional Ubate.'],
    [['mision', 'vision', 'objetivo'], 'Nuestra mision es desarrollar soluciones IoT accesibles que protejan la cosecha de los productores rurales de Ubate. Nuestra vision es ser referente regional en tecnologia poscosecha de bajo costo.'],
    [['metodologia', 'design', 'thinking', 'fases'], 'Usamos Design Thinking en cinco fases: empatizar, definir, idear, prototipar y evaluar. Puedes verlas en la seccion Metodologia.'],
    [['precio', 'costo', 'cuanto', 'vale', 'cotizar'], 'Usamos componentes economicos y faciles de conseguir. Escribenos por WhatsApp y te orientamos segun tu bodega o patio.'],
    [['datos', 'csv', 'historial', 'lote', 'trazabilidad'], 'La consola guarda las mediciones de cada lote y permite descargarlas en CSV para llevar trazabilidad.'],
    [['contacto', 'whatsapp', 'hablar', 'asesor', 'llamar'], 'Con gusto. Toca el boton verde de WhatsApp o usa el boton Escribir por WhatsApp de la seccion de contacto.'],
    [['hola', 'buenas', 'gracias', 'ayuda'], 'Hola, soy el asistente de AgroSecado IoT. Puedo hablarte del sistema, los sensores, el equipo o mostrarte los datos del panel.']];
const say = (t, c) => { const m = document.createElement('div'); m.className = 'msg ' + c; m.textContent = t; msgs.appendChild(m); msgs.scrollTop = msgs.scrollHeight; return m; };
const responder = q => { const e = document.createElement('div'); e.className = 'msg bot escribe'; e.innerHTML = '<i></i><i></i><i></i>'; msgs.appendChild(e); msgs.scrollTop = msgs.scrollHeight;
    setTimeout(() => { e.remove(); const nq = norm(q); let mejor = null, max = 0;
    R.forEach(x => { const sc = x[0].filter(k => nq.includes(k)).length; if (sc > max){ max = sc; mejor = x; } });
    say(mejor ? (typeof mejor[1] === 'function' ? mejor[1]() : mejor[1]) : 'No tengo esa respuesta todavia. Prueba con una de las opciones o escribenos por WhatsApp.', 'bot'); }, 700); };
['¿Qué es AgroSecado?', '¿Qué sensores usa?', '¿Y si llueve?', '¿Cómo está el grano ahora?', '¿Quiénes son los integrantes?', 'Hablar por WhatsApp'].forEach(q => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = q;
    b.onclick = () => { say(q, 'yo'); if (q.startsWith('Hablar')) open(wa('Hola, quiero información sobre AgroSecado IoT'), '_blank'); else responder(q); };
    rap.appendChild(b); });
chat.querySelector('form').onsubmit = e => { e.preventDefault(); const q = inp.value.trim(); if (!q) return; say(q, 'yo'); inp.value = ''; responder(q); };
btn.onclick = () => { chat.classList.toggle('abierto'); if (!msgs.children.length) say('¡Hola! Soy el asistente de AgroSecado IoT. ¿En qué te puedo ayudar?', 'bot'); };
addEventListener('keydown', e => {
    if (e.key === 'Escape'){ zoom.classList.remove('abierto'); chat.classList.remove('abierto'); }
    if (/Arrow(Left|Right)/.test(e.key) && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)){ ir(n + (e.key === 'ArrowRight' ? 1 : -1)); auto(); }
});
  // Galería con filtros
$$('.fil').forEach(b => b.onclick = () => { $$('.fil').forEach(x => x.classList.remove('active')); b.classList.add('active');
    $$('.gal-i').forEach(i => i.classList.toggle('oculto', b.dataset.f !== 'todo' && i.dataset.c !== b.dataset.f)); });
$$('.gal-i img').forEach(im => im.onclick = () => { zoom.firstChild.src = im.src; zoom.classList.add('abierto'); });
  // Comparador antes y después
$('#cmpR').oninput = e => $('#cmp').style.setProperty('--p', e.target.value + '%');
  // Simulador de pérdidas
const num = id => +$(id).value || 0, cop = v => '$ ' + Math.round(v).toLocaleString('es-CO');
  const sim = () => { const p = num('#kg') * num('#precio') * num('#perd') / 100;
    $('#resPerd').textContent = cop(p); $('#resAhorro').textContent = cop(p * num('#red') / 100);
    $('#perdV').textContent = num('#perd') + ' %'; $('#redV').textContent = num('#red') + ' %'; };
$$('#simulador input').forEach(i => i.oninput = sim); sim();
  // Cubo 3D de sensores: arrastrar para girar, tocar una cara para ver el sensor
const cubo = $('#cubo'), esc = $('.escena'); let rx = -20, ry = 30, arr = false, px = 0, py = 0;
const info = [['DHT11', 'Mide la temperatura y la humedad del aire.'], ['MQ-135', 'Detecta gases de fermentación y calidad del aire.'], ['Fotorresistencia (LDR)', 'Mide la luz solar disponible para el secado.'],
    ['Sensor de lluvia', 'Detecta agua y activa el cierre de la cubierta.'], ['Sensor PIR', 'Detecta movimiento en la bodega fuera de horario.'], ['HC-SR04', 'Mide el nivel del producto sin contacto.']];
['f1', 'f2', 'f3', 'f4', 'f5', 'f6'].forEach((c, i) => $('.' + c).onclick = () => { $('#cuboInfo').innerHTML = '<h3>' + info[i][0] + '</h3><p>' + info[i][1] + '</p>'; });
esc.onpointerdown = e => { arr = true; px = e.clientX; py = e.clientY; };
addEventListener('pointerup', () => arr = false);
  addEventListener('pointermove', e => { if (arr){ ry += (e.clientX - px) * .6; rx -= (e.clientY - py) * .6; px = e.clientX; py = e.clientY; } });
(function giro(){ if (!arr) ry += .4; cubo.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)'; requestAnimationFrame(giro); })();
  // Inclinación 3D en tarjetas y luz que sigue al mouse en el hero
$$('.tarjeta, .persona, .contadores div').forEach(c => {
    c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect();
      c.style.transform = 'perspective(700px) rotateX(' + (((e.clientY - r.top) / r.height - .5) * -6) + 'deg) rotateY(' + (((e.clientX - r.left) / r.width - .5) * 6) + 'deg) translateY(-6px)'; });
    c.addEventListener('mouseleave', () => c.style.transform = ''); });
const hero = $('.hero');
hero.addEventListener('mousemove', e => { const r = hero.getBoundingClientRect(); hero.style.setProperty('--hx', (e.clientX - r.left) + 'px'); hero.style.setProperty('--hy', (e.clientY - r.top) + 'px'); });
})();