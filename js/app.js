// Точка входа: маршруты, главная, гайды, источники, поиск, тема.
import anime from 'animejs';
import Fuse from 'fuse';
import { GUIDES } from './guides.js';
import { load, save, esc, fmtDate, getJSON } from './store.js';
import { initBackground } from './bg.js';
import { initMascot, say, hide as hideBubble } from './mascot.js';
import { renderUI } from './ui-screens.js';
import { renderGold } from './gold.js';
import { renderChecklist } from './checklist.js';

const view = document.getElementById('view');
let srcTips = [];

// ===== Источники: всплывашки у значков ⓘ =====
async function wireSources(root) {
  srcTips.forEach((t) => t.destroy()); srcTips = [];
  const sources = await getJSON('data/sources.json');
  root.querySelectorAll('.src[data-src]').forEach((el) => {
    const s = sources[el.dataset.src];
    if (!s) return;
    el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Источник: ' + s.title);
    const html = `<div class="tip-card"><b style="font-size:15px">Источник</b>${esc(s.title)}<br><span class="muted">${s.date ? 'от ' + fmtDate(s.date) : 'дата не указана'}</span><br><a href="${esc(s.url)}" target="_blank" rel="noopener">Открыть на lostark.ru ↗</a></div>`;
    if (window.tippy) srcTips.push(window.tippy(el, { content: html, allowHTML: true, interactive: true, trigger: 'click', theme: 'lostark', animation: 'shift-away', appendTo: document.body, maxWidth: 300 }));
  });
}

// ===== Страницы =====
function pageHome(page) {
  const read = load('read', []);
  page.innerHTML = `
    <section class="hero">
      <div>
        <div class="patch-badge"><i></i>Актуально на обновление «Забытые легенды» · 18.11.2026</div>
        <h1>Тропа <span>мококо</span>: путеводитель по Lost Ark для новичков</h1>
        <p class="lead">Сюжет пропущен, персонаж прокачан, а вокруг сотни непонятных окон? Здесь разбор интерфейса по клику, гайды по свежим патчам со ссылками на источники и калькулятор золота.</p>
        <div class="hero-cta">
          <a class="btn" href="#/ui">Начать с интерфейса →</a>
          <a class="btn ghost" href="#/guides/outdated">Что устарело</a>
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="ring"></div><div class="ring r2"></div><div class="ring r3"></div>
        <img src="assets/mokoko.svg" alt="" id="heroMokoko">
      </div>
    </section>
    <div class="tiles">
      <a class="tile frame" href="#/ui"><div class="t-ico">◈</div><h3>Интерфейс</h3><p>Нажимайте на элементы экрана и узнавайте, что за что отвечает.</p></a>
      <a class="tile frame" href="#/guides"><div class="t-ico">❖</div><h3>Гайды</h3><p>Только свежие патчи, у каждого факта источник и дата.</p></a>
      <a class="tile frame" href="#/gold"><div class="t-ico">◉</div><h3>Золото</h3><p>Сколько золота принесёт ваше Наследие за неделю.</p></a>
      <a class="tile frame" href="#/checklist"><div class="t-ico">✓</div><h3>Чек-лист</h3><p>Ежедневные и еженедельные дела с автосбросом.</p></a>
    </div>
    <section class="section">
      <div class="section-head"><h2>Начните с этого</h2><a href="#/guides">Все гайды →</a></div>
      <div class="guide-grid">${GUIDES.slice(0, 3).map((g) => guideCard(g, read)).join('')}</div>
    </section>`;
  anime({ targets: page.querySelectorAll('.hero > div:first-child > *'), opacity: [0, 1], translateY: [16, 0], delay: anime.stagger(80), duration: 600, easing: 'easeOutCubic' });
  anime({ targets: page.querySelectorAll('.tile'), opacity: [0, 1], translateY: [20, 0], delay: anime.stagger(70, { start: 250 }), duration: 550, easing: 'easeOutCubic' });
  anime({ targets: page.querySelector('.hero-art .r2'), rotate: 360, duration: 60000, loop: true, easing: 'linear' });
  anime({ targets: '#heroMokoko', translateY: [-6, 6], direction: 'alternate', loop: true, duration: 1800, easing: 'easeInOutSine' });
  page.querySelector('#heroMokoko').addEventListener('click', () => say('Пи-пи!', '<p>Это я, ваш мококо-помощник. Я живу в правом нижнем углу — нажмите на меня, если нужен совет.</p>'));
}

