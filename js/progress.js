// Раздел «Прокачка»: интерактивный путь 1700 → 1730 по схеме автора сайта.
// Квест с выбором «да/нет», мини-карта маршрута, шкала уровня, эффекты.
import anime from 'animejs';
import { esc, load, save } from './store.js';
import { coinBurst, reduced } from './fx.js';
import { tooltipDB, bindTooltips } from './tooltip.js';

const I = (n) => `assets/items/${n}.webp`;
// предметы с игровыми подсказками (id из data/item_tooltips.json)
const T = { scrollW3: '66112715', scrollA3: '66112716', scrollW4: '66112717', scrollA4: '66112718', bookW: '66112553', bookA: '66112554', mercy: '52327001', core: '61105980', ropot: '40621103', obet: '40621100' };
const SCROLLS = [T.scrollW3, T.scrollA3, T.scrollW4, T.scrollA4];
const BOOKS = [T.bookW, T.bookA];
let TT = {};
const icon = (x) => (TT[x] ? `<img src="${TT[x].icon}" data-tt="${x}" alt="${TT[x].name}">` : `<img src="${x}" alt="">`);

const INFO = {
  scrolls: {
    title: 'Где взять свитки высшей закалки',
    items: SCROLLS,
    rows: [
      ['Зерка', 'обычный (1710) · героический (1730) · кошмар (1740)'],
      ['Собор', 'героический (1720) · кошмар (1750)'],
      ['Обмен', 'за осколки милости (Собор)', T.mercy],
      ['Магазин', 'покупка в соло-магазине'],
    ],
  },
  books: {
    title: 'Где взять книжки на 19–20',
    items: BOOKS,
    rows: [
      ['Казерос', 'героический (1730)'],
      ['Обмен', 'за осколки милости (Собор)', T.mercy],
      ['Магазин', 'покупка в соло-магазине'],
    ],
  },
};

// Узлы схемы. x/y — позиция на мини-карте (viewBox 480×900).
const N = {
  start: { kind: 'milestone', ilvl: 1700, short: '~1700', title: 'Персонаж ~1700', text: 'Отсюда начинается путь к 1730. Отвечайте на вопросы — мококо подскажет, что делать дальше.', next: 'scrolls', x: 240, y: 40 },
  scrolls: { kind: 'question', short: 'Свитки 3–4?', title: 'Есть свитки на 3–4 высшую закалку?', icons: SCROLLS, info: 'scrolls', yes: 'honeHigh', no: 'books', x: 240, y: 130 },
  honeHigh: { kind: 'action', short: 'Точить вышку', title: 'Точите высшую закалку', text: 'Свитки есть — вкладывайтесь в высшую закалку («вышку»).', icons: SCROLLS, next: 'm1720', nextLabel: 'Персонаж 1720 →', alt: 'books', altLabel: 'Свитки кончились', x: 80, y: 250 },
  books: { kind: 'question', short: 'Книжки 19–20?', title: 'Есть книжки на 19–20?', icons: BOOKS, info: 'books', yes: 'honeNormal', no: 'gold', x: 330, y: 250 },
  honeNormal: { kind: 'action', short: 'Обычная заточка', title: 'Кликайте обычную заточку', text: 'Книжки есть — точите обычную заточку с ними.', icons: BOOKS, next: 'm1720', nextLabel: 'Персонаж 1720 →', alt: 'gold', altLabel: 'Книжки кончились', x: 210, y: 370 },
  gold: { kind: 'question', short: 'Много золота?', title: 'Много золота?', icons: [I('use_13_34')], yes: 'honeRaw', no: 'farm', x: 400, y: 370 },
  honeRaw: { kind: 'action', short: 'Без свитков', title: 'Точите без свитков и книжек', text: 'Золота хватает — можно точить и без свитков с книжками.', icons: [I('use_13_34')], next: 'm1720', nextLabel: 'Персонаж 1720 →', alt: 'farm', altLabel: 'Золото кончилось', x: 300, y: 490 },
  farm: { kind: 'farm', short: 'Фарм', title: 'Фармите свитки и книжки', text: 'Золота мало — сначала соберите свитки и книжки, потом возвращайтесь к заточке.', icons: [T.scrollW3, T.bookA], infoList: ['scrolls', 'books'], next: 'scrolls', nextLabel: 'Собрал — проверить снова', x: 420, y: 490 },
  m1720: { kind: 'milestone', ilvl: 1720, short: '1720', title: 'Персонаж 1720', text: 'Первая цель достигнута! Теперь — ядра.', next: 'cores', x: 160, y: 600 },
  cores: { kind: 'action', short: 'Реликтовые ядра', title: 'Реликтовые ядра', text: 'Возьмите из события или выбейте с рейдов реликтовые ядра.', icons: [T.core], next: 'corePts', x: 160, y: 680 },
  corePts: { kind: 'goal', short: 'Очки ядер', title: 'Цель по ядрам', goals: [['Красные ядра', '17+ очков', '#ff5a5a'], ['Синие ядра', '14+ очков', '#4fb0ff']], advice: 'Совет: сначала роллите руниты «Ропот» и «Обет», не обращая внимания на боковые статы, — сосредоточьтесь на набивании очков в ядра.', icons: [T.ropot, T.obet], next: 'hone1730', x: 160, y: 760 },
  hone1730: { kind: 'action', short: 'Точить в 1730', title: 'Точите персонажа в 1730', text: 'Ядра готовы — дотачивайте персонажа до 1730.', icons: [I('honing-chest')], next: 'm1730', nextLabel: 'Дошёл до 1730 →', alt: 'scrolls', altLabel: 'Не хватает — снова к свиткам', x: 160, y: 840 },
  m1730: { kind: 'milestone', ilvl: 1730, short: '1730', title: '1730 — готово!', text: 'Цель достигнута. Путь дальше — до 1750 — появится здесь позже.', next: 'start', nextLabel: '↺ Пройти заново', final: true, x: 340, y: 840 },
};
const EDGES = [
  ['start', 'scrolls'], ['scrolls', 'honeHigh', 'да'], ['scrolls', 'books', 'нет'],
  ['books', 'honeNormal', 'да'], ['books', 'gold', 'нет'], ['gold', 'honeRaw', 'да'], ['gold', 'farm', 'нет'],
  ['farm', 'scrolls', '', true], ['honeHigh', 'm1720'], ['honeNormal', 'm1720'], ['honeRaw', 'm1720'], ['honeHigh', 'books', '', true], ['honeNormal', 'gold', '', true],
  ['m1720', 'cores'], ['cores', 'corePts'], ['corePts', 'hone1730'], ['hone1730', 'm1730'], ['hone1730', 'scrolls', '', true],
];
const KIND = { question: ['Вопрос', '#f0d796', 'game-icons:help'], action: ['Действие', '#8fd16a', 'game-icons:anvil-impact'], milestone: ['Рубеж', '#ff9a3c', 'game-icons:laurel-crown'], goal: ['Цель', '#4fb0ff', 'game-icons:bullseye'], farm: ['Фарм', '#c084ff', 'game-icons:wheat'] };

