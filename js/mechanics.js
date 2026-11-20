// Раздел «Механики»: анимированные сцены (SVG + anime.js) и тренажёр парирования.
import anime from 'animejs';
import { esc, getJSON, fmtDate } from './store.js';
import { reduced } from './fx.js';

// ---------- общие элементы сцены ----------
const BOSS = (id, extra = '') => `
  <g id="${id}-boss" class="m-boss">
    <ellipse cx="160" cy="166" rx="58" ry="10" fill="#000" opacity=".45"/>
    <path d="M118 160 C110 120 118 92 138 80 L132 52 L148 72 C154 70 166 70 172 72 L188 52 L182 80 C202 92 210 120 202 160 Z" fill="#2b2238" stroke="#5a4a72" stroke-width="2"/>
    <path id="${id}-head" d="M138 82 C146 72 174 72 182 82 C186 96 176 108 160 108 C144 108 134 96 138 82Z" fill="#3a2e4c" stroke="#6b5a86" stroke-width="2"/>
    <circle cx="150" cy="90" r="4" fill="#ff6a5a"/><circle cx="170" cy="90" r="4" fill="#ff6a5a"/>
    <path d="M120 120 L96 138 L104 144 L126 132Z M200 120 L224 138 L216 144 L194 132Z" fill="#2b2238" stroke="#5a4a72" stroke-width="2"/>
    ${extra}
  </g>`;
const HERO = (id, x, color = '#8fd16a') => `
  <g transform="translate(${x} 150)"><g id="${id}">
    <ellipse cx="0" cy="16" rx="11" ry="3" fill="#000" opacity=".4"/>
    <rect x="-6" y="-6" width="12" height="20" rx="5" fill="${color}"/>
    <circle cx="0" cy="-12" r="7" fill="${color}"/>
  </g></g>`;
const ARENA = `<defs>
    <radialGradient id="arenaG" cx="50%" cy="85%" r="70%"><stop offset="0" stop-color="#2a2236"/><stop offset="1" stop-color="#0e0c14"/></radialGradient>
  </defs>
  <rect width="320" height="200" fill="url(#arenaG)"/>
  <ellipse cx="160" cy="172" rx="150" ry="22" fill="none" stroke="rgba(201,164,92,.25)" stroke-dasharray="4 6"/>`;
const txt = (id, x, y, s, fill, size = 14) => `<text id="${id}" x="${x}" y="${y}" text-anchor="middle" font-family="Manrope, sans-serif" font-weight="800" font-size="${size}" fill="${fill}" opacity="0">${s}</text>`;

