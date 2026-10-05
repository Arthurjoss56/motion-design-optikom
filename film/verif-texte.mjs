// Contrôle automatique du texte intégré à l'animation (règles du brief) :
//  - chaque phrase lisible EN ENTIER au moins 1,5 s (tous les mots posés : opaques, nets, à leur place) ;
//  - jamais deux phrases à l'écran en même temps ;
//  - le texte affiché est exactement celui du script (vérifié par la scène au chargement) ;
//  - les mouvements de caméra s'enchaînent sans se chevaucher (pas d'à-coup au rendu).
// Usage : node verif-texte.mjs   (code de sortie 1 si une règle n'est pas tenue)
import { chromium } from '/home/user/optikom-site/node_modules/playwright/index.mjs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const DIR = dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const srv = createServer(async (req, res) => { const p = join(DIR, decodeURIComponent(req.url.split('?')[0])); let b; try { b = await readFile(p); } catch { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); });
await new Promise((r) => srv.listen(0, r));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: .25 })).newPage();
const erreurs = [];
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) erreurs.push(m.text()); });
await page.goto(`http://localhost:${srv.address().port}/index.html`);
await page.evaluate(() => window.__pret);
const res = await page.evaluate(() => {
  const L = window.DATA.lignes, ids = Object.keys(L), pas = 1 / 60;
  const phrases = [...document.querySelectorAll('.phrase')];
  const parId = {}; phrases.forEach((el) => { parId[el.dataset.id] = el; });
  const etat = (el) => {
    const mis = [...el.querySelectorAll('.mi')], chs = [...el.querySelectorAll('.ch')], grp = el.querySelector('.grp');
    const flou = (e) => { const f = getComputedStyle(e).filter; const m = /blur\(([\d.]+)px\)/.exec(f); return m ? +m[1] : 0; };
    const vis = mis.some((m) => +getComputedStyle(m).opacity > .05 && getComputedStyle(m).visibility !== 'hidden' && (!grp || !grp.contains(m) || +getComputedStyle(grp).opacity > .05));
    const pose = mis.every((m) => +getComputedStyle(m).opacity > .9 && getComputedStyle(m).visibility !== 'hidden' && flou(m) <= 1 && Math.abs(gsap.getProperty(m, 'yPercent')) <= 8)
      && chs.every((c) => +getComputedStyle(c).opacity > .9)
      && (!grp || (+getComputedStyle(grp).opacity > .9 && Math.abs(gsap.getProperty(grp, 'scale') - 1) < .03 && flou(grp) <= 1));
    return { vis, pose };
  };
  const out = {};
  for (const id of ids) out[id] = { t0: L[id].t0, t1: L[id].t1, lisible: 0, debut: null, fin: null, phrase: !!parId[id] };
  const chevauchements = [];
  for (let t = 0; t <= window.__duree; t += pas) {
    window.__seek(t);
    const visibles = [];
    for (const id of ids) {
      const el = parId[id]; if (!el) continue;
      const e = etat(el);
      if (e.vis) visibles.push(id);
      const o = out[id];
      if (e.pose) { if (o.cur == null) o.cur = t; } else if (o.cur != null) { const d = t - o.cur; if (d > o.lisible) { o.lisible = d; o.debut = o.cur; o.fin = t; } o.cur = null; }
    }
    if (visibles.length > 1) chevauchements.push([+t.toFixed(3), visibles.join('+')]);
  }
  const cams = window.__cameras(), camChev = [];
  for (let i = 1; i < cams.length; i++) if (cams[i][0] < cams[i - 1][1] - 1e-3) camChev.push([+cams[i - 1][0].toFixed(2), +cams[i - 1][1].toFixed(2), +cams[i][0].toFixed(2)]);
  return { out, chevauchements, n: phrases.length, ids: ids.length, camChev, nCam: cams.length };
});
let ok = true;
console.log(`${res.n} phrases en texte cinétique pour ${res.ids} lignes de script`);
for (const [id, o] of Object.entries(res.out)) {
  if (!o.phrase) { console.log(`· ${id.padEnd(3)} texte porté par l'interface (carte, boutons ou barre d'adresse) — contrôlé à l'image`); continue; }
  const bon = o.lisible >= 1.5;
  if (!bon) ok = false;
  console.log(`${bon ? '✓' : '✗'} ${id.padEnd(3)} lisible en entier ${o.lisible.toFixed(2)} s  (${o.debut?.toFixed(2)} → ${o.fin?.toFixed(2)} ; voix ${o.t0.toFixed(2)} → ${o.t1.toFixed(2)})`);
}
if (res.chevauchements.length) { ok = false; const g = {}; res.chevauchements.forEach(([t, v]) => { (g[v] ||= []).push(t); }); for (const [v, ts] of Object.entries(g)) console.log(`✗ deux phrases à l'écran : ${v} de ${ts[0]} à ${ts[ts.length - 1]} s`); }
else console.log('✓ jamais deux phrases à l\'écran en même temps');
if (res.camChev.length) { ok = false; res.camChev.forEach(([a, b, c]) => console.log(`✗ caméra : le mouvement ${a}→${b} s chevauche le suivant (départ ${c} s)`)); }
else console.log(`✓ ${res.nCam} mouvements de caméra, jamais deux à la fois`);
if (erreurs.length) { ok = false; erreurs.forEach((e) => console.log('✗ console :', e)); } else console.log('✓ texte affiché = texte du script');
await browser.close(); srv.close();
process.exit(ok ? 0 : 1);
