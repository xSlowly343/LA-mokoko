// Мококо-помощник: говорит подсказки в «облачке», подпрыгивает (anime.js).
import anime from 'animejs';

const IDLE = [
  ['Привет, мококо!', 'Я помогу разобраться. Нажимайте на подсвеченные зоны в разделе «Интерфейс».'],
  ['Совет', 'Перед чтением любого гайда смотрите на дату. Игра сильно поменялась в 2025–2026.'],
  ['Совет', 'Значок <span class="src-demo">i</span> рядом с фактом показывает источник и дату.'],
  ['Совет', 'Нажмите <kbd>/</kbd>, чтобы быстро найти что угодно на сайте.'],
];
let idleI = 0;
let onCloseCb = null;
let btn, bubble, titleEl, textEl;

export function initMascot() {
  btn = document.getElementById('mascotBtn');
  bubble = document.getElementById('bubble');
  titleEl = document.getElementById('bubbleTitle');
  textEl = document.getElementById('bubbleText');
  bubble.querySelector('.bubble-x').addEventListener('click', () => hide());
  btn.addEventListener('click', () => {
    if (!bubble.hidden && bubble.dataset.idle === '1') { hide(); return; }
    const [t, x] = IDLE[idleI++ % IDLE.length];
    say(t, x, { idle: true });
  });
  // лёгкое «дыхание»
  anime({ targets: btn.querySelector('.mascot-img'), scaleY: [1, .96], scaleX: [1, 1.03], direction: 'alternate', loop: true, duration: 1400, easing: 'easeInOutSine' });
}

export function say(title, html, opts = {}) {
  titleEl.innerHTML = title;
  textEl.innerHTML = html;
  bubble.dataset.idle = opts.idle ? '1' : '0';
  onCloseCb = opts.onClose || null;
  const wasHidden = bubble.hidden;
  bubble.hidden = false;
  if (wasHidden) anime({ targets: bubble, opacity: [0, 1], translateY: [12, 0], scale: [.9, 1], duration: 350, easing: 'easeOutBack' });
  else anime({ targets: bubble, scale: [.97, 1], duration: 250, easing: 'easeOutQuad' });
  hop();
}
export function hide(silent = false) {
  const cb = silent ? null : onCloseCb;
  onCloseCb = null;
  if (bubble.hidden) { cb?.(); return; }
  anime({ targets: bubble, opacity: [1, 0], translateY: [0, 8], duration: 200, easing: 'easeInQuad', complete: () => { bubble.hidden = true; bubble.style.opacity = ''; cb?.(); } });
}
export function hop() {
  anime({ targets: btn, translateY: [0, -18, 0], duration: 520, easing: 'easeOutQuad' });
}
