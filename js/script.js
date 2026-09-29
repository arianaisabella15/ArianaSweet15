// URL de la aplicación web de Google Apps Script que guarda las
// confirmaciones en Google Sheets (ver tools/apps-script/README.md)
const RSVP_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyXElpsz4fKecCzJGUZs4wgJ4sYw049-mNhwFp9oTkjy68CIJMUunnQsG4i08LHNxU/exec';

// Countdown — set your target date/time here
const target = new Date('2026-12-30T19:00:00');
function tick() {
  const now = new Date();
  let diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000); diff -= h * 3600000;
  const m = Math.floor(diff / 60000); diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  document.getElementById('cd-days').textContent = String(d).padStart(2,'0');
  document.getElementById('cd-hours').textContent = String(h).padStart(2,'0');
  document.getElementById('cd-mins').textContent = String(m).padStart(2,'0');
  document.getElementById('cd-secs').textContent = String(s).padStart(2,'0');
}
tick();
setInterval(tick, 1000);

// Personaliza la invitación según el token ?i= de la URL, buscando el
// nombre en window.INVITADOS (data/invitados.js, generado por
// tools/generar_invitados.py)
function cargarInvitado() {
  const token = new URLSearchParams(window.location.search).get('i');
  const invitado = token && window.INVITADOS && window.INVITADOS[token];
  renderConfirmacion(invitado);
  if (!invitado) return;

  const nombreEl = document.getElementById('invitation-name');
  if (nombreEl) nombreEl.textContent = invitado.nombre;

  // En el popup de entrada el nombre queda oculto si no hay invitado
  const gateNombreEl = document.getElementById('entry-guest-name');
  if (gateNombreEl) {
    gateNombreEl.textContent = invitado.nombre;
    gateNombreEl.classList.remove('hidden');
  }
}

// Confirmar asistencia — a checkbox per name on the card. Without a valid
// ?i= token there is nobody to confirm, so only a hint is shown.
function renderConfirmacion(invitado) {
  const lista = document.getElementById('rsvp-guests');
  if (!lista) return;

  if (!invitado) {
    document.getElementById('rsvp-no-guest').classList.remove('hidden');
    return;
  }

  invitado.invitados.forEach((nombre) => {
    const fila = document.createElement('label');
    fila.className =
      'rsvp-guest flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-stone-200 bg-white hover:border-stone-300 hover:shadow-md font-semibold cursor-pointer';

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.value = nombre;
    check.className = 'w-5 h-5 shrink-0';

    const texto = document.createElement('span');
    texto.textContent = nombre;

    fila.append(check, texto);
    lista.append(fila);
  });

  const boton = document.getElementById('rsvp-confirm');
  boton.classList.remove('hidden');
  boton.addEventListener('click', () => enviarConfirmacion(boton, lista));

  marcarConfirmados(lista);
}

// ID de la hoja de Google, codificado para que no aparezca como texto en el
// código (se genera con tools/codificar_hoja.py). Vacío = leer por Apps Script.
const HOJA_ID_CODIFICADO = ["Y1puVzZVbFU3bHFNMS1z", "UzJnVnc1NHV1Zk9uWTNY", "NXAxc09KSE00THJmajE="];

function hojaId() {
  return HOJA_ID_CODIFICADO.map((parte) => atob(parte)).join('').split('').reverse().join('');
}

// Marca los checks con lo que la familia ya confirmó antes, leído de la
// hoja de Google. Si falla, la lista simplemente queda sin marcar.
async function marcarConfirmados(lista) {
  const token = new URLSearchParams(window.location.search).get('i');
  // Los códigos son hexadecimales; validarlo evita meter texto raro en la
  // consulta a la hoja
  if (!token || !/^[0-9a-f]+$/.test(token)) return;

  // La respuesta puede tardar; si mientras tanto el invitado ya tocó algún
  // check, no se le pisa lo que marcó
  let tocado = false;
  lista.addEventListener('change', () => (tocado = true), { once: true });

  try {
    // Si la lectura directa falla (p. ej. abriendo con file://, que Google
    // no permite), se recurre a Apps Script, más lento pero sin esa limitación
    const confirmacion = HOJA_ID_CODIFICADO.length
      ? await leerConfirmacionDeHoja(token).catch(() => leerConfirmacionDeAppsScript(token))
      : await leerConfirmacionDeAppsScript(token);
    if (tocado || !confirmacion) return;

    const asistentes = new Set(confirmacion);
    lista.querySelectorAll('input').forEach((check) => {
      check.checked = asistentes.has(check.value);
    });
  } catch (err) {
    console.error('No se pudo leer la confirmación guardada', err);
  }
}

