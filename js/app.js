// Точка входа: маршруты, главная, гайды, источники, поиск, тема.
import anime from 'animejs';
import Fuse from 'fuse';
import { load, save, esc, fmtDate, getJSON } from './store.js';
import { initBackground } from './bg.js';
import { initMascot, say, hide as hideBubble } from './mascot.js';
import { renderUI } from './ui-screens.js';
import { renderEvents, liveEvents, left, endOf } from './events.js';
import { renderMechanics, MECH_INDEX } from './mechanics.js';
import { renderBosses, bossIndex } from './bosses.js';
import { renderPromo, activePromoCount } from './promo.js';
import { renderNews, getNews, newsCard, isNew, markNewInNav } from './news.js';
import { renderProgress } from './progress.js';
import { initFX, reveal, transition, moveNavPill, intro, lenis } from './fx.js';

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
  page.dataset.home = '1';
  page.innerHTML = `
    <section class="hero">
      <div>
        <div class="patch-badge"><i></i>Актуально на обновление «Забытые легенды» · 18.11.2026</div>
        <h1>Тропа <span>мококо</span>: путеводитель по Lost Ark для новичков</h1>
        <p class="lead">Сюжет пропущен, а впереди заточка, рейды и механики? Здесь пошаговая прокачка, рейды по вашему ГС, боевые механики на кадрах из игры, свежие новости и промокоды.</p>
        <div class="hero-cta">
          <a class="btn" href="#/progress">Начать прокачку →</a>
          <a class="btn ghost" href="#/bosses">Рейды по ГС</a>
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="ring"></div><div class="ring r2"></div><div class="ring r3"></div>
        <img src="assets/mokoko.svg" alt="" id="heroMokoko">
      </div>
    </section>
    <div class="tiles">
      <a class="tile frame" href="#/progress"><div class="t-ico">⇪</div><h3>Прокачка</h3><p>Путь 1700 → 1730: отвечайте на вопросы — квест подскажет следующий шаг заточки.</p></a>
      <a class="tile frame" href="#/bosses"><div class="t-ico">☠</div><h3>Рейды по ГС</h3><p>Укажите свой ГС — покажем, какие рейды и сложности уже доступны.</p></a>
      <a class="tile frame" href="#/mechanics"><div class="t-ico">✴</div><h3>Механики</h3><p>Изнурение, разрушение, контратака и парирование — на кадрах из игры, с тренажёром.</p></a>
      <a class="tile frame" href="#/events"><div class="t-ico">☄</div><h3>События</h3><p>Что идёт сейчас, сколько осталось и какие награды.</p></a>
    </div>
    <a class="promo-strip frame" href="#/promo" id="promoStrip"><iconify-icon icon="game-icons:present"></iconify-icon><span><b>Промокоды</b><small id="promoCnt">официальные коды и быстрая активация</small></span><span class="ps-go">Открыть →</span></a>
    <section class="section">
      <div class="section-head"><h2>Новости</h2><a href="#/news">Все новости →</a></div>
      <div class="news-grid home" id="homeNews"><p class="muted">Загружаем…</p></div>
    </section>
    <section class="section">
      <div class="section-head"><h2>Сейчас в игре</h2><a href="#/events">Все события →</a></div>
      <div class="ev-strip" id="homeEvents"></div>
    </section>
    <section class="section" id="links">
      <div class="section-head"><h2>Полезные ссылки</h2><a href="#/sources">Все источники →</a></div>
      <div id="homeLinks"></div>
    </section>`;
  getJSON('data/links.json').then((d) => { const h = page.querySelector('#homeLinks'); if (h) { h.innerHTML = linkBlock(d); wireLinkFilter(h); reveal(h); } });
  getNews().then((d) => { const h = page.querySelector('#homeNews'); if (!h) return; const it = (d.items || []).slice(0, 4); h.innerHTML = it.map((n) => newsCard(n, { compact: true })).join(''); reveal(h); }).catch(() => { const h = page.querySelector('#homeNews'); if (h) h.innerHTML = '<p class="muted">Новости недоступны.</p>'; });
  activePromoCount().then((n) => { const el = page.querySelector('#promoCnt'); if (el) el.textContent = n ? `активных кодов: ${n} — скопировать и активировать в один клик` : 'сейчас активных кодов нет'; });
  liveEvents().then((evs) => { const h = page.querySelector('#homeEvents'); if (!h) return; h.innerHTML = evs.map((e) => `<a class="ev-mini frame" href="#/events" style="--ev:${e.color}"><span class="ev-mini-ico">${esc(e.icon)}</span><span><b>${esc(e.title)}</b><small>осталось ${left(endOf(e.end) - Date.now())}</small></span></a>`).join(''); reveal(h); });
  anime({ targets: page.querySelectorAll('.hero > div:first-child > *'), opacity: [0, 1], translateY: [16, 0], delay: anime.stagger(80), duration: 600, easing: 'easeOutCubic' });
  anime({ targets: page.querySelector('.hero-art .r2'), rotate: 360, duration: 60000, loop: true, easing: 'linear' });
  anime({ targets: '#heroMokoko', translateY: [-6, 6], direction: 'alternate', loop: true, duration: 1800, easing: 'easeInOutSine' });
  page.querySelector('#heroMokoko').addEventListener('click', () => say('Пи-пи!', '<p>Это я, ваш мококо-помощник. Я живу в правом нижнем углу — нажмите на меня, если нужен совет.</p>'));
}

