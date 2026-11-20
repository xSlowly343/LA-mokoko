// Раздел «События»: что идёт сейчас, таймеры, награды.
import anime from 'animejs';
import { esc, fmtDate, getJSON, load, save } from './store.js';
import { reveal } from './fx.js';

const DAY = 864e5;
const startOf = (iso) => new Date(iso + 'T00:00:00').getTime();
const endOf = (iso) => startOf(iso) + DAY; // конец дня end
let timer;
// иконка награды по ключевому слову
const RI = [
  [/слит|номинал/i, 'game-icons:gold-bar', '#f2c94c'], [/золот/i, 'game-icons:two-coins', '#f2c94c'], [/серебр/i, 'game-icons:coins', '#cfd6e0'],
  [/рунит/i, 'game-icons:gem-pendant', '#b48cff'], [/сертификат/i, 'game-icons:scroll-unfurled', '#e8d5a6'], [/колод/i, 'game-icons:card-random', '#ff9a3c'],
  [/кристалл/i, 'game-icons:crystal-growth', '#6fc0ff'], [/камень/i, 'game-icons:stone-block', '#9fb3c8'], [/осколк/i, 'game-icons:crystal-cluster', '#8fd16a'],
  [/гравир/i, 'game-icons:book-cover', '#ffb05c'], [/жетон/i, 'game-icons:medal', '#e0c070'], [/катализ/i, 'game-icons:fizzing-flask', '#4fd1c5'],
  [/энерги/i, 'game-icons:crystal-ball', '#6fa8ff'], [/наковальн/i, 'game-icons:anvil', '#c0c0c0'], [/искр/i, 'game-icons:sparkles', '#ffd84a'],
  [/знак/i, 'game-icons:rune-stone', '#d29bff'], [/короб/i, 'game-icons:wooden-crate', '#c98d4a'], [/билет/i, 'game-icons:ticket', '#ff7b7b'],
  [/эликсир|зель/i, 'game-icons:potion-ball', '#ff6bb5'], [/титул/i, 'game-icons:laurel-crown', '#f2c94c'], [/фон/i, 'game-icons:photo-camera', '#9fd0ff'],
  [/сундук|шкатулк|ларец|сумк|мешоч|сундучок/i, 'game-icons:locked-chest', '#e0a050'], [/достижени/i, 'game-icons:trophy-cup', '#f2c94c'],
];
function rewardIcon(text) {
  const key = text.split(':').pop();
  const hit = RI.find(([re]) => re.test(key)) || RI.find(([re]) => re.test(text));
  return hit ? `<span class="rw-ico" style="--ri:${hit[2]}"><iconify-icon icon="${hit[1]}"></iconify-icon></span>` : '<span class="rw-ico"><iconify-icon icon="game-icons:swap-bag"></iconify-icon></span>';
}

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
    return ` <article class="ev-card frame ${e.bannerFull ? 'has-full' : ''}" style="--ev:${e.color}" data-end="${e.e}" data-start="${e.s}">
      <div class="ev-banner">
        ${e.banner ? `<img src="${esc(e.banner)}" alt="${e.bannerFull ? esc(e.title) : ''}" class="${e.bannerFull ? 'full' : ''}" loading="lazy" onerror="this.remove()">` : ''}
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
            <div class="acc-panel"><ul class="rw">${r.items.map((it) => `<li>${rewardIcon(it)}<span>${esc(it)}</span></li>`).join('')}</ul></div>
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
