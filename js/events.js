// Раздел «События»: что идёт сейчас, таймеры, награды.
import anime from 'animejs';
import { esc, fmtDate, getJSON, load, save } from './store.js';
import { reveal } from './fx.js';

const DAY = 864e5;
const startOf = (iso) => new Date(iso + 'T00:00:00').getTime();
const endOf = (iso) => startOf(iso) + DAY; // конец дня end
let timer;

function left(ms) {
  if (ms <= 0) return 'завершено';
  const d = Math.floor(ms / DAY), h = Math.floor((ms % DAY) / 36e5), m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1e3);
  return d > 0 ? `${d} д ${h} ч ${m} мин` : `${h} ч ${String(m).padStart(2, '0')} мин ${String(s).padStart(2, '0')} с`;
}

export async function renderEvents(page) {
  clearInterval(timer);
  const [data, sources] = await Promise.all([getJSON('data/events.json'), getJSON('data/sources.json')]);
  const now = Date.now();
  const evs = data.events.map((e) => ({ ...e, s: startOf(e.start), e: endOf(e.end) }));
  const groups = {
    live: evs.filter((e) => e.s <= now && e.e > now).sort((a, b) => a.e - b.e),
    soon: evs.filter((e) => e.s > now),
    past: evs.filter((e) => e.e <= now),
  };
  let tab = load('ev-tab', 'live');
  if (!groups[tab]?.length) tab = 'live';

  page.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">События · по данным lostark.ru на ${fmtDate(data.updated)}</div>
      <h1>Что идёт прямо сейчас</h1>
      <p>Активные события, сроки и награды — дословно из официальных анонсов. Таймер считает до конца последнего дня события по вашему времени; точное время окончания обычно совпадает с техработами.</p>
    </div>
    <div class="filters" role="tablist">
      <button class="chip" data-tab="live">Идут сейчас · ${groups.live.length}</button>
      ${groups.soon.length ? `<button class="chip" data-tab="soon">Скоро · ${groups.soon.length}</button>` : ''}
      <button class="chip" data-tab="past">Завершились · ${groups.past.length}</button>
    </div>
    <div class="ev-list" id="evList"></div>`;

  const card = (e) => {
    const total = e.e - e.s;
    const src = sources[e.source];
    return `<article class="ev-card frame" style="--ev:${e.color}" data-end="${e.e}" data-start="${e.s}">
      <div class="ev-banner">
        ${e.banner ? `<img src="${esc(e.banner)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
        <div class="ev-banner-fx"></div>
        <span class="ev-ico">${esc(e.icon)}</span>
        <div class="ev-head">
          <span class="ev-kind">${esc(e.kind)}</span>
          <h2>${esc(e.title)}</h2>
          <span class="ev-dates">${fmtDate(e.start)} — ${esc(e.endNote)}</span>
        </div>
      </div>
      <div class="ev-body">
        <div class="ev-timer"><span class="ev-left" data-left>${left(e.e - Date.now())}</span><span class="muted">осталось</span></div>
        <div class="ev-bar"><i style="width:${Math.min(100, Math.max(0, ((Date.now() - e.s) / total) * 100))}%"></i></div>
        ${e.req?.length ? `<div class="ev-req">${e.req.map((r) => `<span>${esc(r)}</span>`).join('')}</div>` : ''}
        ${e.how?.length ? `<ul class="ev-how">${e.how.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
        ${e.rewards.map((r, i) => `
          <div class="acc" data-acc>
            <button class="acc-btn" aria-expanded="false"><span>🎁 ${esc(r.title)}</span><span class="acc-n">${r.items.length}</span><span class="acc-arrow">▾</span></button>
            <div class="acc-panel"><ul class="rw">${r.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul></div>
          </div>`).join('')}
        ${src ? `<div class="ev-src">Источник: <a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(src.title)}</a> · ${fmtDate(src.date)}</div>` : ''}
      </div>
    </article>`;
  };

  const draw = () => {
    page.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    const list = page.querySelector('#evList');
    list.innerHTML = groups[tab].map(card).join('') || '<p class="muted">Пока пусто.</p>';
    reveal(list);
  };
  draw();

  page.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-tab]');
    if (t) { tab = t.dataset.tab; save('ev-tab', tab); draw(); return; }
    const btn = ev.target.closest('.acc-btn');
    if (btn) {
      const panel = btn.nextElementSibling;
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      const h = panel.scrollHeight;
      anime.remove(panel);
      anime({ targets: panel, height: open ? [h, 0] : [0, h], opacity: open ? [1, 0] : [0, 1], duration: 380, easing: 'easeOutCubic',
        complete: () => { panel.style.height = open ? '0px' : 'auto'; } });
      if (!open) anime({ targets: panel.querySelectorAll('li'), opacity: [0, 1], translateX: [-8, 0], delay: anime.stagger(25), duration: 300, easing: 'easeOutQuad' });
    }
  });

  timer = setInterval(() => {
    if (!document.body.contains(page)) { clearInterval(timer); return; }
    page.querySelectorAll('.ev-card').forEach((c) => {
      const el = c.querySelector('[data-left]');
      if (el) el.textContent = left(Number(c.dataset.end) - Date.now());
    });
  }, 1000);
}

// Для главной: короткий список активных
export async function liveEvents() {
  const data = await getJSON('data/events.json');
  const now = Date.now();
  return data.events.filter((e) => startOf(e.start) <= now && endOf(e.end) > now).sort((a, b) => endOf(a.end) - endOf(b.end));
}
export { left, endOf };
