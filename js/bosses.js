// Раздел «Боссы»: данные «Зала славы» lostark.ru — описания, видео, даты первых прохождений.
import anime from 'animejs';
import { esc, getJSON } from './store.js';
import { reveal } from './fx.js';

const GROUP_ICON = { 'Рейды Теней': 'game-icons:hooded-figure', 'Рейды Казероса': 'game-icons:daemon-skull', 'Владыки Фетрании': 'game-icons:crowned-skull', 'Хранители': 'game-icons:dragon-head', 'Эпические рейды': 'game-icons:spiked-dragon-head' };
let io;

export async function renderBosses(page, bossId) {
  const data = await getJSON('data/bosses.json');
  page.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Боссы · данные «Зала славы» lostark.ru</div>
      <h1>Кого предстоит победить</h1>
      <p>Боссы рейдов РУ-версии с официальными описаниями и датами первых прохождений на наших серверах.</p>
    </div>
    <nav class="m-jump">${data.groups.map((g, i) => `<a href="#/bosses" data-g="${i}" style="--mc:var(--gold-hi)"><iconify-icon icon="${GROUP_ICON[g.title] || 'game-icons:skull-crossed-bones'}"></iconify-icon>${esc(g.title)}</a>`).join('')}</nav>
    ${data.groups.map((g, i) => `
      <section class="boss-group" id="bg-${i}">
        <h2 class="bg-title"><iconify-icon icon="${GROUP_ICON[g.title] || 'game-icons:skull-crossed-bones'}"></iconify-icon>${esc(g.title)}</h2>
        <div class="boss-grid">
          ${g.bosses.map((b) => `
            <article class="boss-card frame" id="boss-${b.id}" style="--bc:${esc(b.color || '#c9a45c')}">
              <div class="boss-media">
                <video muted loop playsinline preload="none" poster="assets/bosses/${b.id}-poster.webp" data-src="assets/bosses/${b.id}.webm"></video>
                <img class="boss-icon" src="assets/bosses/${b.id}-icon.webp" alt="">
              </div>
              <div class="boss-body">
                <h3>${esc(b.name)}</h3>
                <div class="boss-modes">${b.modes.map((m) => `<span class="mode" style="--mcol:${esc(m.color || '#c9a45c')}" title="${m.first ? 'Первое прохождение на РУ: ' + esc(m.first) : 'Ещё не пройдено на РУ'}">${esc(m.name)}${m.first ? `<small>${esc(m.first)}</small>` : '<small>—</small>'}</span>`).join('')}</div>
                <p class="boss-text">${esc(b.text)}</p>
                <button class="boss-more">Читать полностью ▾</button>
              </div>
            </article>`).join('')}
        </div>
      </section>`).join('')}
    <p class="muted" style="font-size:12px">Даты под сложностями — первое прохождение на РУ-серверах. Видео и изображения: © Smilegate / lostark.ru.</p>`;

  // видео играют, только когда на экране
  io?.disconnect();
  io = new IntersectionObserver((entries) => entries.forEach((en) => {
    const v = en.target;
    if (en.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause();
  }), { threshold: 0.35 });
  page.querySelectorAll('.boss-media video').forEach((v) => io.observe(v));

  page.addEventListener('click', (e) => {
    const more = e.target.closest('.boss-more');
    if (more) {
      const t = more.previousElementSibling;
      const open = t.classList.toggle('open');
      more.textContent = open ? 'Свернуть ▴' : 'Читать полностью ▾';
      if (open) anime({ targets: t, opacity: [.6, 1], duration: 300, easing: 'linear' });
    }
    const g = e.target.closest('[data-g]');
    if (g) { e.preventDefault(); document.getElementById('bg-' + g.dataset.g)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  if (bossId) setTimeout(() => document.getElementById('boss-' + bossId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
}

export async function bossIndex() {
  const data = await getJSON('data/bosses.json');
  return data.groups.flatMap((g) => g.bosses.map((b) => ({ title: b.name, sub: 'Босс · ' + g.title, text: b.text, href: '#/bosses/' + b.id })));
}
