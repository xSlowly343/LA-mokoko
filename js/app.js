// Точка входа: маршруты (лендинг-гайд, новости, события, промокоды).
import { esc } from './store.js';
import { renderGuide } from './guide.js';
import { renderEvents } from './events.js';
import { renderPromo } from './promo.js';
import { renderNews, markNewInNav } from './news.js';
import { initFX, reveal, transition, lenis } from './fx.js';

const view = document.getElementById('view');

const routes = {
  '': renderGuide,
  news: (p) => renderNews(p),
  events: (p) => renderEvents(p),
  promo: (p) => renderPromo(p),
};

let routed = false;
async function route() {
  const [, section = ''] = (location.hash || '#/').split('/');
  const key = routes[section] ? section : '';
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === (key || 'home')));
  document.body.dataset.page = key || 'home';
  const page = document.createElement('div');
  await transition(!routed, async () => {
    view.replaceChildren(page);
    try { await routes[key](page); }
    catch (err) {
      console.error(err);
      page.innerHTML = `<div class="frame article"><h2>Не удалось загрузить раздел</h2><p class="muted">${esc(err.message)}</p><p>Если вы открыли файл напрямую с диска, запустите локальный сервер (см. README).</p></div>`;
    }
    if (lenis) lenis.scrollTo(0, { immediate: true }); else scrollTo({ top: 0 });
  });
  routed = true;
  reveal(page);
  view.focus({ preventScroll: true });
}

// Подвал: подписи у Discord-кнопок проявляются по буквам.
// При первом появлении на экране кнопки раскрываются сами; на компьютере через пару секунд
// сворачиваются (дальше раскрываются по наведению), на телефоне остаются открытыми.
function initCredits() {
  const links = [...document.querySelectorAll('.credit')];
  links.forEach((a) => a.querySelectorAll('.credit-label b, .credit-label small').forEach((el) => {
    let i = el.tagName === 'SMALL' ? 8 : 0;
    el.innerHTML = [...el.textContent].map((c) => `<span class="ch" style="--i:${i++}">${esc(c)}</span>`).join('');
  }));
  const hover = matchMedia('(hover: hover)').matches;
  const io = new IntersectionObserver((es) => {
    if (!es.some((e) => e.isIntersecting)) return;
    io.disconnect();
    links.forEach((a, k) => setTimeout(() => a.classList.add('open'), k * 250));
    if (hover) setTimeout(() => links.forEach((a) => a.classList.remove('open')), 3200);
  }, { threshold: 0.6 });
  if (links.length) io.observe(links[0].parentElement);
}

initFX();
initCredits();
addEventListener('hashchange', route);
markNewInNav();
setInterval(markNewInNav, 30 * 60e3);
route();