// ---------- сцены ----------
const SCENES = {
  stagger: {
    svg: (p) => `${ARENA}${BOSS(p)}
      ${HERO(p + '-h1', 50)}${HERO(p + '-h2', 270, '#6fa8ff')}
      <g transform="translate(80 18)">
        <text x="0" y="-4" font-size="10" fill="#a69c8a" font-family="Manrope">СТОЙКОСТЬ</text>
        <rect width="160" height="9" rx="4" fill="#1c1626" stroke="#5a4a72"/>
        <rect id="${p}-bar" width="160" height="9" rx="4" fill="#6fa8ff"/>
      </g>
      <g id="${p}-stars" opacity="0">
        <text x="140" y="64" font-size="16" fill="#f2c94c">★</text><text x="158" y="58" font-size="16" fill="#f2c94c">★</text><text x="176" y="64" font-size="16" fill="#f2c94c">★</text>
      </g>
      ${txt(p + '-t', 160, 196, 'ИЗНУРЕН — урон по нему выше!', '#f2c94c', 13)}
      <circle id="${p}-s1" cx="140" cy="120" r="0" fill="#fff"/><circle id="${p}-s2" cx="180" cy="128" r="0" fill="#fff"/>`,
    tl: (p) => {
      const q = (s) => `#${p}-${s}`;
      const tl = anime.timeline({ loop: true, autoplay: false, easing: 'easeOutQuad' });
      const hit = (from, to, side) => {
        tl.add({ targets: q(side === 'l' ? 'h1' : 'h2'), translateX: side === 'l' ? [0, 60, 0] : [0, -60, 0], duration: 420, easing: 'easeInOutQuad' })
          .add({ targets: q(side === 'l' ? 's1' : 's2'), r: [0, 12, 0], opacity: [1, 0], duration: 260 }, '-=220')
          .add({ targets: q('bar'), width: [from, to], duration: 300 }, '-=260')
          .add({ targets: q('boss'), translateX: [0, side === 'l' ? 4 : -4, 0], duration: 180 }, '-=300');
      };
      hit(160, 110, 'l'); hit(110, 55, 'r'); hit(55, 0, 'l');
      tl.add({ targets: q('boss'), rotate: [0, -6], opacity: [1, .75], duration: 300 })
        .add({ targets: q('stars'), opacity: [0, 1], translateY: [8, 0], duration: 300 }, '-=200')
        .add({ targets: q('stars'), rotate: [0, 360], duration: 1600, easing: 'linear' })
        .add({ targets: q('t'), opacity: [0, 1], duration: 300 }, '-=1600')
        .add({ targets: [q('stars'), q('t')], opacity: 0, duration: 300, delay: 300 })
        .add({ targets: q('boss'), rotate: 0, opacity: 1, duration: 300 }, '-=300')
        .add({ targets: q('bar'), width: [0, 160], duration: 500 });
      return tl;
    },
  },
  destroy: {
    svg: (p) => `${ARENA}${BOSS(p, `<g id="${p}-part"><path d="M182 84 L214 70 L222 96 L196 108Z" fill="#7a6a52" stroke="#c9a45c" stroke-width="2"/>
        <path id="${p}-crack" d="M200 76 L204 88 L198 94 L208 102" stroke="#fff" stroke-width="2" fill="none" opacity="0"/></g>`)}
      <g transform="translate(203 89)"><g id="${p}-aim" opacity="0">
        <circle r="18" fill="none" stroke="#e0606b" stroke-width="2" stroke-dasharray="6 4"/>
        <path d="M-24 0 H-12 M12 0 H24 M0 -24 V-12 M0 12 V24" stroke="#e0606b" stroke-width="2"/>
      </g></g>
      ${HERO(p + '-h', 60)}
      <circle id="${p}-bomb" cx="60" cy="140" r="0" fill="#c9a45c" stroke="#fff"/>
      <g transform="translate(118 20)" font-family="Manrope" font-size="10" fill="#a69c8a"><text x="0" y="0">ОЧКИ РАЗРУШЕНИЯ</text></g>
      <g transform="translate(130 28)">${[0, 1, 2].map((i) => `<rect id="${p}-pip${i}" x="${i * 22}" y="0" width="18" height="8" rx="3" fill="#1c1626" stroke="#e0606b"/>`).join('')}</g>
      ${txt(p + '-t', 160, 196, 'Часть разрушена!', '#e0606b')}`,
    tl: (p) => {
      const q = (s) => `#${p}-${s}`;
      const tl = anime.timeline({ loop: true, autoplay: false, easing: 'easeOutQuad' });
      tl.add({ targets: q('aim'), opacity: [0, 1], scale: [1.6, 1], duration: 400 })
        .add({ targets: q('aim'), rotate: [0, 90], duration: 600, easing: 'easeInOutSine' }, '-=200');
      for (let i = 0; i < 3; i++) {
        tl.add({ targets: q('bomb'), r: [4, 6], cx: [60, 203], cy: [{ value: 40, duration: 300, easing: 'easeOutQuad' }, { value: 89, duration: 300, easing: 'easeInQuad' }], duration: 600 })
          .add({ targets: q('bomb'), r: [8, 0], duration: 160 })
          .add({ targets: q('pip' + i), fill: ['#1c1626', '#e0606b'], duration: 200 }, '-=160')
          .add({ targets: q('part'), translateX: [0, 3, -2, 0], duration: 200 }, '-=200');
      }
      tl.add({ targets: q('crack'), opacity: [0, 1], duration: 150 })
        .add({ targets: q('aim'), opacity: 0, duration: 200 })
        .add({ targets: q('part'), translateX: [0, 60], translateY: [0, 80], rotate: [0, 120], opacity: [1, 0], duration: 800, easing: 'easeInQuad' }, '-=100')
        .add({ targets: q('t'), opacity: [0, 1], duration: 300 }, '-=500')
        .add({ targets: q('t'), opacity: 0, duration: 300, delay: 900 })
        .add({ targets: [q('pip0'), q('pip1'), q('pip2')], fill: '#1c1626', duration: 200 })
        .add({ targets: q('part'), translateX: 0, translateY: 0, rotate: 0, opacity: [0, 1], duration: 400 })
        .add({ targets: q('crack'), opacity: 0, duration: 10 });
      return tl;
    },
  },
  counter: {
    svg: (p) => `${ARENA}
      <ellipse id="${p}-aura" cx="160" cy="110" rx="70" ry="64" fill="none" stroke="#f0d796" stroke-width="3" opacity="0"/>
      ${BOSS(p)}
      ${HERO(p + '-h', 40)}
      <circle id="${p}-flash" cx="160" cy="92" r="0" fill="#fff"/>
      <g id="${p}-lbl" opacity="0"><path d="M226 54 L188 82" stroke="#8fd16a" stroke-width="2" marker-end="url(#${p}-arr)"/>
        <text x="232" y="50" font-family="Manrope" font-weight="800" font-size="11" fill="#8fd16a">в голову!</text></g>
      <defs><marker id="${p}-arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6Z" fill="#8fd16a"/></marker></defs>
      ${txt(p + '-w', 160, 30, 'Босс заряжает атаку…', '#f0d796', 12)}
      ${txt(p + '-t', 160, 196, 'Контратака! Атака сорвана', '#8fd16a')}
      <g id="${p}-stars" opacity="0"><text x="146" y="66" font-size="14" fill="#f2c94c">★ ★</text></g>`,
    tl: (p) => {
      const q = (s) => `#${p}-${s}`;
      return anime.timeline({ loop: true, autoplay: false, easing: 'easeOutQuad' })
        .add({ targets: q('w'), opacity: [0, 1], duration: 250 })
        .add({ targets: q('aura'), opacity: [0, .9], rx: [60, 76], ry: [54, 70], duration: 500, direction: 'alternate', loop: 2 }, '-=200')
        .add({ targets: q('boss'), scale: [1, 1.05], duration: 600 }, '-=1000')
        .add({ targets: q('lbl'), opacity: [0, 1], duration: 300 })
        .add({ targets: q('h'), translateX: [0, 92], translateY: [0, -52], duration: 350, easing: 'easeInQuad' })
        .add({ targets: q('flash'), r: [0, 26], opacity: [1, 0], duration: 350 })
        .add({ targets: [q('aura'), q('w'), q('lbl')], opacity: 0, duration: 150 }, '-=350')
        .add({ targets: q('boss'), scale: 1, rotate: [0, 5, -4, 0], duration: 500 }, '-=300')
        .add({ targets: q('stars'), opacity: [0, 1], duration: 200 }, '-=400')
        .add({ targets: q('t'), opacity: [0, 1], duration: 300 }, '-=300')
        .add({ targets: q('h'), translateX: [92, 0], translateY: [-52, 0], duration: 500, delay: 700 })
        .add({ targets: [q('t'), q('stars')], opacity: 0, duration: 300 }, '-=300')
        .add({ targets: q('w'), opacity: 0, duration: 400 });
    },
  },
  parry: {
    svg: (p) => `${ARENA}
      <defs><filter id="${p}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter></defs>
      <ellipse id="${p}-aura" cx="160" cy="112" rx="62" ry="58" fill="#ffd84a" filter="url(#${p}-glow)" opacity="0"/>
      ${BOSS(p)}
      ${HERO(p + '-h1', 70)}${HERO(p + '-h2', 250, '#a69c8a')}
      <g transform="translate(70 104)"><g id="${p}-key" opacity="0">
        <rect x="-14" y="-14" width="28" height="28" rx="6" fill="#f0d796" stroke="#1a1408" stroke-width="2"/>
        <text x="0" y="6" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="16" fill="#1a1408">G</text>
      </g></g>
      <path id="${p}-shield" d="M86 128 Q100 150 86 172" stroke="#8fd16a" stroke-width="5" fill="none" opacity="0" stroke-linecap="round"/>
      <path id="${p}-wave" d="M160 120 Q210 120 240 150" stroke="#ffd84a" stroke-width="4" fill="none" opacity="0"/>
      <path id="${p}-wave2" d="M160 120 Q110 120 86 150" stroke="#ffd84a" stroke-width="4" fill="none" opacity="0"/>
      ${txt(p + '-ok', 80, 30, 'Нажал G — парировал', '#8fd16a', 11)}
      ${txt(p + '-bad', 246, 30, 'Не нажал — отброшен', '#e0606b', 11)}
      ${txt(p + '-w', 160, 196, 'Жёлтое свечение = готовься к парированию', '#ffd84a', 11)}`,
    tl: (p) => {
      const q = (s) => `#${p}-${s}`;
      return anime.timeline({ loop: true, autoplay: false, easing: 'easeOutQuad' })
        .add({ targets: q('aura'), opacity: [0, .55], duration: 400 })
        .add({ targets: q('w'), opacity: [0, 1], duration: 300 }, '-=300')
        .add({ targets: q('aura'), opacity: [.55, .9, .55], duration: 600 })
        .add({ targets: q('key'), opacity: [0, 1], scale: [.6, 1], duration: 250 }, '-=300')
        .add({ targets: q('key'), scale: [1, .82, 1], duration: 200 })
        .add({ targets: [q('wave'), q('wave2')], opacity: [1, 0], strokeDashoffset: [anime.setDashoffset, 0], duration: 350 })
        .add({ targets: q('shield'), opacity: [0, 1, 0], duration: 500 }, '-=300')
        .add({ targets: q('h2'), translateX: [0, 50], translateY: [0, -30, 10], rotate: [0, 80], duration: 600 }, '-=500')
        .add({ targets: [q('ok'), q('bad')], opacity: [0, 1], duration: 300 }, '-=500')
        .add({ targets: [q('aura'), q('key'), q('w')], opacity: 0, duration: 300 }, '-=300')
        .add({ targets: [q('ok'), q('bad')], opacity: 0, duration: 300, delay: 900 })
        .add({ targets: q('h2'), translateX: 0, translateY: 0, rotate: 0, duration: 400 }, '-=200');
    },
  },
};

