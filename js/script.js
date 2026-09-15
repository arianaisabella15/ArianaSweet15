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

// Simple exclusive-choice RSVP toggle
function setRsvp(btn, choice) {
  document.querySelectorAll('.rsvp-btn').forEach(b => b.setAttribute('aria-pressed','false'));
  btn.setAttribute('aria-pressed','true');
}

// Personaliza la invitación según el token ?i= de la URL, buscando el
// nombre en data/invitados.json (generado por tools/generar_invitados.py)
async function cargarInvitado() {
  const nombreEl = document.getElementById('invitation-name');
  const token = new URLSearchParams(window.location.search).get('i');
  if (!nombreEl || !token) return;

  try {
    const res = await fetch('data/invitados.json');
    const invitados = await res.json();
    const invitado = invitados[token];
    if (invitado) {
      nombreEl.textContent = invitado.nombre;
    }
  } catch (err) {
    console.error('No se pudo cargar data/invitados.json', err);
  }
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
// the first time it enters the viewport
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
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
