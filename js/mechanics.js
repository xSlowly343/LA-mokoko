// Раздел «Механики»: реальные кадры из игры (официальный гайд Smilegate) + игровые подсказки
// умений и предметов на русском (lostarkcodex) + тренажёр парирования.
import anime from 'animejs';
import { esc, getJSON } from './store.js';
import { tooltipHTML, tooltipDB } from './tooltip.js';

const MECH = [
  {
    id: 'stagger', name: 'Изнурение', icon: 'game-icons:knockout', color: '#ff9a3c',
    lead: 'Сбейте полоску изнурения под HP — босс упадёт и будет получать больше урона.',
    shots: [
      { src: 'assets/mechanics/stagger-bar.webp', cap: 'Панель босса: полоска изнурения под полоской HP — полная, тает, опустела' },
      { src: 'assets/mechanics/stagger-world.webp', cap: 'Полоска изнурения над боссом в бою (обведена рамкой)' },
    ],
    tips: [
      'Сбивается умениями с пометкой <span class="hl-orange">«Изнурение: N ур.»</span> — ищите её в описании умения.',
      'Не все боссы изнуряются по полоске: у некоторых это <span class="hl-orange">механика на определённой полоске HP</span>.',
    ],
    tt: ['skill:17200', 'skill:16050'], src: 'wiki-stagger',
  },
  {
    id: 'destroy', name: 'Разрушение', icon: 'game-icons:shattered-sword', color: '#ff5a5a',
    lead: 'Прицел на части босса — её можно отколоть.',
    shots: [
      { src: 'assets/mechanics/destroy.webp', cap: 'Слева — прицел на части босса, справа — часть разрушена (надпись «파괴» = «Разрушение»)' },
    ],
    tips: [
      'Работают только умения с пометкой <span class="hl-red">«Разрушение: N ур.»</span> и <span class="hl-red">осколочные бомбы</span>.',
      'У части боссов это обязательная механика, у других — бонус к урону.',
    ],
    tt: ['101912', 'skill:17200'], src: 'wiki-mechanics',
  },
  {
    id: 'counter', name: 'Контратака', icon: 'game-icons:sword-clash', color: '#3da5ff',
    lead: 'Босс подсветился — ударьте в голову умением с контратакой.',
    shots: [
      { src: 'assets/mechanics/counter.webp', cap: 'Слева — босс подсвечен синим, справа — успешная контратака (надпись «카운터 어택» = «Контратака»)' },
      { src: 'assets/mechanics/headattack.webp', cap: 'Удар в голову: контратака засчитывается только так' },
    ],
    tips: [
      '<span class="hl-blue">Синее</span> свечение — одиночная контратака. <span class="hl-purple">Фиолетовое</span> — кооперативная, попасть должны 2–3 игрока.',
      'Только умения с пометкой <span class="hl-green">«Возможна контратака»</span>.',
    ],
    tt: ['skill:16500'], src: 'wiki-mechanics',
  },
  {
    id: 'parry', name: 'Парирование', icon: 'game-icons:shield-reflect', color: '#ffd84a',
    lead: 'Босс вспыхнул золотом — наведите курсор на него и нажмите G.',
    shots: [
      { src: 'assets/mechanics/parry.webp', cap: 'Слева — босс светится золотым, справа — парирование удалось (надпись «가드!» = «Защита!»)' },
    ],
    tips: [
      'Т4-механика (с 1640). Индивидуальная: не успели — отбросит или убьёт.',
      'Бывает <b>нажатие</b> и <b>удержание</b> G — удержание, например, у <span class="hl-yellow">Бельгардина</span>.',
    ],
    trainer: true, src: 'wiki-mechanics',
  },
];

