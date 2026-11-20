// Безопасная обёртка над localStorage: в приватном режиме или без доступа сайт работает, просто не запоминает.
const PREFIX = 'mk-';
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch (e) { return fallback; }
}
export function save(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* без сохранения */ }
}
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmt = (n) => Math.round(n || 0).toLocaleString('ru-RU');
export function fmtDate(iso) {
  if (!iso) return 'без даты';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
const jsonCache = {};
export async function getJSON(path) {
  if (!jsonCache[path]) jsonCache[path] = fetch(path, { cache: 'no-cache' }).then((r) => {
    if (!r.ok) throw new Error(path + ': ' + r.status);
    return r.json();
  });
  return jsonCache[path];
}
export function toast(text) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}
