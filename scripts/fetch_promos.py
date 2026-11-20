#!/usr/bin/env python3
"""Ищет промокоды в новостях lostark.ru и дописывает их в data/promocodes.json.

Берёт новости из data/news.json (его заполняет fetch_news.py), открывает только те,
что ещё не проверялись, и ищет в них ссылку lostark.ru/promocode?code=...
Из статьи берёт: код, название набора («Набор «…»»), состав (список «предмет, N шт.»)
и срок («действителен до начала технических работ 16 декабря 2026 г.»).
Коды, внесённые вручную, не перезаписываются. Только стандартная библиотека.
"""
import html
import json
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NEWS = ROOT / "data" / "news.json"
PROMO = ROOT / "data" / "promocodes.json"
IMG_DIR = ROOT / "assets" / "promo"
UA = "Mozilla/5.0 (compatible; MokokoTrailNewsBot/1.0; fan site news digest)"
MONTHS = {"января": 1, "февраля": 2, "марта": 3, "апреля": 4, "мая": 5, "июня": 6, "июля": 7,
          "августа": 8, "сентября": 9, "октября": 10, "ноября": 11, "декабря": 12}
MAX_PER_RUN = 25


def text(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


def get(url: str, tries: int = 3) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "ru"})
    for i in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8", "replace")
        except Exception:
            if i == tries - 1:
                raise
            time.sleep(3 * (i + 1))


def save_image(url: str, code: str):
    """Сохраняет картинку набора в репозиторий — чтобы не зависеть от чужого сервера."""
    ext = (re.search(r"\.(png|jpe?g|webp|gif)(\?|$)", url, re.I) or [None, "png"])[1].lower()
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for i in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
            path = IMG_DIR / f"{code}.{ext}"
            path.write_bytes(data)
            return f"assets/promo/{code}.{ext}"
        except Exception:
            time.sleep(3 * (i + 1))
    return None


def parse_article(page: str):
    """Вернёт список найденных промокодов из HTML статьи."""
    codes = []
    seen = set()
    for m in re.finditer(r"promocode\?code=([A-Za-z0-9_\-]+)", page):
        code = m.group(1)
        if code in seen:
            continue
        seen.add(code)
        codes.append(code)
    if not codes:
        return []
    plain = text(page)

    until, until_note = None, None
    mu = re.search(r"действител\w+ до (начала технических работ )?(\d{1,2}) ([а-яё]+) (\d{4})", plain)
    if mu and mu.group(3) in MONTHS:
        d, mon, y = int(mu.group(2)), MONTHS[mu.group(3)], int(mu.group(4))
        until = f"{y:04d}-{mon:02d}-{d:02d}"
        until_note = ("до начала технических работ " if mu.group(1) else "до ") + f"{d} {mu.group(3)} {y}"

    # Набор: заголовок «Набор «…»» и следующий за ним список <ul>
    set_name, items = None, []
    # между заголовком и списком бывают абзацы и картинки — ищем первый <ul> до следующего заголовка
    ms = re.search(r"<h\d[^>]*>\s*(Набор[^<]+)</h\d>((?:(?!<h\d).)*?)<ul>(.*?)</ul>", page, re.S)
    if ms:
        set_name = text(ms.group(1))
        between = text(ms.group(2))
        for li in re.findall(r"<li[^>]*>(.*?)</li>", ms.group(3), re.S):
            t = text(li)
            t = re.sub(r",\s*(\d[\d\s]*?)\s*шт\.?$", r" — \1", t).strip()
            items.append(t)
    else:
        mn = re.search(r"Набор «[^»]+»", plain)
        set_name = mn.group(0) if mn else None

    # картинка с составом набора (спойлер «Содержимое промокода»)
    image = None
    mi = re.search(r"Содержимое[^<]{0,40}</p>(.{0,1500}?)</faqspoileritem>", page, re.S)
    if mi:
        im = re.search(r'<img[^>]+src="([^"]+)"', mi.group(1))
        if im:
            image = im.group(1)
            image = "https:" + image if image.startswith("//") else image
    if not set_name:
        mg = re.search(r"получите набор\s*«([^»]+)»", plain)
        if mg:
            set_name = f"Набор «{mg.group(1)}»"

    # примечания ищем только рядом с блоком промокода, а не по всей статье
    first = page.find("promocode?code=")
    near = text(page[max(0, first - 3000): first + 2500]) if first >= 0 else plain
    notes = []
    if re.search(r"только один персонаж Наследия", near):
        notes.append("Подарки может получить только один персонаж Наследия.")
    if ms and between and len(between) < 200:
        notes.append(between)
    elif mi:
        sp = text(mi.group(1))
        if sp and len(sp) < 200:
            notes.append(sp)
    limit = " ".join(notes) or None

    out = []
    for code in codes:
        c = {"code": code, "set": set_name, "until": until,
             "untilNote": until_note or "срок не найден — проверьте в новости", "items": items}
        if image:
            c["image"] = image
        if limit:
            c["note"] = limit
        if not (until and (items or image)):
            c["check"] = True  # не всё удалось прочитать — на сайте будет пометка
        out.append(c)
    return out


def main() -> int:
    news = json.loads(NEWS.read_text(encoding="utf-8")) if NEWS.exists() else {"items": []}
    promo = json.loads(PROMO.read_text(encoding="utf-8"))
    scanned = set(promo.get("scannedNews", []))
    known = {c["code"] for c in promo["codes"]}
    todo = [n for n in news.get("items", []) if n.get("id") and n["id"] not in scanned][:MAX_PER_RUN]
    added = 0
    for n in todo:
        try:
            page = get(n["url"])
        except Exception as e:  # сеть/сайт — попробуем в следующий раз
            print(f"Не открылась {n['url']}: {e}")
            continue
        scanned.add(n["id"])
        for c in parse_article(page):
            if c["code"] in known:
                continue
            if not c["set"]:
                c["set"] = f"Подарок: {n.get('title') or 'набор из новости'}"
            c["sourceUrl"] = n["url"]
            c["sourceTitle"] = n.get("title")
            c["sourceDate"] = n.get("date")
            c["auto"] = True
            if c.get("image"):
                local = save_image(c["image"], c["code"])
                if local:
                    c["imageOrig"] = c["image"]
                    c["image"] = local
            c["found"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
            promo["codes"].insert(0, c)
            known.add(c["code"])
            added += 1
            print(f"Найден промокод {c['code']} ({c['set']}) в {n['url']}")
        time.sleep(1)
    promo["scannedNews"] = sorted(scanned, reverse=True)[:300]
    # дозагрузить картинки для уже найденных кодов, если раньше не получилось
    fixed = 0
    for c in promo["codes"]:
        if c.get("image", "").startswith("http") and c.get("auto"):
            local = save_image(c["image"], c["code"])
            if local:
                c["imageOrig"], c["image"] = c["image"], local
                fixed += 1
    if added or todo or fixed:
        if added:
            promo["updated"] = datetime.now(timezone.utc).date().isoformat()
        PROMO.write_text(json.dumps(promo, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Проверено новостей: {len(todo)}, новых кодов: {added}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
