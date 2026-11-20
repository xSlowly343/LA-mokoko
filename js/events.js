// Раздел «События»: что идёт сейчас, таймеры, награды.
import anime from 'animejs';
import { esc, fmtDate, getJSON, load, save } from './store.js';
import { reveal } from './fx.js';

const DAY = 864e5;
const startOf = (iso) => new Date(iso + 'T00:00:00').getTime();
const endOf = (iso) => startOf(iso) + DAY; // конец дня end
let timer;
// Иконки наград — предметы из базы lostarkcodex.com/ru (assets/items). Порядок важен: сначала точные.
const RI = [
  [/знак\S* грозы/i, 'znak-grozy'], [/знак хаоса/i, 'znak-haosa'],
  [/короб[^;]*кошмар/i, 'use_11_163'], [/короб[^;]*героич/i, 'use_11_162'], [/короб/i, 'use_11_161'],
  [/персонального золота|слиток|номинал/i, 'use_13_34'], [/золот/i, 'use_13_34'], [/серебр/i, 'use_14_24'],
  [/сертификат на сброс рунита/i, 'use_13_201'], [/рунит/i, 'shop_icon_9963'],
  [/шулерская колода/i, 'use_11_2'], [/колода/i, 'shop_icon_5783'],
  [/оружейный кристалл судьбы/i, 'use_13_249'], [/защитный кристалл судьбы/i, 'use_13_250'], [/камень судьбы/i, 'use_13_251'],
  [/осколк/i, 'use_12_92'], [/оружейными кристаллами/i, 'use_14_11'], [/защитными кристаллами/i, 'use_14_12'],
  [/драгоценн/i, 'use_14_13'], [/катализ/i, 'use_12_177'], [/сундучок мастера закалки|закалки/i, 'use_14_10'],
  [/сокровище вечного солнца/i, 'use_7_26'], [/искр\S* хаоса/i, 'use_4_227'], [/искр/i, 'use_13_220'],
  [/гравир|эскиз/i, 'all_quest_02_208'], [/браслет/i, 'use_10_249'], [/ядра/i, 'use_4_224'], [/наковальн/i, 'shop_icon_9'],
  [/авидорский сундук с кристаллами судьбы/i, 'shop_icon_8900'], [/авидорск/i, 'shop_icon_31'],
  [/билет|инферно/i, 'use_13_238'], [/знак/i, 'tokenitem_150'], [/титул/i, 'use_5_156'], [/фон/i, 'use_13_43'],
];
function rewardIcon(text) {
  const key = text.includes(':') ? text.split(':').slice(1).join(':') : text;
  const hit = RI.find(([re]) => re.test(key)) || RI.find(([re]) => re.test(text));
  return hit ? `<span class="rw-ico item"><img src="assets/items/${hit[1]}.webp" alt="" loading="lazy"></span>` : '<span class="rw-ico"><iconify-icon icon="game-icons:swap-bag"></iconify-icon></span>';
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
        ${e.tokens ? `<div class="ev-tokens">${e.tokens.map((k) => `<span><img src="${esc(k.src)}" alt="">${esc(k.name)}</span>`).join('')}</div>` : ''}
        ${e.req?.length ? `<div class="ev-req">${e.req.map((r) => `<span>${esc(r)}</span>`).join('')}</div>` : ''}
        ${e.how?.length ? `<ul class="ev-how">${e.how.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
        ${e.rewards.map((r, i) => `
          <div class="acc" data-acc>
            <button class="acc-btn" aria-expanded="false"><span>🎁 ${esc(r.title)}</span><span class="acc-n">${r.items.length}</span><span class="acc-arrow">▾</span></button>
            <div class="acc-panel"><ul class="rw">${r.items.map((it) => `<li>${rewardIcon(it)}<span>${esc(it)}</span></li>`).join('')}</ul></div>
          </div>`).join('')}
        ${e.gallery ? `<div class="ev-gallery" data-lenis-prevent>${e.gallery.map((g, i) => `<button class="ev-shot" data-gal="${e.id}" data-i="${i}"><img src="${esc(g.src)}" alt="${esc(g.cap)}" loading="lazy"><span>${esc(g.cap)}</span></button>`).join('')}</div>` : ''}
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

  const lb = document.createElement('dialog'); lb.className = 'lightbox'; page.appendChild(lb);
  const openShot = (id, i) => {
    const gal = data.events.find((x) => x.id === id).gallery;
    const g = gal[i];
    lb.innerHTML = `<button class="lb-x" aria-label="Закрыть">×</button>
      ${i > 0 ? '<button class="lb-nav prev" aria-label="Назад">‹</button>' : ''}${i < gal.length - 1 ? '<button class="lb-nav next" aria-label="Вперёд">›</button>' : ''}
      <img src="${esc(g.src)}" alt="${esc(g.cap)}"><p>${esc(g.cap)} · ${i + 1}/${gal.length}</p>`;
    lb.dataset.id = id; lb.dataset.i = i;
    if (!lb.open) lb.showModal();
    anime({ targets: lb.querySelector('img'), opacity: [0, 1], scale: [.97, 1], duration: 300, easing: 'easeOutQuad' });
  };
  lb.addEventListener('click', (ev) => {
    if (ev.target.closest('.lb-x') || ev.target === lb) { lb.close(); return; }
    const nav = ev.target.closest('.lb-nav');
    if (nav) openShot(lb.dataset.id, Number(lb.dataset.i) + (nav.classList.contains('next') ? 1 : -1));
  });
  page.addEventListener('click', (ev) => {
    const shot = ev.target.closest('.ev-shot');
    if (shot) { openShot(shot.dataset.gal, Number(shot.dataset.i)); return; }
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
