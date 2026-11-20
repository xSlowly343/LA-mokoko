#!/usr/bin/env python3
"""Проставляет версию (?v=…) всем своим JS/CSS в index.html, чтобы браузеры не держали старые файлы в кэше.

Модули импортируют друг друга относительными путями — поэтому каждый файл js/*.js
прописывается в import map с версией. Запускать перед коммитом изменений кода:
    python scripts/bump_version.py
"""
import json
import re
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
v = time.strftime("%Y%m%d%H%M")

s = INDEX.read_text(encoding="utf-8")
m = re.search(r'<script type="importmap">\s*(\{.*?\})\s*</script>', s, re.S)
imap = json.loads(m.group(1))
imports = {k: val for k, val in imap["imports"].items() if not k.startswith("./js/")}
for f in sorted((ROOT / "js").glob("*.js")):
    imports[f"./js/{f.name}"] = f"./js/{f.name}?v={v}"
imap["imports"] = imports
s = s[:m.start(1)] + json.dumps(imap, ensure_ascii=False, indent=2) + s[m.end(1):]
s = re.sub(r'src="js/app\.js(\?v=\w+)?"', f'src="js/app.js?v={v}"', s)
s = re.sub(r'href="css/style\.css(\?v=\w+)?"', f'href="css/style.css?v={v}"', s)
INDEX.write_text(s, encoding="utf-8")
print("version", v)
