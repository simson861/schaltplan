/* Betriebsanleitung und Wartung – Leser für window.MANUAL (ba/manual.js).
   Benötigt aus index.html: WIRES, INTERNAL, COMPS, termLabel, colorName, swatch, fmtMM, esc, setVariant, VAR_LABEL. */
"use strict";
(function(){
const M = window.MANUAL; if(!M) return;
const pages = M.pages;
const byId = Object.fromEntries(pages.map(p=>[p.id,p]));
const byPrinted = {}; for(const p of pages) if(p.printed) byPrinted[String(p.printed)] = p;
const pageLabel = p => p.printed ? "Seite " + p.printed : (p.label || "ohne Seitenzahl");
const pageKey = p => p.printed ? "s" + p.printed : p.id;
const figIndex = {};   // "Bild 12" -> el id
const figBlocks = {};  // el id -> fig block
const figBySpec = {};  // "p25-1" -> el id

/* ---------- Inline-Formatierung und Verweise ---------- */
function inline(s){
  let h = esc(s);
  h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Seitenverweise: „Seite 31“, „Seite 39, 40, 41“, „Seiten 13 und 14“
  h = h.replace(/\b(Seiten?)\s+((?:\d{1,2})(?:\s*(?:,|und|u\.|bis|-|–)\s*\d{1,2})*)/g, (m, w, list) => {
    const parts = list.replace(/(\d{1,2})/g, n => byPrinted[n] ? `<a class="pref" href="#anleitung-s${n}">${n}</a>` : n);
    return w + " " + parts;
  });
  h = linkCallouts(h);
  h = h.replace(/\b(Bild)\s+(\d{1,3}[a-z]?)\b(?![^<]*<\/a>)/g, (m, w, n) => `<a class="fref" href="#" data-fig="Bild ${n}">${w} ${n}</a>`);
  return h;
}
/* „(2) Bild 49“: Nummer in Klammern der Abbildung im selben Satz zuordnen */
function linkCallouts(h){
  const all = [...h.matchAll(/\bBild\s+(\d{1,3}[a-z]?)\b/g)].map(m=>m[1]);
  const only = [...new Set(all)].length === 1 ? all[0] : null;
  let last = null;
  return h.split(/(?<=[.!?;:])\s+(?=[A-ZÄÖÜ„"(])/).map(sent => {
    const refs = [...sent.matchAll(/\bBild\s+(\d{1,3}[a-z]?)\b/g)].map(m=>({n:m[1], i:m.index}));
    const out = sent.replace(/\((\d{1,2}[a-z]?)\)/g, (m, num, off) => {
      let f = refs.find(x=>x.i>off) || [...refs].reverse().find(x=>x.i<off);
      const fig = f ? f.n : (only || last);
      return fig ? `<a class="cref" href="#" data-fig="Bild ${fig}" data-n="${num}">(${num})</a>` : m;
    });
    if(refs.length) last = refs[refs.length-1].n;
    return out;
  }).join(" ");
}
function pagesCell(s){
  return esc(s).replace(/(\d{1,2})/g, n => byPrinted[n] ? `<a class="pref" href="#anleitung-s${n}">${n}</a>` : n);
}

/* ---------- Blöcke ---------- */
let blkSeq = 0;
function renderBlock(b, p){
  const id = "b" + (++blkSeq);
  const a = ` id="${id}" class="blk`;
  switch(b.t){
    case "h1": return `<h2${a} b-h1" data-toc="1">${inline(b.text)}</h2>`;
    case "h2": return `<h3${a} b-h2" data-toc="2">${inline(b.text)}</h3>`;
    case "h3": return `<h4${a} b-h3">${inline(b.text)}</h4>`;
    case "p":  return `<p${a}">${inline(b.text).replace(/\n/g,"<br>")}</p>`;
    case "note": return `<aside${a} b-note">${inline(b.text).replace(/\n/g,"<br>")}</aside>`;
    case "list": { const tag = b.ordered ? "ol" : "ul";
      return `<${tag}${a} b-list">${b.items.map(it=>`<li>${inline(it).replace(/\n/g,"<br>")}</li>`).join("")}</${tag}>`; }
    case "table": {
      const isRef = (b.head||[]).some(x=>/^Seite$/i.test(String(x).trim()));
      const head = (b.head||[]).length ? `<thead><tr>${b.head.map(x=>`<th>${inline(String(x))}</th>`).join("")}</tr></thead>` : "";
      const rows = b.rows.map(r=>{
        const grp = r.length>1 && /^\*\*.*\*\*$/.test(r[0]) && r.slice(1).every(c=>!c);
        if(grp) return `<tr class="grp"><td colspan="${r.length}">${inline(r[0])}</td></tr>`;
        return `<tr>${r.map((c,i)=>`<td>${isRef && i===r.length-1 ? pagesCell(String(c)) : inline(String(c))}</td>`).join("")}</tr>`;
      }).join("");
      return `<div${a} b-table"><div class="tscroll"><table>${b.caption&&!isRef?`<caption>${inline(b.caption)}</caption>`:""}${head}<tbody>${rows}</tbody></table></div></div>`;
    }
    case "fig": {
      if(b.label) figIndex[b.label] = figIndex[b.label] || id;
      figBlocks[id] = b; if(b.src) figBySpec[b.src.split("/").pop().replace(".jpg","")] = id;
      const img = b.src ? `<button class="fig-btn" data-src="${b.src}" aria-label="Abbildung vergrößern"><span class="fig-wrap"><img src="${b.src}" alt="${esc((b.label?b.label+": ":"")+(b.caption||"Abbildung"))}" loading="lazy" width="${b.w||600}" height="${b.h||400}"><svg class="fig-marks" viewBox="0 0 ${b.w||600} ${b.h||400}" preserveAspectRatio="none" aria-hidden="true"></svg></span></button>` : "";
      const legNum = l => { const m = /^\s*([0-9]{1,2}[a-z]?|[A-Z][0-9]?)\s*[-–=]/.exec(l); return m ? m[1] : null; };
      const leg = (b.legend||[]).length ? `<ul class="legend">${b.legend.map(l=>{ const n = legNum(l); const has = n && b.marks && b.marks[n]; return `<li${has?` class="leg-link" data-n="${esc(n)}" tabindex="0" role="button"`:""}>${has?esc(l):inline(l)}</li>`; }).join("")}</ul>` : "";
      const cap = (b.label||b.caption) ? `<figcaption>${b.label?`<b>${esc(b.label)}</b> `:""}${inline(b.caption||"")}${leg}</figcaption>` : (leg?`<figcaption>${leg}</figcaption>`:"");
      return `<figure${a} b-fig">${img}${cap}</figure>`;
    }
    case "plan": return `<div${a} b-plan"><p>Diese Seite ist als <b>interaktiver Schaltplan</b> umgesetzt: farbige Kabel, Suche und Stromkreisverfolgung.</p>
      <button class="btn" data-goplan="${b.variant}">Schaltplan ${b.variant==="*"?"G168 · bis 20 km/h":"G167 · über 20 km/h"} öffnen</button></div>`;
    case "parts": return `<div${a} b-table"><div class="tscroll"><table><thead><tr><th>Kurzzeichen</th><th>Bauteil</th></tr></thead><tbody>${
      M_PARTS.map(r=>`<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td></tr>`).join("")}</tbody></table></div></div>`;
    case "cables": {
      const rows = [];
      for(const w of WIRES) if(w.n>=b.from && w.n<=b.to) rows.push({n:w.n,v:w.v,col:w.col,mm:w.mm,txt:`von ${termLabel(w.a)} nach ${termLabel(w.b)}`,key:w.key});
      for(const r of INTERNAL) if(r[0]>=b.from && r[0]<=b.to) rows.push({n:r[0],v:r[1],col:r[2],mm:r[3],txt:r[4]});
      rows.sort((x,y)=>x.n-y.n||x.v.localeCompare(y.v));
      return `<div${a} b-table"><div class="tscroll"><table class="cables"><thead><tr><th>Nr.</th><th>Farbe</th><th>mm²</th><th>Verbindung</th></tr></thead><tbody>${
        rows.map(r=>`<tr><td class="mono"><b>${r.v?r.v:""}${r.n}</b></td><td>${swatch(r.col)} ${esc(colorName(r.col))}</td><td class="mono">${fmtMM(r.mm)}</td><td>${esc(r.txt)}${r.key?` <a href="#plan" data-gowire="${r.key}">im Plan</a>`:""}</td></tr>`).join("")}</tbody></table></div></div>
        <p class="b-src">Inhalt dieser Seite aus der geprüften Kabelliste der App. ${b.from===1?"* nur für Schlepper bis 20 km/h, ** nur für Schlepper über 20 km/h.":""}</p>`;
    }
    case "missing": return `<p${a} b-missing">Diese Seite wird noch digitalisiert. Bis dahin ist die Originalseite unten zu sehen.</p>`;
    default: return "";
  }
}
const M_PARTS = [["Al","Einbauscheinwerfer, links"],["Ar","Einbauscheinwerfer, rechts"],["Bl","Blink-Begrenzungslampe, links"],["Br","Blink-Begrenzungslampe, rechts"],["Cl","Schluß-Blinkleuchte, links"],["Cr","Schluß-Blinkleuchte"],["Ch","Kennzeichenleuchte"],["D","Batterie"],["E","Traktormeter"],["F","Kombiinstrument"],["F1","Fernlichtkontrollampe"],["F2","Öldruckkontrollampe, Motor"],["F3","Ladekontrollampe"],["F4","Kraftstoffkontrolle"],["F5","Blinkkontrollampen"],["F6","Motortemperaturkontrolle"],["F7","Öldruckkontrollampe, Wandlergetriebe"],["Fa","Flachsteckverbindung, links, 2polig"],["Fb","Flachsteckverbindung, rechts, 2polig"],["*Fc","Flachsteckverbindung, links, 1polig"],["**Fc","Flachsteckverbindung, links, 1polig"],["**Fd","Flachsteckverbindung, rechts, 1polig"],["Ga","Glühanlaßschalter"],["Gb","Blinkgeber"],["Ha","Blinkschalter und Horndruckknopf"],["Hb","Schrittschaltrelais"],["**Hc","Umschaltrelais"],["K","Schaltkasten"],["La","Leitungsverteiler"],["Lb","Leitungsverteiler"],["Lm","Anlasser"],["**Ls","Bremslichtzugschalter"],["M","Spannungsregler"],["N","Lichtmaschine"],["O","Sicherungskasten"],["Pa","Steckverbindung"],["Pb","Steckverbindung"],["Pc","Steckverbindung"],["Pe","Steckverbindung"],["R","Steckdose, 7polig"],["Sa","Steckdose, 1polig"],["Ta","Fernthermometer, Geber"],["Ua","Öldruckschalter, Motor"],["Ub","Öldruckschalter, Wandlergetriebe"],["V","Elektr. Kraftstoffanzeiger, (Geber)"],["X","Glühkerzen"],["Z","Horn"]];

/* ---------- Dokument aufbauen ---------- */
const doc = document.getElementById("badoc"), toc = document.getElementById("batoc"), sel = document.getElementById("bapage");
function build(){
  blkSeq = 0;
  doc.innerHTML = pages.map(p => {
    const body = p.blocks.map(b=>renderBlock(b,p)).join("");
    const empty = !p.blocks.some(b=>b.t!=="missing");
    return `<article class="pg" id="pg-${p.id}" data-p="${p.id}">
      <header class="pg-h"><span class="pg-no">${esc(pageLabel(p))}</span><button class="pg-orig" data-orig="${p.id}">Originalseite</button></header>
      <div class="pg-text">${body}</div>
      <button class="pg-scan" data-orig="${p.id}" aria-label="Originalseite ${esc(pageLabel(p))} vergrößern"><img src="ba/pages/${p.id}.jpg" alt="Originalseite ${esc(pageLabel(p))}" loading="lazy" width="1300" height="${Math.round(1300*p.ratio)}"></button>
    </article>`;}).join("");
  // Inhaltsverzeichnis aus Überschriften
  let html = "", open = false;
  doc.querySelectorAll("[data-toc]").forEach(h => {
    const p = byId[h.closest(".pg").dataset.p]; const lvl = h.dataset.toc; const t = h.textContent.trim();
    if(!t || (!p.printed && !p.label) || /^notizen$/i.test(t)) return;
    if(lvl==="1"){ if(open) html += "</ul></details>"; html += `<details class="toc-g"><summary><a href="#" data-blk="${h.id}">${esc(t)}</a><span class="toc-p">${p.printed||""}</span></summary><ul>`; open = true; }
    else { if(!open){ html += `<details class="toc-g" open><summary>Allgemein</summary><ul>`; open = true; } html += `<li><a href="#" data-blk="${h.id}">${esc(t)}</a><span class="toc-p">${p.printed||""}</span></li>`; }
  });
  if(open) html += "</ul></details>";
  toc.innerHTML = html;
  sel.innerHTML = pages.map(p=>{const h=p.blocks.find(b=>b.t==="h1"||b.t==="h2");return `<option value="${p.id}">${esc(pageLabel(p))}${h?" – "+esc(h.text.replace(/\*\*/g,"").slice(0,40)):""}</option>`}).join("");
  resolveRefs();
  buildIndex();
}

/* ---------- Pfeil-Markierung ---------- */
let markedFig = null;
function clearMark(){ if(!markedFig) return; markedFig.querySelector(".fig-marks").innerHTML = ""; markedFig.querySelectorAll(".leg-link.on").forEach(x=>x.classList.remove("on")); markedFig.classList.remove("marked"); markedFig = null; }
function showMark(figId, num, scroll){
  const fig = document.getElementById(figId); const b = figBlocks[figId]; if(!fig || !b || !b.marks) return;
  const nums = String(num).split(",");
  clearMark(); markedFig = fig; fig.classList.add("marked");
  const W = b.w, H = b.h, R = Math.max(16, Math.min(W, H) * 0.035);
  let svg = "";
  for(const n of nums) for(const occ of (b.marks[n]||[])){
    const [lx, ly] = [occ.label[0]*W, occ.label[1]*H];
    for(const t of occ.tips||[]){ const [tx, ty] = [t[0]*W, t[1]*H]; if(Math.hypot(tx-lx, ty-ly) > R*1.2) svg += `<line x1="${lx}" y1="${ly}" x2="${tx}" y2="${ty}" class="mk-line"/><circle cx="${tx}" cy="${ty}" r="${R*0.55}" class="mk-tip"/><circle cx="${tx}" cy="${ty}" r="${R*0.55}" class="mk-pulse"/>`; }
    svg += `<circle cx="${lx}" cy="${ly}" r="${R}" class="mk-ring"/>`;
  }
  fig.querySelector(".fig-marks").innerHTML = svg;
  fig.querySelectorAll(".leg-link").forEach(x=>x.classList.toggle("on", nums.includes(x.dataset.n)));
  if(scroll) scrollToEl(fig.querySelector(".fig-btn") || fig, false);
}
function resolveRefs(){
  doc.querySelectorAll(".cref").forEach(a => { const id = figIndex[a.dataset.fig]; const b = id && figBlocks[id];
    if(!(b && b.marks && b.marks[a.dataset.n])) a.replaceWith(document.createTextNode(a.textContent)); else a.title = `${a.dataset.fig}, Nr. ${a.dataset.n} zeigen`; });
}
window.showSchmierstelle = nums => { const id = figBySpec["p25-1"]; if(!id) return; location.hash = "anleitung-s24"; setTimeout(()=>showMark(id, nums, true), 120); };

/* ---------- Suche ---------- */
let index = [];
function buildIndex(){
  const txt = el => { if(!el.querySelector("td,th,li,figcaption")) return el.textContent; const c = el.cloneNode(true); c.querySelectorAll("td,th,li,caption,figcaption,b").forEach(x=>x.append(" · ")); return c.textContent.replace(/(\s·\s*)+$/,""); };
  index = [...doc.querySelectorAll(".pg-text .blk")].map(el => ({el, p: el.closest(".pg").dataset.p, text: txt(el).replace(/\s+/g," ").trim()}));
}
function termRe(term){
  let t = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  t = t.replace(/ä|ae/g,"(?:ä|ae)").replace(/ö|oe/g,"(?:ö|oe)").replace(/ü|ue/g,"(?:ü|ue)").replace(/ß|ss/g,"(?:ß|ss)");
  return t;
}
function search(q){
  const terms = q.trim().split(/\s+/).filter(t=>t.length>=2);
  if(!terms.length) return {terms, hits:[]};
  const res = terms.map(t=>new RegExp(termRe(t),"i"));
  const hits = index.filter(x=>res.every(r=>r.test(x.text)));
  return {terms, hits};
}
function snippet(text, terms){
  const re = new RegExp(terms.map(termRe).join("|"),"ig");
  const m = re.exec(text); const i = m ? m.index : 0;
  let s = text.slice(Math.max(0,i-60), i+120); if(i>60) s = "…"+s; if(i+120<text.length) s += "…";
  return esc(s).replace(new RegExp(terms.map(termRe).join("|"),"ig"), x=>`<mark>${x}</mark>`);
}
function clearMarks(){ doc.querySelectorAll("mark.hl").forEach(m=>{ m.replaceWith(document.createTextNode(m.textContent)); }); doc.normalize(); }
function markIn(root, terms){
  const re = new RegExp(terms.map(termRe).join("|"),"ig");
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode:n=>n.parentNode.closest("mark,button,select,script")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  const nodes = []; while(walker.nextNode()) nodes.push(walker.currentNode);
  for(const n of nodes){ const t = n.nodeValue; re.lastIndex = 0; if(!re.test(t)) continue; re.lastIndex = 0;
    const frag = document.createDocumentFragment(); let last = 0, m;
    while((m = re.exec(t))){ frag.append(t.slice(last, m.index)); const mk = document.createElement("mark"); mk.className = "hl"; mk.textContent = m[0]; frag.append(mk); last = m.index + m[0].length; }
    frag.append(t.slice(last)); n.replaceWith(frag); }
}
const qIn = document.getElementById("baq"), resBox = document.getElementById("baresults"), cnt = document.getElementById("bacount");
let lastTerms = [];
function runSearch(){
  const q = qIn.value; const {terms, hits} = search(q); lastTerms = terms;
  clearMarks();
  if(!terms.length){ resBox.hidden = true; toc.hidden = false; cnt.textContent = ""; return; }
  toc.hidden = true; resBox.hidden = false;
  const byPage = new Map(); for(const h of hits){ if(!byPage.has(h.p)) byPage.set(h.p, []); byPage.get(h.p).push(h); }
  cnt.textContent = hits.length ? `${hits.length} Treffer auf ${byPage.size} Seiten` : "keine Treffer";
  resBox.innerHTML = hits.length ? [...byPage].map(([pid, hs]) => `<div class="res-pg"><div class="res-h">${esc(pageLabel(byId[pid]))}</div>${hs.slice(0,6).map(h=>`<button class="res" data-blk="${h.el.id}">${snippet(h.text, terms)}</button>`).join("")}${hs.length>6?`<div class="res-more">+ ${hs.length-6} weitere auf dieser Seite</div>`:""}</div>`).join("")
    : `<p class="res-empty">Nichts gefunden. Tipp: einzelne Wortteile suchen, z. B. „kupplung“ oder „öl“.</p>`;
  for(const pid of byPage.keys()) markIn(document.querySelector(`#pg-${pid} .pg-text`), terms);
}
let st; qIn.addEventListener("input", ()=>{ clearTimeout(st); st = setTimeout(runSearch, 160); });
qIn.addEventListener("keydown", e=>{ if(e.key==="Enter"){ const f = resBox.querySelector(".res"); if(f) f.click(); }});

/* ---------- Navigation ---------- */
function setMode(m){
  const keep = doc.dataset.mode && doc.dataset.mode !== m && !document.getElementById("v-anleitung").hidden ? currentPage : null;
  doc.dataset.mode = m;
  if(keep) requestAnimationFrame(()=>gotoPage(keep));
  document.querySelectorAll("#bamode button").forEach(b=>b.setAttribute("aria-pressed", String(b.dataset.m===m)));
  try{ localStorage.setItem("ihc323-bamode", m); }catch(e){}
}
document.getElementById("bamode").addEventListener("click", e=>{ const b = e.target.closest("[data-m]"); if(b) setMode(b.dataset.m); });
function scrollToEl(el, flash){
  if(!el) return;
  if(doc.dataset.mode==="scan" && el.closest(".pg-text")) setMode("text");
  const go = ()=>window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY - 120});
  go(); setTimeout(go, 350);
  if(flash){ el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
  closeSide();
}
function gotoPage(pid){ const el = document.getElementById("pg-"+pid); if(!el) return; const go = ()=>window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY - 110}); go(); setTimeout(go, 350); currentPage = pid; sel.value = pid; }
sel.addEventListener("change", ()=>{ location.hash = "anleitung-" + pageKey(byId[sel.value]); });
function step(d){ const i = pages.findIndex(p=>p.id===currentPage); const n = pages[Math.max(0, Math.min(pages.length-1, i+d))]; location.hash = "anleitung-" + pageKey(n); }
document.getElementById("baprev").onclick = ()=>step(-1);
document.getElementById("banext").onclick = ()=>step(1);
let currentPage = pages[0].id;
const io = new IntersectionObserver(es=>{ for(const e of es) if(e.isIntersecting){ currentPage = e.target.dataset.p; sel.value = currentPage; } }, {rootMargin:"-45% 0px -50% 0px"});
function observe(){ doc.querySelectorAll(".pg").forEach(p=>io.observe(p)); }