function edgePath(a, b, loop) {
  const A = N[a], B = N[b];
  if (loop) { // петля назад к «Свиткам» — дугой справа
    const x = Math.max(A.x, B.x) + 50;
    return `M${A.x + 58},${A.y} C${x + 40},${A.y} ${x + 40},${B.y} ${B.x + 62},${B.y}`;
  }
  const y1 = A.y + 18, y2 = B.y - 18, my = (y1 + y2) / 2;
  return `M${A.x},${y1} C${A.x},${my} ${B.x},${my} ${B.x},${y2}`;
}

function mapSVG() {
  return `<svg viewBox="0 0 520 900" class="pg-map-svg" role="img" aria-label="Схема прокачки">
    <defs><marker id="pgArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10z" fill="currentColor"/></marker></defs>
    ${EDGES.map(([a, b, lbl, loop]) => {
      const A = N[a], B = N[b];
      const lx = (A.x + B.x) / 2 + (B.x < A.x ? -14 : 14), ly = (A.y + B.y) / 2;
      return `<g class="pg-edge ${loop ? 'loop' : ''}" data-e="${a}>${b}"><path d="${edgePath(a, b, loop)}" marker-end="url(#pgArrow)"/>${lbl ? `<text x="${lx}" y="${ly}" class="pg-elbl ${lbl === 'да' ? 'yes' : 'no'}">${lbl}</text>` : ''}</g>`;
    }).join('')}
    ${Object.entries(N).map(([id, n]) => `<g class="pg-node k-${n.kind}" data-n="${id}" tabindex="0" role="button" aria-label="${esc(n.title)}">
      <rect x="${n.x - 60}" y="${n.y - 18}" width="120" height="36" rx="${n.kind === 'question' ? 18 : 9}"/>
      <text x="${n.x}" y="${n.y + 5}">${esc(n.short)}</text></g>`).join('')}
  </svg>`;
}