let observers = [];
export async function renderMechanics(page) {
  observers.forEach((o) => o.disconnect()); observers = [];
  const [sources, db] = await Promise.all([getJSON('data/sources.json'), tooltipDB()]);
  const srcA = (k) => sources[k] ? `<a class="m-src" href="${esc(sources[k].url)}" target="_blank" rel="noopener">ⓘ ${esc(sources[k].title.replace(' — Энциклопедия LOST ARK', ''))}</a>` : '';

  page.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Боевые механики</div>
      <h1>Изнурение, разрушение, контратака, парирование</h1>
      <p>Кадры из игры — из официального гайда Smilegate (корейская версия, надписи переведены в подписях). Подсказки умений и предметов — как они выглядят в русской версии.</p>
    </div>
    <nav class="m-jump">${MECH.map((m) => `<a href="#/mechanics/${m.id}" style="--mc:${m.color}"><iconify-icon icon="${m.icon}"></iconify-icon>${m.name}</a>`).join('')}</nav>
    ${MECH.map((m) => `
      <section class="m2-card frame" id="m-${m.id}" style="--mc:${m.color}">
        <div class="m-title"><span class="m-ico"><iconify-icon icon="${m.icon}"></iconify-icon></span><div><h2>${m.name}</h2><p class="muted">${m.lead}</p></div></div>
        <div class="m2-shots ${m.shots.length > 1 ? 'two' : ''}">
          ${m.shots.map((s) => `<figure class="m2-shot"><button type="button" class="m2-zoom" data-zoom="${esc(s.src)}" data-cap="${esc(s.cap)}"><img src="${esc(s.src)}" alt="${esc(s.cap)}" loading="lazy"></button><figcaption>${esc(s.cap)}</figcaption></figure>`).join('')}
        </div>
        <div class="m2-bottom">
          <ul class="m2-tips">${m.tips.map((t) => `<li>${t}</li>`).join('')}</ul>
          ${m.tt ? `<div class="m2-tts"><div class="m2-tts-title">Как это выглядит в описании</div><div class="m2-tts-row">${m.tt.map((id) => tooltipHTML(db[id])).join('')}</div></div>` : ''}
        </div>
        ${srcA(m.src)}
        ${m.trainer ? trainerHTML() : ''}
      </section>`).join('')}
    <p class="muted" style="font-size:12px">Кадры: официальный игровой гайд LOST ARK (Smilegate). Подсказки: lostarkcodex.com. Иконки: game-icons.net (CC BY 3.0).</p>`;

  // просмотр кадра крупно прямо на странице
  const lb = document.createElement('dialog'); lb.className = 'lightbox zoomable'; page.appendChild(lb);
  lb.addEventListener('click', (e) => {
    if (e.target.closest('.lb-x') || e.target === lb) { lb.close(); return; }
    if (e.target.closest('.lb-img')) lb.classList.toggle('zoomed');
  });
  page.addEventListener('click', (e) => {
    const z = e.target.closest('[data-zoom]'); if (!z) return;
    lb.classList.remove('zoomed');
    lb.innerHTML = `<button class="lb-x" aria-label="Закрыть">×</button><div class="lb-scroll" data-lenis-prevent><img class="lb-img" src="${esc(z.dataset.zoom)}" alt=""></div><p>${esc(z.dataset.cap)}</p>`;
    lb.showModal();
    anime({ targets: lb, opacity: [0, 1], scale: [.96, 1], duration: 260, easing: 'easeOutQuad' });
  });

  initTrainer(page);
}

// ---------- Тренажёр парирования ----------
function trainerHTML() {
  return `<div class="trainer">
    <div class="tr-head"><b><iconify-icon icon="game-icons:shield-reflect"></iconify-icon> Тренажёр парирования</b>
      <span class="muted">Когда босс вспыхнет <span class="hl-yellow">золотым</span> — жмите <kbd>G</kbd> (или кнопку). В режиме «Удержание» — держите, пока не заполнится круг. Тайминги условные.</span></div>
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
  const resetRing = () => { holdAnim?.pause(); holdAnim = null; ring.style.strokeDashoffset = 120; };
  const fail = (text) => { clearTimeout(to); bad++; badEl.textContent = bad; state = 'wait'; glow(false); resetRing(); say(text, 'bad'); anime({ targets: boss, translateX: [0, -10, 10, 0], duration: 300, easing: 'easeOutQuad' }); next(); };
  const success = (dt) => { clearTimeout(to); ok++; okEl.textContent = ok; if (dt != null) { best = Math.min(best, dt); bestEl.textContent = best + ' мс'; } state = 'wait'; glow(false); resetRing(); say(dt != null ? `Парировано! ${dt} мс` : 'Удержал — парировано!', 'good'); next(); };
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

export const MECH_INDEX = MECH.map((m) => ({ id: m.id, name: m.name, text: (m.lead + ' ' + m.tips.join(' ')).replace(/<[^>]+>/g, '') }));
