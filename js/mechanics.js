// Раздел «Механики»: сцены с официальными видео боссов (lostark.ru) + HUD-эффекты поверх них,
// и тренажёр парирования (нажатие / удержание).
import anime from 'animejs';
import { esc, getJSON } from './store.js';
import { reduced } from './fx.js';

const PARTY = ['berserker', 'bard', 'sorceress', 'blades'];
const token = (id, i) => `<span class="ms-pl" data-pl="${i}"><img src="assets/classes/${id}-icon.webp" alt=""></span>`;

// ---------- Разметка сцены ----------
function sceneHTML(m) {
  return `
  <div class="ms" data-scene="${m.id}">
    <div class="ms-bg"></div>
    <div class="ms-hud">
      <div class="ms-name"><span class="ms-bossname">${esc(m.boss.name)}</span><span class="ms-x">×<b>85</b></span></div>
      <div class="ms-hp"><i class="ms-hp-fill"></i><i class="ms-hp-ghost"></i></div>
      ${m.id === 'stagger' ? `<div class="ms-st"><i></i></div><div class="ms-st-lbl">Изнурение</div>` : ''}
      ${m.id === 'destroy' ? `<div class="ms-pips">${[0, 1, 2].map(() => '<i></i>').join('')}<span>Разрушение</span></div>` : ''}
    </div>
    <div class="ms-stage">
      <video class="ms-boss" muted loop playsinline preload="none" data-src="assets/bosses/${m.boss.id}.webm" poster="assets/bosses/${m.boss.id}-poster.webp"></video>
      <div class="ms-fx"></div>
    </div>
    <div class="ms-party">${(m.party || PARTY).map(token).join('')}</div>
    <div class="ms-key" aria-hidden="true"><svg viewBox="0 0 44 44"><circle class="ring-bg" cx="22" cy="22" r="19"/><circle class="ring" cx="22" cy="22" r="19"/></svg><span>G</span></div>
    <div class="ms-big"></div>
    <div class="ms-cap"></div>
    ${m.modes ? `<div class="ms-modes">${m.modes.map((x, i) => `<button class="ms-mode ${i ? '' : 'on'}" data-mode="${x.id}" style="--mm:${x.color}">${esc(x.label)}</button>`).join('')}</div>` : ''}
    <button class="m-replay" aria-label="Пауза/пуск">❚❚</button>
  </div>`;
}

// ---------- Утилиты анимации ----------
const q = (root, s) => root.querySelector(s);
const qa = (root, s) => root.querySelectorAll(s);
function popNumber(root, text, cls, x, y) {
  const fx = q(root, '.ms-fx');
  const el = document.createElement('span');
  el.className = 'ms-num ' + cls; el.textContent = text;
  el.style.left = x + '%'; el.style.top = y + '%';
  fx.appendChild(el);
  anime({ targets: el, translateY: [0, -38], opacity: [1, 0], scale: [1.3, 1], duration: 900, easing: 'easeOutQuad', complete: () => el.remove() });
}
function burst(root, x, y, color) {
  const fx = q(root, '.ms-fx');
  const el = document.createElement('span');
  el.className = 'ms-burst'; el.style.left = x + '%'; el.style.top = y + '%'; el.style.setProperty('--c', color);
  fx.appendChild(el);
  anime({ targets: el, scale: [0, 2.6], opacity: [1, 0], duration: 520, easing: 'easeOutCubic', complete: () => el.remove() });
}
function caption(root, html) {
  const c = q(root, '.ms-cap');
  c.innerHTML = html;
  anime({ targets: c, opacity: [0, 1], translateY: [6, 0], duration: 300, easing: 'easeOutQuad' });
}
function big(root, html, cls = '') {
  const b = q(root, '.ms-big');
  b.className = 'ms-big ' + cls; b.innerHTML = html;
  anime({ targets: b, opacity: [0, 1, 1, 0], scale: [1.6, 1, 1, 1.05], duration: 1500, easing: 'easeOutExpo' });
}
function setX(root, n) { q(root, '.ms-x b').textContent = n; }
function dash(root, idx, toX, toY) {
  const pl = qa(root, '.ms-pl')[idx];
  return { targets: pl, translateX: [0, toX, 0], translateY: [0, toY, 0], duration: 620, easing: 'easeInOutQuad' };
}
const call = (fn) => ({ targets: {}, duration: 1, complete: fn });

