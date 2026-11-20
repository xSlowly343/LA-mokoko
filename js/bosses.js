// Раздел «Рейды по ГС»: какие рейды ходить на выбранном уровне снаряжения и сколько БС нужно в подборе.
// Данные: data/bosses.json (уровни — из официальных анонсов lostark.ru; БС — заполняется вручную).
import anime from 'animejs';
import { esc, getJSON, load, save } from './store.js';

const fmtN = (n) => Number(n).toLocaleString('ru-RU');
const today = () => new Date().toISOString().slice(0, 10);
const dmy = (iso) => { if (!iso) return '?'; const [y, m, d] = iso.split('-'); return d ? `${d}.${m}.${y}` : `${m}.${y}`; };
const QUICK = [1680, 1700, 1710, 1720, 1730, 1740, 1750, 1770, 1780];
let io;

// Все режимы с известным уровнем входа: обычные + активные экстримы
function allModes(data) {
  const out = [];
  for (const g of data.groups) for (const b of g.bosses) {
    for (const m of b.modes) {
      if (m.extreme) {
        const e = m.extreme;
        if (!(e.start && e.end && e.start <= today() && today() <= e.end)) continue;
        for (const x of e.diffs || []) if (x.ilvl) out.push({ boss: b, group: g.title, mode: `Экстрим · ${x.name}`, ilvl: x.ilvl, gold: x.gold, bs: x.bs, color: m.color || '#b25cff', extreme: e });
      } else if (m.ilvl) {
        out.push({ boss: b, group: g.title, mode: m.name, ilvl: m.ilvl, gold: m.gold, goldWeak: m.goldWeak, bs: m.bs, note: m.note, color: m.color });
      }
    }
    if (b.solo) out.push({ boss: b, group: g.title, mode: 'Соло', ilvl: b.solo, color: '#8fd16a', solo: true });
  }
  return out;
}

