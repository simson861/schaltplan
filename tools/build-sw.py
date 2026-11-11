#!/usr/bin/env python3
"""Erzeugt sw.js (Service Worker für Offline-Betrieb) aus den Dateien im Repo.
Nach jeder Änderung an index.html, manual-app.js, ba/ oder img/ erneut ausführen:
    python3 tools/build-sw.py
Die Version ist ein Hash über alle Dateien; ändert sie sich, laden installierte Apps neu."""
import hashlib, json, os, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
core = ["./", "index.html", "manual-app.js", "ba/manual.js", "manifest.webmanifest",
        "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/favicon-32.png"] + sorted(glob.glob("img/*.jpg"))
rest = sorted(glob.glob("ba/fig/*.jpg")) + sorted(glob.glob("ba/pages/*.jpg"))
h = hashlib.sha256()
for f in [c for c in core if c != "./"] + rest:
    h.update(f.encode()); h.update(open(f, "rb").read())
version = h.hexdigest()[:12]
tpl = open("tools/sw.template.js", encoding="utf-8").read()
out = tpl.replace("__VERSION__", version).replace("__CORE__", json.dumps(core)).replace("__REST__", json.dumps(rest))
open("sw.js", "w", encoding="utf-8").write(out)
print("sw.js geschrieben, Version", version, "-", len(core), "Kern- und", len(rest), "Bilddateien")