// ---------- Сцены ----------
const TL = {
  stagger(root) {
    const st = q(root, '.ms-st i'), hp = q(root, '.ms-hp-fill'), boss = q(root, '.ms-boss');
    const stWrap = [q(root, '.ms-st'), q(root, '.ms-st-lbl')];
    const tl = anime.timeline({ loop: true, autoplay: false, easing: 'easeOutQuad' });
    tl.add(call(() => { setX(root, 85); caption(root, 'Бьём умениями с пометкой <span class="hl-orange">«Изнурение»</span> — <span class="hl-orange">оранжевая полоска</span> под HP тает'); boss.style.filter = ''; }))
      .add({ targets: stWrap, opacity: 1, duration: 10 })
      .add({ targets: st, width: ['100%', '100%'], duration: 300 });
    [[0, -30, -48, '100%', '72%'], [1, 30, -44, '72%', '45%'], [2, -10, -52, '45%', '20%'], [3, 20, -40, '20%', '0%']].forEach(([i, x, y, a, b]) => {
      tl.add(dash(root, i, x, y))
        .add(call(() => { burst(root, 50 + x / 6, 52, '#ff9a3c'); popNumber(root, 'Изнурение', 'orange', 46 + x / 5, 40); }), '-=320')
        .add({ targets: st, width: [a, b], duration: 260 }, '-=300')
        .add({ targets: hp, width: (el) => (parseFloat(el.style.width || 100) - 2) + '%', duration: 260 }, '-=260');
    });
    tl.add(call(() => { big(root, 'ИЗНУРЁН', 'orange'); caption(root, 'Босс изнурён: <b>не двигается</b> и <b>получает больше урона</b> — время для самых мощных умений'); boss.style.filter = 'grayscale(.55) brightness(.8)'; }))
      .add({ targets: boss, translateX: [0, -8, 8, -4, 0], duration: 500, easing: 'easeInOutSine' })
      .add({ targets: hp, width: ['86%', '64%'], duration: 1600, easing: 'linear' })
      .add(call(() => setX(root, 72)), '-=800')
      .add(call(() => { boss.style.filter = ''; caption(root, 'Но не у всех так! У некоторых боссов изнурение — <span class="hl-orange">механика на определённой полоске HP</span>'); }))
      .add({ targets: stWrap, opacity: [1, 0], duration: 300 })
      .add({ targets: hp, width: ['64%', '40%'], duration: 1400, easing: 'linear' })
      .add(call(() => setX(root, 60)), '-=200')
      .add(call(() => { big(root, '×60 · МЕХАНИКА', 'orange small'); }))
      .add({ targets: stWrap, opacity: [0, 1], duration: 300 })
      .add({ targets: st, width: ['0%', '100%'], duration: 600, easing: 'easeOutExpo' })
      .add(call(() => caption(root, 'Полоска появляется только сейчас — сбейте её, пока босс не закончил атаку')))
      .add({ targets: st, width: ['100%', '0%'], duration: 1600, easing: 'easeInOutSine' })
      .add({ targets: hp, width: ['40%', '100%'], duration: 500, delay: 900 })
      .add({ targets: st, width: ['0%', '100%'], duration: 10 });
    return tl;
  },

  destroy(root) {
    const fx = q(root, '.ms-fx'), boss = q(root, '.ms-boss');
    const aim = document.createElement('div'); aim.className = 'ms-aim'; aim.innerHTML = '<iconify-icon icon="game-icons:targeting"></iconify-icon>'; fx.appendChild(aim);
    const pips = qa(root, '.ms-pips i');
    const tl = anime.timeline({ loop: true, autoplay: false, easing: 'easeOutQuad' });
    tl.add(call(() => { pips.forEach((p) => p.classList.remove('on')); caption(root, '<span class="hl-red">Прицел</span> на части босса — её можно отколоть'); }))
      .add({ targets: aim, opacity: [0, 1], scale: [1.8, 1], rotate: [0, 90], duration: 700, easing: 'easeOutBack' });
    [0, 1, 2].forEach((i) => {
      const bomb = document.createElement('span'); bomb.className = 'ms-bomb'; bomb.innerHTML = '<iconify-icon icon="game-icons:round-bottom-flask"></iconify-icon>'; fx.appendChild(bomb);
      tl.add(call(() => caption(root, i === 0 ? 'Умения с пометкой <span class="hl-red">«Разрушение: X ур.»</span> и <span class="hl-red">осколочные бомбы</span> дают очки разрушения' : `Очки разрушения: <b>${i}/3</b>`)))
        .add(dash(root, i, (i - 1) * 24, -40))
        .add({ targets: bomb, left: [`${22 + i * 18}%`, '62%'], top: [{ value: '20%', duration: 300, easing: 'easeOutQuad' }, { value: '36%', duration: 300, easing: 'easeInQuad' }], opacity: [1, 1, 0], rotate: [0, 360], duration: 600 }, '-=600')
        .add(call(() => { burst(root, 62, 36, '#ff5a5a'); pips[i].classList.add('on'); popNumber(root, 'Разрушение +1', 'red', 58, 26); }))
        .add({ targets: aim, scale: [1, 1.25, 1], duration: 260 });
    });
    tl.add(call(() => { big(root, 'ЧАСТЬ РАЗРУШЕНА', 'red'); caption(root, 'Часть отколота — у кого-то из боссов это <b>обязательная механика</b>, у кого-то бонус к урону'); burst(root, 62, 36, '#fff'); boss.style.filter = 'brightness(1.6)'; }))
      .add({ targets: aim, opacity: 0, scale: 2, duration: 400 })
      .add({ targets: boss, translateX: [0, 10, -10, 0], duration: 400 }, '-=400')
      .add(call(() => { boss.style.filter = ''; }), '+=200')
      .add({ targets: {}, duration: 1400 });
    return tl;
  },

  counter(root, mode = 'solo') {
    const boss = q(root, '.ms-boss');
    const coop = mode === 'coop';
    const color = coop ? '#b25cff' : '#3da5ff';
    const tl = anime.timeline({ loop: true, autoplay: false, easing: 'easeOutQuad' });
    tl.add(call(() => { boss.style.setProperty('--glow', color); boss.classList.add('glowing'); caption(root, coop ? 'Босс светится <span class="hl-purple">фиолетовым</span> — <b>кооперативная контратака</b>: нужно 2–3 игрока' : 'Босс светится <span class="hl-blue">синим</span> — <b>одиночная контратака</b>: хватит одного игрока'); }))
      .add({ targets: {}, duration: 1300 });
    const hitters = coop ? [0, 1, 2] : [0];
    hitters.forEach((i, k) => {
      tl.add(dash(root, i, (1 - i) * 30 + 10, -70), k ? '-=520' : '+=0')
        .add(call(() => { burst(root, 50, 30, color); popNumber(root, coop ? `Контратака ${k + 1}/3` : 'Контратака!', coop ? 'purple' : 'blue', 44 + k * 6, 22); }), '-=320');
    });
    tl.add(call(() => { boss.classList.remove('glowing'); big(root, coop ? 'КООП-КОНТРАТАКА!' : 'КОНТРАТАКА!', coop ? 'purple' : 'blue'); caption(root, 'Только умения с пометкой <span class="hl-green">«Возможна контратака»</span> и <b>только в голову</b> босса'); boss.style.filter = 'grayscale(.4)'; }))
      .add({ targets: boss, translateX: [0, -10, 10, -6, 0], duration: 600, easing: 'easeInOutSine' })
      .add(call(() => { boss.style.filter = ''; }), '+=900')
      .add({ targets: {}, duration: 700 });
    return tl;
  },

  parry(root, mode = 'press') {
    const boss = q(root, '.ms-boss'), key = q(root, '.ms-key'), ring = q(root, '.ms-key .ring');
    const hold = mode === 'hold';
    const tl = anime.timeline({ loop: true, autoplay: false, easing: 'easeOutQuad' });
    tl.add(call(() => { ring.style.strokeDashoffset = 120; key.classList.remove('ok', 'down'); boss.style.setProperty('--glow', '#ffd84a'); boss.classList.add('glowing'); caption(root, 'Босс вспыхивает <span class="hl-yellow">жёлтым</span> — наведите курсор на босса и готовьтесь'); }))
      .add({ targets: key, opacity: [0, 1], scale: [.6, 1], duration: 300, easing: 'easeOutBack' }, '+=600');
    if (!hold) {
      tl.add(call(() => caption(root, '<b>Нажатие</b>: коротко жмите <kbd>G</kbd> в момент удара')), '+=500')
        .add(call(() => key.classList.add('down')))
        .add({ targets: key, scale: [1, .82, 1], duration: 220 })
        .add(call(() => { key.classList.remove('down'); key.classList.add('ok'); }));
    } else {
      tl.add(call(() => { caption(root, '<b>Удержание</b> (Бельгардин): зажмите <kbd>G</kbd> и держите'); key.classList.add('down'); }), '+=400')
        .add({ targets: key, scale: [1, .9], duration: 200 })
        .add({ targets: ring, strokeDashoffset: [120, 0], duration: 1500, easing: 'linear' })
        .add(call(() => { key.classList.remove('down'); key.classList.add('ok'); }))
        .add({ targets: key, scale: [.9, 1.08, 1], duration: 300 });
    }
    tl.add(call(() => { boss.classList.remove('glowing'); burst(root, 50, 62, '#ffd84a'); big(root, 'ПАРИРОВАНО', 'yellow'); popNumber(root, 'Без урона', 'yellow', 26, 64); }))
      .add(call(() => caption(root, 'Не успели — <span class="hl-red">отбросит, нанесёт большой урон или убьёт</span>. Антиконтроль не спасает')), '+=900')
      .add({ targets: qa(root, '.ms-pl')[3], translateX: [0, 60], translateY: [0, -30, 10], rotate: [0, 90], opacity: [1, .5], duration: 700 })
      .add({ targets: qa(root, '.ms-pl')[3], translateX: 0, translateY: 0, rotate: 0, opacity: 1, duration: 400, delay: 900 })
      .add({ targets: key, opacity: 0, duration: 200 }, '-=400');
    return tl;
  },
};