document.getElementById("v-anleitung").addEventListener("click", e=>{
  const blk = e.target.closest("[data-blk]");
  if(blk){ e.preventDefault(); scrollToEl(document.getElementById(blk.dataset.blk), true); return; }
  const cr = e.target.closest(".cref");
  if(cr){ e.preventDefault(); showMark(figIndex[cr.dataset.fig], cr.dataset.n, true); return; }
  const ll = e.target.closest(".leg-link");
  if(ll){ showMark(ll.closest(".b-fig").id, ll.dataset.n, false); return; }
  const fr = e.target.closest("[data-fig]");
  if(fr){ e.preventDefault(); const id = figIndex[fr.dataset.fig]; if(id) scrollToEl(document.getElementById(id), true); return; }
  const fb = e.target.closest(".fig-btn"); if(fb){ openLightbox(fb.dataset.src, fb.querySelector("img").alt); return; }
  const or = e.target.closest("[data-orig]"); if(or){ const p = byId[or.dataset.orig]; openLightbox(`ba/pages/${p.id}.jpg`, "Originalseite " + pageLabel(p)); return; }
  const gp = e.target.closest("[data-goplan]"); if(gp){ setVariant(gp.dataset.goplan); location.hash = "plan"; return; }
  const gw = e.target.closest("[data-gowire]"); if(gw){ e.preventDefault(); const k = gw.dataset.gowire; const w = WIRES.find(x=>x.key===k); if(w&&w.v) setVariant(w.v); location.hash = "plan"; setTimeout(()=>window.selectWire&&window.selectWire(k), 60); return; }
});