// Lectura directa de la pestaña Confirmaciones (la hoja debe ser visible
// con el enlace). Mucho más rápida que Apps Script. Devuelve los nombres con
// "Sí", o null si esa familia aún no ha confirmado.
async function leerConfirmacionDeHoja(token) {
  const consulta = encodeURIComponent(`select D, E where B = '${token}'`);
  const url = `https://docs.google.com/spreadsheets/d/${hojaId()}/gviz/tq?tqx=out:json&sheet=Confirmaciones&tq=${consulta}`;
  const texto = await (await fetch(url)).text();
  // La respuesta viene envuelta en google.visualization.Query.setResponse(...)
  const data = JSON.parse(texto.slice(texto.indexOf('(') + 1, texto.lastIndexOf(')')));
  const filas = data.table.rows.map((fila) => fila.c.map((celda) => celda && celda.v));
  if (!filas.length) return null;
  return filas.filter(([, asiste]) => asiste === 'Sí').map(([nombre]) => nombre);
}

async function leerConfirmacionDeAppsScript(token) {
  if (!RSVP_ENDPOINT) return null;
  const res = await fetch(`${RSVP_ENDPOINT}?token=${encodeURIComponent(token)}`);
  const data = await res.json();
  return data.ok && data.confirmado ? data.asistentes : null;
}

async function enviarConfirmacion(boton, lista) {
  const token = new URLSearchParams(window.location.search).get('i');
  const asistentes = [...lista.querySelectorAll('input:checked')].map((c) => c.value);

  // Apps Script tarda varios segundos en responder: se muestra "Enviando…"
  // y a los 3 s el agradecimiento aunque la respuesta no haya llegado (antes
  // si llega antes). Si al final el envío falla, se reemplaza por el error.
  // El botón sigue desactivado mientras tanto para no mandar dos a la vez.
  const GRACIAS = '¡Gracias! Tu confirmación fue registrada.';
  boton.disabled = true;
  mostrarEstadoRsvp('Enviando…', 'text-stone-500');
  const agradecer = setTimeout(() => mostrarEstadoRsvp(GRACIAS, 'text-green-600'), 3000);
  try {
    if (!RSVP_ENDPOINT) throw new Error('RSVP_ENDPOINT sin configurar');
    // Sin headers: el body va como text/plain, que Apps Script acepta sin
    // la petición previa de CORS que no sabe responder
    const res = await fetch(RSVP_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ token, asistentes }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    clearTimeout(agradecer);
    mostrarEstadoRsvp(GRACIAS, 'text-green-600');
  } catch (err) {
    clearTimeout(agradecer);
    console.error('No se pudo enviar la confirmación', err);
    mostrarEstadoRsvp('No se pudo enviar la confirmación. Intenta de nuevo.', 'text-red-600');
  } finally {
    boton.disabled = false;
  }
}

function mostrarEstadoRsvp(texto, color) {
  const estado = document.getElementById('rsvp-status');
  estado.textContent = texto;
  estado.className = `mt-4 text-center font-medium ${color}`;
}

cargarInvitado();

// Hero parallax — the photo drifts slower than the scroll while the hero
// is in view. The wrapper is sized 115%/-7.5% top precisely so the image
// has 7.5% of viewport height of "extra" room on each side to shift into
// without ever exposing an empty edge (see the HERO section markup).
const heroImage = document.getElementById('hero-image');
if (heroImage) {
  const parallaxFactor = 0.3;
  function updateHeroParallax() {
    const maxOffset = window.innerHeight * 0.075;
    const offset = Math.max(-maxOffset, Math.min(maxOffset, window.scrollY * parallaxFactor));
    heroImage.style.transform = `translateY(${offset}px)`;
  }
  updateHeroParallax();
  window.addEventListener('scroll', updateHeroParallax, { passive: true });
}

// Scroll reveal — each .reveal card starts hidden and fades/slides in
// the first time it enters the viewport. threshold 0 (not a % of the
// card) so tall cards like the gallery, taller than the viewport, still
// trigger; rootMargin makes it fire once the card is 80px on screen.
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0, rootMargin: '0px 0px -80px 0px' }
);
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// Entry gate popup — locks scroll until the guest taps "Entrar"
const entryGate = document.getElementById('entry-gate');
const entryBtn = document.getElementById('entry-btn');
if (entryGate && entryBtn) {
  document.body.style.overflow = 'hidden';
  entryBtn.addEventListener('click', () => {
    entryGate.classList.add('entry-gate-hidden');
    document.body.style.overflow = '';
    setTimeout(() => entryGate.remove(), 500);
  });
}