export async function renderProgress(page) {
  TT = await tooltipDB();
  let st = load('pg', { cur: 'start', trail: ['start'] });
  if (!N[st.cur]) st = { cur: 'start', trail: ['start'] };

  page.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Прокачка · схема автора сайта</div>
      <h1>Путь 1700 → 1730</h1>
      <p>Отвечайте на вопросы — квест подскажет следующий шаг. Схема справа показывает весь маршрут: по ней можно перейти к любому шагу.</p>
    </div>
    <div class="pg-ilvl frame">
      <div class="pg-ilvl-top"><span>Уровень предметов</span><b id="pgIlvl">1700</b></div>
      <div class="pg-bar"><i id="pgFill"></i>
        ${[1700, 1720, 1730].map((v) => `<span class="pg-mark" style="left:${((v - 1700) / 30) * 100}%" data-v="${v}"><em>${v}</em></span>`).join('')}
      </div>
    </div>
    <div class="pg-layout">
      <div class="pg-main">
        <div class="pg-trail" id="pgTrail"></div>
        <div class="pg-stage" id="pgStage"></div>
      </div>
      <aside class="pg-map frame">
        <div class="pg-map-head"><b>Схема</b><button class="btn ghost sm" id="pgReset">↺ С начала</button></div>
        ${mapSVG()}
        <div class="pg-legend">${Object.entries(KIND).map(([k, [t, c]]) => `<span><i style="background:${c}"></i>${t}</span>`).join('')}</div>
      </aside>
    </div>`;

  const stage = page.querySelector('#pgStage');
  const trailEl = page.querySelector('#pgTrail');
  let ilvlShown = 1700;

  const curIlvl = () => {
    // уровень = последний пройденный рубеж в текущей ветке (или промежуточный прогресс)
    let v = 1700;
    for (const id of st.trail) { if (N[id].ilvl) v = N[id].ilvl; if (id === 'cores' || id === 'corePts' || id === 'hone1730') v = Math.max(v, 1720); }
    return v;
  };

  const infoBlock = (key) => {
    const inf = INFO[key];
    return `<details class="pg-info" open><summary><iconify-icon icon="game-icons:treasure-map"></iconify-icon>${esc(inf.title)}</summary>
      <div class="pg-info-items">${inf.items.map(icon).join('')}</div>
      <ul>${inf.rows.map(([a, b, ic]) => `<li>${ic ? icon(ic) : '<span class="pg-dot"></span>'}<b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ul>
    </details>`;
  };

  const draw = (dir = 1) => {
    const n = N[st.cur];
    const [kt, kc, ki] = KIND[n.kind];
    let body = '';
    if (n.kind === 'question') {
      body = `<div class="pg-choices">
        <button class="pg-choice yes" data-go="${n.yes}"><iconify-icon icon="game-icons:check-mark"></iconify-icon>Да</button>
        <button class="pg-choice no" data-go="${n.no}"><iconify-icon icon="game-icons:cancel"></iconify-icon>Нет</button></div>`;
    } else if (n.kind === 'goal') {
      body = `<div class="pg-goals">${n.goals.map(([a, b, c]) => `<div class="pg-goal" style="--gc:${c}"><span class="pg-orb"></span><b>${esc(a)}</b><em>${esc(b)}</em></div>`).join('')}</div>
        ${n.advice ? `<div class="pg-advice"><iconify-icon icon="game-icons:light-bulb"></iconify-icon><span>${esc(n.advice)}</span></div>` : ''}
        <button class="pg-next" data-go="${n.next}">Дальше →</button>`;
    } else {
      body = `<div class="pg-acts ${n.alt ? 'two' : ''}"><button class="pg-next" data-go="${n.next}">${esc(n.nextLabel || (n.kind === 'milestone' ? 'Вперёд →' : 'Сделано →'))}</button>
        ${n.alt ? `<button class="pg-alt" data-go="${n.alt}"><iconify-icon icon="game-icons:return-arrow"></iconify-icon>${esc(n.altLabel)}</button>` : ''}</div>`;
    }
    stage.innerHTML = `
      <article class="pg-card k-${n.kind}" style="--kc:${kc}">
        <div class="pg-card-glow"></div>
        <div class="pg-kind"><iconify-icon icon="${ki}"></iconify-icon>${kt}${n.ilvl ? ` · ${n.ilvl}` : ''}</div>
        ${n.kind === 'milestone' ? `<div class="pg-big-ilvl">${n.ilvl}</div>` : ''}
        <h2>${esc(n.title)}</h2>
        ${n.icons ? `<div class="pg-icons">${n.icons.map(icon).join('')}</div>` : ''}
        ${n.text ? `<p>${esc(n.text)}</p>` : ''}
        ${body}
        ${n.info ? infoBlock(n.info) : ''}
        ${n.infoList ? n.infoList.map(infoBlock).join('') : ''}
      </article>`;

    trailEl.innerHTML = st.trail.map((id, i) => `<button class="pg-crumb ${i === st.trail.length - 1 ? 'on' : ''}" data-back="${i}">${esc(N[id].short)}</button>`).join('<span class="pg-sep">›</span>');
    trailEl.scrollLeft = trailEl.scrollWidth;

    // мини-карта: текущий узел, пройденный путь
    page.querySelectorAll('.pg-node').forEach((g) => { g.classList.toggle('cur', g.dataset.n === st.cur); g.classList.toggle('done', st.trail.includes(g.dataset.n) && g.dataset.n !== st.cur); });
    const pairs = new Set(st.trail.slice(1).map((id, i) => `${st.trail[i]}>${id}`));
    page.querySelectorAll('.pg-edge').forEach((e) => e.classList.toggle('walked', pairs.has(e.dataset.e)));

    // шкала уровня
    const v = curIlvl();
    page.querySelector('#pgFill').style.width = `${((v - 1700) / 30) * 100}%`;
    page.querySelectorAll('.pg-mark').forEach((m) => m.classList.toggle('reached', Number(m.dataset.v) <= v));
    const num = page.querySelector('#pgIlvl');
    const o = { v: ilvlShown };
    anime({ targets: o, v, duration: 900, easing: 'easeOutExpo', update: () => { num.textContent = Math.round(o.v); } });
    ilvlShown = v;

    if (!reduced) {
      const card = stage.querySelector('.pg-card');
      anime({ targets: card, opacity: [0, 1], translateX: [40 * dir, 0], rotateY: [8 * dir, 0], duration: 520, easing: 'easeOutCubic' });
      anime({ targets: card.querySelectorAll('.pg-icons img, .pg-choice, .pg-next, .pg-goal, .pg-info'), opacity: [0, 1], translateY: [12, 0], delay: anime.stagger(70, { start: 180 }), duration: 420, easing: 'easeOutQuad' });
      if (n.kind === 'milestone' && n.ilvl > 1700) {
        anime({ targets: card.querySelector('.pg-big-ilvl'), scale: [0.4, 1.15, 1], opacity: [0, 1], duration: 900, easing: 'easeOutElastic(1, .6)' });
        setTimeout(() => coinBurst(card.querySelector('.pg-big-ilvl'), 22), 250);
      }
      const node = page.querySelector(`.pg-node[data-n="${st.cur}"] rect`);
      if (node) anime({ targets: node, strokeWidth: [6, 2], duration: 700, easing: 'easeOutQuad' });
    }
    save('pg', st);
    bindTooltips(stage);
  };

  const go = (id) => {
    if (!N[id]) return;
    if (id === 'start') { st = { cur: 'start', trail: ['start'] }; ilvlShown = 1700; draw(-1); scrollToCard(); return; }
    const idx = st.trail.lastIndexOf(id);
    // переход назад по пройденному пути — обрезаем хвост; иначе — добавляем шаг
    if (idx >= 0 && idx < st.trail.length - 1 && id !== 'scrolls') st.trail = st.trail.slice(0, idx + 1);
    else st.trail.push(id);
    if (st.trail.length > 40) st.trail = st.trail.slice(-40);
    st.cur = id;
    draw(1);
    scrollToCard();
  };
  // если карточка ушла за верх экрана (телефон) — плавно вернуть её в поле зрения
  const scrollToCard = () => {
    const r = trailEl.getBoundingClientRect();
    if (r.top < 70 || r.top > innerHeight * 0.6) window.scrollTo({ top: scrollY + r.top - 80, behavior: reduced ? 'auto' : 'smooth' });
  };

  page.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) {
      if (!reduced) {
        const r = b.getBoundingClientRect();
        const s = document.createElement('span'); s.className = 'ripple';
        const d = Math.max(r.width, r.height) * 2;
        Object.assign(s.style, { width: d + 'px', height: d + 'px', left: e.clientX - r.left - d / 2 + 'px', top: e.clientY - r.top - d / 2 + 'px' });
        b.appendChild(s);
      }
      setTimeout(() => go(b.dataset.go), reduced ? 0 : 160);
      return;
    }
    const c = e.target.closest('[data-back]');
    if (c) { const i = Number(c.dataset.back); st.trail = st.trail.slice(0, i + 1); st.cur = st.trail[i]; draw(-1); scrollToCard(); return; }
    const g = e.target.closest('.pg-node');
    if (g) { go(g.dataset.n); return; }
    if (e.target.closest('#pgReset')) { st = { cur: 'start', trail: ['start'] }; ilvlShown = 1700; draw(-1); }
  });
  page.addEventListener('keydown', (e) => { const g = e.target.closest('.pg-node'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(g.dataset.n); } });

  draw(1);
}