// ---------- Контент ----------
const MECH = [
  {
    id: 'stagger', name: 'Изнурение', icon: 'game-icons:knockout', color: '#ff9a3c',
    boss: { id: 'echidna', name: 'Экидна' },
    lead: 'Сбейте <span class="hl-orange">оранжевую полоску</span> — и босс беззащитен.',
    points: [
      ['Что это', 'Под полоской здоровья босса — <span class="hl-orange">оранжевая полоска изнурения</span>. Когда она опустеет, босс получает статус «Изнурение»: <b>получает повышенный урон</b> и какое-то время <b>не может двигаться</b>.', 'wiki-stagger'],
      ['Чем сбивать', 'Умениями с пометкой <span class="hl-orange">«Изнурение»</span> (уровни 1–5). Два умения разных классов с одинаковой пометкой могут изнурять по-разному.', 'wiki-mechanics'],
      ['Подвох', 'Не все боссы изнуряются по полоске. У некоторых изнурение — <span class="hl-orange">механика босса на определённой полоске HP</span>: полоска появляется только в этот момент. А некоторых боссов можно изнурить только в начале боя.', 'wiki-mechanics'],
    ],
  },
  {
    id: 'destroy', name: 'Разрушение', icon: 'game-icons:shattered-sword', color: '#ff5a5a',
    boss: { id: 'voldan', name: 'Волдан' },
    lead: 'Отколите часть брони или тела босса.',
    points: [
      ['Сигнал', 'Начало механики видно по <span class="hl-red">прицелу</span> на той части противника, которую нужно отколоть.', 'wiki-mechanics'],
      ['Чем ломать', 'Только умениями с пометкой <span class="hl-red">«Разрушение: X ур.»</span> — уровень 1/2/3 даёт столько же очков разрушения. Без пометки умение ничего не разрушает. Помогают <span class="hl-red">осколочные бомбы</span>.', 'wiki-mechanics'],
      ['Зачем', 'Иногда это обязательная механика: у Иллиакана разрушение — отдельная фаза при 0 здоровья, у Волдана во 2 фазе так снимают эффект брони. Иногда — просто бонус к урону группы.', 'wiki-illiakan'],
    ],
  },
  {
    id: 'counter', name: 'Контратака', icon: 'game-icons:sword-clash', color: '#3da5ff',
    boss: { id: 'avrelsud-2', name: 'Аврельсуд' },
    modes: [{ id: 'solo', label: 'Одиночная · синяя', color: '#3da5ff' }, { id: 'coop', label: 'Кооп · фиолетовая', color: '#b25cff' }],
    lead: 'Сорвите особую атаку босса ударом в голову.',
    points: [
      ['Сигнал', 'Босс подсвечивается <span class="hl-blue">синим</span> — <b>одиночная</b> контратака, хватит одного игрока. <span class="hl-purple">Фиолетовое</span> свечение — <b>кооперативная</b>: попасть должны 2–3 игрока.', 'wiki-mechanics'],
      ['Чем и куда', 'Только умениями с пометкой <span class="hl-green">«Возможна контратака»</span>, и <b>только в голову</b> противника — встаньте к боссу лицом.', 'wiki-mechanics'],
      ['Бонус', 'У ряда боссов успешная контратака сокращает время восстановления умений и усиливает изнурение (например, в «Башне слоновой кости»).', 'wiki-ivory'],
    ],
  },
  {
    id: 'parry', name: 'Парирование', icon: 'game-icons:shield-reflect', color: '#ffd84a',
    boss: { id: 'egir', name: 'Эгир' },
    modes: [{ id: 'press', label: 'Нажатие', color: '#ffd84a' }, { id: 'hold', label: 'Удержание · Бельгардин', color: '#ffb347' }],
    lead: 'Т4-механика: поймайте момент и нажмите — или зажмите — <kbd>G</kbd>.',
    points: [
      ['Как', 'Сигнал — <span class="hl-yellow">жёлтое свечение</span> босса. Наведите курсор на босса и используйте <kbd>G</kbd>. Момент зависит от атаки и не всегда совпадает со вспышкой; бывают серии — например, одно медленное и два быстрых.', 'wiki-mechanics'],
      ['Два вида', '<b>Нажатие</b> — короткое нажатие <kbd>G</kbd> в нужный момент (например, Эгир, фаза 1). <b>Удержание</b> — у <span class="hl-yellow">Бельгардина</span> <kbd>G</kbd> нужно зажать и держать.', 'wiki-egir-p1'],
      ['Важно', 'Т4-контент (с 1640 уровня). Парирование индивидуально: не успели — <span class="hl-red">отбросит, нанесёт большой урон или убьёт</span>. Антиконтроль, триподы, абсолютные умения и Пробуждение не спасают.', 'wiki-mechanics'],
    ],
    trainer: true,
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
      <p>Четыре механики, без которых не пройти рейды. В сценах — боссы из официальных роликов lostark.ru, эффекты поверх них показывают, что происходит в бою.</p>
    </div>
    <nav class="m-jump">${MECH.map((m) => `<a href="#/mechanics/${m.id}" style="--mc:${m.color}"><iconify-icon icon="${m.icon}"></iconify-icon>${m.name}</a>`).join('')}</nav>
    ${MECH.map((m, i) => `
      <section class="m-card frame ${i % 2 ? 'flip' : ''}" id="m-${m.id}" style="--mc:${m.color}">
        <div class="m-scene">${sceneHTML(m)}</div>
        <div class="m-text">
          <div class="m-title"><span class="m-ico"><iconify-icon icon="${m.icon}"></iconify-icon></span><div><h2>${m.name}</h2><p class="muted">${m.lead}</p></div></div>
          ${m.points.map(([h, t, s]) => `<div class="m-point"><b>${h}</b><p>${t}</p>${srcA(s)}</div>`).join('')}
        </div>
        ${m.trainer ? trainerHTML() : ''}
      </section>`).join('')}
    <p class="muted" style="font-size:12px">Видео боссов: © Smilegate / lostark.ru. Иконки: game-icons.net (CC BY 3.0).</p>`;

  MECH.forEach((m) => {
    const root = page.querySelector(`#m-${m.id} .ms`);
    const video = q(root, '.ms-boss');
    let tl = TL[m.id](root, m.modes?.[0].id);
    const btn = q(root, '.m-replay');
    let visible = false;
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) { if (!video.src) video.src = video.dataset.src; video.play().catch(() => {}); if (!reduced) tl.play(); }
      else { video.pause(); tl.pause(); }
    }, { threshold: 0.3 });
    io.observe(root); observers.push(io);
    btn.addEventListener('click', () => {
      if (tl.paused) { tl.play(); video.play().catch(() => {}); btn.textContent = '❚❚'; } else { tl.pause(); video.pause(); btn.textContent = '▶'; }
    });
    qa(root, '.ms-mode').forEach((b) => b.addEventListener('click', () => {
      qa(root, '.ms-mode').forEach((x) => x.classList.toggle('on', x === b));
      tl.pause(); tl.seek(0);
      qa(root, '.ms-pl').forEach((p) => { p.style.transform = ''; p.style.opacity = ''; });
      q(root, '.ms-fx').innerHTML = '';
      video.classList.remove('glowing');
      if (m.id === 'parry') {
        const id = b.dataset.mode === 'hold' ? 'belgardin' : 'egir';
        video.src = `assets/bosses/${id}.webm`; video.poster = `assets/bosses/${id}-poster.webp`;
        q(root, '.ms-bossname').textContent = id === 'belgardin' ? 'Бельгардин' : 'Эгир';
        video.play().catch(() => {});
      }
      tl = TL[m.id](root, b.dataset.mode);
      if (visible && !reduced) tl.play();
    }));
  });

  initTrainer(page);
}

