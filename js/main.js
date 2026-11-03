// Dashboard de monitoreo - secado y almacenamiento de granos (ESP32 + MicroPython)
// El ESP32 responde en  http://IP/datos  con JSON:
// {"temp":22,"hum":65,"gas":900,"luz":55,"lluvia":0,"pir":0,"dist":40,"cubierta":"abierta","modo":"auto"}
const $ = (id) => document.getElementById(id);
const DEF = {
  ip: "",
  hum: 70,
  gas: 2000,
  sost: 5,
  nivelMin: 20,
  vacio: 100,
  lleno: 10,
  h1: 6,
  h2: 18,
};
const cfg = Object.assign(
  {},
  DEF,
  JSON.parse(localStorage.getItem("cfg") || "{}"),
);
let demo = true,
  hist = [],
  reg = [],
  gasSeguidos = 0,
  activas = {},
  fallos = 0;
let sim = {
  temp: 16,
  hum: 62,
  gas: 900,
  luz: 60,
  lluvia: 0,
  pir: 0,
  dist: 45,
  cubierta: "abierta",
  modo: "auto",
};

const guardar = () => localStorage.setItem("cfg", JSON.stringify(cfg));
document.querySelectorAll("[data-k]").forEach((i) => {
  i.value = cfg[i.dataset.k];
  i.onchange = () => {
    cfg[i.dataset.k] = Number(i.value);
    guardar();
  };
});
$("ip").value = cfg.ip;

function estado(txt, clase) {
  const e = $("estado");
  e.textContent = txt;
  e.className = "badge " + clase;
}
function evento(txt) {
  const li = document.createElement("li");
  li.innerHTML =
    "<span>" + new Date().toLocaleTimeString("es-CO") + "</span>" + txt;
  $("log").prepend(li);
}

// ---- Datos simulados (modo demostración) ----
function simular() {
  const r = (v, a, b, p) =>
    Math.min(b, Math.max(a, v + (Math.random() - 0.5) * p));
  sim.temp = r(sim.temp, 10, 30, 1);
  sim.hum = r(sim.hum, 40, 95, 5);
  sim.gas = r(sim.gas, 500, 3200, 250);
  sim.luz = r(sim.luz, 0, 100, 8);
  sim.dist = r(sim.dist, 10, 95, 3);
  if (Math.random() < 0.08) sim.lluvia = sim.lluvia ? 0 : 1;
  sim.pir = Math.random() < 0.1 ? 1 : 0;
  if (sim.lluvia && sim.modo === "auto") sim.cubierta = "cerrada";
  return Object.assign({}, sim);
}

// ---- Comunicación con el ESP32 ----
async function pedir(ruta) {
  const c = new AbortController();
  setTimeout(() => c.abort(), 2500);
  const r = await fetch("http://" + cfg.ip + ruta, { signal: c.signal });
  return r.json();
}
async function leer() {
  if (demo) return procesar(simular());
  try {
    procesar(await pedir("/datos"));
    fallos = 0;
    estado("Conectado a " + cfg.ip, "ok");
  } catch (e) {
    if (++fallos > 1) estado("Sin conexión con el ESP32", "off");
  }
}
async function comando(ruta, local) {
  if (demo) {
    Object.assign(sim, local);
    return procesar(Object.assign({}, sim));
  }
  try {
    procesar(await pedir(ruta));
  } catch (e) {
    evento("No se pudo enviar la orden al ESP32.");
  }
}
$("bAbrir").onclick = () =>
  comando("/cubierta?accion=abrir", { cubierta: "abierta", modo: "manual" });
$("bCerrar").onclick = () =>
  comando("/cubierta?accion=cerrar", { cubierta: "cerrada", modo: "manual" });
$("chkAuto").onchange = (e) => {
  const m = e.target.checked ? "auto" : "manual";
  comando("/modo?valor=" + m, { modo: m });
};
$("btnConectar").onclick = () => {
  cfg.ip = $("ip").value.trim();
  if (!cfg.ip) return alert("Escribe la IP del ESP32.");
  guardar();
  demo = false;
  estado("Conectando...", "demo");
  evento("Conectando a " + cfg.ip);
  leer();
};
$("btnDemo").onclick = () => {
  demo = true;
  estado("Modo demostración", "demo");
  evento("Modo demostración activado.");
};

