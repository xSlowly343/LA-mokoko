// Раздел «Интерфейс»: скриншот + кликабельные зоны + редактор разметки.
import anime from 'animejs';
import { load, save, esc, getJSON, toast } from './store.js';
import { say, hop } from './mascot.js';
import { ringAt } from './fx.js';

let tips = [];
const isNarrow = () => matchMedia('(max-width: 760px)').matches;

function destroyTips() { tips.forEach((t) => t.destroy()); tips = []; }

export async function renderUI(view, screenId) {
  destroyTips();
  const data = await getJSON('data/screens.json');
  const screens = data.screens.map((s) => ({ ...s, ...(load('draft-' + s.id, null) || {}) }));
  const screen = screens.find((s) => s.id === screenId) || screens[0];
  const seen = load('seen-' + screen.id, []);

  view.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Разбор интерфейса</div>
      <h1>Что здесь за что отвечает?</h1>
      <p>Выберите экран и нажимайте на подсвеченные зоны. Изученные зоны становятся зелёными.</p>
    </div>
    <div class="ui-layout">
      <nav class="screen-list frame" aria-label="Экраны">
        ${screens.map((s, i) => `
          <a href="#/ui/${s.id}" class="${s.id === screen.id ? 'on' : ''} ${s.image ? '' : 'empty'}">
            <span class="s-ico">${esc(s.icon || '◆')}</span>${i}. ${esc(s.title)}
            <span class="s-num">${s.hotspots?.length || 0}</span>
          </a>`).join('')}
      </nav>
      <section class="stage-wrap frame">
        <div class="stage-bar">
          <h2>${esc(screen.title)}</h2>
          <div class="editor-row">
            ${screen.image ? `<button class="btn ghost sm" id="toggleHs">Скрыть рамки</button>` : ''}
            ${screen.hotspots?.length ? `<button class="btn ghost sm" id="resetSeen">Сбросить прогресс</button>` : ''}
            <button class="btn ghost sm" id="editBtn">✎ Редактор</button>
          </div>
        </div>
        ${screen.note ? `<p class="muted" style="margin:0 0 10px">${esc(screen.note)}</p>` : ''}
        <div id="stageHost"></div>
        <div id="editorHost"></div>
      </section>
    </div>`;

  const host = view.querySelector('#stageHost');
  const state = { screen, seen, editing: false };
  drawStage(host, state);

  view.querySelector('#toggleHs')?.addEventListener('click', (e) => {
    const st = host.querySelector('.stage');
    st.classList.toggle('hide-hs');
    e.currentTarget.textContent = st.classList.contains('hide-hs') ? 'Показать рамки' : 'Скрыть рамки';
  });
  view.querySelector('#resetSeen')?.addEventListener('click', () => {
    state.seen = []; save('seen-' + screen.id, []); drawStage(host, state);
  });
  view.querySelector('#editBtn').addEventListener('click', () => {
    state.editing = !state.editing;
    drawStage(host, state);
    drawEditor(view.querySelector('#editorHost'), host, state);
  });
}

function drawStage(host, state) {
  destroyTips();
  const { screen } = state;
  if (!screen.image) {
    host.innerHTML = `<div class="empty-screen">
      <div class="big">▢</div>
      <p><b>Скриншот ещё не добавлен.</b></p>
      <p>Откройте «Редактор», загрузите скриншот из игры и разметьте зоны.<br>Затем положите картинку в <code>assets/screens/${esc(screen.id)}.png</code>, а JSON — в <code>data/screens.json</code>.</p>
    </div>`;
    return;
  }
  const hs = screen.hotspots || [];
  host.innerHTML = `
    <div class="stage ${state.editing ? 'editing' : ''}">
      <img src="${esc(screen.image)}" alt="${esc(screen.title)}" draggable="false">
      ${hs.map((h, i) => `
        <button class="hotspot ${state.seen.includes(h.id) ? 'seen' : ''}" data-id="${esc(h.id)}"
          style="left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%"
          aria-label="${esc(h.title)}"><span class="hs-n">${i + 1}</span></button>`).join('')}
    </div>
    ${hs.length ? `<div class="progress" title="Изучено"><i></i></div>
    <p class="muted" style="margin:6px 0 0;font-size:13px" id="progTxt"></p>` : ''}`;

  updateProgress(host, state);
  const stage = host.querySelector('.stage');
  anime({ targets: stage.querySelectorAll('.hotspot'), opacity: [0, 1], scale: [.85, 1], delay: anime.stagger(70), duration: 450, easing: 'easeOutBack' });

  if (state.editing) { enableDrawing(stage, state, host); return; }

  stage.querySelectorAll('.hotspot').forEach((btn) => {
    const h = hs.find((x) => x.id === btn.dataset.id);
    const html = `<div class="tip-card"><b>${esc(h.title)}</b>${esc(h.text).replace(/\n/g, '<br>')}${h.tip ? `<div class="tip-adv">✦ ${esc(h.tip)}</div>` : ''}</div>`;
    if (window.tippy && !isNarrow()) {
      tips.push(window.tippy(btn, {
        content: html, allowHTML: true, trigger: 'click', interactive: true, theme: 'lostark',
        animation: 'shift-away', placement: 'auto', maxWidth: 320, appendTo: document.body,
        onShow() { activate(btn, h, state, host); },
        onHide() { btn.classList.remove('active'); },
      }));
    } else {
      btn.addEventListener('click', () => {
        stage.querySelectorAll('.hotspot.active').forEach((b) => b.classList.remove('active'));
        activate(btn, h, state, host);
        say(esc(h.title), `<p>${esc(h.text).replace(/\n/g, '<br>')}</p>${h.tip ? `<p class="tip-adv">✦ ${esc(h.tip)}</p>` : ''}`);
      });
    }
  });
}

function activate(btn, h, state, host) {
  btn.classList.add('active');
  const stage = btn.parentElement, sr = stage.getBoundingClientRect(), br = btn.getBoundingClientRect();
  ringAt(stage, br.left - sr.left + br.width / 2, br.top - sr.top + br.height / 2);
  anime({ targets: btn, scale: [1, 1.06, 1], duration: 400, easing: 'easeOutQuad' });
  if (!state.seen.includes(h.id)) {
    state.seen.push(h.id);
    save('seen-' + state.screen.id, state.seen);
    btn.classList.add('seen');
    updateProgress(host, state);
    hop();
    if (state.seen.length === state.screen.hotspots.length) {
      setTimeout(() => say('Экран изучен!', '<p>Вы посмотрели все зоны этого экрана. Переходите к следующему в списке слева.</p>'), 600);
    }
  }
}

function updateProgress(host, state) {
  const total = state.screen.hotspots?.length || 0;
  const n = state.seen.filter((id) => state.screen.hotspots.some((h) => h.id === id)).length;
  const bar = host.querySelector('.progress > i');
  if (bar) bar.style.width = (total ? (n / total) * 100 : 0) + '%';
  const t = host.querySelector('#progTxt');
  if (t) t.textContent = `Изучено ${n} из ${total}`;
}

// ===== Редактор =====
function enableDrawing(stage, state, host) {
  let start = null, rect = null;
  const pct = (e) => {
    const r = stage.getBoundingClientRect();
    return { x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)), y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)) };
  };
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    stage.setPointerCapture(e.pointerId);
    start = pct(e);
    rect = document.createElement('div');
    rect.className = 'draft-rect';
    stage.appendChild(rect);
  });
  stage.addEventListener('pointermove', (e) => {
    if (!start) return;
    const p = pct(e);
    Object.assign(rect.style, {
      left: Math.min(start.x, p.x) + '%', top: Math.min(start.y, p.y) + '%',
      width: Math.abs(p.x - start.x) + '%', height: Math.abs(p.y - start.y) + '%',
    });
  });
  stage.addEventListener('pointerup', (e) => {
    if (!start) return;
    const p = pct(e);
    const w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y);
    rect.remove();
    if (w > 1 && h > 1) {
      const r1 = (v) => Math.round(v * 10) / 10;
      state.screen.hotspots = state.screen.hotspots || [];
      state.screen.hotspots.push({ id: 'h' + Date.now().toString(36), x: r1(Math.min(start.x, p.x)), y: r1(Math.min(start.y, p.y)), w: r1(w), h: r1(h), title: 'Новая зона', text: '' });
      persistDraft(state);
      drawStage(host, state);
      drawEditor(document.getElementById('editorHost'), host, state);
      const inputs = document.querySelectorAll('.hs-item input[data-f="title"]');
      inputs[inputs.length - 1]?.select();
    }
    start = null;
  });
}

function persistDraft(state) {
  const { screen } = state;
  const draft = { title: screen.title, image: screen.image, hotspots: screen.hotspots };
  try { localStorage.setItem('mk-draft-' + screen.id, JSON.stringify(draft)); }
  catch (e) {
    // картинка слишком большая для хранилища — сохраняем без неё
    save('draft-' + screen.id, { ...draft, image: screen.image?.startsWith('data:') ? null : screen.image });
    toast('Скриншот слишком большой для автосохранения — разметка сохранена без него');
  }
}

function drawEditor(el, host, state) {
  const { screen } = state;
  if (!state.editing) { el.innerHTML = ''; return; }
  const hs = screen.hotspots || [];
  el.innerHTML = `
    <div class="editor">
      <div class="editor-row">
        <b>Редактор разметки</b>
        <span class="muted" style="font-size:13px">Выделите прямоугольник на скриншоте мышью или пальцем. Черновик хранится в этом браузере.</span>
      </div>
      <div class="editor-row">
        <label class="btn sm">⬆ Загрузить скриншот<input type="file" accept="image/*" id="imgIn" hidden></label>
        <input type="text" id="scrTitle" value="${esc(screen.title)}" style="max-width:260px" aria-label="Название экрана">
        <button class="btn ghost sm" id="expBtn">⬇ Скачать JSON</button>
        <button class="btn ghost sm" id="cpBtn">Копировать JSON</button>
        <button class="btn danger sm" id="clrBtn">Сбросить черновик</button>
      </div>
      <div class="hs-list">
        ${hs.length ? hs.map((h, i) => `
          <div class="hs-item" data-id="${esc(h.id)}">
            <span class="hs-n2">${i + 1}</span>
            <div class="hs-fields">
              <input type="text" data-f="title" value="${esc(h.title)}" placeholder="Название">
              <textarea data-f="text" placeholder="Что это и зачем нужно">${esc(h.text)}</textarea>
              <input type="text" data-f="tip" value="${esc(h.tip || '')}" placeholder="Совет новичку (необязательно)">
            </div>
            <button class="btn danger sm" data-del="${esc(h.id)}" aria-label="Удалить зону">✕</button>
          </div>`).join('') : '<p class="muted">Пока нет зон.</p>'}
      </div>
    </div>`;

  el.querySelector('#imgIn').addEventListener('change', (e) => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { screen.image = rd.result; persistDraft(state); drawStage(host, state); drawEditor(el, host, state); };
    rd.readAsDataURL(f);
  });
  el.querySelector('#scrTitle').addEventListener('change', (e) => { screen.title = e.target.value; persistDraft(state); });
  el.querySelectorAll('.hs-item').forEach((row) => {
    const h = hs.find((x) => x.id === row.dataset.id);
    row.querySelectorAll('[data-f]').forEach((inp) => inp.addEventListener('input', () => {
      h[inp.dataset.f] = inp.value; if (!h.tip) delete h.tip; persistDraft(state);
    }));
  });
  el.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
    screen.hotspots = hs.filter((x) => x.id !== b.dataset.del);
    persistDraft(state); drawStage(host, state); drawEditor(el, host, state);
  }));
  const exportObj = () => {
    const img = screen.image?.startsWith('data:') ? `assets/screens/${screen.id}.png` : screen.image;
    return JSON.stringify({ id: screen.id, title: screen.title, icon: screen.icon, image: img, hotspots: screen.hotspots || [] }, null, 2);
  };
  el.querySelector('#expBtn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([exportObj()], { type: 'application/json' }));
    a.download = `screen-${screen.id}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  el.querySelector('#cpBtn').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(exportObj()); toast('JSON скопирован'); } catch (e) { toast('Не удалось скопировать'); }
  });
  el.querySelector('#clrBtn').addEventListener('click', () => {
    if (!confirm('Удалить черновик этого экрана из браузера?')) return;
    try { localStorage.removeItem('mk-draft-' + screen.id); } catch (e) {}
    location.reload();
  });
}
