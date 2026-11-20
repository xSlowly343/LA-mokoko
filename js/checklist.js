// Чек-лист дел с автосбросом. Время сброса настраивается — сверьте его в игре.
import anime from 'animejs';
import { load, save, esc } from './store.js';

const DAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const uid = () => Math.random().toString(36).slice(2, 9);
const t = (text) => ({ id: uid(), text, done: false });

function defaults() {
  return {
    hour: 6, weekday: 3,
    daily: [t('Разломы Хаоса'), t('Рейд на Хранителя')],
    weekly: [t('Экстрим Казерос «Акт III» (на Наследие)'), t('Бельгардин, Длань смерти'), t('Зерка, ведьма боли'), t('Собор Сакра-Финистриа')],
    checked: Date.now(),
  };
}

function lastBoundary(now, hour, weekday) {
  const d = new Date(now); d.setHours(hour, 0, 0, 0);
  if (d > now) d.setDate(d.getDate() - 1);
  const w = new Date(d);
  if (weekday != null) { while (w.getDay() !== weekday) w.setDate(w.getDate() - 1); }
  return { day: d.getTime(), week: w.getTime() };
}
function nextIn(now, hour, weekday) {
  const b = lastBoundary(now, hour, weekday);
  const nd = b.day + 864e5, nw = b.week + 7 * 864e5;
  const f = (ms) => { const h = Math.floor(ms / 36e5); return h >= 24 ? `${Math.floor(h / 24)} д ${h % 24} ч` : `${h} ч ${Math.floor((ms % 36e5) / 6e4)} мин`; };
  return { day: f(nd - now), week: f(nw - now) };
}

export function renderChecklist(view) {
  const st = Object.assign(defaults(), load('check', {}));
  const now = new Date();
  const b = lastBoundary(now, st.hour, st.weekday);
  if (st.checked < b.day) st.daily.forEach((x) => (x.done = false));
  if (st.checked < b.week) st.weekly.forEach((x) => (x.done = false));
  st.checked = now.getTime();
  save('check', st);

  const col = (key, title, sub) => {
    const list = st[key];
    const done = list.filter((x) => x.done).length;
    return `<section class="frame check-col" data-key="${key}">
      <h2>${title} <small>${done}/${list.length} · ${sub}</small></h2>
      ${list.map((x) => `<div class="task ${x.done ? 'done' : ''}" data-id="${x.id}">
        <input type="checkbox" id="c-${x.id}" ${x.done ? 'checked' : ''}>
        <label for="c-${x.id}">${esc(x.text)}</label>
        <button class="del" aria-label="Удалить">×</button></div>`).join('')}
      <form class="add-task"><input type="text" placeholder="Добавить дело…" required><button class="btn sm">+</button></form>
    </section>`;
  };

  const draw = () => {
    const n = nextIn(new Date(), st.hour, st.weekday);
    view.innerHTML = `
      <div class="page-head">
        <div class="eyebrow">Чек-лист</div>
        <h1>Дела на день и неделю</h1>
        <p>Отметки сбрасываются сами. Список — заготовка: удаляйте и добавляйте своё. Время сброса сверьте в игре и поправьте ниже.</p>
      </div>
      <div class="check-cols">
        ${col('daily', 'Ежедневно', 'сброс через ' + n.day)}
        ${col('weekly', 'Еженедельно', 'сброс через ' + n.week)}
      </div>
      <div class="frame check-col" style="margin-top:18px">
        <div class="char-head" style="grid-template-columns:1fr 1fr auto">
          <div><label class="lbl" for="rh">Час сброса (ваше время)</label>
            <select id="rh">${Array.from({ length: 24 }, (_, h) => `<option value="${h}" ${h === st.hour ? 'selected' : ''}>${String(h).padStart(2, '0')}:00</option>`).join('')}</select></div>
          <div><label class="lbl" for="rw">День недельного сброса</label>
            <select id="rw">${DAYS.map((d, i) => `<option value="${i}" ${i === st.weekday ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
          <button class="btn ghost sm" id="rst">Снять все отметки</button>
        </div>
      </div>`;
  };
  draw();

  view.onchange = (e) => {
    if (e.target.id === 'rh') { st.hour = Number(e.target.value); save('check', st); draw(); return; }
    if (e.target.id === 'rw') { st.weekday = Number(e.target.value); save('check', st); draw(); return; }
    const task = e.target.closest('.task');
    if (!task) return;
    const key = task.closest('[data-key]').dataset.key;
    const item = st[key].find((x) => x.id === task.dataset.id);
    item.done = e.target.checked;
    save('check', st);
    if (item.done) anime({ targets: task, backgroundColor: ['rgba(143,209,106,.25)', 'rgba(143,209,106,0)'], duration: 700, easing: 'easeOutQuad' });
    task.classList.toggle('done', item.done);
    const list = st[key];
    task.closest('section').querySelector('h2 small').textContent = task.closest('section').querySelector('h2 small').textContent.replace(/^\d+\/\d+/, `${list.filter((x) => x.done).length}/${list.length}`);
  };
  view.onclick = (e) => {
    if (e.target.closest('.del')) {
      const task = e.target.closest('.task');
      const key = task.closest('[data-key]').dataset.key;
      st[key] = st[key].filter((x) => x.id !== task.dataset.id);
      save('check', st); draw();
    }
    if (e.target.id === 'rst') { st.daily.forEach((x) => (x.done = false)); st.weekly.forEach((x) => (x.done = false)); save('check', st); draw(); }
  };
  view.onsubmit = (e) => {
    e.preventDefault();
    const key = e.target.closest('[data-key]').dataset.key;
    const inp = e.target.querySelector('input');
    if (!inp.value.trim()) return;
    st[key].push(t(inp.value.trim()));
    save('check', st); draw();
    view.querySelector(`[data-key="${key}"] .add-task input`).focus();
  };
}