const MECH = [
  {
    id: 'stagger', name: 'Изнурение', icon: '✴', color: '#6fa8ff',
    lead: 'Сбейте стойкость босса до нуля — и он станет беззащитным.',
    points: [
      ['Что это', 'Когда стойкость противника снижается до нуля, он получает статус «Изнурение»: получает повышенный урон и какое-то время не может двигаться.', 'wiki-stagger'],
      ['Чем сбивать', 'Умениями с пометкой «Изнурение» уровня 1–5. Каждый следующий уровень сильнее предыдущего ровно в 1,5 раза. При этом два умения разных классов с одинаковой пометкой могут изнурять по-разному.', 'wiki-mechanics'],
      ['Подвох', 'У механики две вариации. Некоторых боссов можно изнурить только в начале боя — после определённого порога здоровья эта возможность пропадает.', 'wiki-mechanics'],
    ],
    extra: 'levels',
  },
  {
    id: 'destroy', name: 'Разрушение', icon: '✖', color: '#e0606b',
    lead: 'Отколите часть брони или тела босса.',
    points: [
      ['Сигнал', 'Начало механики видно по прицелу на той части противника, которую нужно отколоть.', 'wiki-mechanics'],
      ['Чем ломать', 'Только умениями с пометкой «Разрушение: X ур.» — уровень 1/2/3 означает столько же очков разрушения. Без пометки умение ничего не разрушает. Помогают осколочные бомбы.', 'wiki-mechanics'],
      ['Зачем', 'Иногда это обязательная механика: например, у Иллиакана разрушение — отдельная фаза при 0 здоровья (разрушить можно ударом Эсдо Силлиана или вручную — бомбами и умениями с разрушением). Иногда — просто бонус к урону группы.', 'wiki-illiakan'],
    ],
  },
  {
    id: 'counter', name: 'Контратака', icon: '⚡', color: '#8fd16a',
    lead: 'Сорвите особую атаку босса ударом в голову.',
    points: [
      ['Чем', 'Только умениями с пометкой «Возможна контратака».', 'wiki-mechanics'],
      ['Куда', 'Все контратаки без исключения выполняются только в голову противника — встаньте к боссу лицом.', 'wiki-mechanics'],
      ['Бонус', 'У ряда боссов успешная контратака сокращает время восстановления умений и даёт усиление изнурения (например, в «Башне слоновой кости»).', 'wiki-ivory'],
    ],
  },
  {
    id: 'parry', name: 'Парирование', icon: '🛡', color: '#ffd84a',
    lead: 'Т4-механика: поймайте момент и нажмите G.',
    points: [
      ['Где', 'Рейдовая механика Т4-контента (с 1640 уровня снаряжения). Впервые — в бою с Хранителем Агеросом; например, на Эгире (фаза 1) Иллиакан подсвечивается жёлтым.', 'wiki-egir-p1'],
      ['Как', 'Сигнал — жёлтое свечение босса. Наведите курсор на босса и нажмите G. Момент нажатия зависит от атаки и не обязательно совпадает со вспышкой; иногда нужна серия — например, одно медленное и два быстрых парирования подряд.', 'wiki-mechanics'],
      ['Важно', 'Парирование индивидуально: если вы не нажали, вас отбросит, нанесёт большой урон или убьёт. Антиконтроль, триподы, абсолютные умения и Пробуждение от этого не спасают.', 'wiki-mechanics'],
    ],
    extra: 'trainer',
  },
];

