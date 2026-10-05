/* Film Optikom — v6. Une seule caméra, texte intégré à l'animation, curseurs numériques.
   La timeline est accrochée aux phrases du script (script/lignes.json → film/data.js) :
   T('p1') = début de la phrase p1, F('p1') = fin. Si le script change, l'image suit.
   window.__seek(t) positionne tout le film au temps t (secondes). */
(() => {
const D = window.DATA;
const L = D.lignes;
const W = document.getElementById('world');
const FG = document.getElementById('fg');
const DUREE = D.duree;
const T = (id, d = 0) => L[id].t0 + d;
const F = (id, d = 0) => L[id].t1 + d;

/* ---------- utilitaires ---------- */
const mk = (html, parent = W) => { const t = document.createElement('template'); t.innerHTML = html.trim(); const el = t.content.firstElementChild; parent.appendChild(el); return el; };
const q = (sel, root) => root.querySelector(sel);
const qa = (sel, root) => [...root.querySelectorAll(sel)];
const rect = (el, r) => { Object.assign(el.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' }); return el; };
const box = (el, cx, cy, w, h) => rect(el, { x: cx - w / 2, y: cy - h / 2, w, h });
const at = (el, x, y) => { el.style.left = x + 'px'; el.style.top = y + 'px'; return el; };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const easeIO = (k) => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const rnd = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
const SYNC = []; // fonctions appelées à chaque image (valeurs dérivées du temps)

const I = {
  loupe: '<svg viewBox="0 0 24 24" fill="none" stroke="#56667e" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  croix: (c = '#d92d20') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  coche: (c = '#fff', w = 2.6) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>`,
  mail: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>`,
  cadenas: (c = '#084eff') => `<svg class="cadenas" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`,
  tel: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>`,
  route: (c = '#084eff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 21 12 12 21 3 12z"/><path d="M10 14v-2.5a1.5 1.5 0 0 1 1.5-1.5H15m-2-2 2 2-2 2"/></svg>`,
  web: (c = '#084eff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>`,
  partage: (c = '#084eff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/></svg>`,
  goutte: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>`,
  cle: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6.5a4 4 0 0 0 5 5l-9 9a2.1 2.1 0 0 1-3-3l9-9a4 4 0 0 0-2-2z"/><path d="M14.5 6.5 17 4l3 3-2.5 2.5"/></svg>`,
  bain: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z"/><path d="M6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/></svg>`,
  flamme: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 2 1.5 3 2.5 3 0-3-1-5 0-8z"/></svg>`,
  doc: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>`,
  titre: (c = '#084eff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"><path d="M5 6h14M12 6v13"/></svg>`,
  image: (c = '#084eff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>`,
  pointeur: (c = '#0e2340') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linejoin="round"><path d="M6 3v15l4-4 3 6 2.5-1.2-3-6H18z"/></svg>`,
  cadre: (c = '#0e2340') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round"><path d="M7 3v18M17 3v18M3 7h18M3 17h18"/></svg>`,
  texte: (c = '#0e2340') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round"><path d="M5 6V4h14v2M12 4v16M9 20h6"/></svg>`,
  lecture: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="${c}"><path d="M8 5.5v13l11-6.5z"/></svg>`,
  calendrier: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17M8.5 15l2.2 2 4.3-4"/></svg>`,
  jauge: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round"><path d="M4 16a8 8 0 1 1 16 0"/><path d="m12 16 4-5"/><circle cx="12" cy="16" r="1.4" fill="${c}"/></svg>`,
  personne: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
  bouclier: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4.5 6v6c0 4.5 3.2 8 7.5 9 4.3-1 7.5-4.5 7.5-9V6z"/><path d="m8.5 12 2.4 2.4L15.5 10"/></svg>`,
  epingle: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`,
  fleche: '<svg class="fleche" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
  vise: (c = '#fff') => `<svg viewBox="0 0 100 100" fill="none" stroke="${c}" stroke-linecap="round"><circle cx="50" cy="50" r="46" stroke-width="1.5" opacity=".55"/><circle cx="50" cy="50" r="34" stroke-width="1.5" opacity=".8"/><circle cx="50" cy="50" r="18" stroke-width="2"/><path d="M50 0v22M50 78v22M0 50h22M78 50h22" stroke-width="1.6"/></svg>`,
};
const petit = (svg, px, style = '') => svg.replace('<svg', `<svg width="${px}" height="${px}" ${style ? `style="${style}"` : ''}`);

/* ---------- timeline, caméra, repères sonores ---------- */
const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
const set0 = (el, vars) => gsap.set(el, vars);
const show = (el, t, o = {}) => tl.fromTo(el, { autoAlpha: 0, y: o.y ?? 26, x: o.x ?? 0, scale: o.s ?? 1, filter: `blur(${o.b ?? 12}px)` },
  { autoAlpha: 1, y: 0, x: 0, scale: 1, filter: 'blur(0px)', duration: o.d ?? .9, ease: o.e ?? 'expo.out', immediateRender: o.ir ?? true }, t);
const hide = (el, t, o = {}) => tl.to(el, { autoAlpha: 0, y: o.y ?? -14, x: o.x ?? 0, scale: o.s ?? 1, filter: `blur(${o.b ?? 10}px)`, duration: o.d ?? .45, ease: o.e ?? 'power2.in' }, t);
const to = (el, t, vars, d = .8, e = 'expo.out') => tl.to(el, { ...vars, duration: d, ease: e }, t);

const cam = { x: 0, y: -170, s: 1.12, r: 0, rx: 0, ry: 0 };
const camTo = (t, d, v, e = 'power2.inOut') => tl.to(cam, { ...v, duration: d, ease: e }, t);
const P = {};
const CUES = [];
const cue = (type, t, v = 1) => CUES.push({ type, t: Math.round(t * 1000) / 1000, v });

/* ---------- décor ---------- */
mk('<div id="grille"></div>');
mk('<div id="reperes"></div>');
[[0, 0, 1900], [2380, 0, 2100], [4600, 60, 2400], [4450, 1960, 2100], [4450, 3050, 1800], [4450, 4110, 2100]]
  .forEach(([x, y, r], i) => box(mk(`<div class="halo ${i % 2 ? '' : 'halo-fort'}"></div>`), x + (i % 2 ? 300 : -250), y - 120, r, r * .8));

/* =====================================================================
   TEXTE CINÉTIQUE — les phrases du script vivent dans l'animation
   Balises : [[accent surligné]]  {{rouge}}  ((doux))  <<daté>>  %%lent%%
   ===================================================================== */
const typo = (s) => s.replace(/ ([?!:;])/g, ' $1').replace(/(\d) (\d{3})/g, '$1 $2').replace(/ (€|h\b)/g, ' $1');
function decoupe(m) {
  const re = /\[\[(.+?)\]\]|\{\{(.+?)\}\}|\(\((.+?)\)\)|<<(.+?)>>|%%(.+?)%%|\{#(.+?)#\}/g; const segs = []; let i = 0, x;
  while ((x = re.exec(m))) {
    if (x.index > i) segs.push({ cls: '', txt: m.slice(i, x.index) });
    segs.push({ cls: x[1] ? 'acc' : x[2] ? 'rouge' : x[3] ? 'doux' : x[4] ? 'vieux rouge' : x[5] ? 'lent rouge' : 'grp', txt: x[1] || x[2] || x[3] || x[4] || x[5] || x[6] });
    i = re.lastIndex;
  }
  if (i < m.length) segs.push({ cls: '', txt: m.slice(i) });
  return segs;
}
const motHTML = (w, cls) => `<span class="mw"><span class="mot"><span class="mi ${cls}">${cls.includes('lent') ? [...w].map((c) => `<span class="ch">${c}</span>`).join('') : w}</span></span></span>`;
const rendre = (m) => decoupe(typo(m)).map(({ cls, txt }) => {
  const html = txt.split(/( )/).map((p) => p === ' ' ? ' ' : p ? motHTML(p, cls) : '').join('');
  return cls === 'acc' ? `<span class="seg-acc"><i class="surligne"></i>${html}</span>` : cls === 'grp' ? `<span class="grp">${html}</span>` : html;
}).join('');
const PHRASES = [];
function phrase(id, x, y, markup, o = {}) {
  const el = mk(`<div class="phrase ${o.blanc ? 'blanc' : ''}" data-id="${id}" style="font-size:${o.taille || 80}px"></div>`);
  el.innerHTML = rendre(markup);
  const plain = el.textContent.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (plain !== L[id].texte) console.error(`TEXTE ≠ SCRIPT [${id}] « ${plain} » / « ${L[id].texte} »`);
  at(el, x, y); set0(el, { xPercent: o.align === 'g' ? 0 : -50, yPercent: -50 });
  const tous = qa('.mi', el), surl = qa('.surligne', el), t0 = T(id, o.decal || 0);
  const mis = tous.filter((m) => !m.closest('.grp')); // les mots d'un groupe {#…#} entrent autrement (voir s1)
  set0(tous, { autoAlpha: 0 }); if (surl.length) set0(surl, { scaleX: 0 });
  const e = o.entree || 'mots';
  if (e === 'mots') tl.fromTo(mis, { autoAlpha: 0, yPercent: 105, filter: 'blur(8px)' }, { autoAlpha: 1, yPercent: 0, filter: 'blur(0px)', duration: .5, stagger: .03, ease: 'expo.out', immediateRender: false }, t0);
  else if (e === 'flou') tl.fromTo(mis, { autoAlpha: 0, filter: 'blur(22px)', scale: 1.1 }, { autoAlpha: 1, filter: 'blur(0px)', scale: 1, duration: .55, stagger: .05, ease: 'power2.out', immediateRender: false }, t0);
  else if (e === 'boites') {
    qa('.mw', el).forEach((w) => w.insertAdjacentHTML('beforeend', '<i class="boite"></i>'));
    const bx = qa('.boite', el); set0(bx, { scaleX: 0 });
    tl.to(bx, { scaleX: 1, duration: .26, stagger: .05, ease: 'power3.out' }, t0);
    tl.fromTo(mis, { autoAlpha: 0, yPercent: 50 }, { autoAlpha: 1, yPercent: 0, duration: .4, stagger: .05, ease: 'expo.out', immediateRender: false }, t0 + .1);
    tl.to(bx, { autoAlpha: 0, duration: .3, stagger: .04 }, t0 + .85);
  }
  if (surl.length) tl.to(surl, { scaleX: 1, duration: .45, ease: 'power3.inOut' }, t0 + (o.surl ?? .3));
  let nLent = 0; const pas = o.lent ?? .045;
  qa('.lent', el).forEach((w) => { const ch = qa('.ch', w); set0(ch, { opacity: 0 }); tl.to(ch, { opacity: 1, duration: .01, stagger: pas, ease: 'none' }, t0 + (o.decalLent ?? .35) + nLent * pas); nLent += ch.length + 1; });
  if (o.sortie !== false) {
    // sortie : commence à la fin de la phrase, terminée avant l'entrée de la suivante (écart 0,25 s)
    tl.to(tous, { autoAlpha: 0, yPercent: -45, filter: 'blur(8px)', duration: .2, stagger: .006, ease: 'power2.in' }, F(id, -.02));
    if (surl.length) tl.to(surl, { opacity: 0, duration: .18 }, F(id, -.02));
  }
  PHRASES.push({ el, o });
  return el;
}
/* texte tapé (mono) : balises colorées */
function tapeHTML(s) {
  const esc = (c) => c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c;
  let out = '', dans = false;
  for (const c of s) { if (c === '<') { dans = true; out += '<span class="tg">&lt;'; continue; } if (c === '>' && dans) { dans = false; out += '&gt;</span>'; continue; } out += esc(c); }
  return out + (dans ? '</span>' : '');
}

/* =====================================================================
   CURSEURS NUMÉRIQUES (étiquetés, avec clic)
   ===================================================================== */
const CURSEURS = [];
function curseur(nom, couleur, clair = false) { // clair : flèche blanche cernée de bleu nuit (lisible sur fond sombre)
  const el = mk(`<div class="curseur" style="--c:${couleur}"><div class="cz"><svg viewBox="0 0 24 24"><path d="M4 2.5 L4 20.5 L8.7 16.1 L12.2 23.3 L15.6 21.7 L12.2 14.6 L19 14.6 Z" fill="${clair ? '#fff' : couleur}" stroke="${clair ? '#0e2340' : '#fff'}" stroke-width="1.7" stroke-linejoin="round"/></svg><i class="onde-clic"></i><span class="etiq">${nom}</span></div></div>`);
  const c = { el, x: 0, y: 0, svg: q('svg', el), onde: q('.onde-clic', el), cz: q('.cz', el) };
  set0(el, { autoAlpha: 0 });
  c.pose = (t, x, y) => tl.set(c, { x, y }, t);
  c.va = (t, x, y, d = .65, e = 'power3.inOut') => tl.to(c, { x, y, duration: d, ease: e }, t);
  c.montre = (t, x, y) => { if (x !== undefined) c.pose(t, x, y); tl.fromTo(el, { autoAlpha: 0, scale: .5 }, { autoAlpha: 1, scale: 1, duration: .35, ease: 'back.out(2)', immediateRender: false }, t); };
  c.cache = (t) => tl.to(el, { autoAlpha: 0, scale: .6, duration: .28, ease: 'power2.in' }, t);
  c.appuie = (t) => tl.to(c.svg, { scale: .78, duration: .07, ease: 'power2.in' }, t);
  c.relache = (t) => tl.to(c.svg, { scale: 1, duration: .22, ease: 'back.out(3)' }, t);
  c.clic = (t, son = true) => { c.appuie(t); c.relache(t + .07);
    tl.fromTo(c.onde, { scale: .2, opacity: .95 }, { scale: 1.5, opacity: 0, duration: .55, ease: 'expo.out', immediateRender: false }, t + .04);
    if (son) cue('clic', t); };
  CURSEURS.push(c);
  return c;
}
const curClient = curseur('Votre client', '#0f9d6e');
const curOptikom = curseur('Optikom', '#084eff');
const curVous = curseur('Vous', '#0e2340');

function selection(r, t, d = .6, dim = '') {
  const s = rect(mk(`<div class="selection"><i></i><i></i><i></i><i></i>${dim ? `<span class="dim">${dim}</span>` : ''}</div>`), r);
  set0(s, { autoAlpha: 0 });
  tl.fromTo(s, { autoAlpha: 0, scale: 1.05 }, { autoAlpha: 1, scale: 1, duration: .18, ease: 'power2.out', immediateRender: false }, t);
  tl.to(s, { autoAlpha: 0, duration: .22 }, t + d);
  return s;
}
function touche(x, y, label, t, tAppui) {
  const k = mk(`<div class="touche">${label}</div>`); at(k, x, y); set0(k, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
  tl.fromTo(k, { autoAlpha: 0, scale: .6, y: 10 }, { autoAlpha: 1, scale: 1, y: 0, duration: Math.min(.3, tAppui - t - .01), ease: 'back.out(2)', immediateRender: false }, t);
  tl.to(k, { y: 4, boxShadow: '0 0px 0 #cfd8e6, 0 2px 6px rgba(14,35,64,.12)', duration: .06, ease: 'power2.in' }, tAppui);
  tl.to(k, { y: 0, boxShadow: '0 4px 0 #cfd8e6, 0 12px 24px -6px rgba(14,35,64,.09)', duration: .18, ease: 'power2.out' }, tAppui + .08);
  tl.to(k, { autoAlpha: 0, scale: .8, duration: .25, ease: 'power2.in' }, tAppui + .32);
  cue('entree', tAppui);
  return k;
}
/* frappe : P[clé] va de 0 à n caractères, un son discret par caractère */
function frappe(cle, texte, t0, cps, vol = .7) {
  P[cle] = 0;
  const d = texte.length / cps;
  tl.to(P, { [cle]: texte.length, duration: d, ease: 'none' }, t0);
  for (let i = 0; i < texte.length; i++) if (texte[i] !== ' ') cue('frappe', t0 + (i + .5) / cps, vol);
  return t0 + d;
}

/* =====================================================================
   ACTE 1 — LE PROBLÈME
   ===================================================================== */
const RECH = { x: -560, y: -270, w: 1120, h: 600 };
const rech = rect(mk(`<div class="carte recherche" style="padding:30px 40px;overflow:visible">
  <div class="barre-recherche">${I.loupe}<span class="tape"></span><span class="curseur-texte"></span></div></div>`), RECH);
const barre = q('.barre-recherche', rech), tapeEl = q('.tape', rech), caretR = q('.curseur-texte', rech);
const illuR = mk('<span class="pastille-illu">Illustration</span>'); at(illuR, RECH.x + RECH.w - 120, RECH.y - 40); set0(illuR, { autoAlpha: 0 });
const RES = [
  ['A', 'concurrent-a.fr › plombier-vannes', 'Plombier à Vannes – Dépannage 7j/7', 'Intervention rapide à Vannes et alentours.'],
  ['B', 'concurrent-b.fr', 'Plomberie Vannes | Salle de bain, chauffe-eau', 'Rénovation et dépannage dans le Golfe du Morbihan.'],
  ['C', 'concurrent-c.fr', 'Plombier chauffagiste – Vannes, Séné, Arradon', 'Votre plombier de proximité.'],
];
const resEl = (r, cls = '') => mk(`<div class="res6 ${cls}"><div class="u"><span class="fav">${r[0]}</span>${r[1]}</div><div class="ti">${r[2]}</div><div class="de">${r[3]}</div>${cls ? '' : '<span class="tag">Concurrent</span>'}</div>`, rech);
const RT = (i) => 136 + i * 112;
const R = RES.map((r) => resEl(r));
R.forEach((r, i) => set0(r, { top: RT(i), autoAlpha: 0 }));
const vous = resEl(['V', 'votre-entreprise.fr', 'Votre entreprise – Plombier à Vannes', 'Dépannage, salle de bain, chauffe-eau. Devis en ligne.'], 'vous');
set0(vous, { top: RT(2), autoAlpha: 0 });
const REQ = 'plombier vannes';
const sugg = mk(`<div class="suggestions">${['', ' urgence', ' avis'].map((s, i) => `<p class="${i ? '' : 'actif'}">${I.loupe}<span data-s="${s}"></span></p>`).join('')}</div>`, rech);
set0(sugg, { autoAlpha: 0 });
const suggSpans = qa('span', sugg);

// emplacement rouge « introuvable » (élément du monde, sous les résultats)
const SLOT = { x: RECH.x + 40, y: RECH.y + 472, w: RECH.w - 80, h: 100 };
const slot = rect(mk(`<div class="emplacement"><span class="croix-rouge" style="width:52px;height:52px">${I.croix()}</span><span class="slot-txt">Votre entreprise ? Introuvable.</span></div>`), SLOT);
set0(slot, { autoAlpha: 0 });

phrase('p1', 0, -392, 'Vos clients vous cherchent [[sur Google.]]', { taille: 84 });
phrase('p2', 0, -392, 'Ils trouvent vos {{concurrents.}}', { taille: 84 });

// clic dans la barre, frappe, suggestions, Entrée, résultats
set0(rech, { height: 136 });
tl.fromTo(rech, { autoAlpha: 1, scale: .975, y: 10 }, { scale: 1, y: 0, duration: 1.4, ease: 'power2.out' }, 0);
show(illuR, 0.25, { y: 8, b: 4, d: .6 });
curClient.montre(.15, 470, 380);
curClient.va(.2, -330, -224, .75);
curClient.clic(1.12);
curClient.va(1.3, 200, -190, .45, 'power2.out');
tl.to(barre, { borderColor: '#084eff', boxShadow: '0 0 0 4px rgba(49,107,255,.15), 0 12px 24px -6px rgba(14,35,64,.09)', duration: .25 }, 1.15);
const finTape = frappe('tape', REQ, 1.22, 13, .8);
tl.fromTo(sugg, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, duration: .3, ease: 'power2.out', immediateRender: false }, 1.5);
touche(RECH.x + RECH.w - 150, RECH.y + 30 + 38, 'Entrée ↵', finTape + .05, finTape + .3);
tl.to(sugg, { autoAlpha: 0, duration: .15 }, finTape + .35);
tl.to(rech, { height: RECH.h, duration: .6, ease: 'expo.out' }, finTape + .36);
R.forEach((r, i) => show(r, finTape + .42 + i * .1, { y: 22, b: 6, d: .6 }));
cue('pop', finTape + .45, .6);
tl.to(barre, { borderColor: '#d6deea', boxShadow: '0 1px 2px rgba(14,35,64,.04), 0 4px 8px rgba(14,35,64,.04), 0 12px 24px -6px rgba(14,35,64,.09)', duration: .4 }, finTape + .4);
// le client survole les concurrents, puis ne trouve pas votre entreprise
const ROWY = (i) => RECH.y + RT(i) + 50;
curClient.va(T('p2', -.1), 120, ROWY(0), .4);
R.forEach((r, i) => {
  const th = T('p2', .25 + i * .4);
  if (i) curClient.va(th - .25, 160 + i * 30, ROWY(i), .3);
  tl.fromTo(r, { backgroundColor: 'rgba(241,244,249,0)' }, { backgroundColor: 'rgba(241,244,249,1)', duration: .15, ease: 'power1.out', immediateRender: false }, th);
  tl.to(r, { backgroundColor: 'rgba(241,244,249,0)', duration: .3, ease: 'power1.inOut' }, th + .32);
});
show(slot, T('p2', 1.1), { y: 16, b: 8, d: .6 });
tl.to(slot, { x: 10, duration: .06, yoyo: true, repeat: 5, ease: 'sine.inOut' }, T('p2', 1.3));
cue('erreur', T('p2', 1.15));
curClient.va(T('p2', 1.2), 90, SLOT.y + 55, .4);
curClient.cache(T('p2', 1.95));

// l'emplacement rouge s'ouvre sur l'ancien site
const OLD = { x: 1630, y: -250, w: 1040, h: 640 };
const pixelURL = (() => { const c = document.createElement('canvas'); c.width = 30; c.height = 23; const g = c.getContext('2d');
  for (let y = 0; y < 23; y++) for (let x = 0; x < 30; x++) { const sky = y < 9, v = rnd();
    g.fillStyle = sky ? `rgb(${120 + v * 40},${150 + v * 40},${190 + v * 30})` : (y < 15 ? `rgb(${150 + v * 50},${120 + v * 40},${90 + v * 30})` : `rgb(${90 + v * 60},${100 + v * 50},${80 + v * 40})`); g.fillRect(x, y, 1, 1); }
  g.fillStyle = '#6b4a3a'; g.fillRect(9, 8, 12, 8); g.fillStyle = '#c0392b'; g.fillRect(8, 5, 14, 4); return c.toDataURL(); })();
const ANC = 1040 / 1180;
const ancienHTML = `<div style="position:absolute;left:0;top:0;width:1180px;height:${(640 - 52) / ANC}px;transform:scale(${ANC});transform-origin:0 0"><div class="ancien">
  <div class="entete"><h1>Bienvenue sur le site de Votre Entreprise !!</h1></div>
  <div class="menu"><span>Accueil</span><span>Qui sommes-nous</span><span>Nos services</span><span>Livre d'or</span><span>Contact</span></div>
  <div class="corps"><img class="pixel" src="${pixelURL}">
    <div class="texte"><div class="defile">★ NOUVEAU ★ Site en construction ★ Revenez bientôt ★</div>
      <p>Notre entreprise familiale vous accueille depuis de nombreuses années. N'hésitez pas à nous contacter par téléphone aux heures d'ouverture du bureau pour toute demande de renseignement, nous vous rappellerons dans les meilleurs délais.</p>
      <p>Retrouvez prochainement nos réalisations dans la rubrique dédiée. Merci de votre visite et à bientôt sur notre site internet. Meilleure résolution : 1024 × 768.</p></div></div>
  <div class="pied"><span>Dernière mise à jour : mars 2012</span><span>Visiteurs : <span class="compteur">000127</span></span></div></div></div>`;
const navOld = (ombre = true) => `<div class="navigateur" ${ombre ? '' : 'style="box-shadow:none"'}><div class="nav-barre"><i></i><i></i><i></i><div class="nav-url">votre-entreprise.free-pages.fr/accueil.htm</div></div><div class="nav-contenu">${ancienHTML}</div></div>`;
const oldB = rect(mk(navOld()), OLD);
const oldNet = rect(mk(navOld(false)), OLD);
const oldBC = q('.nav-contenu', oldB);
set0([oldB, oldNet], { autoAlpha: 0 });

const TEL1 = { cx: 2960, cy: 110, w: 290, h: 580 };
const tel1 = box(mk(`<div class="telephone"><div class="ecran"><span class="encoche"></span><div class="chargement"><div class="roue"></div></div><div class="barre-charge"></div><div class="chrono tnum"><span class="cv">0,0 s</span><small>et toujours rien</small></div></div></div>`), TEL1.cx, TEL1.cy, TEL1.w, TEL1.h);
set0(tel1, { autoAlpha: 0 });
const roue = q('.roue', tel1), chronoV = q('.cv', tel1), barreCharge = q('.barre-charge', tel1);
P.chrono = 0; P.charge = 0;
const wid = box(mk(`<div class="carte widget-boite"><span class="ico">${I.mail('#d92d20')}</span><div><div class="lib">Boîte de réception</div><div class="nb tnum">0 demande</div></div></div>`), 1860, 335, 560, 160);
set0(wid, { autoAlpha: 0 });

const tA = T('p2', 2.05); // départ du panoramique vers l'ancien site
to(slot, tA, { left: OLD.x, top: OLD.y, width: OLD.w, height: OLD.h, borderRadius: 22 }, 1.0, 'power2.inOut');
to(q('.slot-txt', slot), tA, { autoAlpha: 0 }, .2, 'none');
to(q('.croix-rouge', slot), tA, { autoAlpha: 0 }, .2, 'none');
to(rech, tA + .1, { autoAlpha: 0, filter: 'blur(8px)' }, .5, 'power2.in');
to(illuR, tA, { autoAlpha: 0 }, .3, 'none');
// l'ancien site est la fenêtre qui s'ouvre dans le cadre rouge : même rectangle, même courbe
tl.set(oldB, { left: SLOT.x, top: SLOT.y, width: SLOT.w, height: SLOT.h, borderRadius: 18 }, tA);
to(oldB, tA, { left: OLD.x, top: OLD.y, width: OLD.w, height: OLD.h, borderRadius: 22 }, 1.0, 'power2.inOut');
tl.fromTo(oldB, { autoAlpha: 0 }, { autoAlpha: 1, duration: .3, ease: 'power1.inOut', immediateRender: false }, tA + .3);
to(slot, tA + .6, { autoAlpha: 0 }, .1, 'none');
cue('whoosh', tA, 1);

phrase('p3', 2380, -392, 'Votre site ? <<Daté.>> %%Trop lent.%%', { taille: 84, decalLent: .35, lent: .045 });
show(tel1, T('p3', .4), { x: 140, y: 0, b: 10, d: .8 });
tl.to(P, { charge: .34, duration: 1.4, ease: 'power2.out' }, T('p3', .5));
tl.to(P, { chrono: 8.4, duration: 1.35, ease: 'power1.inOut' }, T('p3', .55));
cue('lent', T('p3', .55));
phrase('p4', 2380, -392, 'Résultat : {{zéro demande.}}', { taille: 84 });
show(wid, T('p4', .2), { y: 50, b: 10, d: .7, e: 'back.out(1.4)' });
tl.to(q('.ico', wid), { rotation: -14, duration: .07, yoyo: true, repeat: 5, ease: 'sine.inOut' }, T('p4', .65));
cue('erreur', T('p4', .62), .8);

camTo(.1, 2.5, { x: 0, y: -60, s: 1.04 });
camTo(2.6, 1.0, { y: -25, s: 1.0 });
camTo(3.6, tA - 3.6, { y: -18, s: .99 }, 'sine.inOut');
camTo(tA, 1.0, { x: 2380, y: -20, s: 1.0, ry: -4, r: -.5 });
camTo(tA + 1.0, F('p4') - tA - 1.0, { x: 2392, y: -12, s: 1.015, ry: 0, r: 0 }, 'sine.out');

/* =====================================================================
   ACTE 2 — L'AUDIT
   ===================================================================== */
const loupe = mk(`<div class="loupe"><div class="bord"></div>${I.vise('rgba(8,78,255,.55)')}<div class="reflet"></div></div>`);
P.lx = 2600; P.ly = -700; P.lr = 150; P.flou = 0;
set0(loupe, { autoAlpha: 0 });
const SP = [
  { x: 2150, y: -146, t: 'Absent de Google', tx: 2150, ty: -55 },
  { x: 1790, y: 70, t: '8,4 s d\'attente', tx: 1790, ty: 190 },
  { x: 2400, y: 55, t: 'Illisible sur mobile', tx: 2420, ty: 168 },
  { x: 2150, y: 350, t: 'Aucun bouton devis', tx: 2150, ty: 262 },
];
const tags = SP.map((s, i) => { const e = mk(`<div class="etiquette-audit carte-verre"><span class="num">${i + 1}</span>${s.t}</div>`); at(e, s.tx, s.ty); set0(e, { xPercent: -50, yPercent: -50, autoAlpha: 0 }); return e; });
const tB = F('p4');
hide(tel1, tB - .1, { x: 120, y: 0, d: .45 });
hide(wid, tB - .05, { y: 40, d: .45 });
tl.to(P, { flou: 1, duration: .6, ease: 'power2.inOut' }, tB);
tl.fromTo(loupe, { autoAlpha: 0, scale: 2.4, filter: 'blur(18px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: .9, ease: 'expo.out', immediateRender: false }, tB + .1);
tl.to(P, { lx: SP[0].x, ly: SP[0].y, duration: .8, ease: 'expo.out' }, tB + .1);
cue('scan', tB + .1);
phrase('a1', 2392, -392, 'Notre [[audit gratuit]] montre pourquoi.', { taille: 84, entree: 'flou', surl: .7 });
const tS = (i) => T('a1', .1 + i * .45);
SP.forEach((s, i) => {
  if (i) tl.to(P, { lx: s.x, ly: s.y, duration: .38, ease: 'power3.inOut' }, tS(i) - .32);
  show(tags[i], tS(i) + .05, { y: 12, s: .8, b: 6, d: .55, e: 'back.out(1.8)' });
  cue('pin', tS(i) + .05, .8);
});
// rapport d'audit
const REP = { cx: 2985, cy: 70, w: 440, h: 600 };
const rap = box(mk(`<div class="carte rapport" style="padding:28px">
  <div class="entete-r"><span class="doc ico-bleu">${I.doc()}</span><div style="position:relative;height:56px;flex:1"><div class="h-rap" style="position:absolute;inset:0"><h3>Rapport d'audit</h3><div class="sous">votre-entreprise.free-pages.fr</div></div>
    <div class="h-calq" style="position:absolute;inset:0"><h3>Calques</h3><div class="sous">Maquette · Accueil</div></div></div></div>
  <div class="score">4 points font fuir vos clients</div>
  ${SP.map((s, i) => `<div class="ligne-r" style="height:70px;margin-top:10px"><span class="etat"><span class="num">${i + 1}</span></span><span class="txt"><span class="avant" style="color:var(--rouge);font-size:20px">${s.t}</span><span class="apres" style="font-size:20px"></span></span></div>`).join('')}
  <span class="pastille-illu" style="right:20px;bottom:18px">Illustration</span>
</div>`), REP.cx, REP.cy, REP.w, REP.h);
set0(rap, { autoAlpha: 0, zIndex: 12 });
const lignes = qa('.ligne-r', rap);
set0(q('.h-calq', rap), { autoAlpha: 0 });
lignes.forEach((l) => set0(l, { autoAlpha: 0 }));
show(rap, tS(3) + .1, { x: 100, y: 0, b: 12, d: .8 });
const ROWR = (i) => REP.cy - REP.h / 2 + 28 + 56 + 46 + i * 80 + 35;
tags.forEach((g, i) => {
  const t0 = tS(3) + .45 + i * .08;
  tl.to(g, { left: REP.cx - 10, top: ROWR(i), scale: .85, duration: .5, ease: 'power3.inOut' }, t0);
  tl.to(g, { autoAlpha: 0, duration: .15, ease: 'none' }, t0 + .45);
  tl.to(lignes[i], { autoAlpha: 1, duration: .2, ease: 'none' }, t0 + .42);
});
to(loupe, tS(3) + .5, { autoAlpha: 0, scale: 1.45, filter: 'blur(10px)' }, .4, 'power2.in');
cue('whoosh', tS(3) + .45, .5);
// l'ancien site est aspiré dans le rapport
tl.to(oldB, { x: (REP.cx - REP.w / 2 + 55) - (OLD.x + OLD.w / 2), y: (REP.cy - REP.h / 2 + 55) - (OLD.y + OLD.h / 2), scale: .03, duration: .6, ease: 'power3.in' }, F('a1', -.75));
tl.to(oldB, { autoAlpha: 0, duration: .12, ease: 'none' }, F('a1', -.2));
tl.to(q('.doc', rap), { scale: 1.25, duration: .14, ease: 'power2.out' }, F('a1', -.17)); tl.to(q('.doc', rap), { scale: 1, duration: .4, ease: 'back.out(3)' }, F('a1', -.03));
cue('aspire', F('a1', -.75));
camTo(tB, .7, { x: 2360, y: -10, s: 1.04 });
camTo(tS(3), .9, { x: 2440, y: -10, s: 1.0 });

/* =====================================================================
   ACTE 3 — LA MAQUETTE (éditeur, calques, curseurs)
   ===================================================================== */
const EDIT = { x: 3680, y: -250, w: 1840, h: 700 };
const PANEL = { x: 3692, y: -190, w: 336, h: 628 };
const DF = { x: 4100, y: -150, w: 980, h: 550 };
const MF = { x: 5140, y: -150, w: 280, h: 560 };
const edit = rect(mk(`<div class="editeur"><div class="ed-barre"><i></i><i></i><i></i>
  <span class="ed-outils"><span class="actif">${I.pointeur()}</span><span>${I.cadre()}</span><span>${I.texte()}</span><span>${I.image('#0e2340')}</span></span>
  <span class="ed-titre">Maquette · votre-entreprise.fr</span>
  <span class="ed-avatars"><b style="background:#084eff">O</b><b style="background:#0e2340">V</b></span>
  <span class="btn btn-primaire ed-valider"><span class="v1">Valider la maquette</span><span class="v2" style="display:none;align-items:center;gap:8px">${petit(I.coche('#fff', 3), 18)} Validée</span></span>
</div><div class="ed-canevas"></div></div>`), EDIT);
set0(edit, { autoAlpha: 0, zIndex: 2 });
const edValider = q('.ed-valider', edit);
const cadreLib = (r, nom, dim) => { const e = mk(`<div class="cadre-lib">${nom}<span class="dim">${dim}</span></div>`); at(e, r.x, r.y - 30); set0(e, { autoAlpha: 0, zIndex: 3 }); return e; };
const libDF = cadreLib(DF, 'Accueil — Ordinateur', '980 × 550');
const libMF = cadreLib(MF, 'Mobile', '280 × 560');
const df = rect(mk('<div class="cadre"><div class="wire"></div><div class="site-l"></div></div>'), DF);
const mf = rect(mk('<div class="cadre mob"><div class="wire-m"></div><div class="mobile-l"></div></div>'), MF);
set0([df, mf], { autoAlpha: 0, zIndex: 3 });
const wire = q('.wire', df), wm = q('.wire-m', mf);
const bloc = (cls, x, y, w, h, parent, html = '') => rect(mk(`<div class="bloc ${cls}">${html}</div>`, parent), { x, y, w, h });
const WB = {
  nav: [bloc('ink', 34, 17, 28, 28, wire), bloc('gris', 72, 25, 108, 12, wire), bloc('gris', 530, 27, 58, 8, wire), bloc('gris', 606, 27, 75, 8, wire), bloc('gris', 697, 27, 66, 8, wire), bloc('bleu', 814, 15, 133, 32, wire)],
  titre: [bloc('ink', 34, 108, 390, 40, wire), bloc('ink', 34, 156, 300, 40, wire)],
  lignes: [bloc('gris', 34, 222, 365, 10, wire), bloc('gris', 34, 240, 315, 10, wire)],
  cta: [bloc('bleu', 34, 280, 200, 50, wire, '<span style="position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-size:17px;font-weight:600">Demander un devis</span>'), bloc('blanc', 247, 280, 125, 50, wire)],
  image: [bloc('veil', 498, 90, 448, 315, wire, `<span style="position:absolute;inset:0;display:grid;place-items:center;align-content:center;text-align:center;color:#084eff;font:500 16px/1.6 'DejaVu Sans Mono',monospace">${petit(I.image(), 40)}<br>photo-chantier.webp · 48 Ko</span>`)],
  tuiles: [bloc('blanc', 34, 438, 295, 96, wire), bloc('blanc', 342, 438, 295, 96, wire), bloc('blanc', 650, 438, 296, 96, wire)],
};
const WM = [bloc('ink', 16, 52, 180, 24, wm), bloc('ink', 16, 84, 130, 24, wm), bloc('bleu', 16, 124, 248, 40, wm), bloc('veil', 16, 178, 248, 150, wm), bloc('blanc', 16, 342, 120, 80, wm), bloc('blanc', 144, 342, 120, 80, wm)];
Object.values(WB).flat().forEach((b) => set0(b, { autoAlpha: 0 }));
WM.forEach((b) => set0(b, { autoAlpha: 0 }));
const SOL = ['Visible sur Google', 'Rapide à s\'afficher', 'Lisible sur téléphone', 'Bouton devis visible'];
lignes.forEach((l, i) => { const ap = q('.apres', l); ap.textContent = SOL[i]; ap.style.color = 'var(--accent-strong)'; set0(ap, { autoAlpha: 0, y: 14 }); });
const grp = (bs, base) => { const xs = bs.map((b) => parseFloat(b.style.left)), ys = bs.map((b) => parseFloat(b.style.top));
  const x2 = Math.max(...bs.map((b) => parseFloat(b.style.left) + parseFloat(b.style.width))), y2 = Math.max(...bs.map((b) => parseFloat(b.style.top) + parseFloat(b.style.height)));
  return { x: base.x + Math.min(...xs), y: base.y + Math.min(...ys), w: x2 - Math.min(...xs), h: y2 - Math.min(...ys) }; };
const CIBLES = [{ bs: WB.titre, base: DF }, { bs: WB.image, base: DF }, { bs: WM, base: MF }, { bs: WB.cta, base: DF }].map((c) => ({ ...c, r: grp(c.bs, c.base) }));

const tC = F('a1') - .05; // départ vers l'éditeur
camTo(tC, .95, { x: 4600, y: 60, s: .96, ry: -3, r: -.4 });
camTo(tC + .95, F('m2') - .02 - tC - .95, { x: 4612, y: 66, s: .968, ry: 0, r: 0 }, 'sine.inOut');
cue('whoosh', tC, 1);
// le rapport devient le panneau des calques
to(rap, tC, { left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, borderRadius: 16 }, .95, 'power2.inOut');
to(q('.h-rap', rap), tC + .4, { autoAlpha: 0 }, .25, 'none');
to(q('.h-calq', rap), tC + .55, { autoAlpha: 1 }, .3, 'none');
to(q('.score', rap), tC + .3, { autoAlpha: 0 }, .25, 'none');
to(q('.pastille-illu', rap), tC + .2, { autoAlpha: 0 }, .2, 'none');
tl.fromTo(edit, { autoAlpha: 0, scale: .97, filter: 'blur(10px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: .8, ease: 'expo.out', immediateRender: false }, tC + .3);
show(df, tC + .55, { y: 20, b: 6, d: .7 }); show(mf, tC + .65, { y: 20, b: 6, d: .7 });
show(libDF, tC + .7, { y: 8, b: 4, d: .5 }); show(libMF, tC + .78, { y: 8, b: 4, d: .5 });

phrase('m1', 4612, -352, 'Votre maquette [[corrige chaque point.]]', { taille: 80, entree: 'boites', surl: 1.0 });
// le curseur Optikom pose chaque bloc
curOptikom.montre(T('m1', -.15), 4300, 520);
CIBLES.forEach((c, i) => {
  const t0 = T('m1', .02 + i * .62);
  const ry = ROWR(i) - (REP.cy - REP.h / 2) + PANEL.y + 4;  // ligne du panneau
  const rx = PANEL.x + PANEL.w - 16; // dans la marge droite de la ligne, jamais sur le texte
  curOptikom.va(t0, rx, ry, .24);
  curOptikom.appuie(t0 + .26);
  // la ligne passe du problème à la solution
  const l = lignes[i];
  tl.to(q('.num', l), { backgroundColor: '#084eff', duration: .25 }, t0 + .26);
  tl.to(q('.avant', l), { autoAlpha: 0, y: -14, filter: 'blur(4px)', duration: .2, ease: 'power2.in' }, t0 + .26);
  tl.to(q('.apres', l), { autoAlpha: 1, y: 0, duration: .45, ease: 'expo.out' }, t0 + .34);
  tl.to(l, { backgroundColor: '#dce5fb', duration: .3 }, t0 + .26);
  // bloc fantôme glissé jusqu'à sa place
  const g = mk('<div class="ghost" style="background:rgba(8,78,255,.14);border:2px solid rgba(8,78,255,.6);border-radius:10px"></div>');
  rect(g, { x: rx - 70, y: ry - 22, w: 140, h: 44 }); set0(g, { autoAlpha: 0, zIndex: 32 });
  const tx = c.r.x + c.r.w / 2, ty = c.r.y + c.r.h / 2;
  tl.set(g, { autoAlpha: 1 }, t0 + .28);
  tl.to(g, { left: tx - 70, top: ty - 22, duration: .32, ease: 'power3.inOut' }, t0 + .3);
  curOptikom.va(t0 + .3, tx + 40, ty + 10, .32);
  tl.to(g, { left: c.r.x, top: c.r.y, width: c.r.w, height: c.r.h, duration: .16, ease: 'power2.out' }, t0 + .62);
  tl.to(g, { autoAlpha: 0, duration: .15 }, t0 + .78);
  curOptikom.relache(t0 + .63); cue('clic', t0 + .63, .7);
  c.bs.forEach((b, k) => show(b, t0 + .63 + k * .04, { y: 0, s: .92, b: 3, d: .4 }));
  selection({ x: c.r.x - 4, y: c.r.y - 4, w: c.r.w + 8, h: c.r.h + 8 }, t0 + .63, .5, `${Math.round(c.r.w)} × ${Math.round(c.r.h)}`);
  cue('pop', t0 + .65, .5);
});
[...WB.nav, ...WB.lignes, ...WB.tuiles].forEach((b, k) => show(b, T('m1', -.12) + k * .06, { y: 10, b: 3, d: .5 }));
curOptikom.cache(T('m1', 2.64));
// validation par le client
phrase('m2', 4612, -352, 'Vous validez [[avant qu\'on code.]]', { taille: 80 });
const VALX = EDIT.x + EDIT.w - 105, VALY = EDIT.y + 24;
curVous.montre(T('m2', -.15), 5640, 560);
curVous.va(T('m2', -.1), VALX + 20, VALY + 6, .75);
curVous.clic(T('m2', .7));
tl.to(edValider, { scale: .94, duration: .07, ease: 'power2.in' }, T('m2', .7)); tl.to(edValider, { scale: 1, duration: .3, ease: 'back.out(2.5)' }, T('m2', .77));
tl.set(q('.v1', edValider), { display: 'none' }, T('m2', .78)); tl.set(q('.v2', edValider), { display: 'inline-flex' }, T('m2', .78));
tl.to(edValider, { background: 'linear-gradient(180deg,#0e2340,#0e2340)', duration: .2 }, T('m2', .78));
cue('valide', T('m2', .8));
const bulle = mk(`<div class="commentaire carte-verre"><span class="av">V</span><div><div class="n">Vous · à l'instant</div><div class="m">Parfait, on valide !</div></div></div>`);
at(bulle, 5090, -186); set0(bulle, { autoAlpha: 0 });
tl.fromTo(bulle, { autoAlpha: 0, scale: .7, y: 14, transformOrigin: '100% 0%' }, { autoAlpha: 1, scale: 1, y: 0, duration: .45, ease: 'back.out(1.8)', immediateRender: false }, T('m2', .9));
cue('ding', T('m2', .92), .6);
const badgeOK = mk(`<div class="badge-ok"><b>${I.coche('#fff', 3)}</b>Maquette validée</div>`); at(badgeOK, DF.x + DF.w - 200, DF.y - 46); set0(badgeOK, { autoAlpha: 0 });
show(badgeOK, T('m2', 1.0), { y: 10, s: .8, b: 4, d: .5, e: 'back.out(2)' });
tl.to([df, mf], { borderColor: '#084eff', boxShadow: '0 0 0 3px rgba(8,78,255,.25), 0 12px 24px -6px rgba(14,35,64,.09)', duration: .3 }, T('m2', .95));
curVous.cache(F('m2', -.35));

/* =====================================================================
   ACTE 4 — LE SITE SE CONSTRUIT (code, site réel, téléphone)
   ===================================================================== */
const CODE = { x: 3692, y: -202, w: 368, h: 602 };
const BRW = { x: 4100, y: -202, w: 980, h: 602 };
const brw = rect(mk(`<div class="navigateur"><div class="nav-barre"><i></i><i></i><i></i><div class="nav-url" style="flex-basis:380px"><span class="url-a">maquette</span><span class="url-b" style="display:flex;align-items:center;gap:8px;color:var(--ink);font-weight:500">${I.cadenas()}<span class="url-t"></span></span></div></div></div>`), BRW);
W.insertBefore(brw, df);
set0(brw, { autoAlpha: 0, zIndex: 3 });
set0(q('.url-b', brw), { display: 'none' });
const urlT = q('.url-t', brw);
const tel2 = rect(mk('<div class="telephone" style="padding:0"></div>'), { x: MF.x - 12, y: MF.y - 12, w: MF.w + 24, h: MF.h + 24 });
W.insertBefore(tel2, mf); set0(tel2, { autoAlpha: 0, zIndex: 3 });
const codeEl = rect(mk(`<div class="code"><div class="code-tete"><i></i><i></i><i></i><span class="onglet">index.html</span><span style="margin-left:auto">votre-entreprise.fr</span></div><div class="code-corps"></div>
  <div class="code-statut">✓ Compilé · 0 erreur</div><span class="btn btn-primaire code-pied">${petit(I.lecture(), 18)}Mettre en ligne</span></div>`), CODE);
set0(codeEl, { autoAlpha: 0, zIndex: 14 });
const CODE_L = [
  ['<header>', ''],
  ['  <b>Votre entreprise</b>', ''],
  ['  <a class="btn">Devis</a>', ''],
  ['</header>', 'nav'],
  ['<h1>Plombier à Vannes.</h1>', 'titre'],
  ['<p>Dépannage rapide.</p>', 'chapo'],
  ['<a class="btn">Demander un devis</a>', 'boutons'],
  ['<img src="chantier.webp">', 'panneau'],
  ['<section class="services">', ''],
  ['  <h3>Salle de bain</h3>', ''],
  ['</section>', 'tuiles'],
  ['<!-- pensé mobile -->', 'mobile'],
];
const corps = q('.code-corps', codeEl);
corps.innerHTML = CODE_L.map((_, i) => `<div class="code-ligne"><span class="n">${i + 1}</span><span class="c"></span></div>`).join('');
const codeC = qa('.c', corps);
const colore = (s) => {
  let h = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (/^\s*&lt;!--/.test(h)) return `<span class="tk-com">${h}</span>`;
  h = h.replace(/ ([a-z]+)=("[^"]*"?)/g, ' <span class="tk-att">$1</span>=<span class="tk-val">$2</span>');
  return h.replace(/(&lt;\/?[a-z0-9]+)/g, '<span class="tk-tag">$1</span>').replace(/(&gt;)/g, '<span class="tk-tag">$1</span>');
};
const statut = q('.code-statut', codeEl), piedBtn = q('.code-pied', codeEl);
set0([statut, piedBtn], { autoAlpha: 0 });

const tD = F('m2') - .02;
camTo(tD, .7, { x: 4565, y: 66, s: .97 });
camTo(tD + .7, F('s1') - tD - .7, { x: 4575, y: 62, s: .985 }, 'sine.inOut');
// l'éditeur s'efface : le cadre devient navigateur, le panneau devient éditeur de code, le cadre mobile devient téléphone
to([q('.ed-barre', edit), q('.ed-canevas', edit), libDF, libMF, badgeOK, bulle], tD, { autoAlpha: 0 }, .4, 'power1.inOut');
to(edit, tD + .2, { autoAlpha: 0 }, .3, 'none');
show(brw, tD + .05, { y: 10, b: 4, d: .5 });
tl.to([df, mf], { borderColor: 'rgba(214,222,234,0)', boxShadow: 'none', duration: .3 }, tD);
tl.to(df, { borderRadius: 0, duration: .3 }, tD);
show(tel2, tD + .1, { s: .96, y: 0, b: 4, d: .5 });
to(qa('.entete-r, .ligne-r', rap), tD, { autoAlpha: 0 }, .25, 'none');
to(rap, tD + .05, { left: CODE.x, top: CODE.y, width: CODE.w, height: CODE.h, backgroundColor: '#0e2340', borderColor: '#0e2340', borderRadius: 18 }, .36, 'power2.inOut');
tl.set(codeEl, { autoAlpha: 1 }, tD + .41);
tl.set(rap, { autoAlpha: 0 }, tD + .45);
cue('whoosh', tD, .5);

// le code s'écrit ; chaque ligne terminée fait apparaître le bloc correspondant du vrai site
const siteL = q('.site-l', df);
const illustration = (h) => `<div class="carte-bleue" style="position:absolute;inset:0"></div><div class="trame-bleue"></div>
  <svg viewBox="0 0 540 380" style="position:absolute;inset:0;width:100%;height:100%" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
    <g opacity=".95" stroke-width="5"><path d="M70 300h150a40 40 0 0 0 40-40V170a30 30 0 0 1 30-30h80"/><path d="M370 116v48"/><rect x="350" y="96" width="40" height="22" rx="6"/><path d="M342 140h56"/></g>
    <g opacity=".9" stroke-width="4"><path d="M380 190s28 30 28 50a28 28 0 0 1-56 0c0-20 28-50 28-50z"/></g>
    <g opacity=".35" stroke-width="2"><circle cx="420" cy="250" r="70"/><circle cx="420" cy="250" r="100"/></g></svg>
  <div class="sphere" style="width:${h * .2}px;height:${h * .2}px;left:6%;top:9%"></div>`;
const SC = 980 / 1180;
siteL.innerHTML = `<div style="position:absolute;left:0;top:0;width:1180px;height:${550 / SC}px;transform:scale(${SC});transform-origin:0 0"><div class="site">
  <div class="nav"><span class="marque"><i class="ico-bleu">${I.goutte()}</i>Votre entreprise</span><span class="liens"><span>Services</span><span>Réalisations</span><span>Contact</span></span><span class="btn btn-primaire">Demander un devis</span></div>
  <div class="heros"><h2>Plombier à Vannes. <span class="doux">Dépannage rapide, travail soigné.</span></h2>
    <p class="chapo">Fuite, salle de bain, chauffe-eau : on intervient à Vannes et dans tout le Golfe du Morbihan.</p>
    <div class="boutons"><span class="btn btn-primaire">Demander un devis ${I.fleche}</span><span class="btn btn-verre">${petit(I.tel('#0e2340'), 20)}Appeler</span></div></div>
  <div class="panneau">${illustration(380)}<div class="carte-verre" style="position:absolute;left:24px;bottom:24px;border-radius:16px;padding:14px 18px;font-size:17px;font-weight:600;display:flex;gap:10px;align-items:center"><i class="ico-bleu" style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center">${I.epingle()}</i>Vannes et Golfe du Morbihan</div></div>
  <div class="tuiles"><div class="tuile"><i class="ico-bleu">${I.cle()}</i><b>Dépannage</b></div><div class="tuile"><i class="ico-bleu">${I.bain()}</i><b>Salle de bain</b></div><div class="tuile"><i class="ico-bleu">${I.flamme()}</i><b>Chauffe-eau</b></div></div>
</div></div>`;
const site = q('.site', siteL);
const SB = { nav: q('.nav', site), titre: q('.heros h2', site), chapo: q('.chapo', site), boutons: q('.boutons', site), panneau: q('.panneau', site), tuiles: q('.tuiles', site) };
Object.values(SB).forEach((e) => set0(e, { autoAlpha: 0 }));
const WIRE_DE = { nav: WB.nav, titre: WB.titre, chapo: WB.lignes, boutons: WB.cta, panneau: WB.image, tuiles: WB.tuiles };
// version mobile (téléphone de l'acte 4 et du visiteur)
const mobileHTML = (avecSections) => `<div class="mobile">
  <div class="m-nav"><b><i class="ico-bleu">${I.goutte()}</i>Votre entreprise</b><span></span></div>
  <div class="m-defile">
    <h4>Plombier à Vannes. <span class="doux">Dépannage rapide.</span></h4>
    <span class="btn btn-primaire m-btn">Demander un devis</span>
    <div class="m-panneau">${illustration(180)}</div>
    ${avecSections ? `<div class="m-sec m-real"><h5>Nos réalisations</h5><div class="m-reals">
      ${[I.bain(), I.cle(), I.flamme(), I.goutte()].map((ic, k) => `<div class="${k % 3 ? 'carte-bleue' : ''}" style="${k % 3 ? '' : 'background:linear-gradient(160deg,#dce5fb,#9db8ff)'}"><span style="position:absolute;right:10px;bottom:10px;width:30px;height:30px;opacity:.9">${ic}</span></div>`).join('')}</div></div>
      <div class="m-sec m-hor"><h5>Horaires</h5><div class="m-horaires"><p><span>Lundi – vendredi</span><b>8 h – 19 h</b></p><p><span>Samedi</span><b>9 h – 12 h</b></p></div></div>
      <div class="m-sec m-tel"><span class="btn btn-verre m-appel">${petit(I.tel('#0e2340'), 20)}&nbsp;Appeler</span></div>
      <div class="m-sec m-devis"><h5>Votre demande de devis</h5><div class="m-horaires" style="line-height:1.2">
        <div class="champ-m f1" style="height:40px;border-radius:10px;background:#fff;border:1px solid var(--line);margin-bottom:8px;padding:0 12px;display:flex;align-items:center;font-size:15px"><span class="ph" style="color:#aebbd0">Nom</span><span class="v"></span></div>
        <div class="champ-m f2" style="height:62px;border-radius:10px;background:#fff;border:1px solid var(--line);padding:10px 12px;font-size:15px"><span class="ph" style="color:#aebbd0">Votre projet</span><span class="v"></span></div></div>
        <span class="btn btn-primaire m-btn m-envoi" style="margin:12px 0 0">Envoyer ma demande</span></div>` : ''}
  </div></div>`;
const MSC = 280 / 326;
q('.mobile-l', mf).innerHTML = `<div style="position:absolute;left:0;top:0;width:326px;height:${560 / MSC}px;transform:scale(${MSC});transform-origin:0 0">${mobileHTML(false)}</div>`;
const mob2 = q('.mobile', mf); set0(mob2, { autoAlpha: 0 });

const s1El = phrase('s1', 4575, -300, '{#Votre site se construit.#} [[Rapide, pensé mobile.]]', { taille: 72, decal: 1.19, fit: 1800 });
// préambule tapé en code : <h1>Votre site se construit.</h1>, puis la ligne de code DEVIENT le titre :
// les balises s'effacent, le texte mono glisse et se transforme en titre à sa place exacte (mesurée après chargement des polices)
const H1A = '<h1>', H1T = 'Votre site se construit.', H1B = '</h1>', H1 = H1A + H1T + H1B;
const pc = mk('<div class="phrase-code" style="font-size:54px"><span class="tg pc-a"></span><span class="pc-t" style="display:inline-block"></span><span class="tg pc-b"></span><span class="caret"></span></div>');
const pcA = q('.pc-a', pc), pcT = q('.pc-t', pc), pcB = q('.pc-b', pc), pcC = q('.caret', pc);
at(pc, 4575, -300); set0(pc, { yPercent: -50, autoAlpha: 0 });
tl.set(pc, { autoAlpha: 1 }, T('s1'));
frappe('h1', H1, T('s1', .02), 44, .55);
const tMorph = T('s1', .8);
tl.to(pcA, { autoAlpha: 0, x: -24, filter: 'blur(6px)', duration: .25, ease: 'power2.in' }, tMorph);
tl.to(pcB, { autoAlpha: 0, x: 24, filter: 'blur(6px)', duration: .25, ease: 'power2.in' }, tMorph);
cue('whoosh', tMorph, .35);
SYNC.push((t) => { const n = Math.round(P.h1 || 0);
  const a = H1A.slice(0, clamp(n, 0, 4)), b = H1T.slice(0, clamp(n - 4, 0, H1T.length)), c = H1B.slice(0, clamp(n - 4 - H1T.length, 0, 5));
  if (pcA.textContent !== a) pcA.textContent = a; if (pcT.textContent !== b) pcT.textContent = b; if (pcB.textContent !== c) pcB.textContent = c;
  pcC.style.opacity = t < tMorph ? (Math.floor(t * 3) % 2 ? .25 : 1) : 0; });
function morphH1() { // appelée quand les polices sont prêtes (positions réelles)
  pcA.textContent = H1A; pcT.textContent = H1T; pcB.textContent = H1B;
  const pcW = pc.offsetWidth - pcC.offsetWidth - 2, pcL = 4575 - pcW / 2;
  pc.style.left = pcL + 'px';
  const grp = q('.grp', s1El), sL = 4575 - s1El.offsetWidth / 2;
  const tL0 = pcL + pcT.offsetLeft, tW = pcT.offsetWidth, gL = sL + grp.offsetLeft, gW = grp.offsetWidth;
  const k = gW / tW, dx = gL - tL0;
  pcA.textContent = pcT.textContent = pcB.textContent = '';
  set0(pcT, { transformOrigin: '0% 50%' }); set0(grp, { transformOrigin: '0% 50%' });
  tl.to(pcT, { x: dx, scale: k, duration: .5, ease: 'power3.inOut' }, tMorph);
  tl.to(pcT, { autoAlpha: 0, filter: 'blur(4px)', duration: .16, ease: 'power1.inOut' }, tMorph + .16);
  tl.set(qa('.mi', grp), { autoAlpha: 1 }, tMorph);
  set0(grp, { autoAlpha: 0 });
  tl.fromTo(grp, { x: -dx / k, scale: 1 / k }, { x: 0, scale: 1, duration: .5, ease: 'power3.inOut', immediateRender: false }, tMorph);
  tl.fromTo(grp, { autoAlpha: 0, filter: 'blur(4px)' }, { autoAlpha: 1, filter: 'blur(0px)', duration: .26, ease: 'power1.out', immediateRender: false }, tMorph + .16);
}
// le code de la page
const CODE_TXT = CODE_L.map(([c]) => c);
const totalCode = CODE_TXT.reduce((a, c) => a + c.length, 0);
const tCode0 = tD + .43, tCode1 = F('s1', -1.1);
P.code = 0;
tl.to(P, { code: totalCode, duration: tCode1 - tCode0, ease: 'none' }, tCode0);
let cumul = 0;
CODE_L.forEach(([c, cible], i) => {
  cumul += c.length;
  const tFin = tCode0 + (tCode1 - tCode0) * cumul / totalCode;
  if (i % 2 === 0) cue('frappe', tFin - .05, .35);
  if (cible && SB[cible]) {
    show(SB[cible], tFin, { y: 24, b: 8, d: .6 });
    tl.to(WIRE_DE[cible], { autoAlpha: 0, filter: 'blur(4px)', duration: .3, ease: 'power2.in' }, tFin - .05);
    cue('pop', tFin, .35);
  }
  if (cible === 'mobile') { tl.to(WM, { autoAlpha: 0, duration: .3 }, tFin - .05); show(mob2, tFin, { y: 20, b: 6, d: .6 }); }
});
SYNC.push(() => {
  let reste = Math.round(P.code);
  codeC.forEach((el, i) => { const s = CODE_TXT[i]; const n = clamp(reste, 0, s.length); reste -= s.length;
    const html = colore(s.slice(0, n)) + (n > 0 && n < s.length ? '<span style="display:inline-block;width:8px;height:17px;background:#8fb0ff;vertical-align:-3px"></span>' : '');
    if (el.innerHTML !== html) el.innerHTML = html; });
});
show(statut, tCode1 + .05, { y: 6, b: 2, d: .3 });
show(piedBtn, tCode1 + .15, { y: 14, b: 4, d: .44 });
// score de performance
const PERF = { cx: 4330, cy: 494, w: 330, h: 120 };
const perf = box(mk(`<div class="carte carte-verre" style="display:flex;align-items:center;gap:18px;padding:16px 22px;border-radius:20px">
  <div style="position:relative;width:84px;height:84px;flex:none"><svg viewBox="0 0 100 100" width="84" height="84"><circle cx="50" cy="50" r="42" stroke="#dce5fb" stroke-width="10" fill="none"/><circle class="arc" cx="50" cy="50" r="42" stroke="#084eff" stroke-width="10" fill="none" stroke-linecap="round" transform="rotate(-90 50 50)" stroke-dasharray="263.9" stroke-dashoffset="263.9"/></svg><span class="tnum perf-n" style="position:absolute;inset:0;display:grid;place-items:center;font-size:30px;font-weight:700">0</span></div>
  <div><div style="font-size:22px;font-weight:650">Performance</div><div style="font-size:15px;color:var(--ink-soft)">Score Google · Illustration</div></div></div>`), PERF.cx, PERF.cy, PERF.w, PERF.h);
set0(perf, { autoAlpha: 0, zIndex: 16 });
const perfArc = q('.arc', perf), perfN = q('.perf-n', perf);
P.perf = 0;
show(perf, F('s1', -1.0), { y: 30, s: .9, b: 8, d: .6, e: 'back.out(1.6)' });
tl.to(P, { perf: 100, duration: .8, ease: 'power2.out' }, F('s1', -.85));
cue('montee', F('s1', -.85), .5);

/* =====================================================================
   ACTE 5 — MISE EN LIGNE → RÉFÉRENCEMENT LOCAL
   ===================================================================== */
const tE = F('s1') - .5;   // clic « Mettre en ligne »
curOptikom.montre(tE - .55, 4250, 560);
curOptikom.va(tE - .5, CODE.x + CODE.w - 52, CODE.y + CODE.h - 36, .45); // à droite du libellé
curOptikom.clic(tE);
tl.to(piedBtn, { scale: .94, duration: .07 }, tE); tl.to(piedBtn, { scale: 1, duration: .3, ease: 'back.out(2.5)' }, tE + .07);
const DEP = { cx: 4870, cy: 494, w: 440, h: 112 };
const dep = box(mk(`<div class="deploi carte-verre"><div class="l1"><b><span class="d-i1">${I.lecture('#084eff')}</span><span class="d-i2" style="display:none">${I.coche('#084eff', 3)}</span></b><span class="d-t1">Mise en ligne…</span><span class="d-t2" style="display:none">En ligne · votre-entreprise.fr</span></div><div class="barre"><i></i></div><div class="et">images optimisées ✓ · sécurité HTTPS ✓</div></div>`), DEP.cx, DEP.cy, DEP.w, DEP.h);
set0(dep, { autoAlpha: 0, zIndex: 35 });
const depBarre = q('.barre i', dep);
set0(depBarre, { scaleX: 0 });
show(dep, tE + .08, { y: 16, s: .92, b: 6, d: .35, e: 'back.out(1.6)' });
tl.to(depBarre, { scaleX: 1, duration: .45, ease: 'power2.inOut' }, tE + .12);
tl.set([q('.d-t1', dep), q('.d-i1', dep)], { display: 'none' }, tE + .58);
tl.set([q('.d-t2', dep), q('.d-i2', dep)], { display: 'inline' }, tE + .58);
cue('deploi', tE + .1); cue('valide', tE + .58, .8);
tl.set(q('.url-a', brw), { display: 'none' }, tE + .12); tl.set(q('.url-b', brw), { display: 'flex' }, tE + .12);
frappe('url', 'votre-entreprise.fr', tE + .14, 48, .25);
curOptikom.cache(tE + .5);

// ondes, carte du Golfe, le site se replie dans le repère de Vannes
const VAN = { x: BRW.x + BRW.w / 2, y: BRW.y + BRW.h / 2 };
const ondes = [0, 1, 2, 3].map(() => { const o = mk('<div class="onde"></div>'); at(o, VAN.x, VAN.y); set0(o, { xPercent: -50, yPercent: -50, width: 200, height: 200, autoAlpha: 0, zIndex: 18 }); return o; });
ondes.forEach((o, i) => tl.fromTo(o, { width: 260, height: 260, autoAlpha: .9, borderWidth: 4 }, { width: 3400, height: 3400, autoAlpha: 0, borderWidth: 1, duration: 1.8, ease: 'power2.out', immediateRender: false }, tE + .6 + i * .22));
const PAN = { x: 2200, y: -1700, w: 5400, h: 3100 };
const K = 2.6, VX = VAN.x - 577.3 * K, VY = VAN.y - 484.8 * K;
const carte = rect(mk(`<div class="carte-panneau carte-bleue"><div class="trame-large"></div><svg class="contour" viewBox="0 0 1000 824" width="${1000 * K}" height="${824 * K}" style="left:${VX - PAN.x}px;top:${VY - PAN.y}px"><path d="${D.carte.d}" fill="rgba(255,255,255,.10)" stroke="rgba(255,255,255,.62)" stroke-width="1.15" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg></div>`), PAN);
W.insertBefore(carte, W.querySelector('.navigateur'));
const contour = q('path', carte);
set0(carte, { clipPath: `circle(0px at ${VAN.x - PAN.x}px ${VAN.y - PAN.y}px)` });
P.trace = 0;
const tF = tE + .6;
tl.to(carte, { clipPath: `circle(1500px at ${VAN.x - PAN.x}px ${VAN.y - PAN.y}px)`, duration: .58, ease: 'power1.in' }, tF);
tl.to(carte, { clipPath: `circle(4300px at ${VAN.x - PAN.x}px ${VAN.y - PAN.y}px)`, duration: .5, ease: 'power1.out' }, tF + .58);
tl.to(P, { trace: 1, duration: 1.8, ease: 'power2.inOut' }, tF + .3);
cue('boom', tF);
const repli = [brw, df, mf, tel2, codeEl, perf, dep];
repli.forEach((e) => {
  const r = { x: parseFloat(e.style.left), y: parseFloat(e.style.top) };
  tl.to(e, { scale: .02, transformOrigin: `${VAN.x - r.x}px ${VAN.y - r.y}px`, duration: .75, ease: 'power3.in' }, tF + .05);
  tl.to(e, { autoAlpha: 0, duration: .15, ease: 'none' }, tF + .7);
});
const comms = D.carte.communes.map((c) => { const wx = VX + c.x * K, wy = VY + c.y * K;
  const cote = { 'Vannes': 'd v', 'Séné': 'b', 'Saint-Avé': 'h', 'Arradon': 'g', 'Plescop': 'g', 'Theix-Noyalo': 'd', 'Auray': 'b', 'Sarzeau': 'b' }[c.nom] || 'b';
  const e = mk(`<div class="commune"><div class="pt"></div><div class="nom ${cote}">${c.nom}</div></div>`); at(e, wx, wy); set0(e, { xPercent: -50, yPercent: -50, autoAlpha: 0, zIndex: 6 });
  return { ...c, wx, wy, el: e, cote }; });
const vannes = comms.find((c) => c.nom === 'Vannes');
const visee = mk(`<div class="visee">${[90, 150, 210].map((r) => `<div class="anneau" style="width:${r}px;height:${r}px"></div>`).join('')}<svg viewBox="0 0 100 100" style="position:absolute;width:260px;height:260px;left:-130px;top:-130px" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"><path d="M50 0v26M0 50h26M74 50h26"/></svg></div>`);
at(visee, vannes.wx, vannes.wy); set0(visee, { autoAlpha: 0, zIndex: 6 });
show(visee, tF + .55, { s: .3, y: 0, b: 8, d: 1.0 });
show(vannes.el, tF + .6, { y: 0, s: .4, b: 6, d: .7 });
comms.filter((c) => c !== vannes).forEach((c, k) => { show(c.el, tF + .7 + k * .07, { y: -40, b: 6, d: .7, e: 'back.out(1.7)' }); cue('goutte', tF + .7 + k * .07, .45); });
// fiche d'établissement Google
const photo = (g, ic) => `<div style="background:${g}"><span style="position:absolute;right:12px;bottom:12px;width:30px;height:30px;opacity:.85">${ic}</span></div>`;
const FICHE = { cx: 5440, cy: 110, w: 460, h: 620 };
const fiche = box(mk(`<div class="carte fiche">
  <div class="photos">${photo('linear-gradient(160deg,#316bff,#063cc8)', I.cle())}${photo('linear-gradient(160deg,#dce5fb,#9db8ff)', I.bain())}${photo('linear-gradient(160deg,#1d5cff,#084eff)', I.flamme())}</div>
  <div class="corps-f"><h3>Votre entreprise</h3><div class="cat">Plombier · Vannes</div><div class="ouvert"><b>Ouvert</b> · Ferme à 19:00</div>
  <div class="actions"><div class="action"><i>${I.tel('#fff')}</i>Appeler</div><div class="action"><i>${I.route()}</i>Itinéraire</div><div class="action"><i>${I.web()}</i>Site web</div><div class="action"><i>${I.partage()}</i>Partager</div></div>
  <div class="adr">${petit(I.epingle('#56667e'), 20)}Vannes, Golfe du Morbihan</div><div class="adr" style="border:none;margin-top:6px;padding-top:0">${petit(I.web('#56667e'), 20)}votre-entreprise.fr</div></div>
  <span class="pastille-illu" style="right:16px;top:14px">Illustration</span></div>`), FICHE.cx, FICHE.cy, FICHE.w, FICHE.h);
set0(fiche, { autoAlpha: 0, zIndex: 7 });
const ficheParts = [q('.photos', fiche), q('h3', fiche), q('.cat', fiche), q('.ouvert', fiche), q('.actions', fiche), ...qa('.adr', fiche)];
ficheParts.forEach((e) => set0(e, { autoAlpha: 0 }));
const lien = mk(`<svg class="abs" style="left:${vannes.wx}px;top:${vannes.wy - 40}px;overflow:visible;z-index:6" width="10" height="10"><path d="M0 40 C 220 40, 300 0, ${FICHE.cx - FICHE.w / 2 - vannes.wx} 0" stroke="#fff" stroke-width="3" fill="none" stroke-dasharray="1" stroke-dashoffset="1" pathLength="1" stroke-linecap="round"/></svg>`);
const lienP = q('path', lien);
const tG = T('l1', 1.25);
tl.to(lienP, { strokeDashoffset: 0, duration: .5, ease: 'power2.inOut' }, tG - .2);
tl.fromTo(fiche, { autoAlpha: 0, scale: .2, x: -500, filter: 'blur(10px)', transformOrigin: '0% 50%' }, { autoAlpha: 1, scale: 1, x: 0, filter: 'blur(0px)', duration: .9, ease: 'expo.out', immediateRender: false }, tG);
ficheParts.forEach((e, k) => show(e, tG + .2 + k * .08, { y: 18, b: 6, d: .6 }));
cue('whoosh', tG, .5);
phrase('l1', 4770, -455, 'En ligne, il s\'ancre à [[Vannes]] et dans le Golfe.', { taille: 76, blanc: true, fit: 1900 });
camTo(tE + .5, 1.1, { x: 4770, y: 30, s: .82, rx: 3 });
camTo(tE + 1.6, T('l2') - tE - 1.9, { x: 4780, y: 35, s: .83, rx: 0 }, 'sine.inOut');

// la recherche Google revient : « Votre entreprise » monte en tête
const SERP = { cx: 3930, cy: 140, s: .8 };
const tH = T('l2', -.3);
const SR = { x0: SERP.cx - RECH.w * SERP.s / 2, x1: SERP.cx + RECH.w * SERP.s / 2, y0: SERP.cy - RECH.h * SERP.s / 2, y1: SERP.cy + RECH.h * SERP.s / 2 };
const sousSERP = comms.filter((c) => c.wy > SR.y0 - 40 && c.wy < SR.y1 + 40 && c.wx > SR.x0 - 40 && (c.wx < SR.x1 + 20 || (c.cote.includes('g') && c.wx < SR.x1 + 240)));
tl.set(rech, { left: SERP.cx - RECH.w / 2, top: SERP.cy - RECH.h / 2, scale: SERP.s, x: -1300, filter: 'blur(0px)', zIndex: 8 }, tH - .05);
tl.set(R[2], { top: RT(3) }, tH - .05);
tl.to(rech, { autoAlpha: 1, x: 0, duration: .8, ease: 'expo.out' }, tH);
tl.to(sousSERP.map((c) => c.el), { autoAlpha: 0, duration: .22, ease: 'power1.in' }, tH - .02);
cue('whoosh', tH, .7);
show(vous, T('l2', .3), { y: 0, s: .95, b: 6, d: .45 });
tl.to(vous, { top: RT(0), duration: .7, ease: 'power3.inOut' }, T('l2', .7));
tl.to(R[0], { top: RT(1), duration: .7, ease: 'power3.inOut' }, T('l2', .7));
tl.to(R[1], { top: RT(2), duration: .7, ease: 'power3.inOut' }, T('l2', .7));
cue('montee', T('l2', .7), .5); cue('ding', T('l2', 1.35), .7);
phrase('l2', 4600, -470, 'Vos clients vous trouvent [[sur Google.]]', { taille: 76, blanc: true });
camTo(tH, .9, { x: 4600, y: 40, s: .8 });
camTo(tH + .9, F('l2') - .05 + .2 - tH - .9, { x: 4520, y: 58, s: .845 }, 'sine.inOut');

/* =====================================================================
   ACTE 6 — LES VISITEURS → LES DEMANDES
   ===================================================================== */
const tI = F('l2') - .05;
const ROW0 = { x: SERP.cx, y: SERP.cy + (RT(0) + 50 - RECH.h / 2) * SERP.s };
curClient.montre(T('l2', 1.25), 4420, 520);
curClient.va(T('l2', 1.3), ROW0.x + 330, ROW0.y + 60, .8, 'power2.inOut');
tl.to(vous, { backgroundColor: '#eef3ff', boxShadow: '0 0 0 2px rgba(8,78,255,.35)', duration: .25 }, T('l2', 1.95));
curClient.va(tI - .3, ROW0.x + 250, ROW0.y + 10, .45);
curClient.clic(tI + .25);
tl.to(vous, { scale: .98, backgroundColor: '#e3ebff', duration: .1, ease: 'power2.in' }, tI + .25); tl.to(vous, { scale: 1, duration: .25, ease: 'back.out(2)' }, tI + .35);
const TEL3 = { cx: 3930, cy: 150, w: 320, h: 640 };
const tel3 = box(mk(`<div class="telephone"><div class="ecran"><span class="encoche"></span>${mobileHTML(true)}</div></div>`), TEL3.cx, TEL3.cy, TEL3.w, TEL3.h);
set0(tel3, { autoAlpha: 0, zIndex: 9 });
const ecran3 = q('.ecran', tel3), defile = q('.m-defile', tel3);
const VR = { x: SERP.cx - (RECH.w / 2 - 40) * SERP.s, y: ROW0.y - 50 * SERP.s, w: (RECH.w - 80) * SERP.s, h: 100 * SERP.s };
tl.set(tel3, { left: VR.x, top: VR.y, width: VR.w, height: VR.h, borderRadius: 16, autoAlpha: 1 }, tI + .36);
tl.fromTo(tel3, { backgroundColor: '#e3ebff' }, { backgroundColor: '#0e2340', duration: .45, ease: 'power2.inOut', immediateRender: false }, tI + .36);
tl.to(tel3, { left: TEL3.cx - TEL3.w / 2, top: TEL3.cy - TEL3.h / 2, width: TEL3.w, height: TEL3.h, borderRadius: 46, duration: .8, ease: 'power3.inOut' }, tI + .36);
tl.set(vous, { autoAlpha: 0 }, tI + .37);
to(rech, tI + .38, { autoAlpha: 0, scale: .9, y: 40, filter: 'blur(6px)' }, .26, 'power2.in');
tl.to(sousSERP.map((c) => c.el), { autoAlpha: 1, duration: .4, ease: 'power1.out' }, tI + .6);
hide(fiche, tI + .2, { x: 140, y: 0, d: .3 }); to(lien, tI + .2, { autoAlpha: 0 }, .3, 'none');
cue('whoosh', tI + .36, .6);
curClient.cache(tI + .7);
const direct = mk('<div class="badge-direct carte-verre"><i></i>Visiteurs en direct</div>'); at(direct, TEL3.cx, TEL3.cy - TEL3.h / 2 - 40); set0(direct, { xPercent: -50, yPercent: -50, autoAlpha: 0, zIndex: 10 });
show(direct, T('v1', .1), { y: 10, s: .8, b: 4, d: .5, e: 'back.out(2)' });
phrase('v1', 4400, -390, 'Ils visitent [[votre site…]]', { taille: 80, blanc: true });
// défilement du téléphone (mesures après chargement des polices)
const focusA = mk('<div class="focus-anneau"></div>', ecran3); set0(focusA, { autoAlpha: 0 });
P.sc = 0; P.fi = 0;
tl.to(P, { sc: 1, duration: .6, ease: 'power3.inOut' }, T('v1', .35));
tl.to(P, { sc: 2, fi: 1, duration: .5, ease: 'power3.inOut' }, T('v1', .95));
tl.to(P, { sc: 3, fi: 2, duration: .45, ease: 'power3.inOut' }, T('v1', 1.45));
tl.to(focusA, { autoAlpha: 1, duration: .2 }, T('v1', .7));
tl.to(focusA, { autoAlpha: 0, duration: .2 }, F('v1', -.05));
cue('defile', T('v1', .35), .4); cue('defile', T('v1', .95), .4); cue('defile', T('v1', 1.45), .4);
const MT = { sc: [0, 0, 0, 0, 0], rects: [], champs: [] };
const ECRAN = { x: TEL3.cx - TEL3.w / 2 + 12, y: TEL3.cy - TEL3.h / 2 + 12, w: TEL3.w - 24 };
function mesuresTel() {
  const sec = ['.m-real', '.m-hor', '.m-tel', '.m-devis'].map((c) => q(c, tel3));
  const top = (e) => { let y = 0; while (e && e !== defile) { y += e.offsetTop; e = e.offsetParent; } return y; };
  MT.sc = [0, top(sec[0]) - 110, top(sec[1]) - 220, top(sec[2]) - 320, top(sec[3]) - 90];
  MT.rects = sec.slice(0, 3).map((e) => ({ y: top(e) - 10, h: e.offsetHeight + 20 }));
  MT.champs = ['.f1', '.f2', '.m-envoi'].map((c) => { const e = q(c, tel3); return { x: e.offsetLeft + e.offsetWidth / 2, y: top(e) + e.offsetHeight / 2 }; });
}
const scrollPx = () => { const i = Math.min(3, Math.floor(P.sc)), k = P.sc - i; return lerp(MT.sc[i], MT.sc[Math.min(4, i + 1)], k); };
// boîte de réception
const BOX = { cx: 4930, cy: 170, w: 860, h: 560 };
const boite = box(mk(`<div class="carte boite" style="grid-template-columns:220px 1fr"><div class="lat" style="padding:26px 18px"><span class="btn btn-primaire ecrire" style="font-size:16px;padding:12px 18px">Nouveau message</span>
  <div class="dossier" style="font-size:16px"><span>Réception</span><span class="badge tnum">0</span></div><div class="dossier gris" style="font-size:16px"><span>Envoyés</span></div><div class="dossier gris" style="font-size:16px"><span>Archives</span></div></div>
  <div class="liste" style="padding:22px 24px"><h3 style="font-size:30px">Demandes de devis</h3></div><span class="pastille-illu" style="right:18px;top:20px">Illustration</span></div>`), BOX.cx, BOX.cy, BOX.w, BOX.h);
set0(boite, { autoAlpha: 0, zIndex: 9 });
const liste = q('.liste', boite), badge = q('.badge', boite);
const MAILS = [['C', 'Claire M.', 'Salle de bain à rénover', 'Séné', '09:12'], ['T', 'Thomas L.', 'Fuite sous l\'évier', 'Vannes', '10:47'], ['S', 'Sophie R.', 'Chauffe-eau à remplacer', 'Arradon', '14:05']];
const ROWH = 110, ROWP = 122, ROW_TOP = 76;
const mails = MAILS.map(([a, n, o, v, h]) => { const m = mk(`<div class="mail" style="left:24px;right:24px;height:${ROWH}px"><span class="nouveau" style="top:49px"></span><span class="av">${a}</span><div><div class="de">${n} · via votre site</div><div class="obj" style="font-size:25px">${o} <em>· ${v}</em></div></div><span class="h">${h}</span></div>`, liste); set0(m, { autoAlpha: 0, top: ROW_TOP }); return m; });
P.badge = 0;
const notif = mk(`<div class="notif carte-verre" style="z-index:11"><i>${I.mail()}</i><div><b>Nouvelle demande de devis</b><small>Salle de bain à rénover · Séné</small></div></div>`);
at(notif, BOX.cx + BOX.w / 2 - 175, BOX.cy - BOX.h / 2 - 56); set0(notif, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
const notifSmall = q('small', notif);
// la boîte s'ouvre comme une fenêtre, opaque dès sa première image (la carte ne se voit jamais au travers)
tl.set(boite, { autoAlpha: 1, clipPath: 'inset(47% 47% 47% 47% round 24px)' }, T('v2', -.3));
tl.fromTo(boite, { scale: .88, y: 30 }, { scale: 1, y: 0, duration: .6, ease: 'expo.out', immediateRender: false }, T('v2', -.3));
tl.to(boite, { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: .36, ease: 'power2.inOut' }, T('v2', -.3));
tl.set(boite, { clipPath: 'none' }, T('v2', .08));
cue('pop', T('v2', -.22), .5);
phrase('v2', 4400, -390, '…et vous demandent [[un devis.]]', { taille: 80, blanc: true });
// le visiteur remplit et envoie le formulaire
tl.to(P, { sc: 4, duration: .35, ease: 'power3.inOut' }, T('v2', -.1));
curClient.montre(T('v2', .0), TEL3.cx + 120, TEL3.cy + 240);
const tJ = T('v2', .15);
const F1 = 'Claire M.', F2 = 'Salle de bain à rénover';
frappe('f1', F1, tJ + .16, 40, .45);
frappe('f2', F2, tJ + .5, 85, .35);
const tEnvoi = tJ + .86;
const ENVS = [tEnvoi + .02, tEnvoi + .22, tEnvoi + .42];
const envs = ENVS.map(() => { const e = mk(`<div class="enveloppe ico-bleu">${I.mail()}</div>`); set0(e, { autoAlpha: 0, zIndex: 12 }); return e; });
P.env = ENVS.map(() => 0);
ENVS.forEach((t0, i) => {
  tl.fromTo(envs[i], { autoAlpha: 0, scale: .3 }, { autoAlpha: 1, scale: 1, duration: .22, ease: 'back.out(2)', immediateRender: false }, t0);
  tl.to(P.env, { [i]: 1, duration: .5, ease: 'power2.inOut' }, t0);
  tl.to(envs[i], { autoAlpha: 0, scale: .5, duration: .12 }, t0 + .46);
  const ta = t0 + .5;
  // les demandes précédentes descendent d'abord, la nouvelle s'insère en tête (aucun chevauchement)
  mails.forEach((m, k) => { if (k < i) tl.fromTo(m, { top: ROW_TOP + (i - 1 - k) * ROWP }, { top: ROW_TOP + (i - k) * ROWP, duration: .18, ease: 'power3.out', immediateRender: false }, ta - .06); });
  tl.fromTo(mails[i], { autoAlpha: 0, scale: .97, y: -12, backgroundColor: '#dce5fb' }, { autoAlpha: 1, scale: 1, y: 0, backgroundColor: '#ffffff', duration: .7, ease: 'expo.out', immediateRender: false }, ta + .1);
  tl.set(P, { badge: i + 1 }, ta + .05);
  cue('envoi', t0, .5); cue('ding', ta, .8);
});
tl.fromTo(notif, { autoAlpha: 0, y: -24, filter: 'blur(8px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: .45, ease: 'expo.out', immediateRender: false }, ENVS[0] + .5);
ENVS.slice(1).forEach((t0) => tl.fromTo(notif, { scale: 1.06 }, { scale: 1, duration: .18, ease: 'power2.out', immediateRender: false }, t0 + .5));
P.notifIdx = 0; ENVS.forEach((t0, i) => tl.set(P, { notifIdx: i }, t0 + .51));
curClient.cache(tEnvoi + .3);
camTo(tI + .2, 1.0, { x: 4420, y: 70, s: .9 });
camTo(tI + 1.2, F('v2') - .05 - tI - 1.2, { x: 4430, y: 75, s: .915 }, 'sine.inOut');
// particules : les visiteurs arrivent de partout vers le téléphone
const SRC = comms.filter((c) => ['Auray', 'Plescop', 'Arradon', 'Saint-Avé', 'Séné', 'Theix-Noyalo'].includes(c.nom)).map((c) => ({ x: c.wx, y: c.wy }));
const DOTS = [];
for (let k = 0; k < 44; k++) {
  const deCote = k % 3 === 2; // venus des bords du cadre, à mi-hauteur (jamais à travers la phrase)
  const s = deCote ? { x: k % 2 ? 3330 : 5560, y: -240 + rnd() * 300 } : SRC[k % SRC.length];
  const e = mk('<div class="particule"></div>'); e.style.opacity = 0;
  DOTS.push({ el: e, t0: T('v1', -.1) + k * .085 + (rnd() - .5) * .08, d: .9 + rnd() * .4, sx: s.x, sy: s.y,
    cx: lerp(s.x, TEL3.cx, .5) + (rnd() - .5) * 260, cy: deCote ? s.y - 40 - rnd() * 60 : Math.min(s.y, -120) - 150 - rnd() * 190, ex: TEL3.cx + (rnd() - .5) * 140, ey: TEL3.cy - TEL3.h / 2 + 40 + rnd() * 40 });
}

/* =====================================================================
   ACTE 7 — LE RÉSULTAT EN CHIFFRES
   La caméra va de carte en carte ; chaque chiffre se prouve (frise, jauge, parcours).
   ===================================================================== */
const coche = (c = '#fff', px = 18, w = 3) => petit(I.coche(c, w), px);
const CH = [
  { cx: 3850, ico: I.calendrier(), apd: 'à partir de', gros: '30<small>jours</small>', lib: 'Mise en ligne', note: 'après validation de la maquette',
    preuve: '<div class="preuve frise"><div class="rail"><i class="rempli"></i><b class="n0"></b><b class="n1"></b></div><div class="frise-l"><span>Maquette validée</span><span>En ligne</span></div></div>' },
  { cx: 4450, ico: '', apd: '', gros: '<span class="c100">0</span><small>/100</small>', lib: 'Vitesse', note: 'Lighthouse mobile · optikom.fr · sept. 2026',
    preuve: `<svg class="anneau-lh" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,.22)" stroke-width="7" fill="none"/><circle class="arc-lh" cx="60" cy="60" r="50" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" transform="rotate(-90 60 60)" stroke-dasharray="314.16" stroke-dashoffset="314.16"/><g class="lh-ico" transform="translate(42 42) scale(1.5)" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round">${I.jauge().replace(/<\/?svg[^>]*>/g, '')}</g><g class="lh-ok" transform="translate(39 39) scale(1.75)" opacity="0" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${I.coche('#fff', 3).replace(/<\/?svg[^>]*>/g, '')}</g></svg>` },
  { cx: 5050, ico: I.personne(), apd: '', gros: '1', lib: 'Interlocuteur', note: 'le même, du devis au suivi',
    preuve: `<div class="preuve etapes"><div class="rail"><i class="rempli"></i></div>${['Devis', 'Maquette', 'Site', 'Suivi'].map((e) => `<div class="etape"><b></b><span>${e}</span></div>`).join('')}<span class="av-int">${I.personne('#084eff')}</span></div>` },
];
const CHY = 2030, CHW = 520, CHH = 600;
const chiffres = CH.map((c) => { const e = box(mk(`<div class="carte carte-bleue chiffre" style="border:none;box-shadow:var(--shadow-accent-lg)"><div class="trame-bleue"></div>${c.ico ? `<span class="ico">${c.ico}</span>` : '<div style="height:64px"></div>'}<div class="apd">${c.apd || '&nbsp;'}</div><div class="gros tnum">${c.gros}</div><div class="lib">${c.lib}</div><div class="note">${c.note}</div>${c.preuve}</div>`), c.cx, CHY, CHW, CHH);
  set0(e, { autoAlpha: 0, zIndex: 13 }); return e; });
const c100 = q('.c100', chiffres[1]), arcLH = q('.arc-lh', chiffres[1]);
P.n100 = 0; P.lh = 0;
const tK = F('v2') - .05;
// caméra : carte 1 → carte 2 → carte 3 (chaque carte ≈ 2/3 de la hauteur du cadre)
const CAMY = 1978, CAMS = 1.13;
camTo(tK, 1.05, { x: CH[0].cx, y: CAMY, s: CAMS });
camTo(tK + 1.05, T('c2', -.4) - tK - 1.05, { x: CH[0].cx + 14, y: CAMY + 4, s: CAMS + .025 }, 'sine.inOut');
camTo(T('c2', -.4), .75, { x: CH[1].cx, y: CAMY, s: CAMS }, 'power3.inOut');
camTo(T('c2', .35), T('c3', -.4) - T('c2', .35), { x: CH[1].cx + 14, y: CAMY + 4, s: CAMS + .025 }, 'sine.inOut');
camTo(T('c3', -.4), .75, { x: CH[2].cx, y: CAMY, s: CAMS }, 'power3.inOut');
const tL = F('c3'); // la caméra part quand la phrase c3 est finie
camTo(T('c3', .35), tL - T('c3', .35), { x: CH[2].cx - 14, y: CAMY + 4, s: CAMS + .025 }, 'sine.inOut');
cue('whoosh', tK, 1); cue('whoosh', T('c2', -.4), .5); cue('whoosh', T('c3', -.4), .5);
// les trois demandes deviennent les trois cartes
[0, 1, 2].forEach((i) => {
  const c = chiffres[i], t0 = tK + i * .06;
  const parts = qa('.ico, .apd, .gros, .lib, .note, .preuve, .anneau-lh', c); parts.forEach((e) => set0(e, { autoAlpha: 0 }));
  const rx = BOX.cx - BOX.w / 2 + 220 + 24, ry = BOX.cy - BOX.h / 2 + ROW_TOP + (2 - i) * ROWP;
  const eti = mk(`<div style="position:absolute;left:24px;top:24px;font-size:22px;font-weight:600;color:#fff;white-space:nowrap">${MAILS[i][2]} · ${MAILS[i][3]}</div>`, c);
  tl.to(eti, { autoAlpha: 0, y: -8, duration: .25, ease: 'power2.in' }, t0 + .5);
  tl.set(c, { left: rx, top: ry, width: BOX.w - 220 - 48, height: ROWH, borderRadius: 16 }, t0);
  // la ligne devient carte bleue d'un coup (sélection), puis s'envole
  tl.fromTo(c, { autoAlpha: 0 }, { autoAlpha: 1, duration: .03, ease: 'none', immediateRender: false }, t0);
  tl.set(mails[i], { display: 'none' }, t0 + .03);
  tl.to(c, { left: CH[i].cx - CHW / 2, top: CHY - CHH / 2, width: CHW, height: CHH, borderRadius: 24, duration: .95, ease: 'power2.inOut' }, t0);
  parts.forEach((e, k) => { if (!e.classList.contains('gros')) show(e, t0 + .65 + k * .05, { y: 20, b: 6, d: .7 }); });
});
['c1', 'c2', 'c3'].forEach((id, i) => { show(q('.gros', chiffres[i]), T(id, .1), { y: 30, s: .85, b: 14, d: .9 }); cue('pop', T(id, .12), .7); });
chiffres.forEach((c) => set0(c, { filter: 'blur(0px)' }));
const focusCarte = (i, t) => chiffres.forEach((c, k) => tl.to(c, { scale: k === i ? 1.04 : .95, autoAlpha: k === i ? 1 : .5, filter: k === i ? 'blur(0px)' : 'blur(6px)', duration: .7, ease: 'power3.inOut' }, t));
focusCarte(0, T('c1', -.3)); focusCarte(1, T('c2', -.4)); focusCarte(2, T('c3', -.4));
// preuve 1 : la frise « maquette validée → en ligne » se remplit
const fr = q('.frise', chiffres[0]);
tl.fromTo(q('.rempli', fr), { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: 'power2.inOut', immediateRender: false }, T('c1', .45));
tl.to(q('.n1', fr), { backgroundColor: '#ffffff', scale: 1.3, duration: .22, ease: 'back.out(3)' }, T('c1', 1.72));
tl.to(q('.n1', fr), { scale: 1, duration: .35, ease: 'power2.out' }, T('c1', 1.94));
cue('valide', T('c1', 1.72), .45);
// preuve 2 : la jauge balaie le cercle avec le compteur, coche à 100
tl.to(P, { n100: 100, lh: 1, duration: 1.15, ease: 'power2.out' }, T('c2', .15));
for (let i = 0; i < 14; i++) cue('tick', T('c2', .15 + i * .07), .3);
tl.to(q('.lh-ico', chiffres[1]), { opacity: 0, duration: .15 }, T('c2', 1.25));
tl.fromTo(q('.lh-ok', chiffres[1]), { opacity: 0, scale: .4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .4, ease: 'back.out(3)', immediateRender: false }, T('c2', 1.3));
cue('valide', T('c2', 1.3), .45);
// preuve 3 : le même interlocuteur suit chaque étape
const et = q('.etapes', chiffres[2]), noeuds = qa('.etape b', et), avInt = q('.av-int', et), railE = q('.rempli', et);
const XE = [0, 138, 276, 414];
set0(avInt, { x: 0 }); set0(railE, { scaleX: 0 });
tl.to(noeuds[0], { backgroundColor: '#ffffff', duration: .2 }, T('c3', .35));
XE.slice(1).forEach((x, k) => {
  const t = T('c3', .5 + k * .42);
  tl.to(avInt, { x, duration: .38, ease: 'power3.inOut' }, t);
  tl.to(railE, { scaleX: (k + 1) / 3, duration: .38, ease: 'power3.inOut' }, t);
  tl.to(noeuds[k + 1], { backgroundColor: '#ffffff', scale: 1.25, duration: .18, ease: 'power2.out' }, t + .32);
  tl.to(noeuds[k + 1], { scale: 1, duration: .3, ease: 'power2.out' }, t + .5);
  cue('tick', t + .32, .5);
});
phrase('c1', CH[0].cx, 1655, 'En ligne à partir de [[30 jours.]]', { taille: 62, fit: 1350 });
phrase('c2', CH[1].cx, 1655, 'Construit comme le nôtre : [[100/100]] en vitesse.', { taille: 62, fit: 1350 });
phrase('c3', CH[2].cx, 1655, 'Un seul interlocuteur, [[du devis au suivi.]]', { taille: 62, fit: 1350 });

/* =====================================================================
   ACTE 8 — LA GARANTIE (la pile de cartes s'ouvre en carte « garantie »)
   ===================================================================== */
const GAR = { cx: 4450, cy: 3050, w: 1240, h: 560 }; // même hauteur que les cartes de prix (partage net)
const sceau = `<svg viewBox="0 0 210 210" width="230" height="230" fill="none"><circle cx="105" cy="105" r="100" stroke="#084eff" stroke-opacity=".18" stroke-width="2"/><circle class="sc-arc" cx="105" cy="105" r="86" stroke="#084eff" stroke-width="3" stroke-dasharray="540.4" stroke-dashoffset="540.4" transform="rotate(-90 105 105)" stroke-linecap="round"/><circle cx="105" cy="105" r="64" fill="url(#gS)"/><defs><linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#1d5cff"/><stop offset="1" stop-color="#063cc8"/></linearGradient></defs><path d="M105 0v26M105 184v26M0 105h26M184 105h26" stroke="#084eff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/><g transform="translate(75 75) scale(2.5)" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${I.bouclier().replace(/<\/?svg[^>]*>/g, '')}</g></svg>`;
const gar = box(mk(`<div class="carte garantie" style="background:#fff"><div class="sceau" style="width:230px;height:230px">${sceau}</div><div><h3>Notre garantie</h3><div class="vide">[À COMPLÉTER]<span class="caret"></span></div></div><div class="zone-reflet"><i></i></div></div>`), GAR.cx, GAR.cy, GAR.w, GAR.h);
set0(gar, { autoAlpha: 0, zIndex: 13 });
const garArc = q('.sc-arc', gar), garCaret = q('.vide .caret', gar);
P.arc = 0;
const tM = F('g1') - .1;
camTo(tL, .9, { x: 4450, y: 3050, s: 1.0 });
camTo(tL + .9, tM - tL - .9, { x: 4450, y: 3038, s: 1.07 }, 'sine.inOut'); // poussée lente pendant la garantie
cue('whoosh', tL, .8);
// la phrase c3 est finie : les deux cartes estompées se vident (0,25 s), « 1 interlocuteur » reste sur la carte du dessus
const CONTENU = '.ico, .apd, .gros, .lib, .note, .preuve, .anneau-lh';
chiffres.forEach((c, i) => {
  if (i < 2) tl.to(qa(CONTENU, c), { autoAlpha: 0, duration: .25, ease: 'power2.in' }, tL);
  tl.to(c, { autoAlpha: 1, filter: 'blur(0px)', duration: .14, ease: 'power1.out' }, i < 2 ? tL + .22 : tL);
  tl.to(c, { left: GAR.cx - CHW / 2, top: GAR.cy - CHH / 2, rotation: (i - 1) * 4, scale: .82, duration: .72, ease: 'power3.inOut' }, tL + (2 - i) * .04);
});
// la carte du dessus s'ouvre : la garantie (blanche, opaque) épouse son rectangle à chaque image
const tG0 = tL + .74;
tl.set([chiffres[0], chiffres[1]], { autoAlpha: 0 }, tG0 + .02);
tl.set(gar, { left: GAR.cx - CHW / 2, top: GAR.cy - CHH / 2, width: CHW, height: CHH, rotation: 4, scale: .82 }, tG0 - .01);
tl.to([chiffres[2], gar], { left: GAR.cx - GAR.w / 2, top: GAR.cy - GAR.h / 2, width: GAR.w, height: GAR.h, rotation: 0, scale: 1, duration: .8, ease: 'expo.out' }, tG0);
tl.to(qa(CONTENU, chiffres[2]), { autoAlpha: 0, duration: .15, ease: 'power1.in' }, tG0);
tl.set(gar, { autoAlpha: 1, clipPath: 'inset(0% 100% 0% 0% round 24px)' }, tG0 + .04);
tl.to(gar, { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: .3, ease: 'power2.inOut' }, tG0 + .04);
tl.set(gar, { clipPath: 'none' }, tG0 + .35);
tl.set(chiffres[2], { autoAlpha: 0 }, tG0 + .34);
cue('pop', tG0, .5);
const garParts = qa('.sceau, h3, .vide', gar); set0(garParts, { autoAlpha: 0 });
const tG1 = Math.max(T('g1'), tG0 + .2); // le texte arrive quand la carte est ouverte
garParts.forEach((e, k) => show(e, tG1 + k * .12, { y: 18, b: 8, d: .7, ir: false }));
tl.to(P, { arc: 1, duration: 1.1, ease: 'power2.inOut' }, tG1 + .1);
cue('valide', tG1 + .15, .6);
const refletG = q('.zone-reflet i', gar);
tl.fromTo(refletG, { x: -400 }, { x: 1700, duration: 1.1, ease: 'power2.inOut', immediateRender: false }, T('g1', 1.9));
cue('brillance', T('g1', 1.9), .35);

/* =====================================================================
   ACTE 9 — LES PRIX (la carte dont on parle s'avance, ses points se cochent)
   ===================================================================== */
const PX = [{ cx: 4110, cls: 'bleu carte-bleue', ico: I.web('#fff'), h: 'Création de votre site', m: '1 100 €', s: '', li: ['Maquette sur mesure', 'Pensé pour le téléphone', 'Prêt pour Google'] },
            { cx: 4790, cls: 'blanc', ico: I.epingle('#fff'), h: 'Référencement local', m: '250 €', s: '/mois', li: ['Fiche Google complète', 'Vannes et le Golfe', 'Suivi chaque mois'] }];
const PY = 4180, PW = 620, PH = 560;
const LIBS = ['Audit gratuit sous 48 h', 'Devis sous 24 h']; // ce que deviendront les cartes (acte 10)
const prix = PX.map((p, i) => { const e = box(mk(`<div class="carte prix ${p.cls}" style="padding:40px 44px;${p.cls.includes('bleu') ? 'border:none;box-shadow:var(--shadow-accent-lg)' : ''}">${p.cls.includes('bleu') ? '<div class="trame-bleue"></div>' : ''}<div class="lib-pil" style="color:${i ? 'var(--accent-strong)' : '#fff'}"><span class="pt"></span>${LIBS[i]}<span class="fl">${I.fleche}</span></div><div class="zone-reflet"><i></i></div><span class="ico ${p.cls.includes('bleu') ? '' : 'ico-bleu'}">${p.ico}</span><h3 style="margin-top:24px">${p.h}</h3><div class="apd" style="margin-top:18px">à partir de</div><div class="montant">${typo(p.m)}<small>${p.s}</small></div><ul style="margin-top:22px">${p.li.map((l) => `<li><i>${I.coche(p.cls.includes('bleu') ? '#fff' : '#084eff', 3)}</i>${l}</li>`).join('')}</ul><div class="tva" style="bottom:26px">TVA non applicable, art. 293 B du CGI</div></div>`), p.cx, PY, PW, PH);
  set0(e, { autoAlpha: 0, zIndex: 13 }); return e; });
const tN = F('x2') - .1;
// la garantie descend avec la caméra (toujours au centre du cadre), puis se partage en deux cartes de prix
camTo(tM, .75, { x: 4450, y: 4110, s: 1.04 });
camTo(T('x1', .1), .7, { x: 4330, y: 4108, s: 1.06 }, 'power3.inOut');
camTo(T('x1', .8), T('x2', -.1) - T('x1', .8), { x: 4318, y: 4110, s: 1.08 }, 'sine.inOut');
camTo(T('x2', -.1), .8, { x: 4590, y: 4106, s: 1.07 }, 'power3.inOut');
camTo(T('x2', .7), tN - .15 - T('x2', .7), { x: 4615, y: 4114, s: 1.11 }, 'sine.inOut'); // poussée lente une fois les points cochés
cue('whoosh', tM, .8); cue('whoosh', T('x2', -.1), .45);
tl.to(gar, { top: PY - GAR.h / 2, duration: .75, ease: 'power2.inOut' }, tM);
tl.to(garParts, { autoAlpha: 0, filter: 'blur(6px)', duration: .18, ease: 'power2.in' }, tM + .55);
const tS2 = tM + .76; // partage : la moitié droite est déjà la carte blanche, la gauche se remplit de bleu (opaque)
tl.set(prix[1], { left: GAR.cx, top: PY - PH / 2, autoAlpha: 1 }, tS2);
tl.set(prix[0], { left: GAR.cx - PW, top: PY - PH / 2, autoAlpha: 1, clipPath: 'inset(0% 100% 0% 0% round 24px)' }, tS2);
tl.to(prix[0], { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: .26, ease: 'power2.inOut' }, tS2);
tl.set(prix[0], { clipPath: 'none' }, tS2 + .27);
tl.set(gar, { autoAlpha: 0 }, tS2 + .27);
PX.forEach((p, i) => tl.to(prix[i], { left: p.cx - PW / 2, duration: .5, ease: 'power3.out' }, tS2 + .24));
cue('pop', tS2, .5);
PX.forEach((p, i) => {
  const c = prix[i];
  const parts = qa('.ico, h3, .apd, .montant, ul, .tva', c); parts.forEach((e) => set0(e, { autoAlpha: 0 }));
  parts.forEach((e, k) => show(e, T('x1', i * .12) + k * .04, { y: 20, b: 8, d: .6 }));
  // les points se cochent un à un quand on parle de cette carte
  const ics = qa('li i', c); set0(ics, { scale: 0 });
  ics.forEach((e, k) => { const t = T(i ? 'x2' : 'x1', .75 + k * .22); tl.to(e, { scale: 1, duration: .35, ease: 'back.out(3)' }, t); cue('tick', t, .45); });
});
const focusPrix = (i, t) => prix.forEach((c, k) => tl.to(c, { scale: k === i ? 1.05 : .95, autoAlpha: k === i ? 1 : .6, duration: .7, ease: 'power3.inOut' }, t));
focusPrix(0, T('x1', .02)); focusPrix(1, T('x2', -.05));
// reflet sur la carte dont on parle
[[0, T('x1', 1.7)], [1, T('x2', 2.3)]].forEach(([i, t]) => { tl.fromTo(q('.zone-reflet i', prix[i]), { x: -300 }, { x: 900, duration: 1.0, ease: 'power2.inOut', immediateRender: false }, t); cue('brillance', t, .25); });
phrase('x1', 4450, 3720, 'Votre site à partir de [[1 100 €.]]', { taille: 80 });
phrase('x2', 4450, 3720, 'Référencement local [[dès 250 €/mois.]]', { taille: 80 });
cue('pop', T('x1', .2), .5); cue('pop', T('x2', .2), .5);

/* =====================================================================
   ACTE 10 — APPEL À L'ACTION
   Les cartes de prix deviennent deux grands boutons ; « Vous » clique ;
   les boutons se rangent, optikom.fr se tape, le logo fait sa mise au point.
   ===================================================================== */
const CTA = { cx: 4450, cy: PY, w: 1700, h: 880 }; // sur place : les cartes de prix deviennent les boutons sans quitter le cadre
const cta = box(mk(`<div class="carte cta" style="border:none"><div class="fond-cta"><div class="h1" style="left:-200px;top:-300px;width:1100px;height:900px"></div><div class="h2" style="right:-300px;bottom:-400px;width:1200px;height:1000px"></div></div></div>`), CTA.cx, CTA.cy, CTA.w, CTA.h);
set0(cta, { autoAlpha: 0, zIndex: 12 });
const cx0 = CTA.cx - CTA.w / 2, cy0 = CTA.cy - CTA.h / 2;
const PIL = [{ x: CTA.cx, y: CTA.cy - 110, w: 1010, h: 156 }, { x: CTA.cx, y: CTA.cy + 96, w: 720, h: 156 }];
const PILF = [{ x: CTA.cx - 345, y: cy0 + 150 }, { x: CTA.cx + 375, y: cy0 + 150 }], PS = .62; // place finale, plus petits
const pilHTML = (cls, txt, w, h) => `<div class="btn ${cls} cta-pilule" style="z-index:14;font-size:64px;width:${w}px;height:${h}px;padding:0;justify-content:center;gap:26px"><span class="pt"></span>${txt}<span class="fl">${I.fleche}</span><span class="ok" style="display:none">${petit(I.coche('currentColor', 3), 54)}</span></div>`;
const pil1 = mk(pilHTML('btn-primaire', 'Audit gratuit sous 48 h', PIL[0].w, PIL[0].h)); at(pil1, PIL[0].x, PIL[0].y);
const pil2 = mk(pilHTML('btn-inverse', 'Devis sous 24 h', PIL[1].w, PIL[1].h)); at(pil2, PIL[1].x, PIL[1].y);
const logo = mk('<img class="cta-logo" src="assets/logo-blanc.svg" style="width:600px;z-index:14">'); at(logo, CTA.cx, cy0 + 360);
const urlB = mk(`<div class="url-barre" style="z-index:14;overflow:hidden">${I.cadenas('#9db8ff')}<span class="u-t"></span><span class="caret"></span><i class="reflet-url"></i></div>`); at(urlB, CTA.cx, cy0 + 575);
const lieu = mk(`<div class="cta-lieu" style="z-index:14">${petit(I.epingle('#aebbd0'), 22, 'vertical-align:-3px;margin-right:8px')}Agence web à Vannes · Golfe du Morbihan<span style="opacity:.45;margin:0 14px">|</span>${petit(I.tel('#aebbd0'), 22, 'vertical-align:-3px;margin-right:8px')}06 33 46 79 83</div>`); at(lieu, CTA.cx, cy0 + 745);
const envoye = mk(`<div class="puce-ok carte-verre"><b>${coche('#fff', 18)}</b>Demande envoyée</div>`); at(envoye, PIL[0].x + PIL[0].w / 2 - 120, PIL[0].y - PIL[0].h / 2 - 46);
[pil1, pil2, logo, urlB, lieu, envoye].forEach((e) => set0(e, { xPercent: -50, yPercent: -50, autoAlpha: 0 }));
const urlT2 = q('.u-t', urlB), urlCaret = q('.caret', urlB);
const sph = [[cx0 + 40, cy0 + 120, 150], [cx0 + CTA.w - 90, cy0 + CTA.h - 150, 210], [cx0 + 260, cy0 + CTA.h - 20, 90]].map(([x, y, r]) => { const s = box(mk('<div class="sphere" style="z-index:15"></div>'), x, y, r, r); set0(s, { autoAlpha: 0 }); return s; });
const anneauCTA = box(mk(`<div class="anneau-optique" style="width:300px;height:300px;z-index:13">${I.vise('rgba(255,255,255,.4)')}</div>`), cx0 + 150, cy0 + 560, 300, 300); set0(anneauCTA, { autoAlpha: 0 });
camTo(tN - .15, 1.0, { x: 4450, y: PY, s: .98 });
camTo(tN + .85, F('k1', -.6) - tN - .85, { x: 4450, y: PY - 4, s: 1.0 }, 'sine.inOut');
camTo(F('k1', -.6), DUREE - F('k1', -.6), { x: 4450, y: PY + 10, s: 1.075 }, 'sine.inOut'); // poussée finale
cue('whoosh', tN, .6);
// les cartes de prix se rétractent sur place en boutons : « 1 100 € » devient « Audit gratuit sous 48 h »,
// « 250 €/mois » devient « Devis sous 24 h » (fondu des libellés pendant le mouvement)
PX.forEach((p, i) => {
  const c = prix[i], g = PIL[i], lib = q('.lib-pil', c);
  if (!i) tl.set(c, { zIndex: 14 }, tN - .15);
  tl.to(qa('.ico, .apd, ul, .tva, h3, .montant, .trame-bleue', c), { autoAlpha: 0, duration: .22, ease: 'power2.in' }, tN - .15);
  tl.to(c, { autoAlpha: 1, duration: .2, ease: 'power1.out' }, tN - .15); // la carte estompée redevient pleine tout de suite
  tl.to(c, { left: g.x - g.w / 2, top: g.y - g.h / 2, width: g.w, height: g.h, borderRadius: g.h / 2, scale: 1, duration: .8, ease: 'power3.inOut' }, tN - .1 + i * .05);
  tl.fromTo(lib, { autoAlpha: 0, filter: 'blur(6px)' }, { autoAlpha: 1, filter: 'blur(0px)', duration: .3, ease: 'power1.out', immediateRender: false }, tN - .08 + i * .05);
  tl.set(i ? pil2 : pil1, { autoAlpha: 1 }, tN + .71 + i * .05);
  tl.set(c, { autoAlpha: 0 }, tN + .72 + i * .05);
});
// le panneau bleu nuit s'ouvre depuis le centre des boutons (opaque à chaque image)
const OY = ((PIL[0].y - cy0) / CTA.h * 100).toFixed(2); // centre du cercle : derrière le bouton « Audit »
tl.set(cta, { autoAlpha: 1, clipPath: `circle(5.5% at 50% ${OY}%)` }, tN + .55);
tl.to(cta, { clipPath: `circle(80% at 50% ${OY}%)`, duration: .9, ease: 'none' }, tN + .55);
tl.set(cta, { clipPath: 'none' }, tN + 1.46);
sph.forEach((s, i) => show(s, T('k1', .2 + i * .15), { s: .7, y: 30, b: 16, d: 1.3 }));
show(anneauCTA, T('k1', .5), { s: .7, y: 0, b: 14, d: 1.3 });
// « Vous » (curseur clair, visible sur le bleu nuit) clique sur l'audit, puis sur le devis
const curVousN = curseur('Vous', '#316bff', true);
const fl1 = { x: PIL[0].x + PIL[0].w / 2 - 92, y: PIL[0].y + 6 }, fl2 = { x: PIL[1].x + PIL[1].w / 2 - 92, y: PIL[1].y + 6 };
curVousN.montre(T('k1', .3), CTA.cx + 420, CTA.cy + 330);
curVousN.va(T('k1', .35), fl1.x, fl1.y, .85);
tl.to(pil1, { y: -6, boxShadow: '0 0 0 8px rgba(49,107,255,.28), 0 18px 40px -10px rgba(8,78,255,.7)', duration: .3, ease: 'power2.out' }, T('k1', 1.05));
curVousN.clic(T('k1', 1.45));
tl.to(pil1, { scale: .96, y: 0, duration: .07, ease: 'power2.in' }, T('k1', 1.45)); tl.to(pil1, { scale: 1, duration: .35, ease: 'back.out(2.5)' }, T('k1', 1.52));
tl.set(q('.fl', pil1), { display: 'none' }, T('k1', 1.53)); tl.set(q('.ok', pil1), { display: 'inline-flex' }, T('k1', 1.53));
tl.to(q('.pt', pil1), { backgroundColor: '#3ddc84', opacity: 1, duration: .25 }, T('k1', 1.53));
tl.fromTo(envoye, { autoAlpha: 0, scale: .6, y: 16 }, { autoAlpha: 1, scale: 1, y: 0, duration: .45, ease: 'back.out(2)', immediateRender: false }, T('k1', 1.6));
cue('valide', T('k1', 1.55), .7);
tl.to(pil1, { boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25), 0 1px 2px rgba(8,78,255,.2), 0 8px 20px -6px rgba(8,78,255,.45)', duration: .5 }, T('k1', 2.3));
curVousN.va(T('k1', 2.55), fl2.x, fl2.y, .6);
tl.to(pil2, { y: -6, boxShadow: '0 0 0 8px rgba(255,255,255,.18), 0 18px 40px -10px rgba(0,0,0,.45)', duration: .3, ease: 'power2.out' }, T('k1', 3.0));
curVousN.clic(T('k1', 3.35));
tl.to(pil2, { scale: .96, y: 0, duration: .07, ease: 'power2.in' }, T('k1', 3.35)); tl.to(pil2, { scale: 1, duration: .35, ease: 'back.out(2.5)' }, T('k1', 3.42));
tl.set(q('.fl', pil2), { display: 'none' }, T('k1', 3.43)); tl.set(q('.ok', pil2), { display: 'inline-flex' }, T('k1', 3.43));
tl.to(q('.pt', pil2), { backgroundColor: '#12b76a', opacity: 1, duration: .25 }, T('k1', 3.43));
cue('valide', T('k1', 3.45), .6);
tl.to(pil2, { boxShadow: '0 4px 8px rgba(14,35,64,.06), 0 12px 24px -6px rgba(14,35,64,.12)', duration: .5 }, T('k1', 4.0));
curVousN.va(T('k1', 3.75), CTA.cx + 300, cy0 + 690, .7);
// comme au début du film dans Google : « Vous » clique dans la barre d'adresse, puis s'efface pendant la frappe
curVousN.va(T('k2', -.3), CTA.cx + 26, cy0 + 588, .32);
curVousN.clic(T('k2', .05));
tl.to(urlB, { borderColor: 'rgba(157,184,255,.9)', boxShadow: '0 0 0 6px rgba(49,107,255,.28), inset 0 1px 0 rgba(255,255,255,.12)', duration: .1 }, T('k2', .05));
curVousN.va(T('k2', .2), CTA.cx + 120, cy0 + 700, .35);
curVousN.cache(T('k2', .6));
// les boutons se rangent en haut (plus petits) pour laisser place à l'adresse et au logo
const tRange = F('k1', -.55);
tl.to(envoye, { autoAlpha: 0, y: -10, duration: .25, ease: 'power2.in' }, tRange - .2);
[pil1, pil2].forEach((e, i) => tl.to(e, { left: PILF[i].x, top: PILF[i].y, scale: PS, duration: .85, ease: 'power3.inOut' }, tRange + i * .05));
cue('whoosh', tRange, .45);
// optikom.fr tapé dans la barre d'adresse, puis le logo fait sa mise au point
show(urlB, T('k2', -.08), { y: 16, s: .96, b: 8, d: .5 });
const finURL = frappe('url2', 'optikom.fr', T('k2', .27), 20, .8);
touche(CTA.cx + 470, cy0 + 575, 'Entrée ↵', finURL + .02, finURL + .18);
tl.fromTo(logo, { autoAlpha: 0, filter: 'blur(26px)', scale: 1.12 }, { autoAlpha: 1, filter: 'blur(0px)', scale: 1, duration: 1.5, ease: 'expo.out', immediateRender: false }, finURL + .3);
cue('logo', finURL + .3);
show(lieu, finURL + .7, { y: 20, b: 10, d: .9 });
// carton final vivant : reflets, point d'état qui pulse, caméra qui avance
tl.fromTo(q('.reflet-url', urlB), { x: 0 }, { x: 900, duration: 1.0, ease: 'power2.inOut', immediateRender: false }, finURL + 1.3);
const reflet = mk('<span style="position:absolute;top:0;bottom:0;width:160px;left:-200px;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg)"></span>', pil1);
pil1.style.overflow = 'hidden';
tl.fromTo(reflet, { x: 0 }, { x: 1300, duration: 1.1, ease: 'power2.inOut', immediateRender: false }, DUREE - 2.4);
cue('brillance', DUREE - 2.4, .4);

/* ---------- profondeur : éléments optiques de premier plan ---------- */
const FGS = [
  { wx: -760, wy: -360, r: 240, p: 1.55, b: 14 }, { wx: 820, wy: 430, r: 150, p: 1.35, b: 8 },
  { wx: 1450, wy: -520, r: 120, p: 1.25, b: 6 }, { wx: 3300, wy: 520, r: 210, p: 1.5, b: 14 },
  { wx: 3700, wy: -560, r: 130, p: 1.3, b: 8 }, { wx: 5700, wy: 560, r: 230, p: 1.5, b: 14 },
  { wx: 3500, wy: 2350, r: 190, p: 1.45, b: 12 }, { wx: 5350, wy: 2900, r: 150, p: 1.3, b: 8 },
  { wx: 3450, wy: 3600, r: 220, p: 1.5, b: 14 }, { wx: 5500, wy: 4400, r: 170, p: 1.4, b: 10 },
].map((f) => ({ ...f, el: mk(`<div class="sphere" style="width:${f.r}px;height:${f.r}px;filter:blur(${f.b}px);opacity:.7"></div>`, FG) }));

/* ---------- synchronisation des valeurs dérivées ---------- */
const fmt1 = (v) => v.toFixed(1).replace('.', ',');
function sync(t) {
  const s = cam.s;
  W.style.transform = `translate(960px,540px) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) rotate(${cam.r}deg) scale(${s}) translate(${-cam.x}px,${-cam.y}px)`;
  FGS.forEach((f) => { const sx = 960 + (f.wx - cam.x) * s * f.p, sy = 540 + (f.wy - cam.y) * s * f.p + Math.sin(t * .9 + f.wx) * 8; f.el.style.transform = `translate(${sx - f.r / 2}px,${sy - f.r / 2}px) scale(${s * f.p})`; });
  const kc = clamp(1.16 / s, 1, 1.6); // taille des curseurs à l'écran ≈ constante
  CURSEURS.forEach((c) => { c.el.style.left = c.x + 'px'; c.el.style.top = c.y + 'px'; c.cz.style.transform = `scale(${kc})`; });
  // recherche
  const typed = REQ.slice(0, Math.round(P.tape || 0));
  tapeEl.textContent = typed;
  caretR.style.opacity = t > 1.1 && t < 2.6 ? (Math.floor(t * 3) % 2 ? .2 : 1) : 0;
  suggSpans.forEach((sp) => { const h = `${typed}<b>${REQ.slice(typed.length)}${sp.dataset.s}</b>`; if (sp.innerHTML !== h) sp.innerHTML = h; });
  // ancien site, téléphone lent, loupe
  roue.style.transform = `rotate(${t * 400}deg)`;
  chronoV.textContent = fmt1(P.chrono) + ' s';
  barreCharge.style.width = (P.charge * 100) + '%';
  const fl = Math.min(P.flou, 1);
  oldBC.style.filter = `blur(${fl * 6}px) saturate(${1 - .3 * fl})`;
  loupe.style.left = P.lx + 'px'; loupe.style.top = P.ly + 'px';
  const lvis = gsap.getProperty(loupe, 'autoAlpha'), lsc = gsap.getProperty(loupe, 'scale');
  oldNet.style.visibility = lvis > .01 && t < F('a1') ? 'visible' : 'hidden';
  oldNet.style.opacity = lvis;
  oldNet.style.clipPath = `circle(${(P.lr - 12) * lsc}px at ${P.lx - OLD.x}px ${P.ly - OLD.y}px)`;
  // mise en ligne
  urlT.textContent = 'votre-entreprise.fr'.slice(0, Math.round(P.url || 0));
  perfArc.setAttribute('stroke-dashoffset', 263.9 * (1 - P.perf / 100)); perfN.textContent = Math.round(P.perf);
  // carte
  contour.setAttribute('stroke-dashoffset', 1 - P.trace);
  qa('.anneau', visee).forEach((a, i) => { const ph = ((t * .6 + i / 3) % 1); a.style.transform = `translate(-50%,-50%) scale(${.6 + ph * .9})`; a.style.opacity = (1 - ph) * .9; });
  // téléphone du visiteur
  if (MT.rects.length) {
    const scp = scrollPx(); defile.style.transform = `translateY(${-scp}px)`;
    const i = Math.min(1, Math.floor(P.fi)), k = P.fi - i, a = MT.rects[i], b = MT.rects[Math.min(2, i + 1)];
    Object.assign(focusA.style, { left: '8px', width: (ECRAN.w - 16) + 'px', top: (74 + lerp(a.y, b.y, k) - scp) + 'px', height: lerp(a.h, b.h, k) + 'px' });
  }
  const f1 = q('.f1', tel3), f2 = q('.f2', tel3);
  const v1 = F1.slice(0, Math.round(P.f1)), v2 = F2.slice(0, Math.round(P.f2));
  q('.v', f1).textContent = v1; q('.ph', f1).style.display = v1 ? 'none' : ''; q('.v', f2).textContent = v2; q('.ph', f2).style.display = v2 ? 'none' : '';
  // particules
  DOTS.forEach((d) => {
    const k = (t - d.t0) / d.d;
    if (k <= 0 || k >= 1) { d.el.style.opacity = 0; return; }
    const e = easeIO(k), u = 1 - e;
    const x = u * u * d.sx + 2 * u * e * d.cx + e * e * d.ex, y = u * u * d.sy + 2 * u * e * d.cy + e * e * d.ey;
    const dx = 2 * u * (d.cx - d.sx) + 2 * e * (d.ex - d.cx), dy = 2 * u * (d.cy - d.sy) + 2 * e * (d.ey - d.cy);
    d.el.style.opacity = Math.min(1, k * 6, (1 - k) * 5);
    d.el.style.transform = `translate(${x}px,${y}px) rotate(${Math.atan2(dy, dx)}rad) scale(${1 - .35 * k})`;
  });
  // enveloppes : du bouton « Envoyer » du téléphone vers la boîte
  if (MT.champs.length) {
    const s0 = { x: ECRAN.x + MT.champs[2].x, y: ECRAN.y + 74 + MT.champs[2].y - MT.sc[4] };
    const dst = { x: BOX.cx - BOX.w / 2 + 220 + 24 + 64, y: BOX.cy - BOX.h / 2 + ROW_TOP + ROWH / 2 };
    envs.forEach((e, i) => { const k = P.env[i], u = 1 - k, cx = (s0.x + dst.x) / 2, cy = Math.min(s0.y, dst.y) - 150;
      e.style.left = (u * u * s0.x + 2 * u * k * cx + k * k * dst.x) + 'px'; e.style.top = (u * u * s0.y + 2 * u * k * cy + k * k * dst.y) + 'px'; });
  }
  badge.textContent = Math.round(P.badge);
  notifSmall.textContent = MAILS[Math.round(P.notifIdx)].slice(2, 4).join(' · ');
  // chiffres, garantie, appel à l'action
  c100.textContent = Math.round(P.n100);
  arcLH.setAttribute('stroke-dashoffset', 314.16 * (1 - P.lh));
  garArc.setAttribute('stroke-dashoffset', 540.4 * (1 - P.arc));
  garCaret.style.opacity = Math.floor(t * 2.4) % 2 ? .2 : 1;
  q('.pt', pil1).style.transform = `scale(${1 + .22 * Math.sin(t * 5)})`;
  urlT2.textContent = 'optikom.fr'.slice(0, Math.round(P.url2 || 0));
  urlCaret.style.opacity = Math.floor(t * 2.4) % 2 ? .25 : 1;
  sph.forEach((sp, i) => { sp.style.translate = `0 ${Math.sin(t * .8 + i * 2) * 8}px`; });
  SYNC.forEach((fn) => fn(t));
}
// curseur du client sur le formulaire : positions connues seulement après mesure du téléphone
function curseurFormulaire() {
  const pt = (i, dx) => ({ x: ECRAN.x + MT.champs[i].x + dx, y: ECRAN.y + 74 + MT.champs[i].y - MT.sc[4] });
  const p0 = pt(0, 40), p1 = pt(1, 40), p2 = pt(2, 30);
  curClient.va(T('v2', .02), p0.x, p0.y, .22); curClient.clic(tJ + .11);
  curClient.va(tJ + .16, p0.x + 96, p0.y + 6, .16);      // s'écarte pendant la frappe
  curClient.va(tJ + .335, p1.x, p1.y, .12); curClient.clic(tJ + .47);
  curClient.va(tJ + .5, p2.x, p2.y, .3); curClient.clic(tEnvoi - .02);
  const envoiBtn = q('.m-envoi', tel3);
  tl.to(envoiBtn, { scale: .94, duration: .07 }, tEnvoi - .02); tl.to(envoiBtn, { scale: 1, duration: .3, ease: 'back.out(2.5)' }, tEnvoi + .05);
}

window.__duree = DUREE;
window.__cues = CUES;
window.__seek = (t) => { tl.seek(t, true); sync(t); };
if (location.search.includes('qa')) { window.__tlqa = tl; window.__camObj = cam; } // contrôles internes
window.__cam = () => ({ ...cam });
window.__cameras = () => tl.getTweensOf(cam).map((tw) => [tw.startTime(), tw.endTime()]).sort((a, b) => a[0] - b[0]);
window.__pret = document.fonts.ready.then(() => {
  mesuresTel(); curseurFormulaire();
  PHRASES.forEach(({ el, o }) => { if (o.fit && el.offsetWidth > o.fit) el.style.fontSize = (parseFloat(el.style.fontSize) * o.fit / el.offsetWidth) + 'px'; });
  morphH1();
  CUES.sort((a, b) => a.t - b.t);
  window.__seek(0); return true; });
if (location.search.includes('play')) { const t0 = performance.now(); const off = parseFloat(new URLSearchParams(location.search).get('t') || 0);
  const loop = () => { const t = off + (performance.now() - t0) / 1000; window.__seek(t % DUREE); requestAnimationFrame(loop); }; window.__pret.then(loop); }
})();