export async function renderBosses(page, bossId) {
  const [data, sources] = await Promise.all([getJSON('data/bosses.json'), getJSON('data/sources.json')]);
  const modes = allModes(data);
  let ilvl = load('raid-ilvl', 1720);

  page.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Рейды по ГС</div>
      <h1>Какие рейды ходить на вашем ГС</h1>
      <p>Укажите уровень снаряжения — покажем рейды, куда уже пускает, лучшую сложность для каждого и сколько БС обычно просят в подборе.</p>
    </div>
    <div class="rg-pick frame">
      <div class="rg-pick-row">
        <button class="rg-step" data-step="-5" aria-label="Минус 5">−</button>
        <label class="rg-ilvl"><span>Ваш ГС</span><input id="rgInput" type="number" inputmode="numeric" min="1600" max="1800" step="5" value="${ilvl}"></label>
        <button class="rg-step" data-step="5" aria-label="Плюс 5">+</button>
      </div>
      <input id="rgRange" class="rg-range" type="range" min="1600" max="1800" step="5" value="${ilvl}" aria-label="Уровень снаряжения">
      <div class="rg-quick">${QUICK.map((v) => `<button class="chip" data-q="${v}">${v}</button>`).join('')}</div>
    </div>
    <div id="rgResult"></div>
    <p class="muted rg-note">${esc(data.bsNote)} Уровни входа — из анонсов lostark.ru; «*» — уровень по одиночному режиму.</p>

    <h2 class="rg-all-title">Все рейды</h2>
    ${data.groups.map((g, gi) => `
      <section class="boss-group" id="bg-${gi}">
        <h3 class="bg-title">${esc(g.title)}</h3>
        <div class="boss-grid">
          ${g.bosses.map((b) => `
            <article class="boss-card frame" id="boss-${b.id}" style="--bc:${esc(b.color || '#c9a45c')}">
              ${b.noMedia ? '' : `<div class="boss-media"><video muted loop playsinline preload="none" poster="assets/bosses/${b.id}-poster.webp" data-src="assets/bosses/${b.id}.webm"></video></div>`}
              <div class="boss-body">
                <h3>${esc(b.name)}</h3>
                <div class="boss-tags">
                  ${b.party ? `<span class="btag party"><iconify-icon icon="game-icons:three-friends"></iconify-icon>${b.party} игроков</span>` : ''}
                  ${b.solo ? `<span class="btag solo"><iconify-icon icon="game-icons:person"></iconify-icon>Соло с ${b.solo}</span>` : ''}
                  ${b.expedition ? `<span class="btag exp"><iconify-icon icon="game-icons:backup"></iconify-icon>${esc(b.expedition)}</span>` : ''}
                </div>
                <div class="boss-modes">${b.modes.filter((m) => !m.extreme && m.ilvl).map((m) => `<span class="mode" style="--mcol:${esc(m.color || '#c9a45c')}"><b>${esc(m.name)}</b><span class="mc-meta"><span class="mc-ilvl"><iconify-icon icon="game-icons:checked-shield"></iconify-icon>${m.ilvl}${m.ilvlNote ? '*' : ''}</span>${m.bs ? `<span class="mc-bs">БС ${esc(m.bs)}</span>` : ''}</span></span>`).join('') || '<span class="muted" style="font-size:13px">Уровни входа не указаны в найденных источниках</span>'}</div>
                <p class="boss-text">${esc(b.text)}</p>
                <button class="boss-more">Читать полностью ▾</button>
              </div>
            </article>`).join('')}
        </div>
      </section>`).join('')}
    <p class="muted" style="font-size:12px">Видео и изображения: © Smilegate / lostark.ru.</p>`;

  const res = page.querySelector('#rgResult');
  const inp = page.querySelector('#rgInput'), rng = page.querySelector('#rgRange');

  const draw = (animate = true) => {
    save('raid-ilvl', ilvl);
    inp.value = ilvl; rng.value = ilvl;
    rng.style.setProperty('--p', `${((ilvl - 1600) / 200) * 100}%`);
    page.querySelectorAll('[data-q]').forEach((b) => b.classList.toggle('on', Number(b.dataset.q) === ilvl));
    const avail = modes.filter((m) => m.ilvl <= ilvl);
    // лучшая доступная сложность у каждого босса (без соло)
    const best = new Map();
    for (const m of avail) {
      if (m.solo) continue;
      const k = m.boss.id + (m.extreme ? ':ex' : '');
      if (!best.has(k) || best.get(k).ilvl < m.ilvl) best.set(k, m);
    }
    const top = [...best.values()].sort((a, b) => b.ilvl - a.ilvl);
    const soon = modes.filter((m) => m.ilvl > ilvl && m.ilvl <= ilvl + 30 && !m.solo).sort((a, b) => a.ilvl - b.ilvl);
    const row = (m, cls = '') => `
      <div class="rg-row ${cls}" style="--mcol:${esc(m.color || '#c9a45c')}">
        ${m.boss.noMedia ? '<span class="rg-thumb blank"><iconify-icon icon="game-icons:church"></iconify-icon></span>' : `<img class="rg-thumb" src="assets/bosses/${m.boss.id}-poster.webp" alt="" loading="lazy">`}
        <div class="rg-name"><b>${esc(m.boss.name)}</b><small>${esc(m.group)}${m.boss.party ? ` · ${m.boss.party} игроков` : ''}</small></div>
        <span class="rg-mode">${esc(m.mode)}</span>
        <span class="rg-req"><iconify-icon icon="game-icons:checked-shield"></iconify-icon>${m.ilvl}</span>
        <span class="rg-bs ${m.bs ? '' : 'empty'}" title="Боевая сила в подборе">${m.bs ? `БС ${esc(m.bs)}` : 'БС —'}</span>
        ${m.extreme ? `<span class="rg-ex">до ${dmy(m.extreme.end)}</span>` : ''}
      </div>`;
    res.innerHTML = `
      <section class="rg-block frame">
        <h2><iconify-icon icon="game-icons:crossed-swords"></iconify-icon>Лучшее на ${ilvl} <span class="rg-count">${top.length}</span></h2>
        ${top.length ? top.map((m) => row(m)).join('') : '<p class="muted">На этом уровне рейдов из списка ещё нет — поднимите ГС.</p>'}
      </section>
      ${soon.length ? `<section class="rg-block soon frame"><h2><iconify-icon icon="game-icons:hourglass"></iconify-icon>Скоро откроется</h2>
        ${soon.map((m) => row(m, 'locked')).join('')}</section>` : ''}
      ${avail.some((m) => m.solo) ? `<section class="rg-block frame"><h2><iconify-icon icon="game-icons:person"></iconify-icon>Соло-режимы</h2>
        <p class="muted" style="margin:0 0 8px;font-size:13px">Меньше золота, нет энергии эсдо, зато без группы.</p>
        <div class="rg-solo">${avail.filter((m) => m.solo).sort((a, b) => b.ilvl - a.ilvl).map((m) => `<span>${esc(m.boss.name)} <small>${m.ilvl}</small></span>`).join('')}</div></section>` : ''}`;
    if (animate) anime({ targets: res.querySelectorAll('.rg-row'), opacity: [0, 1], translateX: [-10, 0], delay: anime.stagger(35), duration: 320, easing: 'easeOutQuad' });
  };
  draw(false);

  const set = (v) => { ilvl = Math.max(1600, Math.min(1800, Math.round(Number(v) / 5) * 5 || 1720)); draw(); };
  rng.addEventListener('input', () => { ilvl = Number(rng.value); draw(false); });
  rng.addEventListener('change', () => draw());
  inp.addEventListener('change', () => set(inp.value));
  page.addEventListener('click', (e) => {
    const st = e.target.closest('[data-step]'); if (st) { set(ilvl + Number(st.dataset.step)); return; }
    const q = e.target.closest('[data-q]'); if (q) { set(q.dataset.q); return; }
    const more = e.target.closest('.boss-more');
    if (more) { const t = more.previousElementSibling; const open = t.classList.toggle('open'); more.textContent = open ? 'Свернуть ▴' : 'Читать полностью ▾'; }
  });

  io?.disconnect();
  io = new IntersectionObserver((entries) => entries.forEach((en) => {
    const v = en.target;
    if (en.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause();
  }), { threshold: 0.35 });
  page.querySelectorAll('.boss-media video').forEach((v) => io.observe(v));
  if (bossId) setTimeout(() => document.getElementById('boss-' + bossId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
}

export async function bossIndex() {
  const data = await getJSON('data/bosses.json');
  return data.groups.flatMap((g) => g.bosses.map((b) => ({ title: b.name, sub: 'Рейды по ГС · ' + g.title, text: b.text, href: '#/bosses/' + b.id })));
}