let observers = [];
export async function renderMechanics(page) {
  observers.forEach((o) => o.disconnect()); observers = [];
  const sources = await getJSON('data/sources.json');
  const srcA = (k) => sources[k] ? `<a class="m-src" href="${esc(sources[k].url)}" target="_blank" rel="noopener" title="${esc(sources[k].title)}">ⓘ ${esc(sources[k].title.replace(' — Энциклопедия LOST ARK', ''))}</a>` : '';

  page.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Боевые механики</div>
      <h1>Изнурение, разрушение, контратака, парирование</h1>
      <p>Четыре механики, без которых не пройти рейды. Анимации — схемы для понимания, а не кадры из игры. Описания — по Энциклопедии lostark.ru.</p>
    </div>
    <nav class="m-jump">${MECH.map((m) => `<a href="#/mechanics/${m.id}" style="--mc:${m.color}"><span>${m.icon}</span>${m.name}</a>`).join('')}</nav>
    ${MECH.map((m, i) => `
      <section class="m-card frame ${i % 2 ? 'flip' : ''}" id="m-${m.id}" style="--mc:${m.color}">
        <div class="m-scene"><svg viewBox="0 0 320 200" role="img" aria-label="Анимация: ${esc(m.name)}">${SCENES[m.id].svg('sc' + m.id)}</svg>
          <button class="m-replay" data-replay="${m.id}" aria-label="Пауза/пуск">❚❚</button></div>
        <div class="m-text">
          <div class="m-title"><span class="m-ico">${m.icon}</span><div><h2>${m.name}</h2><p class="muted">${m.lead}</p></div></div>
          ${m.points.map(([h, t, s]) => `<div class="m-point"><b>${h}</b><p>${t}</p>${srcA(s)}</div>`).join('')}
          ${m.extra === 'levels' ? levelsHTML() : ''}
        </div>
        ${m.extra === 'trainer' ? trainerHTML() : ''}
      </section>`).join('')}`;

  // сцены: играем только когда видны
  const tls = {};
  MECH.forEach((m) => {
    const tl = SCENES[m.id].tl('sc' + m.id);
    tls[m.id] = tl;
    if (reduced) { tl.seek(tl.duration * 0.6); return; }
    const io = new IntersectionObserver(([en]) => { en.isIntersecting ? tl.play() : tl.pause(); }, { threshold: 0.3 });
    io.observe(page.querySelector('#m-' + m.id));
    observers.push(io);
  });
  page.querySelectorAll('[data-replay]').forEach((b) => b.addEventListener('click', () => {
    const tl = tls[b.dataset.replay];
    if (tl.paused) { tl.play(); b.textContent = '❚❚'; } else { tl.pause(); b.textContent = '▶'; }
  }));

  // уровни изнурения
  const bars = page.querySelectorAll('.lv-bar i');
  const ioL = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    anime({ targets: bars, width: (el) => el.dataset.w + '%', delay: anime.stagger(120), duration: 900, easing: 'easeOutExpo' });
    ioL.disconnect();
  }, { threshold: 0.4 });
  const lv = page.querySelector('.levels'); if (lv) ioL.observe(lv);
  observers.push(ioL);

  initTrainer(page);
}

function levelsHTML() {
  const vals = [1, 1.5, 2.25, 3.375, 5.0625];
  return `<div class="levels"><b>Сила пометки «Изнурение» по уровням</b>
    ${vals.map((v, i) => `<div class="lv"><span>${i + 1} ур.</span><div class="lv-bar"><i data-w="${(v / 5.0625) * 100}"></i></div><span>×${v.toLocaleString('ru-RU')}</span></div>`).join('')}
    <small class="muted">Относительно 1 уровня: каждый следующий ×1,5.</small></div>`;
}

// ---------- тренажёр парирования ----------
function trainerHTML() {
  return `<div class="trainer">
    <div class="tr-head"><b>Тренажёр реакции</b><span class="muted">Когда босс засветится жёлтым — жмите G (или кнопку). Это тренировка реакции, реальные тайминги в игре свои у каждой атаки.</span></div>
    <div class="tr-arena" id="trArena"><div class="tr-boss" id="trBoss"></div><div class="tr-msg" id="trMsg">Нажмите «Старт»</div></div>
    <div class="tr-ctrl">
      <button class="btn" id="trStart">Старт</button>
      <button class="btn ghost tr-g" id="trG" disabled>G</button>
      <div class="tr-score">Успешно: <b id="trOk">0</b> · Промахи: <b id="trBad">0</b> · Лучшая реакция: <b id="trBest">—</b></div>
    </div></div>`;
}

function initTrainer(page) {
  const boss = page.querySelector('#trBoss');
  if (!boss) return;
  const msg = page.querySelector('#trMsg'), btnS = page.querySelector('#trStart'), btnG = page.querySelector('#trG');
  const okEl = page.querySelector('#trOk'), badEl = page.querySelector('#trBad'), bestEl = page.querySelector('#trBest');
  let state = 'idle', t0 = 0, to, ok = 0, bad = 0, best = Infinity, round = 0;
  const WINDOW = 600;
  const say = (s, cls = '') => { msg.textContent = s; msg.className = 'tr-msg ' + cls; anime({ targets: msg, scale: [.9, 1], opacity: [0, 1], duration: 250, easing: 'easeOutBack' }); };
  const next = () => {
    if (round >= 10) { state = 'idle'; btnG.disabled = true; btnS.disabled = false; btnS.textContent = 'Ещё раз'; say(`Готово! ${ok} из 10`, ok >= 8 ? 'good' : ''); return; }
    state = 'wait'; boss.classList.remove('glow');
    to = setTimeout(() => { state = 'glow'; t0 = performance.now(); boss.classList.add('glow'); round++;
      to = setTimeout(() => { if (state === 'glow') { bad++; badEl.textContent = bad; state = 'wait'; boss.classList.remove('glow'); say('Отброшен! Не успели', 'bad'); hitFx(false); next(); } }, WINDOW);
    }, 900 + Math.random() * 1800);
  };
  const hitFx = (good) => anime({ targets: boss, translateX: good ? [0, 0] : [0, -10, 10, 0], scale: good ? [1, .94, 1] : 1, duration: 300, easing: 'easeOutQuad' });
  const press = () => {
    if (state === 'glow') {
      const dt = Math.round(performance.now() - t0);
      clearTimeout(to); ok++; okEl.textContent = ok; best = Math.min(best, dt); bestEl.textContent = best + ' мс';
      state = 'wait'; boss.classList.remove('glow'); say(`Парировано! ${dt} мс`, 'good'); hitFx(true); next();
    } else if (state === 'wait') {
      clearTimeout(to); bad++; badEl.textContent = bad; say('Рано! Ждите свечения', 'bad'); next();
    }
  };
  btnS.addEventListener('click', () => { ok = bad = round = 0; okEl.textContent = badEl.textContent = 0; btnS.disabled = true; btnG.disabled = false; say('Ждите свечения…'); next(); });
  btnG.addEventListener('click', press);
  const onKey = (e) => { if ((e.key === 'g' || e.key === 'G' || e.key === 'п' || e.key === 'П') && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { if (!document.body.contains(page)) { removeEventListener('keydown', onKey); return; } e.preventDefault(); press(); } };
  addEventListener('keydown', onKey);
}

export const MECH_INDEX = MECH.map((m) => ({ id: m.id, name: m.name, text: m.lead + ' ' + m.points.map((p) => p[1]).join(' ') }));
