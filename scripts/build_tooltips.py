#!/usr/bin/env python3
"""Собирает игровые подсказки предметов с lostarkcodex.com/ru в data/item_tooltips.json.

Запуск вручную, когда нужно добавить предметы:  python scripts/build_tooltips.py 66112715 101912 ...
Без аргументов — обновляет все id, что уже есть в файле. Иконки кладутся в assets/items/codex/.
"""
import html
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "item_tooltips.json"
ICONS = ROOT / "assets" / "items" / "codex"
UA = "Mozilla/5.0 (compatible; MokokoTrail/1.0; fan site)"
GRADE = {0: "Обычный", 1: "Необычный", 2: "Редкий", 3: "Эпический", 4: "Легендарный", 5: "Реликвия", 6: "Древний", 7: "Эсдо"}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for i in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except Exception:
            time.sleep(2 * (i + 1))
    raise RuntimeError(url)


def clean(fragment):
    """Оставляем только переносы, разделители и цвет текста из игры."""
    s = re.sub(r"<script.*?</script>", "", fragment, flags=re.S)
    s = re.sub(r"<div class=\"centerdiv.*?</div>", "", s, flags=re.S)
    s = re.sub(r"<div class=\"collapse[^\"]*\" id=\"item_sources\">.*?</div>", "", s, flags=re.S)
    s = re.sub(r"<hr[^>]*>", "\n---\n", s)
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"<font color=['\"]?(#[0-9A-Fa-f]{6})['\"]?>", r"[c=\1]", s, flags=re.I)
    s = re.sub(r"</font>", "[/c]", s, flags=re.I)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    lines = [re.sub(r"[ \t]+", " ", l).strip() for l in s.split("\n")]
    out, prev = [], None
    for l in lines:
        if not l or (l == "---" and prev == "---"):
            continue
        out.append(l)
        prev = l
    while out and out[0] == "---":
        out.pop(0)
    while out and out[-1] == "---":
        out.pop()
    return out


def fetch(item_id):
    page = get(f"https://lostarkcodex.com/ru/item/{item_id}/").decode("utf-8", "replace")
    name = re.search(r'id="item_name"><b>(.*?)</b>', page, re.S)
    grade = re.search(r'item_title item_grade_(\d)', page)
    icon = re.search(r'<img src="(/icons/[^"]+)" class="item_icon"', page)
    titles = re.search(r'<td class="titles_cell">(.*?)</td>', page, re.S)
    body = re.search(r'<td class="titles_cell">.*?</tr>\s*<tr><td colspan="2">(.*?)</td></tr></table>', page, re.S)
    sources = re.search(r'id="item_sources">(.*?)</div>', page, re.S)
    data = {
        "id": item_id,
        "name": html.unescape(re.sub(r"<[^>]+>", "", name.group(1))).strip() if name else str(item_id),
        "grade": int(grade.group(1)) if grade else 0,
        "gradeName": GRADE.get(int(grade.group(1)) if grade else 0, ""),
        "head": clean(titles.group(1)) if titles else [],
        "lines": clean(body.group(1)) if body else [],
        "sources": [l for l in clean(sources.group(1))] if sources else [],
        "url": f"https://lostarkcodex.com/ru/item/{item_id}/",
    }
    # убираем строки «Цена покупки/продажи» — в игре их нет в подсказке
    data["lines"] = [l for l in data["lines"] if not l.startswith(("Цена покупки", "Цена продажи"))]
    while data["lines"] and data["lines"][-1] == "---":
        data["lines"].pop()
    if icon:
        ICONS.mkdir(parents=True, exist_ok=True)
        fn = icon.group(1).rsplit("/", 1)[1]
        p = ICONS / fn
        if not p.exists():
            p.write_bytes(get("https://lostarkcodex.com" + icon.group(1)))
        data["icon"] = f"assets/items/codex/{fn}"
    return data


def fetch_skill(skill_id):
    """Подсказка умения: заголовок, характеристики, описание и пометки (Изнурение, Разрушение, контратака)."""
    page = get(f"https://lostarkcodex.com/ru/skill/{skill_id}/").decode("utf-8", "replace")
    name = re.search(r'id="item_name"><b>(.*?)</b>', page, re.S)
    head = re.search(r'<td class="titles_cell">(.*?)</td>', page, re.S)
    i = page.find("var skill_stats")
    k = page.find("</table>", i)
    m = re.search(r"var skill_stats = (\{.*?\});", page[i:k], re.S)
    rest = page[i:k][m.end():] if m else ""
    stats_part = page[page.find('<td colspan="2">', page.find('titles_cell')):i]
    lines = clean(rest)
    lines = [l for l in lines if not l.startswith("Эффект трипода")]
    while lines and lines[-1] == "---":
        lines.pop()
    icon = re.search(r'(/icons/[^"\\\]]+\.webp)', page[page.find('item_name') - 4000: page.find('item_name') + 4000])
    data = {"id": f"skill:{skill_id}", "kind": "skill",
            "name": html.unescape(re.sub(r"<[^>]+>", "", name.group(1))).strip() if name else skill_id,
            "grade": 0, "gradeName": "", "head": clean(head.group(1)) if head else [],
            "stats": [l for l in clean(stats_part) if l != "---"][:3], "lines": lines, "sources": [],
            "url": f"https://lostarkcodex.com/ru/skill/{skill_id}/"}
    if icon:
        ICONS.mkdir(parents=True, exist_ok=True)
        fn = icon.group(1).rsplit("/", 1)[1]
        p = ICONS / fn
        if not p.exists():
            p.write_bytes(get("https://lostarkcodex.com" + icon.group(1)))
        data["icon"] = f"assets/items/codex/{fn}"
    return data


def main():
    db = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    ids = sys.argv[1:] or list(db)
    for i in ids:
        try:
            i = str(i)
            db[i] = fetch_skill(i.split(":", 1)[1]) if i.startswith("skill:") else fetch(i)
            print("ok", i, db[i]["name"])
        except Exception as e:
            print("fail", i, e)
        time.sleep(0.7)
    OUT.write_text(json.dumps(db, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
