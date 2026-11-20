// Новости lostark.ru. Файл data/news.json обновляет GitHub Actions каждый час;
// сайт читает его напрямую из репозитория (raw.githubusercontent.com), поэтому
// новые новости видны без пересборки/передеплоя сайта. Если raw недоступен — берём локальную копию.
import anime from 'animejs';
import { esc, fmtDate, load, save } from './store.js';

const RAW = 'https://raw.githubusercontent.com/xSlowly343/LA-mokoko/main/data/news.json';
const LOCAL = 'data/news.json';
const NEW_MS = 2 * 864e5;
let cache = null, cacheAt = 0;

export async function getNews() {
  if (cache && Date.now() - cacheAt < 5 * 60e3) return cache;
  const tryGet = async (url) => { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error(r.status); return r.json(); };
  let data;
  try { data = await tryGet(RAW); } catch (e) { data = await tryGet(LOCAL); }
  cache = data; cacheAt = Date.now();
  return data;
}

// Новость «новая», если с даты публикации (по Москве) прошло меньше 2 суток
export function isNew(n, now = Date.now()) {
  const t = n.date ? Date.parse(n.date + 'T00:00:00+03:00') : Date.parse(n.firstSeen || '');
  return Number.isFinite(t) && now - t < NEW_MS && now >= t;
}

const CAT_COLOR = { 'Важное': '#e0606b', 'Обзоры': '#6fa8ff', 'Изменения': '#f2c94c', 'События': '#8fd16a', 'Акции': '#ff9a3c', 'Конкурсы': '#b48cff', 'Другое': '#a69c8a' };

export function newsCard(n, opts = {}) {
  const nw = isNew(n);
  const col = CAT_COLOR[n.category] || '#c9a45c';
  return `<a class="news-card frame ${nw ? 'is-new' : ''} ${opts.compact ? 'compact' : ''}" href="${esc(n.url)}" target="_blank" rel="noopener" style="--nc:${col}">
    <div class="nc-img">${n.image ? `<img src="${esc(n.image)}" alt="" loading="lazy" onerror="this.remove()">` : '<iconify-icon icon="game-icons:scroll-unfurled"></iconify-icon>'}
      ${nw ? '<span class="new-badge">NEW</span>' : ''}</div>
    <div class="nc-body">
      <div class="nc-meta">${n.category ? `<span class="nc-cat">${esc(n.category)}</span>` : ''}<span>${n.date ? fmtDate(n.date) : ''}</span></div>
      <h3>${esc(n.title)}</h3>
      ${n.lead && !opts.compact ? `<p>${esc(n.lead)}</p>` : ''}
      <span class="nc-go">Читать на lostark.ru ↗</span>
    </div>
  </a>`;
}

export async function renderNews(page) {
  page.innerHTML = `<div class="page-head"><div class="eyebrow">Новости</div><h1>Новости LOST ARK</h1><p class="muted">Загружаем…</p></div>`;
  let data;
  try { data = await getNews(); } catch (e) { page.innerHTML += '<p>Не удалось загрузить новости.</p>'; return; }
  const items = data.items || [];
  const cats = ['Все', ...new Set(items.map((n) => n.category).filter(Boolean))];
  let cur = load('news-cat', 'Все'); if (!cats.includes(cur)) cur = 'Все';
  const newCount = items.filter((n) => isNew(n)).length;
  page.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Новости · автообновление каждый час</div>
      <h1>Новости LOST ARK ${newCount ? `<span class="new-count">${newCount} NEW</span>` : ''}</h1>
      <p>Собираются с главной страницы lostark.ru автоматически. Метка <span class="new-badge inline">NEW</span> — у новостей, вышедших меньше 2 дней назад. ${data.checked ? `Последняя проверка: ${new Date(data.checked).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}.` : ''}</p>
    </div>
    <div class="filters">${cats.map((c) => `<button class="chip ${c === cur ? 'on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <div class="news-grid" id="newsGrid"></div>
    <p class="muted" style="font-size:12px;margin-top:18px">Источник: <a href="https://lostark.ru/news" target="_blank" rel="noopener">lostark.ru/news</a>. Тексты и изображения — © Smilegate / Astrum Entertainment.</p>`;
  const grid = page.querySelector('#newsGrid');
  const draw = () => {
    grid.innerHTML = items.filter((n) => cur === 'Все' || n.category === cur).map((n) => newsCard(n)).join('') || '<p class="muted">Пусто.</p>';
    anime({ targets: grid.querySelectorAll('.news-card'), opacity: [0, 1], translateY: [14, 0], delay: anime.stagger(40), duration: 400, easing: 'easeOutQuad' });
  };
  draw();
  page.querySelector('.filters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    cur = b.dataset.cat; save('news-cat', cur);
    page.querySelectorAll('[data-cat]').forEach((x) => x.classList.toggle('on', x === b));
    draw();
  });
}

// Счётчик NEW в меню
export async function markNewInNav() {
  try {
    const d = await getNews();
    const n = (d.items || []).filter((x) => isNew(x)).length;
    document.querySelectorAll('[data-nav="news"]').forEach((a) => {
      a.querySelector('.nav-new')?.remove();
      if (n) a.insertAdjacentHTML('beforeend', `<span class="nav-new">${n}</span>`);
    });
  } catch (e) { /* без счётчика */ }
}
