// Игровые подсказки предметов и умений (данные с lostarkcodex.com/ru → data/item_tooltips.json).
// tooltipHTML(data) — карточка «как в игре»; bindTooltips(root) — показ при наведении (на телефоне — по тапу).
import { esc, getJSON } from './store.js';

const GRADE_COLOR = ['#e2e2e2', '#8dd35c', '#3ea4ff', '#c26bff', '#f9ae00', '#fa5d00', '#e3c7a1', '#3cf2e6'];

const line = (l) => {
  if (l === '---') return '<hr>';
  const t = esc(l).replace(/\[c=(#[0-9A-Fa-f]{6})\]/g, '<span style="color:$1">').replace(/\[\/c\]/g, '</span>');
  // подсветка ключевых пометок, как в игре
  return `<p>${t.replace(/^(Изнурение:[^<]*)/, '<b class="tt-st">$1</b>').replace(/^(Разрушение[^<]*)/, '<b class="tt-de">$1</b>').replace(/^(Возможна контратака)/, '<b class="tt-co">$1</b>').replace(/^(Тип атаки:[^<]*)/, '<b class="tt-at">$1</b>')}</p>`;
};

export function tooltipHTML(d) {
  if (!d) return '';
  const col = GRADE_COLOR[d.grade] || GRADE_COLOR[0];
  const head = (d.head || []).filter((h) => h !== d.gradeName);
  return `<div class="gtt" style="--gc:${col}">
    <div class="gtt-name">${esc(d.name)}</div>
    <div class="gtt-top">
      ${d.icon ? `<img class="gtt-icon" src="${esc(d.icon)}" alt="">` : ''}
      <div class="gtt-head">${d.gradeName ? `<span class="gtt-grade">${esc(d.gradeName)}</span>` : ''}${head.map((h) => `<span>${esc(h).replace(/\[c=(#[0-9A-Fa-f]{6})\]/g, '<span style="color:$1">').replace(/\[\/c\]/g, '</span>')}</span>`).join('')}</div>
    </div>
    <div class="gtt-body">${(d.lines || []).map(line).join('')}</div>
    ${d.sources?.length ? `<div class="gtt-src">${d.sources.map((s) => `<p>${esc(s)}</p>`).join('')}</div>` : ''}
  </div>`;
}

let dbPromise;
export const tooltipDB = () => (dbPromise ||= getJSON('data/item_tooltips.json').catch(() => ({})));

// Элементы с data-tt="ID" получают подсказку при наведении/тапе
export async function bindTooltips(root) {
  const db = await tooltipDB();
  if (!window.tippy) return;
  root.querySelectorAll('[data-tt]').forEach((el) => {
    if (el._tippy) return;
    const d = db[el.dataset.tt];
    if (!d) return;
    el.classList.add('has-tt');
    window.tippy(el, {
      content: tooltipHTML(d), allowHTML: true, theme: 'game', maxWidth: 340, placement: 'auto', interactive: false,
      trigger: matchMedia('(hover: hover)').matches ? 'mouseenter focus' : 'click', appendTo: document.body, animation: 'shift-away', delay: [80, 0],
    });
  });
}