function linkBlock(d) {
  const P = d.purposes || [];
  const L = d.langs || {};
  return `<div class="lk-filters">
      <div class="filters lk-purpose">
        <button class="chip on" data-lp="all">Все</button>
        ${P.map((p) => `<button class="chip" data-lp="${esc(p)}">${esc(p)} <small>${d.links.filter((l) => (l.tags || []).includes(p)).length}</small></button>`).join('')}
      </div>
      <div class="lk-lang"><span>Язык:</span>
        <button class="on" data-ll="all">все</button>${Object.entries(L).map(([k, v]) => `<button data-ll="${k}">${v}</button>`).join('')}
      </div>
    </div>${linkCards(d.links)}`;
}
function wireLinkFilter(root) {
  let purpose = 'all', lang = 'all';
  const apply = () => {
    const cards = [...root.querySelectorAll('.link-card')];
    cards.forEach((c) => {
      const tags = (c.dataset.tags || '').split('|');
      c.hidden = !((purpose === 'all' || tags.includes(purpose)) && (lang === 'all' || c.dataset.group === lang));
    });
    anime({ targets: cards.filter((c) => !c.hidden), opacity: [0, 1], translateY: [10, 0], delay: anime.stagger(40), duration: 350, easing: 'easeOutQuad' });
  };
  root.addEventListener('click', (e) => {
    const p = e.target.closest('[data-lp]');
    if (p) { purpose = p.dataset.lp; root.querySelectorAll('[data-lp]').forEach((x) => x.classList.toggle('on', x === p)); apply(); return; }
    const l = e.target.closest('[data-ll]');
    if (l) { lang = l.dataset.ll; root.querySelectorAll('[data-ll]').forEach((x) => x.classList.toggle('on', x === l)); apply(); }
  });
}
function linkCards(links) {
  return `<div class="link-grid">${links.map((l) => `
    <a class="link-card frame" data-group="${esc(l.group || '')}" data-tags="${esc((l.tags || []).join('|'))}" href="${esc(l.url)}" target="_blank" rel="noopener">
      <div class="lc-top"><span class="lc-ico">${esc(l.icon)}</span><span class="lc-tags">${(l.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</span></div>
      <h3>${esc(l.title)}</h3>
      <p>${esc(l.desc)}</p>
      ${l.note ? `<p class="muted lc-note">${esc(l.note)}</p>` : ''}
      <div class="lc-foot"><span>${esc(l.domain)}</span><span class="lc-go">Перейти ↗</span></div>
    </a>`).join('')}</div>`;
}

async function pageSources(page) {
  const [sources, links] = await Promise.all([getJSON('data/sources.json'), getJSON('data/links.json')]);
  const list = Object.entries(sources).sort((a, b) => (b[1].date || '').localeCompare(a[1].date || ''));
  page.innerHTML = `
    <div class="page-head"><div class="eyebrow">Прозрачность</div><h1>Источники</h1>
      <p>Всё на сайте взято из официальных материалов РУ-версии. Если факта нет в источниках, мы его не пишем, а предлагаем свериться с игрой.</p></div>
    <div class="frame article" style="max-width:none">
      <div class="table-wrap"><table class="tbl"><thead><tr><th>Дата</th><th>Материал</th></tr></thead><tbody>
      ${list.map(([, s]) => `<tr><td style="white-space:nowrap">${s.date ? fmtDate(s.date) : '—'}</td><td><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></td></tr>`).join('')}
      </tbody></table></div>
      <div class="callout">Нашли ошибку или устаревший факт? Создайте issue в репозитории сайта со ссылкой на свежий источник.</div>
    </div>
    <section class="section" id="srcLinks"><div class="section-head"><h2>Полезные ссылки</h2></div>${linkBlock(links)}</section>`;
  wireLinkFilter(page.querySelector('#srcLinks'));
}

// ===== Роутер =====
const routes = {
  '': pageHome,
  guides: (p) => renderBosses(p),
  ui: (p, id) => renderUI(p, id),
  sources: pageSources,
  mechanics: (p, id) => renderMechanics(p).then(() => id && setTimeout(() => jumpTo('#m-' + id), 50)),
  events: (p) => renderEvents(p),
  bosses: (p, id) => renderBosses(p, id),
  promo: (p) => renderPromo(p),
  news: (p) => renderNews(p),
  progress: (p) => renderProgress(p),
};
function jumpTo(sel) {
  const el = document.querySelector(sel); if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -80 }); else el.scrollIntoView({ behavior: 'smooth' });
}
// прыжки внутри страницы «Механики» без перерисовки
document.addEventListener('click', (e) => {
  const a = e.target.closest('.m-jump a'); if (!a) return;
  e.preventDefault();
  history.replaceState(null, '', a.getAttribute('href'));
  jumpTo('#m-' + a.getAttribute('href').split('/').pop());
});

