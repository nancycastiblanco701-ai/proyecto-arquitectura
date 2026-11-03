// Efectos: foto de fondo con parallax, hero animado, cinta, granos flotantes, barras, lluvia, luz del mouse, chispas, ondas e inclinación 3D.
(function(){
const $ = s => document.querySelector(s);
const calma = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Fondo con la foto (img/granos.jpg), con aviso si no se encuentra ----
const fondo = document.createElement('div'); fondo.className = 'fondo';
const foto = new Image(); foto.alt = '';
foto.onload = () => fondo.appendChild(foto);
foto.onerror = () => { const a = document.createElement('div'); a.className = 'aviso';
    a.textContent = 'No se encontró img/granos.jpg. La carpeta img debe estar junto a index.html y el nombre debe ser exacto.';
    document.body.appendChild(a); setTimeout(() => a.remove(), 9000); };
foto.src = 'img/granos.jpg';
document.body.prepend(fondo);

  // ---- Manchas de color flotando al fondo ----
['b1','b2','b3'].forEach(c => { const b = document.createElement('div'); b.className = 'blob ' + c; document.body.appendChild(b); });

  // ---- Hero con saludo (máquina de escribir), reloj, título bailarín y estado del lote ----
const hero = document.createElement('section'); hero.className = 'hero';
hero.innerHTML = '<small id="saludo"></small><h2>Tus granos, bajo control</h2><p id="reloj"></p><span class="estado-lote" id="estadoLote"><i></i><span>Todo en orden</span></span>';
$('main').before(hero);

// título: cada letra baila en ola
const h2 = hero.querySelector('h2');
h2.innerHTML = [...h2.textContent].map((ch, i) => ch === ' ' ? ' ' : '<span class="l" style="--i:' + i + '">' + ch + '</span>').join('');

// cinta de texto en movimiento
const items = ['🌾 Secado', '☀️ Luz solar', '💧 Humedad', '🍃 Calidad del aire', '🌧️ Lluvia', '🏠 Cubierta del patio', '📈 Datos en vivo'];
const grupo = items.map(t => '<span>' + t + '</span><span>✦</span>').join('');
const cinta = document.createElement('div'); cinta.className = 'cinta';
cinta.innerHTML = '<div class="cinta-in">' + grupo + grupo + '</div>';
hero.after(cinta);

let textoSaludo = '', tipeado = false;
const tic = () => { const d = new Date(), h = d.getHours();
    textoSaludo = (h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches') + ', Nancy';
    if (tipeado) $('#saludo').textContent = textoSaludo;
    $('#reloj').textContent = d.toLocaleDateString('es-CO', {weekday:'long', day:'numeric', month:'long'}) + ' · ' + d.toLocaleTimeString('es-CO'); };
tic();
// el saludo se escribe letra por letra al cargar
if (calma){ tipeado = true; $('#saludo').textContent = textoSaludo; }
else { let k = 0; const t = setInterval(() => { $('#saludo').textContent = textoSaludo.slice(0, ++k);
    if (k >= textoSaludo.length){ clearInterval(t); tipeado = true; } }, 70); }
setInterval(tic, 1000);

const estado = () => { const l = $('#listaAlertas'), e = $('#estadoLote');
    const crit = l.querySelectorAll('li.crit').length, avisos = l.querySelectorAll('li:not(.ok):not(.crit)').length;
    e.className = 'estado-lote' + (crit ? ' crit' : avisos ? ' warn' : '');
    e.lastChild.textContent = crit ? 'Atención inmediata: ' + crit + (crit > 1 ? ' alertas críticas' : ' alerta crítica') : avisos ? 'Revisar el lote' : 'Todo en orden'; };
new MutationObserver(estado).observe($('#listaAlertas'), {childList:true}); estado();

  // ---- Granos flotantes ----
for (let i = 0; i < 22; i++){
    const g = document.createElement('span'), s = 6 + Math.random() * 12; g.className = 'grano';
    g.style.cssText = 'left:' + Math.random() * 100 + '%;width:' + s + 'px;height:' + s * 1.4 + 'px;animation-duration:' + (14 + Math.random() * 18) + 's;animation-delay:-' + Math.random() * 20 + 's';
    document.body.appendChild(g);
}

  // ---- Mouse: luz que lo sigue, parallax de la foto y chispas ----
const luz = document.createElement('div'); luz.className = 'luz'; document.body.appendChild(luz);
let ultChispa = 0;
const chispa = (x, y) => { const s = document.createElement('i'), t = 7 + Math.random() * 11; s.className = 'chispa';
    s.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + t + 'px;height:' + t + 'px;--dx:' + ((Math.random() - .5) * 70) + 'px;--dy:' + (20 + Math.random() * 45) + 'px;--h:' + (Math.random() > .5 ? '#fff' : '#F0ABFC');
    document.body.appendChild(s); s.addEventListener('animationend', () => s.remove()); };
document.addEventListener('mousemove', e => {
    document.body.style.setProperty('--mx', e.clientX + 'px'); document.body.style.setProperty('--my', e.clientY + 'px');
    foto.style.translate = ((e.clientX / innerWidth - .5) * -30) + 'px ' + ((e.clientY / innerHeight - .5) * -20) + 'px';
    luz.style.transform = 'translate(' + (e.clientX - 230) + 'px,' + (e.clientY - 230) + 'px)';
    const ahora = performance.now();
    if (!calma && ahora - ultChispa > 45){ ultChispa = ahora; chispa(e.clientX, e.clientY); }
});

  // ---- Botones: onda al hacer clic ----
document.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
    const r = b.getBoundingClientRect(), t = Math.max(r.width, r.height) * 2, o = document.createElement('span');
    o.className = 'onda'; o.style.cssText = 'width:' + t + 'px;height:' + t + 'px;left:' + (e.clientX - r.left - t / 2) + 'px;top:' + (e.clientY - r.top - t / 2) + 'px';
    b.appendChild(o); setTimeout(() => o.remove(), 700); });

  // ---- Paneles: aparecen al hacer scroll ----
const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting){ x.target.classList.add('vis'); io.unobserve(x.target); } }), {threshold:.12});
document.querySelectorAll('.panel').forEach(p => { p.classList.add('rv'); io.observe(p); });

  // ---- Tarjetas: inclinación 3D, destello de valores y barras de progreso ----
const tarjetas = [...document.querySelectorAll('.card')];
tarjetas.forEach(c => {
    c.insertAdjacentHTML('beforeend', '<div class="barra"><i></i></div>');
    c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect();
      c.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 10 + 'deg');
      c.style.setProperty('--rx', ((e.clientY - r.top) / r.height - .5) * -10 + 'deg'); });
    c.addEventListener('mouseleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
});
const obs = new MutationObserver(m => m.forEach(x => { const b = x.target.nodeType === 3 ? x.target.parentElement : x.target;
    if (b && b.tagName === 'B'){ b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); } }));
document.querySelectorAll('.card b').forEach(b => obs.observe(b, {childList:true, characterData:true, subtree:true}));
const num = el => parseFloat(el.textContent) || 0;
const barras = () => {
    const pct = [num($('#vTemp')) / 40 * 100, num($('#vHum')), num($('#nGas')) / 4095 * 100, num($('#vLuz')), null, null, num($('#vNivel'))];
    pct.forEach((p, i) => { if (p !== null) tarjetas[i].querySelector('.barra i').style.width = Math.max(3, Math.min(100, p)) + '%'; });
    document.body.classList.toggle('llueve', $('#vLluvia').textContent.includes('Lloviendo'));   // lluvia en pantalla
};
setInterval(barras, 800);
})();