/* ---------- Seitenleiste (Handy) ---------- */
const side = document.getElementById("baside");
function closeSide(){ side.classList.remove("open"); document.getElementById("batoggle").setAttribute("aria-expanded","false"); }
document.getElementById("baclose").onclick = closeSide;
document.getElementById("batoggle").onclick = ()=>{ const o = !side.classList.contains("open"); side.classList.toggle("open", o); document.getElementById("batoggle").setAttribute("aria-expanded", String(o)); if(o) qIn.focus({preventScroll:true}); };

/* ---------- Lightbox ---------- */
const lb = document.getElementById("lightbox"), lbImg = document.getElementById("lbimg"), lbCap = document.getElementById("lbcap");
function openLightbox(src, cap){ lbImg.src = src; lbImg.alt = cap; lbCap.textContent = cap; lb.hidden = false; lb.classList.remove("zoom"); document.body.style.overflow = "hidden"; document.getElementById("lbclose").focus(); }
function closeLightbox(){ lb.hidden = true; lbImg.removeAttribute("src"); document.body.style.overflow = ""; }
document.getElementById("lbclose").onclick = closeLightbox;
window.addEventListener("hashchange", ()=>{ if(!lb.hidden) closeLightbox(); closeSide(); });
lb.addEventListener("click", e=>{ if(e.target===lb) closeLightbox(); });
lbImg.addEventListener("click", ()=>lb.classList.toggle("zoom"));
document.addEventListener("keydown", e=>{
  if(e.key==="Escape" && !lb.hidden) closeLightbox();
  if(!document.getElementById("v-anleitung").hidden && lb.hidden && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){
    if(e.key==="ArrowRight") step(1); if(e.key==="ArrowLeft") step(-1);
  }
});