let routed = false;
let lastSection = null;
async function route() {
  const [, section = '', id] = (location.hash || '#/').split('/');
  const fn = routes[section] || pageHome;
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === (section || 'home') || (a.dataset.nav === 'more' && ['mechanics', 'sources', 'promo', 'news', 'ui'].includes(section)) || (a.dataset.nav === 'nav-more' && ['sources', 'promo', 'ui'].includes(section))));
  closeSheet();
  srcTips.forEach((t) => t.destroy()); srcTips = [];
  const first = !routed;
  if (routed) hideBubble(true);
  routed = true;
  moveNavPill();
  const page = document.createElement('div');
  await transition(first || (section === 'ui' && lastSection === 'ui'), async () => {
    view.replaceChildren(page);
    try { await fn(page, id && decodeURIComponent(id)); }
    catch (err) {
      console.error(err);
      page.innerHTML = `<div class="frame article"><h2>Не удалось загрузить раздел</h2><p class="muted">${esc(err.message)}</p><p>Если вы открыли файл напрямую с диска, запустите локальный сервер (см. README).</p></div>`;
    }
    if (!(section === 'ui' && lastSection === 'ui')) { if (lenis) lenis.scrollTo(0, { immediate: true }); else scrollTo({ top: 0 }); }
  });
  reveal(page);
  lastSection = section;
  view.focus({ preventScroll: true });
}