// ---- Procesamiento y alertas ----
function procesar(d) {
  const aire =
    d.gas <= cfg.gas * 0.6 ? "Buena" : d.gas <= cfg.gas ? "Regular" : "Mala";
  const nivel = Math.round(
    Math.min(
      100,
      Math.max(0, ((cfg.vacio - d.dist) / (cfg.vacio - cfg.lleno)) * 100),
    ),
  );
  $("vTemp").textContent = d.temp.toFixed(1);
  $("vHum").textContent = Math.round(d.hum);
  $("vGas").textContent = aire;
  $("nGas").textContent = Math.round(d.gas) + " / 4095";
  $("vLuz").textContent = Math.round(d.luz);
  $("vLluvia").textContent = d.lluvia ? "Lloviendo" : "Seco";
  $("vPir").textContent = d.pir ? "Detectado" : "Sin movimiento";
  $("vNivel").textContent = nivel;
  $("nNivel").textContent = "% (" + Math.round(d.dist) + " cm al sensor)";
  $("vCub").textContent = d.cubierta === "cerrada" ? "Cerrada" : "Abierta";
  $("chkAuto").checked = d.modo === "auto";

  gasSeguidos = d.gas > cfg.gas ? gasSeguidos + 1 : 0;
  const h = new Date().getHours(),
    fuera = h < cfg.h1 || h >= cfg.h2;
  const cond = {
    hum: [
      d.hum > cfg.hum,
      "Humedad alta (" +
        Math.round(d.hum) +
        " %). Conviene ventilar la bodega.",
      "warn",
    ],
    moho: [
      gasSeguidos >= cfg.sost,
      "Posible moho o fermentación: gases altos de forma sostenida.",
      "crit",
    ],
    lluvia: [!!d.lluvia, "Lluvia detectada sobre el patio de secado.", "crit"],
    pir: [
      d.pir && fuera,
      "Movimiento en la bodega fuera del horario permitido.",
      "crit",
    ],
    nivel: [
      nivel < cfg.nivelMin,
      "Nivel del producto bajo (" + nivel + " %).",
      "warn",
    ],
  };
  for (const k in cond) {
    const [on, msg, tipo] = cond[k];
    if (on && !activas[k]) evento("ALERTA: " + msg);
    if (!on && activas[k]) evento("Resuelto: " + activas[k].msg);
    activas[k] = on ? { msg, tipo } : null;
  }
  const act = Object.values(activas).filter(Boolean);
  $("listaAlertas").innerHTML = act.length
    ? act
        .map(
          (a) =>
            '<li class="' +
            (a.tipo === "crit" ? "crit" : "") +
            '">' +
            a.msg +
            "</li>",
        )
        .join("")
    : '<li class="ok">Todo en orden: las condiciones están dentro de los umbrales.</li>';
  $("vHum").parentElement.classList.toggle("alerta", !!activas.hum);
  $("vGas").parentElement.classList.toggle("alerta", !!activas.moho);

  const fila = {
    t: new Date(),
    hum: d.hum,
    temp: d.temp,
    luz: d.luz,
    aire: d.gas / 40.95,
  };
  hist.push(fila);
  if (hist.length > 60) hist.shift();
  reg.push([
    fila.t.toISOString(),
    $("lote").value,
    d.temp,
    d.hum,
    d.gas,
    d.luz,
    d.lluvia,
    d.pir,
    d.dist,
    d.cubierta,
  ]);
  dibujar();
}

// ---- Gráfica (sin librerías) ----
function dibujar() {
  const c = $("graf"),
    g = c.getContext("2d"),
    W = c.width,
    H = c.height,
    p = 30;
  g.clearRect(0, 0, W, H);
  g.font = "12px sans-serif";
  g.fillStyle = "#5C6B62";
  g.strokeStyle = "#D3DCD5";
  for (let v = 0; v <= 100; v += 25) {
    const y = H - p - ((H - 2 * p) * v) / 100;
    g.beginPath();
    g.moveTo(p, y);
    g.lineTo(W - 10, y);
    g.stroke();
    g.fillText(v, 4, y + 4);
  }
  [
    ["hum", "#2B6CB0"],
    ["temp", "#C98A00"],
    ["luz", "#2F7D4A"],
    ["aire", "#7A4E9E"],
  ].forEach(([k, col]) => {
    g.strokeStyle = col;
    g.lineWidth = 2;
    g.beginPath();
    hist.forEach((f, i) => {
      const x = p + ((W - p - 10) * i) / 59,
        y = H - p - ((H - 2 * p) * Math.min(100, f[k])) / 100;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    });
    g.stroke();
  });
}

// ---- Exportar datos del lote ----
$("btnCsv").onclick = () => {
  const csv =
    "fecha,lote,temp_C,humedad_pct,gases_adc,luz_pct,lluvia,movimiento,distancia_cm,cubierta\n" +
    reg.map((r) => r.join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = ($("lote").value || "lote").replace(/\s+/g, "_") + ".csv";
  a.click();
};

evento("Panel iniciado en modo demostración.");
leer();
setInterval(leer, 3000);