// ---------- Тренажёр ----------
function trainerHTML() {
  return `<div class="trainer">
    <div class="tr-head"><b><iconify-icon icon="game-icons:shield-reflect"></iconify-icon> Тренажёр парирования</b>
      <span class="muted">Когда босс вспыхнет <span class="hl-yellow">жёлтым</span> — жмите <kbd>G</kbd> (или кнопку). В режиме «Удержание» — зажмите и держите, пока не заполнится круг. Тайминги тренажёра условные.</span></div>
    <div class="tr-modes"><button class="chip on" data-tr="press">Нажатие</button><button class="chip" data-tr="hold">Удержание</button></div>
    <div class="tr-arena" id="trArena">
      <video class="tr-boss" id="trBoss" muted loop playsinline preload="none" data-src="assets/bosses/egir.webm" poster="assets/bosses/egir-poster.webp"></video>
      <div class="tr-hold" id="trHold"><svg viewBox="0 0 44 44"><circle class="ring-bg" cx="22" cy="22" r="19"/><circle class="ring" cx="22" cy="22" r="19"/></svg><span>G</span></div>
      <div class="tr-msg" id="trMsg">Нажмите «Старт»</div>
    </div>
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
  const holdEl = page.querySelector('#trHold'), ring = holdEl.querySelector('.ring');
  let mode = 'press', state = 'idle', t0 = 0, to, ok = 0, bad = 0, best = Infinity, round = 0, holdAnim = null, holdStart = 0;
  const WINDOW = 650, HOLD = 900, HOLD_WINDOW = 1700;
  const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { if (!boss.src) boss.src = boss.dataset.src; boss.play().catch(() => {}); } else boss.pause(); });
  io.observe(boss); observers.push(io);

  const say = (s, cls = '') => { msg.innerHTML = s; msg.className = 'tr-msg ' + cls; anime({ targets: msg, scale: [.9, 1], opacity: [0, 1], duration: 250, easing: 'easeOutBack' }); };
  const glow = (on) => { boss.style.setProperty('--glow', '#ffd84a'); boss.classList.toggle('glowing', on); holdEl.classList.toggle('show', on && mode === 'hold'); };
  const fail = (text) => { clearTimeout(to); bad++; badEl.textContent = bad; state = 'wait'; glow(false); resetRing(); say(text, 'bad'); anime({ targets: boss, translateX: [0, -10, 10, 0], duration: 300, easing: 'easeOutQuad' }); next(); };
  const success = (dt) => { clearTimeout(to); ok++; okEl.textContent = ok; if (dt != null) { best = Math.min(best, dt); bestEl.textContent = best + ' мс'; } state = 'wait'; glow(false); resetRing(); say(dt != null ? `Парировано! ${dt} мс` : 'Удержал — парировано!', 'good'); next(); };
  const resetRing = () => { holdAnim?.pause(); holdAnim = null; ring.style.strokeDashoffset = 120; };
  const next = () => {
    if (round >= 10) { state = 'idle'; btnG.disabled = true; btnS.disabled = false; btnS.textContent = 'Ещё раз'; say(`Готово! ${ok} из 10`, ok >= 8 ? 'good' : ''); return; }
    state = 'wait';
    to = setTimeout(() => {
      state = 'glow'; t0 = performance.now(); glow(true); round++;
      to = setTimeout(() => { if (state === 'glow' || state === 'holding') fail('Отброшен! Не успели'); }, mode === 'hold' ? HOLD_WINDOW : WINDOW);
    }, 900 + Math.random() * 1800);
  };
  const down = () => {
    if (state === 'wait') { fail('Рано! Ждите свечения'); return; }
    if (state !== 'glow') return;
    if (mode === 'press') { success(Math.round(performance.now() - t0)); return; }
    state = 'holding'; holdStart = performance.now();
    holdAnim = anime({ targets: ring, strokeDashoffset: [120, 0], duration: HOLD, easing: 'linear', complete: () => { if (state === 'holding') success(null); } });
  };
  const up = () => { if (state === 'holding' && performance.now() - holdStart < HOLD) fail('Отпустили рано — держите до конца'); };

  page.querySelectorAll('[data-tr]').forEach((b) => b.addEventListener('click', () => {
    if (state !== 'idle') return;
    mode = b.dataset.tr;
    page.querySelectorAll('[data-tr]').forEach((x) => x.classList.toggle('on', x === b));
    const id = mode === 'hold' ? 'belgardin' : 'egir';
    boss.src = `assets/bosses/${id}.webm`; boss.poster = `assets/bosses/${id}-poster.webp`; boss.play().catch(() => {});
    say(mode === 'hold' ? 'Режим «Удержание» — как у Бельгардина' : 'Режим «Нажатие»');
  }));
  btnS.addEventListener('click', () => { ok = bad = round = 0; okEl.textContent = badEl.textContent = 0; btnS.disabled = true; btnG.disabled = false; say('Ждите свечения…'); next(); });
  btnG.addEventListener('pointerdown', (e) => { e.preventDefault(); down(); });
  btnG.addEventListener('pointerup', up); btnG.addEventListener('pointerleave', up);
  const isG = (e) => /^(g|G|п|П)$/.test(e.key) && !/INPUT|TEXTAREA/.test(document.activeElement.tagName);
  const onDown = (e) => { if (!document.body.contains(page)) { cleanup(); return; } if (isG(e) && !e.repeat && state !== 'idle') { e.preventDefault(); down(); } };
  const onUp = (e) => { if (isG(e)) up(); };
  const cleanup = () => { removeEventListener('keydown', onDown); removeEventListener('keyup', onUp); };
  addEventListener('keydown', onDown); addEventListener('keyup', onUp);
}

export const MECH_INDEX = MECH.map((m) => ({ id: m.id, name: m.name, text: (m.lead + ' ' + m.points.map((p) => p[1]).join(' ')).replace(/<[^>]+>/g, '') }));
