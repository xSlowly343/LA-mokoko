// Эффекты: плавный скролл (Lenis), появление при прокрутке, 3D-наклон карточек,
// свечение курсора, волны на кнопках, монетки, прогресс прокрутки, заставка.
import anime from 'animejs';
import Lenis from 'lenis';

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
export let lenis = null;

export function initFX() {
  // --- плавный скролл ---
  if (!reduced) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 0.95 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  // --- прогресс прокрутки и сжатие шапки ---
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  const topbar = document.querySelector('.topbar');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    topbar.classList.toggle('scrolled', scrollY > 10);
    document.documentElement.style.setProperty('--scroll', scrollY);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // --- свечение под курсором ---
  if (fine && !reduced) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);
    let x = innerWidth / 2, y = innerHeight / 2, gx = x, gy = y;
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    const loop = () => { gx += (x - gx) * 0.12; gy += (y - gy) * 0.12; glow.style.transform = `translate(${gx}px, ${gy}px)`; requestAnimationFrame(loop); };
    loop();
  }

  // --- 3D-наклон и блик карточек (делегирование, работает для новых страниц) ---
  if (fine && !reduced) {
    const SEL = '.tile, .guide-card, .link-card';
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest(SEL);
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--rx', `${(0.5 - py) * 8}deg`);
      card.style.setProperty('--ry', `${(px - 0.5) * 10}deg`);
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
      card.classList.add('tilting');
    }, { passive: true });
    document.addEventListener('pointerout', (e) => {
      const card = e.target.closest(SEL);
      if (card && !card.contains(e.relatedTarget)) { card.classList.remove('tilting'); card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); }
    });
  }

  // --- волна от клика на кнопках ---
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.btn, .chip, .icon-btn, .nav a');
    if (!b || reduced) return;
    const r = b.getBoundingClientRect();
    const s = document.createElement('span');
    s.className = 'ripple';
    const d = Math.max(r.width, r.height) * 2;
    Object.assign(s.style, { width: d + 'px', height: d + 'px', left: e.clientX - r.left - d / 2 + 'px', top: e.clientY - r.top - d / 2 + 'px' });
    b.appendChild(s);
    anime({ targets: s, scale: [0, 1], opacity: [0.45, 0], duration: 650, easing: 'easeOutQuad', complete: () => s.remove() });
  });

  // --- «бегающая» подложка активного пункта меню ---
  const nav = document.querySelector('.nav');
  if (nav) {
    const pill = document.createElement('span');
    pill.className = 'nav-pill';
    nav.prepend(pill);
  }
}

export function moveNavPill() {
  const nav = document.querySelector('.nav');
  const pill = nav?.querySelector('.nav-pill');
  const a = nav?.querySelector('a.active');
  if (!pill) return;
  if (!a) { pill.style.opacity = 0; return; }
  const nr = nav.getBoundingClientRect(), ar = a.getBoundingClientRect();
  pill.style.opacity = 1;
  pill.style.width = ar.width + 'px';
  pill.style.transform = `translateX(${ar.left - nr.left}px)`;
}

// Появление элементов при прокрутке (один общий наблюдатель)
let io;
function getIO() {
  if (io) return io;
  let batch = [], timer;
  io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { io.unobserve(en.target); batch.push(en.target); } });
    clearTimeout(timer);
    timer = setTimeout(() => {
      const show = batch; batch = [];
      if (!show.length) return;
      anime({ targets: show, opacity: [0, 1], translateY: [24, 0], delay: anime.stagger(60), duration: 650, easing: 'easeOutCubic',
        complete: () => show.forEach((el) => { el.style.transform = ''; }) });
    }, 16);
  }, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });
  return io;
}
export function reveal(root) {
  if (reduced || !root) return;
  const items = root.querySelectorAll('.tile, .guide-card, .link-card, .frame:not(.summary), .tl-item, .callout, .table-wrap');
  const obs = getIO();
  items.forEach((el) => {
    if (el.closest('.hero') || el.dataset.rv) return;
    el.dataset.rv = '1';
    el.style.opacity = 0;
    obs.observe(el);
  });
}

// Переход между страницами
export async function transition(skip, swap) {
  if (reduced || skip) { await swap(); return; }
  if (document.startViewTransition) {
    const vt = document.startViewTransition(() => swap());
    try { await vt.updateCallbackDone; } catch (e) {}
    return;
  }
  const v = document.getElementById('view');
  await anime({ targets: v, opacity: [1, 0], translateY: [0, -8], duration: 150, easing: 'easeInQuad' }).finished;
  await swap();
  anime({ targets: v, opacity: [0, 1], translateY: [10, 0], duration: 320, easing: 'easeOutCubic' });
}

// Монетки разлетаются из точки
export function coinBurst(el, count = 14) {
  if (reduced || !el) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + 16, cy = r.top + r.height / 2;
  for (let i = 0; i < count; i++) {
    const c = document.createElement('span');
    c.className = 'fly-coin';
    c.style.left = cx + 'px'; c.style.top = cy + 'px';
    document.body.appendChild(c);
    const ang = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 90;
    anime({
      targets: c,
      translateX: [0, Math.cos(ang) * dist], translateY: [0, Math.sin(ang) * dist - 40, Math.sin(ang) * dist + 60],
      rotate: [0, (Math.random() - 0.5) * 720], scale: [0.4, 1, 0.6], opacity: [1, 1, 0],
      duration: 900 + Math.random() * 400, easing: 'easeOutQuad', complete: () => c.remove(),
    });
  }
}

// Кольцо-волна в точке (для зон интерфейса)
export function ringAt(parent, x, y) {
  if (reduced) return;
  const s = document.createElement('span');
  s.className = 'ring-wave';
  s.style.left = x + 'px'; s.style.top = y + 'px';
  parent.appendChild(s);
  anime({ targets: s, scale: [0, 3.2], opacity: [0.9, 0], duration: 700, easing: 'easeOutCubic', complete: () => s.remove() });
}

// Заставка при первом заходе в сессии
export function intro() {
  let seen = false;
  try { seen = sessionStorage.getItem('mk-intro') === '1'; sessionStorage.setItem('mk-intro', '1'); } catch (e) {}
  if (seen || reduced) return;
  const el = document.createElement('div');
  el.className = 'intro';
  el.innerHTML = `<div class="intro-inner"><img src="assets/mokoko.svg" alt=""><div class="intro-title">Тропа <em>мококо</em></div><div class="intro-line"><i></i></div></div>`;
  document.body.appendChild(el);
  const tl = anime.timeline({ easing: 'easeOutCubic' });
  tl.add({ targets: el.querySelector('img'), scale: [0.3, 1], rotate: [-20, 0], opacity: [0, 1], duration: 600, easing: 'easeOutBack' })
    .add({ targets: el.querySelector('.intro-title'), opacity: [0, 1], translateY: [10, 0], duration: 400 }, '-=250')
    .add({ targets: el.querySelector('.intro-line i'), scaleX: [0, 1], duration: 500 }, '-=200')
    .add({ targets: el, opacity: [1, 0], duration: 450, easing: 'easeInQuad', complete: () => el.remove() }, '+=150');
}
