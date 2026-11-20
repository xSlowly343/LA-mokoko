// Раздел «Боссы»: данные «Зала славы» lostark.ru — описания, видео, даты первых прохождений.
import anime from 'animejs';
import { esc, getJSON } from './store.js';
import { reveal } from './fx.js';

const GROUP_ICON = { 'Рейды Теней': 'game-icons:hooded-figure', 'Рейды Казероса': 'game-icons:daemon-skull', 'Владыки Фетрании': 'game-icons:crowned-skull', 'Хранители': 'game-icons:dragon-head', 'Эпические рейды': 'game-icons:spiked-dragon-head' };
let io;
const fmtN = (n) => Number(n).toLocaleString('ru-RU');
const today = () => new Date().toISOString().slice(0, 10);
const dmy = (iso) => { if (!iso) return '?'; const [y, m, d] = iso.split('-'); return d ? `${d}.${m}.${y}` : `${m}.${y}`; };

function modeChip(m) {
  const meta = [];
  if (m.ilvl) meta.push(`<span class="mc-ilvl" title="Уровень снаряжения${m.ilvlNote ? ': ' + esc(m.ilvlNote) : ''}"><iconify-icon icon="game-icons:checked-shield"></iconify-icon>${m.ilvl}${m.ilvlNote ? '*' : ''}</span>`);
  if (m.gold) meta.push(`<span class="mc-gold" title="${m.goldNote ? esc(m.goldNote) : ''}${m.goldWeak ? ' — по одному стороннему источнику' : ''}"><iconify-icon icon="game-icons:two-coins"></iconify-icon>${fmtN(m.gold)}${m.goldWeak ? '*' : ''}</span>`);
  if (m.first) meta.push(`<span class="mc-date">${esc(m.first)}</span>`);
  if (m.note) meta.push(`<span class="mc-date">${esc(m.note)}</span>`);
  if (!meta.length) meta.push('<span class="mc-date">уровень уточняется</span>');
  return `<span class="mode" style="--mcol:${esc(m.color || '#c9a45c')}"><b>${esc(m.name)}</b><span class="mc-meta">${meta.join('')}</span></span>`;
}

function extremeBlock(m) {
  const e = m.extreme;
  const live = e.start && e.end && e.start <= today() && today() <= e.end;
  const status = !e.end ? '' : live ? '<span class="ex-live">идёт сейчас</span>' : e.end < today() ? '<span class="ex-done">завершён</span>' : '<span class="ex-live">скоро</span>';
  return `<div class="extreme" style="--mcol:${esc(m.color || '#b25cff')}">
    <div class="ex-head"><iconify-icon icon="game-icons:fire-ring"></iconify-icon><b>${esc(e.event)}</b>${status}</div>
    ${e.end ? `<div class="ex-dates">${dmy(e.start)} — ${dmy(e.end)}</div>` : ''}
    ${e.diffs?.length ? `<div class="boss-modes">${e.diffs.map((x) => modeChip({ ...x, color: m.color })).join('')}</div>` : ''}
  </div>`;
}

export async function renderBosses(page, bossId) {
  const [data, sources] = await Promise.all([getJSON('data/bosses.json'), getJSON('data/sources.json')]);
  page.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Боссы · данные «Зала славы» lostark.ru</div>
      <h1>Кого предстоит победить</h1>
      <p>Боссы рейдов РУ-версии с официальными описаниями и датами первых прохождений на наших серверах.</p>
    </div>
    <nav class="m-jump">${data.groups.map((g, i) => `<a href="#/bosses" data-g="${i}" style="--mc:var(--gold-hi)"><iconify-icon icon="${GROUP_ICON[g.title] || 'game-icons:skull-crossed-bones'}"></iconify-icon>${esc(g.title)}</a>`).join('')}</nav>
    ${data.groups.map((g, i) => `
      <section class="boss-group" id="bg-${i}">
        <h2 class="bg-title"><iconify-icon icon="${GROUP_ICON[g.title] || 'game-icons:skull-crossed-bones'}"></iconify-icon>${esc(g.title)}</h2>
        <div class="boss-grid">
          ${g.bosses.map((b) => `
            <article class="boss-card frame" id="boss-${b.id}" style="--bc:${esc(b.color || '#c9a45c')}">
              <div class="boss-media">
                <video muted loop playsinline preload="none" poster="assets/bosses/${b.id}-poster.webp" data-src="assets/bosses/${b.id}.webm"></video>
              </div>
              <div class="boss-body">
                <h3>${esc(b.name)}</h3>
                <div class="boss-tags">
                  ${b.party ? `<span class="btag party" title="Размер группы — фиксированный"><iconify-icon icon="game-icons:three-friends"></iconify-icon>${b.party} игроков</span>` : ''}
                  ${b.solo ? `<span class="btag solo" title="Одиночный режим: меньше золота, нет энергии эсдо"><iconify-icon icon="game-icons:person"></iconify-icon>Соло с ${b.solo}</span>` : ''}
                  ${b.expedition ? `<span class="btag exp"><iconify-icon icon="game-icons:backup"></iconify-icon>${esc(b.expedition)}</span>` : ''}
                </div>
                <div class="boss-modes">${b.modes.filter((m) => !m.extreme).map(modeChip).join('')}</div>
                ${b.modes.filter((m) => m.extreme).map(extremeBlock).join('')}
                ${b.src && sources[b.src] ? `<a class="m-src" href="${esc(sources[b.src].url)}" target="_blank" rel="noopener">ⓘ ${esc(sources[b.src].title)}</a>` : ''}
                <p class="boss-text">${esc(b.text)}</p>
                <button class="boss-more">Читать полностью ▾</button>
              </div>
            </article>`).join('')}
        </div>
      </section>`).join('')}
    <p class="muted" style="font-size:12px">${esc(data.partyNote)} ${esc(data.goldNote)} Видео и изображения: © Smilegate / lostark.ru.</p>`;

  // видео играют, только когда на экране
  io?.disconnect();
  io = new IntersectionObserver((entries) => entries.forEach((en) => {
    const v = en.target;
    if (en.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause();
  }), { threshold: 0.35 });
  page.querySelectorAll('.boss-media video').forEach((v) => io.observe(v));

  page.addEventListener('click', (e) => {
    const more = e.target.closest('.boss-more');
    if (more) {
      const t = more.previousElementSibling;
      const open = t.classList.toggle('open');
      more.textContent = open ? 'Свернуть ▴' : 'Читать полностью ▾';
      if (open) anime({ targets: t, opacity: [.6, 1], duration: 300, easing: 'linear' });
    }
    const g = e.target.closest('[data-g]');
    if (g) { e.preventDefault(); document.getElementById('bg-' + g.dataset.g)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  if (bossId) setTimeout(() => document.getElementById('boss-' + bossId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
}

export async function bossIndex() {
  const data = await getJSON('data/bosses.json');
  return data.groups.flatMap((g) => g.bosses.map((b) => ({ title: b.name, sub: 'Босс · ' + g.title, text: b.text, href: '#/bosses/' + b.id })));
}
