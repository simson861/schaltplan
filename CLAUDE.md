# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, German-language web app for the **IHC McCormick 323** tractor (manual dated 12.66), published via GitHub Pages from the repo root. It has two areas, switched by the menu at the top (`.area-switch`):

- **Betriebsanleitung**: the full operating manual, digitized as searchable text (tabs *Anleitung*, *Wartung*).
- **Schaltplan**: an interactive, colored wiring diagram (tabs *Plan*, *Kabelliste*, *Bauteile*, *Sicherungen*, *Plan-Fotos*, *Datenlage*).

There is no build step, no package manager and no test suite. Open `index.html` in a browser, or serve the folder (`python3 -m http.server`), and the app runs.

**The user has said not to change the Schaltplan any more.** Leave the wiring data, the layouts and the router as they are unless asked.

## Accuracy rule

Everything must match the original paper manual exactly; a mechanic relies on it. Don't invent, "fix" or modernize data. Keep the 1966 spelling ("Kontrolleuchte", "Schluß", "Kraftstoffilter") and printed misprints. Anything that was inferred rather than read verbatim is labelled in the data and explained in the *Datenlage* tab. Keep that convention.

## Files

- `index.html`: the page, all CSS, and the whole Schaltplan app as one inline `<script>`. At the end it loads `ba/manual.js` and then `manual-app.js`.
- `manual-app.js`: the manual reader and the Wartung view. It reads `window.MANUAL` and uses globals from the inline script (`WIRES`, `INTERNAL`, `termLabel`, `colorName`, `swatch`, `fmtMM`, `esc`, `setVariant`, `window.selectWire`).
- `ba/manual.js`: **generated** data, `window.MANUAL = {pages:[{id, printed, ratio, label?, blocks:[…]}]}`, with 59 pages `p01`–`p59` in scan order. `printed` is the printed page number, or null for unnumbered pages.
- `ba/pages/pNN.jpg`: enhanced full-page scans (perspective-corrected, evened lighting).
- `ba/fig/pNN-k.jpg`: figures cropped from those scans, referenced by fig blocks via `src`.
- `img/`: photos of the original wiring diagrams and cable list pages, shown in the *Plan-Fotos* tab.

## Schaltplan architecture (inline script in `index.html`)

- **Data.** At the top of the script:
  - `COMPS`: components with grid coordinates and terminals `[id, label, side, offset, hint, variant?]`. Side is one of `l/r/t/b/lr/tb`.
  - `WIRES_RAW`: one row per cable, `[nr, variant, colors, mm², "Comp:term", "Comp:term", circuit, source, note]`.
  - `INTERNAL`: cables drawn without a line (59, 69, 82).
  - Variant is `""` (both versions), `"*"` (≤20 km/h, plan G168) or `"**"` (>20 km/h, plan G167).
  - Source is `L` (verbatim from the cable list) or `L+P` (missing detail read from the plan).
- **Layouts.** `applyLayout()` switches between the functional layout ("Übersichtlich") and `LAYOUT_ORIG` ("Wie Original"). It rewrites `COMPS` positions from a deep-copied base.
- **Routing.** `route()` is an A* search on a 10-px grid. `routeNets()` groups terminals into electrical nets; fuse box `O` is split top/bottom, and `bridge` components (La, Lb) are merged into one node. The router forbids cables from different nets sharing a segment, bending on another net's cable, or passing another net's terminal. `placeLabels()` positions the number tags, and `junctions()` draws dots where a net branches.
- **Fuse box `O`.** Each fuse has a top terminal (`S1e`…`S8e`, feed) and a bottom terminal (`S1a`…`S8a`, outgoing). `bridges:[[1,2],[3,4,5,6]]` joins the tops. `traceNet()` follows these bridges.
- **Routing in the app.** Views are hash-based: `#anleitung`, `#anleitung-s23` (printed page) or `#anleitung-p49` (scan id), `#wartung`, `#plan`, `#kabel`, …. `showView()` handles them, and the list of views is `VIEWS`.

## Manual block schema

Block types:
- `h1`, `h2`, `h3`, `p`, `note`: carry `text`.
- `list`: `ordered`, `items`.
- `table`: `caption`, `head`, `rows`. A group row is `["**…**", "", …]`.
- `fig`: `label` (e.g. "Bild 12"), `caption`, `legend[]`, `src`, `w`, `h`.
- Special blocks for pages 48–51: `plan`, `parts`, `cables`. These pages render live from the wiring data instead of from transcribed text.

Inline `**bold**` is supported. "Seite N" and "Bild N" in text become links automatically.

The Wartung view is built from three tables found by regex in the data: pages `p24`, `p25` and `p26`. If you edit those tables, keep their captions and headers.

Per-viewer state is kept in `localStorage`: chosen variant and layout, reader mode, last tab per area, Wartung checkboxes and operating hours. Every access is wrapped in try/catch.

## Regenerating `ba/` (not reproducible from this repo alone)

`ba/manual.js` and the images were produced from the user's three PDFs by scripts that are **not in this repo**: per-page transcription JSON, an OpenCV enhancement script and a build script. Small text fixes can be made directly in `ba/manual.js`. Keep it valid JS with one `window.MANUAL=…;` assignment.

## Verifying changes

There are no tests. Check changes in a headless browser with the pre-installed Playwright:
- Load `index.html` via `file://`.
- Block Google Fonts with `page.route(/fonts/, r => r.abort())`.
- Watch for `pageerror` events.
- Check both variants (`setVariant('*')`, `setVariant('**')`).
- Check phone width (`devices['iPhone 13']`) for horizontal overflow: `document.documentElement.scrollWidth <= innerWidth`.
