// Раздел «Промокоды»: коды с lostark.ru, копирование в один клик и быстрая активация.
import anime from 'animejs';
import { esc, getJSON, fmtDate, toast } from './store.js';
import { rewardIcon } from './events.js';

const endOf = (iso) => new Date(iso + 'T00:00:00').getTime(); // действует до начала техработ этого дня
function left(ms) {
  if (ms <= 0) return null;
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5);
  return d > 0 ? `${d} д ${h} ч` : `${h} ч ${Math.floor((ms % 36e5) / 6e4)} мин`;
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
    ta.remove(); return ok;
  }
}

export async function renderPromo(page) {
  const [data, sources] = await Promise.all([getJSON('data/promocodes.json'), getJSON('data/sources.json')]);
  const now = Date.now();
  const codes = data.codes.map((c) => ({ ...c, ms: endOf(c.until) - now })).sort((a, b) => (b.ms > 0) - (a.ms > 0) || a.ms - b.ms);
  const active = codes.filter((c) => c.ms > 0);

  page.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Промокоды · по данным lostark.ru на ${fmtDate(data.updated)}</div>
      <h1>Промокоды</h1>
      <p>Только официальные коды из новостей lostark.ru. Скопируйте код или нажмите «Активировать» — откроется страница активации, подарок появится в «Моих предметах» на сайте, оттуда его переводят в игру.</p>
    </div>
    <div class="promo-hero frame">
      <div class="ph-ico"><iconify-icon icon="game-icons:present"></iconify-icon></div>
      <div class="ph-text"><b>Активные коды: ${active.length}</b><span>Регистр букв важен. Один набор получает один персонаж Наследия — выбирайте заранее.</span></div>
      <div class="ph-btns">
        <a class="btn" href="${esc(data.activateUrl)}" target="_blank" rel="noopener"><iconify-icon icon="game-icons:key"></iconify-icon> Активировать промокод</a>
        <a class="btn ghost" href="${esc(data.inventoryUrl)}" target="_blank" rel="noopener">Мои предметы ↗</a>
      </div>
    </div>
    <div class="promo-list">
      ${codes.map((c) => {
        const live = c.ms > 0;
        const src = sources[c.source];
        return `<article class="promo-card frame ${live ? '' : 'expired'}">
          <div class="pc-top">
            <span class="pc-status ${live ? 'on' : 'off'}">${live ? 'Действует' : 'Истёк'}</span>
            <span class="pc-left">${live ? 'осталось ' + left(c.ms) : esc(c.untilNote)}</span>
          </div>
          <button class="pc-code" data-copy="${esc(c.code)}" ${live ? '' : 'disabled'} title="Скопировать">
            <span>${esc(c.code)}</span><iconify-icon icon="game-icons:files"></iconify-icon>
          </button>
          <div class="pc-set"><b>${esc(c.set)}</b><small>${esc(c.untilNote)}</small></div>
          ${c.note ? `<p class="muted pc-note">${esc(c.note)}</p>` : ''}
          <ul class="rw pc-items">${c.items.map((it) => `<li>${rewardIcon(it)}<span>${esc(it)}</span></li>`).join('')}</ul>
          <div class="pc-actions">
            ${live ? `<a class="btn sm" href="${esc(data.activateUrl)}?code=${encodeURIComponent(c.code)}" target="_blank" rel="noopener">Активировать этот код ↗</a>` : ''}
            ${src ? `<a class="m-src" href="${esc(src.url)}" target="_blank" rel="noopener">ⓘ ${esc(src.title)} · ${fmtDate(src.date)}</a>` : ''}
          </div>
        </article>`;
      }).join('')}
    </div>
    <div class="callout">Нашли новый код в новостях lostark.ru? Его можно добавить в файл <code>data/promocodes.json</code>. Коды с агрегаторов не публикуем — там много устаревших.</div>`;

  anime({ targets: page.querySelectorAll('.promo-card'), opacity: [0, 1], translateY: [16, 0], delay: anime.stagger(80), duration: 450, easing: 'easeOutCubic' });
  page.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copy]'); if (!b) return;
    const ok = await copy(b.dataset.copy);
    toast(ok ? `Скопировано: ${b.dataset.copy}` : 'Не удалось скопировать — выделите код вручную');
    if (ok) anime({ targets: b, scale: [1, 1.05, 1], duration: 350, easing: 'easeOutQuad' });
  });
}

export async function activePromoCount() {
  const d = await getJSON('data/promocodes.json');
  return d.codes.filter((c) => endOf(c.until) > Date.now()).length;
}
