// Раздел «Классы»: 7 архетипов, 30 классов. Тексты и картинки — с lostark.ru/classes.
import anime from 'animejs';
import { esc, getJSON, load, save } from './store.js';
import { reveal } from './fx.js';

const ICON = { warrior: 'game-icons:broadsword', monk: 'game-icons:fist', shooter: 'game-icons:revolver', assassin: 'game-icons:daggers', magician: 'game-icons:wizard-staff', creator: 'game-icons:quill-ink', knights: 'game-icons:knight-banner' };

export async function renderClasses(page, classId) {
  const data = await getJSON('data/classes.json');
  const all = data.archetypes.flatMap((a) => a.classes.map((c) => ({ ...c, arch: a })));
  let arch = load('cls-arch', 'warrior');
  const preset = all.find((c) => c.id === classId);
  if (preset) arch = preset.arch.id;
  if (!data.archetypes.some((a) => a.id === arch)) arch = 'warrior';

  page.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Классы · данные lostark.ru</div>
      <h1>Кем играть?</h1>
      <p>В LOST ARK ${all.length} классов в 7 архетипах. Выберите архетип, затем класс — откроется официальное описание, оружие и особенность класса.</p>
    </div>
    <div class="arch-tabs" role="tablist">
      ${data.archetypes.map((a) => `<button class="arch-tab" data-arch="${a.id}" role="tab"><iconify-icon icon="${ICON[a.id]}"></iconify-icon><span>${esc(a.name)}</span><small>${a.classes.length}</small></button>`).join('')}
    </div>
    <p class="arch-text" id="archText"></p>
    <div class="class-grid" id="classGrid"></div>
    <dialog class="class-dlg" id="classDlg" data-lenis-prevent></dialog>
    <p class="muted" style="font-size:12px;margin-top:24px">Изображения и тексты: © Smilegate / официальный сайт lostark.ru.</p>`;

  const grid = page.querySelector('#classGrid');
  const dlg = page.querySelector('#classDlg');

  const draw = (animate = true) => {
    save('cls-arch', arch);
    const a = data.archetypes.find((x) => x.id === arch);
    page.querySelectorAll('.arch-tab').forEach((t) => t.classList.toggle('on', t.dataset.arch === arch));
    page.querySelector('#archText').textContent = a.text;
    grid.innerHTML = a.classes.map((c) => `
      <button class="class-card frame" data-cls="${c.id}" style="--cc:var(--arch-${a.id})">
        <img class="cc-art" src="assets/classes/${c.id}-art.webp" alt="" loading="lazy">
        <span class="cc-glow"></span>
        <img class="cc-weapon" src="assets/classes/${c.id}-icon.webp" alt="" loading="lazy">
        <span class="cc-name">${esc(c.name)}</span>
        <span class="cc-arch">${esc(a.name)}</span>
      </button>`).join('');
    if (animate) anime({ targets: grid.querySelectorAll('.class-card'), opacity: [0, 1], translateY: [24, 0], scale: [.96, 1], delay: anime.stagger(55), duration: 520, easing: 'easeOutCubic' });
  };
  draw();

  const open = (id) => {
    const c = all.find((x) => x.id === id); if (!c) return;
    dlg.innerHTML = `
      <button class="dlg-x" aria-label="Закрыть">×</button>
      <div class="cd-hero">
        <img src="assets/classes/${c.id}-art.webp" alt="${esc(c.name)}">
        <div class="cd-title"><span class="eyebrow">${esc(c.arch.name)}</span><h2>${esc(c.name)}</h2></div>
      </div>
      <div class="cd-body">
        <p class="cd-lead">${esc(c.text)}</p>
        <div class="cd-block"><img src="assets/classes/${c.id}-icon.webp" alt=""><div><b class="hl-gold">Оружие класса</b><p>${esc(c.weapon)}</p></div></div>
        <div class="cd-block"><iconify-icon icon="game-icons:power-lightning"></iconify-icon><div><b class="hl-blue">Особенность класса</b><p>${esc(c.feature)}</p></div></div>
        <a class="btn ghost sm" href="https://lostark.ru/classes" target="_blank" rel="noopener">Страница классов на lostark.ru ↗</a>
      </div>`;
    dlg.showModal();
    anime({ targets: dlg, opacity: [0, 1], scale: [.94, 1], duration: 380, easing: 'easeOutCubic' });
    anime({ targets: dlg.querySelector('.cd-hero img'), translateX: [40, 0], opacity: [0, 1], duration: 700, easing: 'easeOutExpo' });
    anime({ targets: dlg.querySelectorAll('.cd-body > *'), opacity: [0, 1], translateY: [12, 0], delay: anime.stagger(70, { start: 150 }), duration: 450, easing: 'easeOutQuad' });
    history.replaceState(null, '', '#/classes/' + c.id);
  };
  const close = () => { if (dlg.open) { dlg.close(); history.replaceState(null, '', '#/classes'); } };

  page.querySelector('.arch-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-arch]'); if (!b || b.dataset.arch === arch) return;
    arch = b.dataset.arch; draw();
  });
  grid.addEventListener('click', (e) => { const b = e.target.closest('[data-cls]'); if (b) open(b.dataset.cls); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('.dlg-x')) close(); });
  if (preset) setTimeout(() => open(preset.id), 200);
}

export async function classIndex() {
  const data = await getJSON('data/classes.json');
  return data.archetypes.flatMap((a) => a.classes.map((c) => ({ title: c.name, sub: 'Класс · ' + a.name, text: c.text, href: '#/classes/' + c.id })));
}
