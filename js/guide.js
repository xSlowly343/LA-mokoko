// Лендинг «Lost Ark — краткий гайд по системам развития»:
// обложка → «Зачем я здесь?» → вкладки систем с кликабельными зонами на скриншотах.
import anime from 'animejs';
import { SECTIONS } from './guide-data.js';
import { lenis, reduced } from './fx.js';

const EMPTY = '<p class="g-empty">Тут пока что пусто</p>';

export function renderGuide(page) {
  page.classList.add('landing');
  page.innerHTML = `
    <section class="l-hero">
      <div class="l-hero-text">
        <h1>Lost Ark</h1>
        <p>Краткий гайд по системам развития</p>
      </div>
      <button class="l-arrow" type="button" aria-label="Перейти к следующему блоку">
        <svg viewBox="0 0 48 24" width="48" height="24" aria-hidden="true"><path d="M4 4l20 16L44 4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </section>

    <section class="l-why" id="why">
      <div class="l-why-label">Зачем я здесь?</div>
      <p>За годы существования игра обросла большим количеством прогрессий, необходимых для прокачки персонажа, новичку может быть сложно сразу понять их.</p>
      <p>Я надеюсь, этот гайд хотя бы немного облегчит ваше продвижение в мире Lost Ark.</p>
      <p class="l-heart" aria-hidden="true">♥</p>
    </section>

    <section class="l-sys" id="systems">
      <div class="l-tabs" role="tablist" aria-label="Системы развития">
        ${SECTIONS.map((s, i) => `<button type="button" role="tab" class="l-tab${i ? '' : ' on'}" aria-selected="${!i}" data-sec="${s.id}">${s.tab}</button>`).join('')}
      </div>
      <div class="l-stage-row">
        <div class="l-stage" id="stage"></div>
        <div class="l-text"><div class="l-text-in" id="sysText" data-lenis-prevent tabindex="0"></div></div>
      </div>
    </section>

    <section class="l-extra">
      <h2>Дополнительная информация</h2>
      <div class="l-extra-box" id="sysExtra"></div>
    </section>`;

  const stage = page.querySelector('#stage');
  const textEl = page.querySelector('#sysText');
  const extraEl = page.querySelector('#sysExtra');
  let sec = SECTIONS[0], spot = null;

  const fade = (el, html) => {
    el.innerHTML = html;
    el.scrollTop = 0;
    if (!reduced) anime({ targets: el, opacity: [0, 1], translateY: [8, 0], duration: 320, easing: 'easeOutCubic' });
  };

  const drawText = () => {
    const back = spot ? `<button type="button" class="g-back" data-back>← К описанию раздела</button>` : '';
    const title = spot ? spot.title : sec.tab;
    fade(textEl, `${back}<h3>${title}</h3>${spot ? spot.text : sec.text}${!spot && sec.hotspots.length ? '<p class="g-hint">Нажимайте на подсвеченные области на картинке.</p>' : ''}`);
    fade(extraEl, (spot && spot.extra) || sec.extra || EMPTY);
    stage.querySelectorAll('.hs').forEach((h) => h.classList.toggle('on', !!spot && h.dataset.hs === spot.id));
  };

  const drawStage = () => {
    stage.parentElement.style.setProperty('--ar', `${sec.w} / ${sec.h}`);
    stage.parentElement.style.setProperty('--arn', sec.w / sec.h);
    stage.innerHTML = `<img src="assets/guide/${sec.image}.webp" alt="${sec.alt}" width="${sec.w}" height="${sec.h}">` +
      sec.hotspots.map((h) => h.rects.map(([x, y, w, hh]) =>
        `<button type="button" class="hs" data-hs="${h.id}" aria-label="${h.title}" style="left:${x}%;top:${y}%;width:${w}%;height:${hh}%"></button>`).join('')).join('');
    if (!reduced) anime({ targets: stage, opacity: [0, 1], duration: 380, easing: 'easeOutQuad' });
  };

  const select = (id) => {
    sec = SECTIONS.find((s) => s.id === id) || SECTIONS[0];
    spot = null;
    page.querySelectorAll('.l-tab').forEach((t) => { const on = t.dataset.sec === sec.id; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); });
    drawStage();
    drawText();
  };

  page.querySelector('.l-tabs').addEventListener('click', (e) => {
    const t = e.target.closest('.l-tab');
    if (t && t.dataset.sec !== sec.id) select(t.dataset.sec);
  });

  stage.addEventListener('click', (e) => {
    const b = e.target.closest('.hs'); if (!b) return;
    const h = sec.hotspots.find((x) => x.id === b.dataset.hs);
    spot = spot === h ? null : h;
    drawText();
    // на телефоне текст под картинкой — докручиваем к нему
    if (spot && matchMedia('(max-width: 900px)').matches) scrollToEl(textEl.parentElement, -70);
  });
  // наведение на одну зону подсвечивает все прямоугольники этой группы
  stage.addEventListener('pointerover', (e) => {
    const b = e.target.closest('.hs');
    stage.querySelectorAll('.hs').forEach((h) => h.classList.toggle('hover', !!b && h.dataset.hs === b.dataset.hs));
  });
  stage.addEventListener('pointerleave', () => stage.querySelectorAll('.hs.hover').forEach((h) => h.classList.remove('hover')));

  textEl.addEventListener('click', (e) => {
    if (e.target.closest('[data-back]')) { spot = null; drawText(); return; }
    const g = e.target.closest('[data-goto]');
    if (g) { e.preventDefault(); select(g.dataset.goto); }
  });

  page.querySelector('.l-arrow').addEventListener('click', () => scrollToEl(page.querySelector('#why'), -60));

  select(SECTIONS[0].id);
}

function scrollToEl(el, offset = 0) {
  if (lenis) lenis.scrollTo(el, { offset });
  else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: reduced ? 'auto' : 'smooth' });
}