// ===== Поиск =====
async function initSearch() {
  const dlg = document.getElementById('searchDlg');
  const input = document.getElementById('searchInput');
  const out = document.getElementById('searchResults');
  const [screens, links] = await Promise.all([getJSON('data/screens.json').catch(() => ({ screens: [] })), getJSON('data/links.json').catch(() => ({ links: [] }))]);
  const events = await getJSON('data/events.json').catch(() => ({ events: [] }));
  const promos = await getJSON('data/promocodes.json').catch(() => ({ codes: [] }));
  const bossIdx = await bossIndex().catch(() => []);
  const strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const docs = [
    ...screens.screens.flatMap((s) => [{ title: s.title, sub: 'Интерфейс', text: '', href: '#/ui/' + s.id },
      ...(s.hotspots || []).map((h) => ({ title: h.title, sub: 'Интерфейс · ' + s.title, text: h.text, href: '#/ui/' + s.id }))]),
    ...links.links.map((l) => ({ title: l.title, sub: 'Полезная ссылка · ' + l.domain, text: l.desc, href: l.url, ext: true })),
    ...MECH_INDEX.map((m) => ({ title: m.name, sub: 'Механика', text: m.text, href: '#/mechanics/' + m.id })),
    ...(events.events || []).map((e) => ({ title: e.title, sub: 'Событие · ' + e.kind, text: (e.how || []).join(' ') + ' ' + e.rewards.flatMap((r) => r.items).join(' '), href: '#/events' })),
    ...bossIdx,
    { title: 'Промокоды', sub: 'Коды и активация', text: 'промокод код подарок активировать ' + promos.codes.map((c) => c.code + ' ' + c.set).join(' '), href: '#/promo' },
    { title: 'Прокачка 1705 → 1730', sub: 'Интерактивная схема', text: 'свитки высшая закалка вышка книжки 19-20 заточка ядра реликтовые руниты мококомонетки 1720 1730', href: '#/progress' },
    { title: 'Источники', sub: 'Справка', text: 'lostark.ru патчноуты', href: '#/sources' },
  ];
  const fuse = new Fuse(docs, { keys: [{ name: 'title', weight: 3 }, 'text'], threshold: 0.38, ignoreLocation: true, minMatchCharLength: 2 });
  const draw = () => {
    const q = input.value.trim();
    const res = q ? fuse.search(q).slice(0, 8).map((r) => r.item) : docs.slice(0, 6);
    out.innerHTML = res.length ? res.map((d) => `<li><a href="${esc(d.href)}"${d.ext ? ' target="_blank" rel="noopener"' : ''}>${esc(d.title)}<small>${esc(d.sub)}</small></a></li>`).join('') : '<li class="none">Ничего не нашлось. Попробуйте другое слово.</li>';
  };
  const open = () => { input.value = ''; draw(); lenis?.stop(); dlg.showModal(); input.focus(); };
  dlg.addEventListener('close', () => lenis?.start());
  document.getElementById('searchBtn').addEventListener('click', open);
  addEventListener('keydown', (e) => {
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
  });
  input.addEventListener('input', draw);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const a = out.querySelector('a'); if (a) { a.click(); dlg.close(); } } });
  out.addEventListener('click', (e) => { if (e.target.closest('a')) dlg.close(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

// ===== Мобильное меню «Ещё» =====
const sheet = document.getElementById('sheet');
function closeSheet() {
  if (!sheet || sheet.hidden) return;
  document.body.classList.remove('sheet-open');
  anime({ targets: sheet.querySelector('.sheet-panel'), translateY: [0, 300], duration: 250, easing: 'easeInQuad' });
  anime({ targets: sheet, opacity: [1, 0], duration: 250, easing: 'linear', complete: () => { sheet.hidden = true; } });
}
document.getElementById('moreBtn')?.addEventListener('click', () => {
  if (!sheet.hidden) { closeSheet(); return; }
  sheet.hidden = false;
  hideBubble(true);
  document.body.classList.add('sheet-open');
  anime({ targets: sheet, opacity: [0, 1], duration: 200, easing: 'linear' });
  anime({ targets: sheet.querySelector('.sheet-panel'), translateY: [300, 0], duration: 420, easing: 'easeOutCubic' });
  anime({ targets: sheet.querySelectorAll('a'), opacity: [0, 1], translateY: [12, 0], delay: anime.stagger(50, { start: 120 }), duration: 350, easing: 'easeOutQuad' });
});
sheet?.addEventListener('click', (e) => { if (e.target === sheet || e.target.closest('a')) closeSheet(); });

// ===== Тема =====
document.getElementById('themeBtn').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('mk-theme', next); } catch (e) {}
});

// ===== Старт =====
intro();
initFX();
initBackground(document.getElementById('bg'));
addEventListener('resize', moveNavPill);
document.fonts?.ready.then(moveNavPill);
initMascot();
addEventListener('hashchange', route);
markNewInNav();
setInterval(markNewInNav, 30 * 60e3);
route();
initSearch();
if (!load('greeted', false)) {
  setTimeout(() => say('Привет, мококо!', '<p>Я помогу освоиться в Lost Ark. Начните с <a href="#/progress">прокачки</a> или посмотрите, <a href="#/bosses">какие рейды доступны на вашем ГС</a>.</p>'), 900);
  save('greeted', true);
}
