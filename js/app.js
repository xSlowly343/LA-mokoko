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

initFX();
addEventListener('hashchange', route);
markNewInNav();
setInterval(markNewInNav, 30 * 60e3);
route();
