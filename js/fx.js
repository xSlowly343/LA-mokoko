// Эффекты: плавный скролл (Lenis), появление при прокрутке, волны на кнопках, переходы между страницами.
import anime from 'animejs';
import Lenis from 'lenis';

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export let lenis = null;

export function initFX() {
  if (!reduced) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 0.95 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  // прогресс прокрутки и тень у шапки
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  const topbar = document.querySelector('.topbar');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    topbar.classList.toggle('scrolled', scrollY > 10);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // волна от клика на кнопках
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.btn, .chip, .nav-btn');
    if (!b || reduced) return;
    const r = b.getBoundingClientRect();
    const s = document.createElement('span');
    s.className = 'ripple';
    const d = Math.max(r.width, r.height) * 2;
    Object.assign(s.style, { width: d + 'px', height: d + 'px', left: e.clientX - r.left - d / 2 + 'px', top: e.clientY - r.top - d / 2 + 'px' });
    b.appendChild(s);
    anime({ targets: s, scale: [0, 1], opacity: [0.35, 0], duration: 650, easing: 'easeOutQuad', complete: () => s.remove() });
  });
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
  const items = root.querySelectorAll('.frame, .callout');
  const obs = getIO();
  items.forEach((el) => {
    if (el.dataset.rv) return;
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
