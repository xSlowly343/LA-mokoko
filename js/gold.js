// Калькулятор недельного золота.
import anime from 'animejs';
import { load, save, esc, fmt, fmtDate, getJSON } from './store.js';

let chart;
const vals0 = (per, roster) => roster > 0 || per.some((p) => p.total > 0);
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);

function defaultState() {
  return {
    chars: [{ id: uid(), name: 'Мой мейн', ilvl: 1750, recipient: true, picks: {} }],
    roster: {},          // { raidId: diffId } — рейды «раз в неделю на Наследие»
    gold: {},            // переопределения золота { 'raid:diff': число }
    customName: '',
    charLimit: null,
    expenses: 0,
  };
}

export async function renderGold(view) {
  const [data, sources] = await Promise.all([getJSON('data/raids.json'), getJSON('data/sources.json')]);
  const st = Object.assign(defaultState(), load('gold', {}));
  const raids = data.raids.filter((r) => !r.available?.to || r.available.to >= today());
  const rosterRaids = raids.filter((r) => r.perRoster);
  const charRaids = raids.filter((r) => !r.perRoster);

  const goldOf = (r, d) => {
    const k = r.id + ':' + d.id;
    if (st.gold[k] !== undefined && st.gold[k] !== '') return Number(st.gold[k]) || 0;
    return d.gold ?? null;
  };
  const persist = () => save('gold', st);

  view.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Калькулятор · данные от ${fmtDate(data.updated)}</div>
      <h1>Доход золота за неделю</h1>
      <p>Добавьте персонажей, отметьте рейды и сложности. Если у рейда нет подтверждённой цифры золота, впишите её из превью наград в окне входа. Всё сохраняется в браузере.</p>
    </div>
    <div class="gold-layout">
      <div>
        <div class="frame char-card" id="rosterCard"></div>
        <div id="chars"></div>
        <button class="btn ghost" id="addChar">+ Добавить персонажа</button>
        <div class="frame char-card" style="margin-top:14px">
          <h3 style="margin-top:0">Настройки</h3>
          <div class="char-head" style="grid-template-columns:1fr 1fr">
            <div><label class="lbl" for="lim">Лимит персонажей-получателей</label>
              <input type="number" id="lim" min="1" max="30" placeholder="не задан" value="${st.charLimit ?? ''}"></div>
            <div><label class="lbl" for="exp">Расходы за неделю (сундуки и т.п.)</label>
              <input type="number" id="exp" min="0" step="100" value="${st.expenses || 0}"></div>
          </div>
          <p class="muted" style="font-size:13px;margin:0">${esc(data.settings.goldCharacterLimitNote)}</p>
        </div>
      </div>
      <aside class="frame summary" id="summary"></aside>
    </div>`;

  const srcLink = (id) => {
    const s = sources[id];
    return s ? `<a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.title)}">${fmtDate(s.date)}</a>` : '';
  };

  function diffOptions(r, ilvl, picked) {
    return `<option value="">— не иду —</option>` + r.difficulties.map((d) => {
      const locked = ilvl != null && d.ilvl != null && ilvl < d.ilvl;
      return `<option value="${d.id}" ${picked === d.id ? 'selected' : ''} ${locked ? 'disabled' : ''}>${esc(d.name)}${d.ilvl ? ` · ${d.ilvl}+` : ''}${locked ? ' (мало уровня)' : ''}</option>`;
    }).join('');
  }

  function raidRow(r, picked, ilvl, scope) {
    const d = r.difficulties.find((x) => x.id === picked);
    const g = d ? goldOf(r, d) : null;
    const name = r.id === 'custom' && st.customName ? st.customName : r.short;
    const lockedAll = ilvl != null && r.difficulties.every((x) => x.ilvl != null && ilvl < x.ilvl);
    return `<div class="raid-row ${lockedAll ? 'locked' : ''}" data-raid="${r.id}" data-scope="${scope}">
      <div class="r-name">${esc(name)}
        ${r.perRoster ? '<span class="badge roster">Наследие</span>' : ''}
        ${r.personalGold ? '<span class="badge bound">персон.</span>' : ''}
        ${d && g == null ? '<span class="badge manual">введите</span>' : ''}
        <small>${esc(r.type)}${r.available?.to ? ` · до ${fmtDate(r.available.to)}` : ''}${d?.source ? ` · ист. ${srcLink(d.source)}` : ''}</small>
      </div>
      <select data-act="diff" aria-label="Сложность ${esc(name)}">${diffOptions(r, ilvl, picked)}</select>
      <input type="number" data-act="gold" min="0" step="100" placeholder="золото" aria-label="Золото" value="${d && g != null ? g : ''}" ${d ? '' : 'disabled'}>
    </div>`;
  }

  function drawRoster() {
    const el = view.querySelector('#rosterCard');
    el.innerHTML = `<h3 style="margin-top:0">На всё Наследие (1 раз в неделю)</h3>
      <p class="muted" style="font-size:13px;margin:0 0 6px">Не считается в лимите золота персонажа и выдаётся без назначения получателя.</p>
      ${rosterRaids.map((r) => raidRow(r, st.roster[r.id], null, 'roster')).join('') || '<p class="muted">Сейчас таких рейдов нет.</p>'}`;
  }

  function drawChars() {
    const el = view.querySelector('#chars');
    el.innerHTML = st.chars.map((c, i) => `
      <div class="frame char-card" data-char="${c.id}">
        <div class="char-head">
          <div><label class="lbl">Персонаж ${i + 1}</label><input type="text" data-f="name" value="${esc(c.name)}"></div>
          <div><label class="lbl">Уровень предм.</label><input type="number" data-f="ilvl" min="0" max="2000" value="${c.ilvl ?? ''}"></div>
          <label class="check" title="Только назначенные получатели получают золото с обычных рейдов"><input type="checkbox" data-f="recipient" ${c.recipient ? 'checked' : ''}> Получатель</label>
          <button class="btn danger sm" data-act="del" aria-label="Удалить персонажа">✕</button>
        </div>
        ${charRaids.map((r) => raidRow(r, c.picks[r.id], c.ilvl, c.id)).join('')}
        ${c.picks.custom !== undefined ? `<div style="margin-top:8px"><input type="text" id="customName" placeholder="Название своего рейда" value="${esc(st.customName)}"></div>` : ''}
      </div>`).join('');
  }

  function charGold(c) {
    let normal = 0, personal = 0, missing = 0;
    for (const r of charRaids) {
      const d = r.difficulties.find((x) => x.id === c.picks[r.id]);
      if (!d) continue;
      const g = goldOf(r, d);
      if (g == null) { missing++; continue; }
      if (!c.recipient) continue;
      if (r.personalGold) personal += g; else normal += g;
    }
    return { normal, personal, missing };
  }

  function drawSummary() {
    let normal = 0, personal = 0, missing = 0, roster = 0;
    const per = st.chars.map((c) => { const g = charGold(c); normal += g.normal; personal += g.personal; missing += g.missing; return { name: c.name, total: g.normal + g.personal }; });
    for (const r of rosterRaids) {
      const d = r.difficulties.find((x) => x.id === st.roster[r.id]);
      if (!d) continue;
      const g = goldOf(r, d);
      if (g == null) missing++; else roster += g;
    }
    const recipients = st.chars.filter((c) => c.recipient).length;
    const total = normal + personal + roster - (Number(st.expenses) || 0);
    const el = view.querySelector('#summary');
    el.innerHTML = `
      <div class="eyebrow">Итого за неделю</div>
      <div class="big-gold"><span class="coin"></span><span id="totalNum">0</span></div>
      <div class="sum-rows">
        <div><span>Обычное золото (рейды персонажей)</span><b>${fmt(normal)}</b></div>
        <div><span style="color:var(--bound)">Персональное золото</span><b>${fmt(personal)}</b></div>
        <div><span style="color:var(--info)">Наследие (экстрим)</span><b>${fmt(roster)}</b></div>
        ${st.expenses ? `<div><span>Расходы</span><b>−${fmt(st.expenses)}</b></div>` : ''}
        <div><span>Получателей</span><b>${recipients}${st.charLimit ? ' / ' + st.charLimit : ''}</b></div>
      </div>
      ${missing ? `<div class="warn">У ${missing} выбранных рейдов не указано золото — они не учтены. Впишите цифру из превью наград.</div>` : ''}
      ${st.charLimit && recipients > st.charLimit ? `<div class="warn">Получателей больше лимита (${st.charLimit}).</div>` : ''}
      <div class="chart-box"><canvas id="goldChart" aria-label="Доля золота по персонажам"></canvas></div>`;

    const num = el.querySelector('#totalNum');
    const prev = Number(num.dataset.v || 0);
    const obj = { v: prev };
    anime({ targets: obj, v: total, duration: 600, easing: 'easeOutExpo', update: () => { num.textContent = fmt(obj.v); } });

    if (!vals0(per, roster)) { el.querySelector('.chart-box').innerHTML = '<p class="muted" style="text-align:center;padding-top:80px">Выберите рейды — здесь появится диаграмма.</p>'; return; }
    if (window.Chart) {
      const labels = per.map((p) => p.name || '—').concat(roster ? ['Наследие'] : []);
      const vals = per.map((p) => p.total).concat(roster ? [roster] : []);
      chart?.destroy();
      const css = getComputedStyle(document.documentElement);
      chart = new window.Chart(el.querySelector('#goldChart'), {
        type: 'doughnut',
        data: { labels, datasets: [{ data: vals, borderWidth: 2, borderColor: css.getPropertyValue('--panel-solid').trim(),
          backgroundColor: ['#f2c94c', '#8fd16a', '#6fa8ff', '#e0606b', '#b48cff', '#e89a4f', '#4fd1c5', '#c9a45c'] }] },
        options: { maintainAspectRatio: false, cutout: '62%', animation: { duration: 500 },
          plugins: { legend: { position: 'bottom', labels: { color: css.getPropertyValue('--muted').trim(), boxWidth: 10, font: { family: 'Manrope' } } },
            tooltip: { callbacks: { label: (c) => ` ${c.label}: ${fmt(c.raw)}` } } } },
      });
    }
  }

  function redraw() { drawRoster(); drawChars(); drawSummary(); }
  redraw();

  // ==== события (делегирование) ====
  view.addEventListener('change', (e) => {
    const t = e.target;
    const row = t.closest('.raid-row');
    if (row) {
      const raid = row.dataset.raid, scope = row.dataset.scope;
      const r = raids.find((x) => x.id === raid);
      if (t.dataset.act === 'diff') {
        const target = scope === 'roster' ? st.roster : st.chars.find((c) => c.id === scope).picks;
        if (t.value) target[raid] = t.value; else delete target[raid];
        persist(); redraw(); return;
      }
      if (t.dataset.act === 'gold') {
        const picked = scope === 'roster' ? st.roster[raid] : st.chars.find((c) => c.id === scope).picks[raid];
        st.gold[raid + ':' + picked] = t.value === '' ? undefined : Number(t.value);
        persist(); redraw(); return;
      }
    }
    const card = t.closest('[data-char]');
    if (card && t.dataset.f) {
      const c = st.chars.find((x) => x.id === card.dataset.char);
      if (t.dataset.f === 'recipient') c.recipient = t.checked;
      else if (t.dataset.f === 'ilvl') c.ilvl = t.value === '' ? null : Number(t.value);
      else c[t.dataset.f] = t.value;
      persist(); redraw(); return;
    }
    if (t.id === 'customName') { st.customName = t.value; persist(); redraw(); }
    if (t.id === 'lim') { st.charLimit = t.value ? Number(t.value) : null; persist(); drawSummary(); }
    if (t.id === 'exp') { st.expenses = Number(t.value) || 0; persist(); drawSummary(); }
  });
  view.addEventListener('click', (e) => {
    if (e.target.closest('#addChar')) {
      st.chars.push({ id: uid(), name: 'Персонаж ' + (st.chars.length + 1), ilvl: null, recipient: true, picks: {} });
      persist(); redraw();
      const cards = view.querySelectorAll('[data-char]');
      const last = cards[cards.length - 1];
      anime({ targets: last, opacity: [0, 1], translateY: [10, 0], duration: 350, easing: 'easeOutQuad' });
      last.querySelector('input').select();
    }
    const del = e.target.closest('[data-act="del"]');
    if (del) {
      const id = del.closest('[data-char]').dataset.char;
      if (st.chars.length === 1) return;
      st.chars = st.chars.filter((c) => c.id !== id);
      persist(); redraw();
    }
  });
}
