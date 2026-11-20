#!/usr/bin/env python3
"""Забирает список новостей с главной lostark.ru и дописывает их в data/news.json.

Только стандартная библиотека Python — запускается в GitHub Actions без установки пакетов.
Старые новости не удаляются (храним последние MAX_ITEMS), так что архив копится сам.
"""
import html
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SOURCE = "https://lostark.ru/"
OUT = Path(__file__).resolve().parent.parent / "data" / "news.json"
MAX_ITEMS = 80
UA = "Mozilla/5.0 (compatible; MokokoTrailNewsBot/1.0; fan site news digest)"

ITEM_RE = re.compile(r'<li class="home-news__item">(.*?)</li>', re.S)


def clean(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


def parse(page: str):
    items = []
    for block in ITEM_RE.findall(page):
        href = re.search(r'href="([^"]+)"', block)
        title = re.search(r'home-news__item-title">(.*?)</div>', block, re.S)
        if not href or not title:
            continue
        url = href.group(1)
        if url.startswith("/"):
            url = "https://lostark.ru" + url
        m_id = re.search(r"/news/(\d+)", url)
        lead = re.search(r'home-news__item-lead">(.*?)</div>', block, re.S)
        img = re.search(r'<img[^>]+src="([^"]+)"', block)
        meta = re.search(r'home-news__item-meta">(.*?)</div>', block, re.S)
        cat = re.search(r'home-news__item-meta-category">(.*?)</span>', block, re.S)
        date = re.search(r"(\d{2})\.(\d{2})\.(\d{4})", meta.group(1) if meta else "")
        items.append({
            "id": int(m_id.group(1)) if m_id else None,
            "url": url,
            "title": clean(title.group(1)),
            "lead": clean(lead.group(1)) if lead else "",
            "image": img.group(1) if img else None,
            "category": clean(cat.group(1)) if cat else "",
            "date": f"{date.group(3)}-{date.group(2)}-{date.group(1)}" if date else None,
        })
    return items


def main() -> int:
    req = urllib.request.Request(SOURCE, headers={"User-Agent": UA, "Accept-Language": "ru"})
    with urllib.request.urlopen(req, timeout=30) as r:
        page = r.read().decode("utf-8", "replace")
    fresh = parse(page)
    if not fresh:
        print("Новости не найдены — разметка сайта могла измениться. Файл не трогаю.")
        return 1

    old = {"items": []}
    if OUT.exists():
        old = json.loads(OUT.read_text(encoding="utf-8"))
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    by_key = {(n.get("id") or n["url"]): n for n in old.get("items", [])}
    added = 0
    for n in fresh:
        key = n.get("id") or n["url"]
        if key in by_key:
            n["firstSeen"] = by_key[key].get("firstSeen", now)
        else:
            n["firstSeen"] = now
            added += 1
        by_key[key] = n
    items = sorted(by_key.values(), key=lambda n: (n.get("date") or "", n.get("id") or 0), reverse=True)[:MAX_ITEMS]

    data = {"source": SOURCE, "items": items}
    if json.dumps(data.get("items"), sort_keys=True) == json.dumps(old.get("items"), sort_keys=True):
        print("Новых изменений нет.")
        return 0
    data["checked"] = now
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"Обновлено: всего {len(items)}, новых {added}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