/* ---------- Hash-Routing (#anleitung, #anleitung-s12, #anleitung-p49) ---------- */
window.manualRoute = function(sub){
  if(!sub) return;
  let p = null;
  if(sub[0]==="s") p = byPrinted[sub.slice(1)]; else p = byId[sub];
  if(p) requestAnimationFrame(()=>gotoPage(p.id));
};

/* ---------- Wartung ---------- */
const LS = {get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}, del(k){try{localStorage.removeItem(k)}catch(e){}}};
const K_RUN="ihc323-wartung-aktiv", K_HIST="ihc323-wartung-historie", K_BH="ihc323-bh";
const plain = t => String(t).replace(/\*\*/g,"");
const fmtD = iso => new Date(iso).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"});
const fmtDT = iso => new Date(iso).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
const num = v => { const n = parseFloat(String(v||"").replace(/\./g,"").replace(",", ".")); return n>=0 ? n : null; };
function wGroups(){
  const t = findTable("p24", /Regelmäßige Wartungs/); const groups = []; let g = null;
  if(t) for(const r of t.rows){ const m = /^\*\*Nach jeweils (\d+) Betriebsstunden\*\*$/.exec(r[0]); if(m){ g = {h:+m[1], items:[]}; groups.push(g); } else if(g) g.items.push({text:r[0], nr:r[1]}); }
  return groups;
}
function suggestInterval(bh, groups){
  if(bh==null) return groups[0] ? groups[0].h : 10;
  const r = Math.round(bh/10)*10; let best = groups[0].h;
  for(const g of groups) if(r>0 && r % g.h === 0) best = g.h;
  return best;
}
function nrList(t){ const out=[]; for(const part of String(t).split(",")){ const m=/(\d+)\s*[-–]\s*(\d+)/.exec(part); if(m){ for(let i=+m[1];i<=+m[2];i++) out.push(String(i)); } else { const n=part.trim(); if(/^\d+$/.test(n)) out.push(n); } } return out; }
function nrChip(t){ const l = nrList(t); return l.length ? `<button type="button" class="w-nr w-nr-btn" data-schmier="${l.join(",")}" title="Im Schmierplan zeigen">${esc(t)}</button>` : `<span class="w-nr">${esc(t)}</span>`; }
function buildWartung(){
  const box = document.getElementById("wartung"); if(!box) return;
  const groups = wGroups();
  const tOil = findTable("p25", /Schmiermittel/), tErl = findTable("p26", /Erläuterungen/);
  const figPlan = (byId.p25||{blocks:[]}).blocks.find(b=>b.t==="fig");
  const render = () => {
    const run = LS.get(K_RUN, null), hist = LS.get(K_HIST, []), bh = LS.get(K_BH, "");
    const bhN = num(bh);
    const due = h => { if(bhN==null) return ""; const next = Math.floor(bhN/h)*h + h; return `nächste bei ${next.toLocaleString("de-DE")} Bh`; };
    let h = `<div class="w-top"><div class="w-intro"><h2>Wartung und Pflege</h2><p>Nach der Tabelle „Regelmäßige Wartungs- und Pflegearbeiten“, <a class="pref" href="#anleitung-s23">Seite 23</a>. Die grauen Nummern verweisen auf den Schmierplan.</p></div></div>`;
    if(run){
      const done = run.items.filter(i=>i.done).length, all = run.items.length, pct = Math.round(done/all*100);
      h += `<section class="w-run" aria-labelledby="wrun-h">
        <header class="w-run-h"><div><h3 id="wrun-h">Laufende Wartung: ${run.interval.toLocaleString("de-DE")}-Stunden-Wartung</h3>
          <p>Begonnen ${fmtDT(run.start)}${run.bh!=null?` · Stand ${run.bh.toLocaleString("de-DE")} Bh`:""}</p></div>
          <div class="w-prog" role="progressbar" aria-valuemin="0" aria-valuemax="${all}" aria-valuenow="${done}"><span style="width:${pct}%"></span><b>${done} / ${all}</b></div></header>
        ${groups.filter(g=>g.h<=run.interval).map(g=>{ const its = run.items.filter(i=>i.g===g.h); return `<div class="w-run-g"><h4>aus „alle ${g.h.toLocaleString("de-DE")} Betriebsstunden“</h4><ul>${its.map(i=>`
          <li class="${i.done?"is-done":""}"><label><input type="checkbox" data-run="${i.k}" ${i.done?"checked":""}><span class="w-t">${inline(i.text)}${i.doneAt?`<small>erledigt ${fmtDT(i.doneAt)}</small>`:""}</span></label>${i.nr?nrChip(i.nr):""}</li>`).join("")}</ul></div>`; }).join("")}
        <label class="w-note"><span>Notizen (z. B. verwendetes Öl, Auffälligkeiten)</span><textarea id="wnote" rows="3">${esc(run.note||"")}</textarea></label>
        <div class="row w-run-act">
          <button class="btn" id="wfinish">${done===all?"Wartung abschließen":`Abschließen (${all-done} offen)`}</button>
          <button class="btn ghost" id="wcancel">Wartung verwerfen</button>
        </div>
        <div id="wconfirm" class="w-confirm" hidden></div>
      </section>`;
    } else {
      const sug = suggestInterval(bhN, groups);
      h += `<section class="w-start"><h3>Wartung starten</h3>
        <div class="w-start-f">
          <label><span>Stand Betriebsstundenzähler</span><input id="wbh" type="text" inputmode="decimal" placeholder="z. B. 2400" value="${esc(bh)}"></label>
          <fieldset><legend>Intervall</legend><div class="seg w-int" role="radiogroup">${groups.map(g=>`<button type="button" role="radio" data-int="${g.h}" aria-checked="${g.h===sug}">${g.h.toLocaleString("de-DE")} h</button>`).join("")}</div></fieldset>
        </div>
        <p class="w-start-hint" id="wsughint">${bhN!=null?`Bei ${bhN.toLocaleString("de-DE")} Bh ist die <b>${sug.toLocaleString("de-DE")}-Stunden-Wartung</b> fällig.`:"Gib den Zählerstand ein, dann schlägt die App das fällige Intervall vor."} Eine größere Wartung enthält alle kleineren Arbeiten, z. B. umfasst die 200-Stunden-Wartung auch die Punkte für 10 und 50 Stunden.</p>
        <div class="row"><button class="btn" id="wgo">Wartung starten</button><span class="w-count" id="wcount"></span></div>
      </section>`;
    }
    h += `<details class="w-over"${run?"":" open"}><summary>Übersicht aller Intervalle</summary><div class="w-grid">${groups.map(g=>`
      <section class="w-card"><header><h3>alle ${g.h.toLocaleString("de-DE")} Betriebsstunden</h3><small class="w-due">${due(g.h)}</small></header>
      <ul>${g.items.map(i=>`<li><span>${inline(i.text)}</span>${i.nr?nrChip(i.nr):""}</li>`).join("")}</ul></section>`).join("")}</div></details>`;
    h += `<section class="w-hist"><h3>Verlauf</h3>${hist.length?`<ul>${hist.slice().reverse().map((e,ri)=>{ const i = hist.length-1-ri; const d = e.items.filter(x=>x.done).length; return `
      <li><details><summary><b>${fmtD(e.end)}</b> · ${e.interval.toLocaleString("de-DE")}-h-Wartung${e.bh!=null?` · ${e.bh.toLocaleString("de-DE")} Bh`:""} <span class="badge ${d===e.items.length?"b-ok":"b-warn"}">${d}/${e.items.length}</span></summary>
        <ul class="w-hist-items">${e.items.map(x=>`<li class="${x.done?"is-done":"is-open"}">${x.done?"✓":"–"} ${esc(plain(x.text))}</li>`).join("")}</ul>
        ${e.note?`<p class="w-hist-note">${esc(e.note)}</p>`:""}
        <div class="row"><button class="btn ghost" data-copy="${i}">Als Text kopieren</button><button class="btn ghost" data-delh="${i}">Eintrag löschen</button></div></details></li>`; }).join("")}</ul>`:`<p class="w-empty">Noch keine abgeschlossene Wartung. Abgeschlossene Wartungen erscheinen hier mit Datum, Stundenstand und Notizen.</p>`}
      <p class="b-src">Laufende Wartung und Verlauf werden nur auf diesem Gerät gespeichert. Mit „Als Text kopieren“ lässt sich ein Eintrag sichern, z. B. in eine Notiz.</p></section>`;
    h += `<div class="b-note w-warn"><b>Hinweis zum Original:</b> Die Ölstandskontrolle des Lenkgetriebes (Nr. 11) steht in der Tabelle auf Seite 23 unter „alle 200 Betriebsstunden“, in den Erläuterungen zum Schmierplan auf Seite 25 aber in der Spalte „1600“. Im Zweifel den kürzeren Abstand einhalten.</div>
     <div class="w-two">
       <section><h3>Schmiermittel und Füllmengen</h3>${tOil?`<div class="tscroll"><table>${tOil.rows.map(r=>`<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join("")}</table></div>`:""}
         <p class="b-src">Aus dem Schmierplan, <a class="pref" href="#anleitung-s24">Seite 24</a>. Weitere Angaben unter „Technische Einzelheiten“, <a class="pref" href="#anleitung-s4">Seite 4</a>.</p></section>
       <section><h3>Schmierplan</h3>${figPlan&&figPlan.src?`<button class="fig-btn" data-src="${figPlan.src}"><img src="${figPlan.src}" alt="Schmierplan" loading="lazy"></button>`:""}<p class="b-src">Antippen zum Vergrößern.</p></section>
     </div>
     ${tErl?`<section class="w-erl"><h3>Erläuterungen zum Schmierplan</h3><div class="filters"><span>Intervall:</span>${["alle","10","50","200","800","1600"].map(v=>`<button class="chip" data-erl="${v}" aria-pressed="${v==="alle"}">${v==="alle"?"alle":v+" h"}</button>`).join("")}</div>
       <div class="tscroll"><table id="werl"><thead><tr>${tErl.head.map(x=>`<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>${tErl.rows.map(r=>`<tr data-ints="${[3,4,5,6,7].filter(i=>r[i]).map(i=>tErl.head[i]).join(" ")}">${r.map((c,i)=>`<td${i>=3?' class="mono c"':''}>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
       <p class="b-src">Aus <a class="pref" href="#anleitung-s25">Seite 25</a>. (x) = bei staubiger Arbeit.</p></section>`:""}`;
    box.innerHTML = h;
    updateCount();
    const tab = document.querySelector('nav.tabs a[data-v="wartung"]'); if(tab){ tab.classList.toggle("has-run", !!run); tab.title = run ? "Eine Wartung läuft" : ""; }
  };
  const selInt = () => { const b = box.querySelector('[data-int][aria-checked="true"]'); return b ? +b.dataset.int : null; };
  const updateCount = () => { const c = box.querySelector("#wcount"); const iv = selInt(); if(c && iv) c.textContent = groups.filter(g=>g.h<=iv).reduce((n,g)=>n+g.items.length,0) + " Arbeiten"; };
  box.addEventListener("input", e => {
    if(e.target.id==="wbh"){ LS.set(K_BH, e.target.value); const bhN = num(e.target.value); const sug = suggestInterval(bhN, groups);
      box.querySelectorAll("[data-int]").forEach(b=>b.setAttribute("aria-checked", String(+b.dataset.int===sug)));
      const hint = box.querySelector("#wsughint"); if(hint) hint.firstChild && (hint.innerHTML = (bhN!=null?`Bei ${bhN.toLocaleString("de-DE")} Bh ist die <b>${sug.toLocaleString("de-DE")}-Stunden-Wartung</b> fällig.`:"Gib den Zählerstand ein, dann schlägt die App das fällige Intervall vor.") + " Eine größere Wartung enthält alle kleineren Arbeiten, z. B. umfasst die 200-Stunden-Wartung auch die Punkte für 10 und 50 Stunden.");
      box.querySelectorAll(".w-due").forEach((el,i)=>{ const g = groups[i]; el.textContent = bhN==null?"":`nächste bei ${(Math.floor(bhN/g.h)*g.h+g.h).toLocaleString("de-DE")} Bh`; });
      updateCount(); }
    if(e.target.id==="wnote"){ const run = LS.get(K_RUN,null); if(run){ run.note = e.target.value; LS.set(K_RUN, run); } }
  });
  box.addEventListener("change", e => {
    const cb = e.target.closest("[data-run]"); if(!cb) return;
    const run = LS.get(K_RUN,null); if(!run) return;
    const it = run.items.find(i=>i.k===cb.dataset.run); it.done = cb.checked; it.doneAt = cb.checked ? new Date().toISOString() : null;
    LS.set(K_RUN, run);
    const li = cb.closest("li"); li.classList.toggle("is-done", cb.checked);
    const t = li.querySelector(".w-t small"); if(t) t.remove(); if(cb.checked) li.querySelector(".w-t").insertAdjacentHTML("beforeend", `<small>erledigt ${fmtDT(it.doneAt)}</small>`);
    const done = run.items.filter(i=>i.done).length, all = run.items.length;
    box.querySelector(".w-prog span").style.width = Math.round(done/all*100)+"%"; box.querySelector(".w-prog b").textContent = `${done} / ${all}`;
    box.querySelector(".w-prog").setAttribute("aria-valuenow", done);
    box.querySelector("#wfinish").textContent = done===all ? "Wartung abschließen" : `Abschließen (${all-done} offen)`;
    if(navigator.vibrate) try{ navigator.vibrate(10); }catch(_){}
  });
  box.addEventListener("click", e => {
    const sm = e.target.closest("[data-schmier]"); if(sm){ e.preventDefault(); window.showSchmierstelle(sm.dataset.schmier); return; }
    const ib = e.target.closest("[data-int]"); if(ib){ box.querySelectorAll("[data-int]").forEach(b=>b.setAttribute("aria-checked", String(b===ib))); updateCount(); return; }
    if(e.target.closest("#wgo")){ const iv = selInt(); const bhN = num(LS.get(K_BH,""));
      const items = []; for(const g of groups) if(g.h<=iv) g.items.forEach((it,i)=>items.push({k:g.h+":"+i, g:g.h, text:it.text, nr:it.nr, done:false, doneAt:null}));
      LS.set(K_RUN, {start:new Date().toISOString(), bh:bhN, interval:iv, items, note:""}); render(); box.scrollIntoView({block:"start"}); return; }
    const conf = box.querySelector("#wconfirm");
    if(e.target.closest("#wfinish")){ const run = LS.get(K_RUN,null); const open = run.items.filter(i=>!i.done).length;
      if(open && conf.hidden){ conf.hidden = false; conf.innerHTML = `<p>Es sind noch <b>${open}</b> Arbeiten offen. Trotzdem abschließen? Die offenen Punkte werden im Verlauf als nicht erledigt vermerkt.</p><div class="row"><button class="btn" id="wfinish2">Ja, abschließen</button><button class="btn ghost" id="wback">Weiter abhaken</button></div>`; return; }
      finish(); return; }
    if(e.target.closest("#wfinish2")){ finish(); return; }
    if(e.target.closest("#wback")){ conf.hidden = true; return; }
    if(e.target.closest("#wcancel")){ conf.hidden = false; conf.innerHTML = `<p>Laufende Wartung verwerfen? Alle Häkchen gehen verloren.</p><div class="row"><button class="btn" id="wcancel2">Ja, verwerfen</button><button class="btn ghost" id="wback">Abbrechen</button></div>`; return; }
    if(e.target.closest("#wcancel2")){ LS.del(K_RUN); render(); return; }
    const cp = e.target.closest("[data-copy]"); if(cp){ const ent = LS.get(K_HIST,[])[+cp.dataset.copy];
      const txt = `IHC McCormick 323 – ${ent.interval}-Stunden-Wartung\nDatum: ${fmtD(ent.end)}${ent.bh!=null?`\nBetriebsstunden: ${ent.bh}`:""}\n\n${ent.items.map(x=>`${x.done?"[x]":"[ ]"} ${plain(x.text)}`).join("\n")}${ent.note?`\n\nNotizen: ${ent.note}`:""}`;
      const ok = () => { cp.textContent = "Kopiert"; setTimeout(()=>cp.textContent="Als Text kopieren", 1600); };
      if(navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, ()=>prompt_fallback(txt)); else prompt_fallback(txt); return; }
    const dl = e.target.closest("[data-delh]"); if(dl){ if(dl.dataset.sure){ const hst = LS.get(K_HIST,[]); hst.splice(+dl.dataset.delh,1); LS.set(K_HIST,hst); render(); } else { dl.dataset.sure = "1"; dl.textContent = "Wirklich löschen?"; } return; }
    const ch = e.target.closest("[data-erl]"); if(ch){ box.querySelectorAll("[data-erl]").forEach(b=>b.setAttribute("aria-pressed", String(b===ch)));
      box.querySelectorAll("#werl tbody tr").forEach(tr=>tr.hidden = ch.dataset.erl!=="alle" && !tr.dataset.ints.split(" ").includes(ch.dataset.erl)); return; }
    const fb = e.target.closest(".fig-btn"); if(fb) openLightbox(fb.dataset.src, "Schmierplan");
  });
  function prompt_fallback(txt){ const ta = document.createElement("textarea"); ta.value = txt; ta.className = "w-copyfb"; box.querySelector(".w-hist").append(ta); ta.focus(); ta.select(); }
  function finish(){ const run = LS.get(K_RUN,null); if(!run) return; run.end = new Date().toISOString(); const hst = LS.get(K_HIST,[]); hst.push(run); LS.set(K_HIST,hst); LS.del(K_RUN); render(); const hb = box.querySelector(".w-hist"); if(hb) hb.scrollIntoView({block:"start"}); }
  render();
}
function findTable(pid, re){ const p = byId[pid]; if(!p) return null; return p.blocks.find(b=>b.t==="table" && re.test((b.caption||"")+" "+(b.head||[]).join(" "))); }

/* ---------- Start ---------- */
build(); observe(); buildWartung();
let m0 = "text"; try{ m0 = localStorage.getItem("ihc323-bamode") || "text"; }catch(e){}
setMode(m0);
})();