function guideCard(g, read) {
  return `<a class="guide-card frame" href="#/guides/${g.id}">
    <div class="g-top"><span class="tag">${esc(g.tag)}</span><span>${read.includes(g.id) ? '<span class="read-mark">✓ прочитано</span>' : `${g.minutes} мин`}</span></div>
    <h3>${esc(g.icon)} ${esc(g.title)}</h3>
    <p>${esc(g.summary)}</p>
    <div class="g-top"><span>Проверено ${fmtDate(g.updated)}</span></div>
  </a>`;
}

function pageGuides(page) {
  const read = load('read', []);
  const tags = ['Все', ...new Set(GUIDES.map((g) => g.tag))];
  let current = 'Все';
  page.innerHTML = `
    <div class="page-head"><div class="eyebrow">Гайды</div><h1>Знания для мококо</h1>
      <p>Для тех, кто пропустил сюжет и начинает эндгейм. Прочитано: ${read.filter((id) => GUIDES.some((g) => g.id === id)).length} из ${GUIDES.length}.</p></div>
    <div class="filters">${tags.map((t) => `<button class="chip ${t === current ? 'on' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    <div class="guide-grid" id="gg"></div>`;
  const draw = () => {
    page.querySelector('#gg').innerHTML = GUIDES.filter((g) => current === 'Все' || g.tag === current).map((g) => guideCard(g, read)).join('');
    anime({ targets: page.querySelectorAll('.guide-card'), opacity: [0, 1], translateY: [12, 0], delay: anime.stagger(50), duration: 400, easing: 'easeOutQuad' });
  };
  draw();
  page.querySelector('.filters').addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    current = b.dataset.tag;
    page.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === b));
    draw();
  });
}

async function pageGuide(page, id) {
  const g = GUIDES.find((x) => x.id === id);
  if (!g) { page.innerHTML = '<p>Гайд не найден. <a href="#/guides">К списку</a></p>'; return; }
  const sources = await getJSON('data/sources.json');
  const read = load('read', []);
  const isRead = read.includes(id);
  const idx = GUIDES.indexOf(g);
  const next = GUIDES[idx + 1];
  page.innerHTML = `
    <article class="article frame">
      <a href="#/guides" class="muted" style="font-size:13px">← Все гайды</a>
      <h1 style="margin-top:10px">${esc(g.title)}</h1>
      <div class="meta"><span class="tag">${esc(g.tag)}</span><span>${g.minutes} мин чтения</span><span>Проверено ${fmtDate(g.updated)}</span></div>
      ${g.body}
      ${g.sources.length ? `<h3>Источники</h3><ul class="src-list">${g.sources.map((s) => sources[s] ? `<li><a href="${esc(sources[s].url)}" target="_blank" rel="noopener">${esc(sources[s].title)}</a> — ${sources[s].date ? fmtDate(sources[s].date) : 'дата не указана'}</li>` : '').join('')}</ul>` : ''}
      <div class="article-foot">
        <button class="btn ${isRead ? 'ghost' : ''}" id="readBtn">${isRead ? '✓ Прочитано' : 'Отметить как прочитанное'}</button>
        ${next ? `<a class="btn ghost" href="#/guides/${next.id}">Дальше: ${esc(next.title)} →</a>` : ''}
      </div>
    </article>`;
  wireSources(page);
  page.querySelector('#readBtn').addEventListener('click', (e) => {
    const r = load('read', []);
    const i = r.indexOf(id);
    if (i >= 0) r.splice(i, 1); else r.push(id);
    save('read', r);
    const now = r.includes(id);
    e.currentTarget.textContent = now ? '✓ Прочитано' : 'Отметить как прочитанное';
    e.currentTarget.classList.toggle('ghost', now);
    if (now) say('Молодец!', `<p>Гайд прочитан. Всего прочитано: ${r.filter((x) => GUIDES.some((g) => g.id === x)).length} из ${GUIDES.length}.</p>`);
  });
}

async function pageSources(page) {
  const sources = await getJSON('data/sources.json');
  const list = Object.entries(sources).sort((a, b) => (b[1].date || '').localeCompare(a[1].date || ''));
  page.innerHTML = `
    <div class="page-head"><div class="eyebrow">Прозрачность</div><h1>Источники</h1>
      <p>Всё на сайте взято из официальных материалов РУ-версии. Если факта нет в источниках, мы его не пишем, а предлагаем свериться с игрой.</p></div>
    <div class="frame article" style="max-width:none">
      <div class="table-wrap"><table class="tbl"><thead><tr><th>Дата</th><th>Материал</th></tr></thead><tbody>
      ${list.map(([, s]) => `<tr><td style="white-space:nowrap">${s.date ? fmtDate(s.date) : '—'}</td><td><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></td></tr>`).join('')}
      </tbody></table></div>
      <div class="callout">Нашли ошибку или устаревший факт? Создайте issue в репозитории сайта со ссылкой на свежий источник.</div>
    </div>`;
}

// ===== Роутер =====
const routes = {
  '': pageHome,
  guides: (p, id) => (id ? pageGuide(p, id) : pageGuides(p)),
  ui: (p, id) => renderUI(p, id),
  gold: (p) => renderGold(p),
  checklist: (p) => renderChecklist(p),
  sources: pageSources,
};

let routed = false;
async function route() {
  const [, section = '', id] = (location.hash || '#/').split('/');
  const fn = routes[section] || pageHome;
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === (section || 'home')));
  srcTips.forEach((t) => t.destroy()); srcTips = [];
  if (routed) hideBubble();
  routed = true;
  const page = document.createElement('div');
  view.replaceChildren(page);
  try { await fn(page, id && decodeURIComponent(id)); }
  catch (err) {
    console.error(err);
    page.innerHTML = `<div class="frame article"><h2>Не удалось загрузить раздел</h2><p class="muted">${esc(err.message)}</p><p>Если вы открыли файл напрямую с диска, запустите локальный сервер (см. README).</p></div>`;
  }
  if (section !== 'ui') anime({ targets: page, opacity: [0, 1], duration: 300, easing: 'linear' });
  scrollTo({ top: 0 });
  view.focus({ preventScroll: true });
}

// ===== Поиск =====
async function initSearch() {
  const dlg = document.getElementById('searchDlg');
  const input = document.getElementById('searchInput');
  const out = document.getElementById('searchResults');
  const [raids, screens] = await Promise.all([getJSON('data/raids.json').catch(() => ({ raids: [] })), getJSON('data/screens.json').catch(() => ({ screens: [] }))]);
  const strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const docs = [
    ...GUIDES.map((g) => ({ title: g.title, sub: 'Гайд · ' + g.tag, text: g.summary + ' ' + strip(g.body), href: '#/guides/' + g.id })),
    ...raids.raids.map((r) => ({ title: r.name, sub: 'Калькулятор золота', text: r.notes || '', href: '#/gold' })),
    ...screens.screens.flatMap((s) => [{ title: s.title, sub: 'Интерфейс', text: '', href: '#/ui/' + s.id },
      ...(s.hotspots || []).map((h) => ({ title: h.title, sub: 'Интерфейс · ' + s.title, text: h.text, href: '#/ui/' + s.id }))]),
    { title: 'Чек-лист дел', sub: 'Инструмент', text: 'ежедневные еженедельные сброс', href: '#/checklist' },
    { title: 'Источники', sub: 'Справка', text: 'lostark.ru патчноуты', href: '#/sources' },
  ];
  const fuse = new Fuse(docs, { keys: [{ name: 'title', weight: 3 }, 'text'], threshold: 0.38, ignoreLocation: true, minMatchCharLength: 2 });
  const draw = () => {
    const q = input.value.trim();
    const res = q ? fuse.search(q).slice(0, 8).map((r) => r.item) : docs.slice(0, 6);
    out.innerHTML = res.length ? res.map((d) => `<li><a href="${d.href}">${esc(d.title)}<small>${esc(d.sub)}</small></a></li>`).join('') : '<li class="none">Ничего не нашлось. Попробуйте другое слово.</li>';
  };
  const open = () => { input.value = ''; draw(); dlg.showModal(); input.focus(); };
  document.getElementById('searchBtn').addEventListener('click', open);
  addEventListener('keydown', (e) => {
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
  });
  input.addEventListener('input', draw);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const a = out.querySelector('a'); if (a) { location.hash = a.getAttribute('href'); dlg.close(); } } });
  out.addEventListener('click', (e) => { if (e.target.closest('a')) dlg.close(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

// ===== Тема =====
document.getElementById('themeBtn').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('mk-theme', next); } catch (e) {}
  if (location.hash.startsWith('#/gold')) route(); // перерисовать график под тему
});

// ===== Старт =====
initBackground(document.getElementById('bg'));
initMascot();
addEventListener('hashchange', route);
route();
initSearch();
if (!load('greeted', false)) {
  setTimeout(() => say('Привет, мококо!', '<p>Я помогу освоиться в Lost Ark. Начните с раздела «Интерфейс» или почитайте, что в игре <a href="#/guides/outdated">уже устарело</a>.</p>'), 900);
  save('greeted', true);
}
