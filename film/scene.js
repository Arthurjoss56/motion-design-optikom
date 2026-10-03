/* Film Optikom — scène unique, une seule caméra, timeline déterministe.
   window.__seek(t) positionne tout le film au temps t (secondes). */
(() => {
const D = window.DATA;
const W = document.getElementById('world');
const FG = document.getElementById('fg');
const BG = document.getElementById('bg');
const SUB = document.getElementById('sub');
const DUREE = D.duree;

/* ---------- utilitaires ---------- */
const mk = (html, parent = W) => { const t = document.createElement('template'); t.innerHTML = html.trim(); const el = t.content.firstElementChild; parent.appendChild(el); return el; };
const q = (sel, root) => root.querySelector(sel);
const qa = (sel, root) => [...root.querySelectorAll(sel)];
const box = (el, cx, cy, w, h) => { Object.assign(el.style, { left: (cx - w / 2) + 'px', top: (cy - h / 2) + 'px', width: w + 'px', height: h + 'px' }); return el; };
const at = (el, x, y) => { el.style.left = x + 'px'; el.style.top = y + 'px'; return el; };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const easeIO = (k) => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const easeO = (k) => 1 - Math.pow(1 - k, 3);
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

const I = {
  loupe: '<svg viewBox="0 0 24 24" fill="none" stroke="#56667e" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  croix: (c = '#d92d20') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  coche: (c = '#fff', w = 2.6) => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>`,
  mail: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>`,
  cadenas: '<svg class="cadenas" viewBox="0 0 24 24" fill="none" stroke="#084eff" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  tel: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>`,
  route: (c = '#084eff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 21 12 12 21 3 12z"/><path d="M10 14v-2.5a1.5 1.5 0 0 1 1.5-1.5H15m-2-2 2 2-2 2"/></svg>`,
  web: (c = '#084eff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>`,
  partage: (c = '#084eff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/></svg>`,
  goutte: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>`,
  cle: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6.5a4 4 0 0 0 5 5l-9 9a2.1 2.1 0 0 1-3-3l9-9a4 4 0 0 0-2-2z"/><path d="M14.5 6.5 17 4l3 3-2.5 2.5"/></svg>`,
  bain: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z"/><path d="M6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/></svg>`,
  flamme: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 2 1.5 3 2.5 3 0-3-1-5 0-8z"/></svg>`,
  doc: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>`,
  calendrier: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17M8.5 15l2.2 2 4.3-4"/></svg>`,
  jauge: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round"><path d="M4 16a8 8 0 1 1 16 0"/><path d="m12 16 4-5"/><circle cx="12" cy="16" r="1.4" fill="${c}"/></svg>`,
  personne: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
  bouclier: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4.5 6v6c0 4.5 3.2 8 7.5 9 4.3-1 7.5-4.5 7.5-9V6z"/><path d="m8.5 12 2.4 2.4L15.5 10"/></svg>`,
  epingle: (c = '#fff') => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`,
  fleche: '<svg class="fleche" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
  souris: '<svg viewBox="0 0 24 24"><path d="M5 3l13 8.5-6 1.2-3.2 5.6z" fill="#0e2340" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  vise: (c = '#fff') => `<svg viewBox="0 0 100 100" fill="none" stroke="${c}" stroke-linecap="round"><circle cx="50" cy="50" r="46" stroke-width="1.5" opacity=".55"/><circle cx="50" cy="50" r="34" stroke-width="1.5" opacity=".8"/><circle cx="50" cy="50" r="18" stroke-width="2"/><path d="M50 0v22M50 78v22M0 50h22M78 50h22" stroke-width="1.6"/></svg>`,
};

/* ---------- timeline ---------- */
const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
const set0 = (el, vars) => gsap.set(el, vars);
const show = (el, t, o = {}) => tl.fromTo(el, { autoAlpha: 0, y: o.y ?? 26, x: o.x ?? 0, scale: o.s ?? 1, filter: `blur(${o.b ?? 12}px)` },
  { autoAlpha: 1, y: 0, x: 0, scale: 1, filter: 'blur(0px)', duration: o.d ?? 1.0, ease: o.e ?? 'expo.out' }, t);
const hide = (el, t, o = {}) => tl.to(el, { autoAlpha: 0, y: o.y ?? -14, scale: o.s ?? 1, filter: `blur(${o.b ?? 10}px)`, duration: o.d ?? 0.6, ease: o.e ?? 'power2.in' }, t);
const to = (el, t, vars, d = 1, e = 'expo.out') => tl.to(el, { ...vars, duration: d, ease: e }, t);

/* caméra (proxy) — x, y = centre visé dans le monde ; s = zoom ; r = roulis ; rx/ry = inclinaison 3D */
const cam = { x: 40, y: -250, s: 1.62, r: 0, rx: 0, ry: 0 };
const camTo = (t, d, v, e = 'power3.inOut') => tl.to(cam, { ...v, duration: d, ease: e }, t);
const P = {}; // proxys numériques (texte tapé, compteurs, progressions)

/* ---------- décor du monde ---------- */
mk('<div id="grille"></div>');
const halos = [[0, 0, 1700], [2200, 0, 2000], [3500, 0, 1400], [5000, 0, 2200], [4300, 1750, 1900], [4300, 2950, 2000], [4300, 4050, 1700], [4300, 5150, 2000], [4300, 6350, 2400]];
halos.forEach(([x, y, r], i) => box(mk(`<div class="halo ${i % 2 ? '' : 'halo-fort'}"></div>`), x + (i % 2 ? 300 : -200), y - 100, r, r * 0.8));

/* =====================================================================
   ACTE 1 — LE PROBLÈME
   ===================================================================== */
const RECH = { cx: 0, cy: 0, w: 1040, h: 660 };
const rech = box(mk(`<div class="carte recherche">
  <div class="barre-recherche">${I.loupe}<span class="tape"></span><span class="curseur-texte"></span></div>
  <div class="rangs"></div>
  <span class="pastille-illu" style="right:24px;top:12px">Illustration</span>
</div>`), RECH.cx, RECH.cy, RECH.w, RECH.h);
const tape = q('.tape', rech), caret = q('.curseur-texte', rech), rangs = q('.rangs', rech);
const PITCH = 126, RTOP = 140;
const resultat = (cls, inner) => { const r = mk(`<div class="resultat ${cls}" style="position:absolute;left:40px;right:40px;height:112px;margin:0">${inner}</div>`, rech); return r; };
const concurrent = () => resultat('', '<div class="url"><span class="favicon"></span><span style="width:200px;height:10px;border-radius:5px;background:#e4e9f1;display:block"></span></div><div class="t"></div><div class="l"></div><span class="etiquette">Concurrent</span>');
const R = [concurrent(), concurrent(), concurrent()];
const vous = resultat('vous', '<div class="url"><span class="favicon" style="background:var(--veil);border-color:var(--veil)"></span>votre-entreprise.fr</div><div class="titre-res">Votre entreprise — Plombier à Vannes</div><div class="l" style="width:70%"></div>');
const placeRang = (el, i) => gsap.set(el, { top: RTOP + i * PITCH });
R.forEach((r, i) => placeRang(r, i));
placeRang(vous, 2); set0(vous, { autoAlpha: 0 });
P.typed = 0;
const REQ = 'plombier Vannes';

// emplacement rouge « introuvable » : élément du monde, posé sur la 4e ligne
const SLOT = { x: RECH.cx - RECH.w / 2 + 40, y: RECH.cy - RECH.h / 2 + RTOP + 3 * PITCH, w: RECH.w - 80, h: 112 };
const slot = mk(`<div class="emplacement"><span class="croix-rouge" style="width:52px;height:52px">${I.croix()}</span><span class="slot-txt">Votre entreprise ? Introuvable.</span></div>`);
Object.assign(slot.style, { left: SLOT.x + 'px', top: SLOT.y + 'px', width: SLOT.w + 'px', height: SLOT.h + 'px' });

// titres rouges (même emplacement, l'un après l'autre)
const titre = (txt, x, y, cls = '') => { const el = mk(`<div class="titre ${cls}">${txt}</div>`); at(el, x, y); set0(el, { xPercent: -50, yPercent: -50, autoAlpha: 0 }); return el; };
const tInvisible = titre(`<span class="titre-pastille"><span class="croix-rouge">${I.croix()}</span>Invisible sur Google</span>`, 0, -455, 'rouge');

// Ancien site
const OLD = { cx: 2100, cy: 0, w: 1180, h: 740 };
const pixelURL = (() => { const c = document.createElement('canvas'); c.width = 30; c.height = 23; const g = c.getContext('2d');
  for (let y = 0; y < 23; y++) for (let x = 0; x < 30; x++) { const sky = y < 9; const v = rnd();
    g.fillStyle = sky ? `rgb(${120 + v * 40},${150 + v * 40},${190 + v * 30})` : (y < 15 ? `rgb(${150 + v * 50},${120 + v * 40},${90 + v * 30})` : `rgb(${90 + v * 60},${100 + v * 50},${80 + v * 40})`); g.fillRect(x, y, 1, 1); }
  g.fillStyle = '#6b4a3a'; g.fillRect(9, 8, 12, 8); g.fillStyle = '#c0392b'; g.fillRect(8, 5, 14, 4); return c.toDataURL(); })();
const ancienHTML = `<div class="ancien">
  <div class="entete"><h1>Bienvenue sur le site de Votre Entreprise !!</h1></div>
  <div class="menu"><span>Accueil</span><span>Qui sommes-nous</span><span>Nos services</span><span>Livre d'or</span><span>Contact</span></div>
  <div class="corps"><img class="pixel" src="${pixelURL}">
    <div class="texte"><div class="defile">★ NOUVEAU ★ Site en construction ★ Revenez bientôt ★</div>
      <p>Notre entreprise familiale vous accueille depuis de nombreuses années. N'hésitez pas à nous contacter par téléphone aux heures d'ouverture du bureau pour toute demande de renseignement, nous vous rappellerons dans les meilleurs délais.</p>
      <p>Retrouvez prochainement nos réalisations dans la rubrique dédiée. Merci de votre visite et à bientôt sur notre site internet. Meilleure résolution : 1024 × 768.</p></div></div>
  <div class="pied"><span>Dernière mise à jour : mars 2012</span><span>Visiteurs : <span class="compteur">000127</span></span></div>
</div>`;
const oldB = box(mk(`<div class="navigateur"><div class="nav-barre"><i></i><i></i><i></i><div class="nav-url">votre-entreprise.free-pages.fr/accueil.htm</div></div><div class="nav-contenu">${ancienHTML}</div></div>`), OLD.cx, OLD.cy, OLD.w, OLD.h);
const oldNet = box(mk(`<div class="navigateur" style="box-shadow:none"><div class="nav-barre"><i></i><i></i><i></i><div class="nav-url">votre-entreprise.free-pages.fr/accueil.htm</div></div><div class="nav-contenu">${ancienHTML}</div></div>`), OLD.cx, OLD.cy, OLD.w, OLD.h);
set0([oldB, oldNet], { autoAlpha: 0 });
const oldBC = q('.nav-contenu', oldB);

const tDate = titre('Site daté', 2250, -500, 'rouge');
const tLent = titre('Trop lent', 2960, -330, 'rouge');
const tZero = titre('0 demande', 1720, 120, 'rouge');

// téléphone lent
const tel1 = box(mk(`<div class="telephone"><div class="ecran"><span class="encoche"></span><div class="chargement"><div class="roue"></div></div><div class="barre-charge"></div><div class="chrono tnum"><span class="cv">0,0 s</span><small>et la page ne s'affiche toujours pas</small></div></div></div>`), 2960, 80, 310, 630);
set0(tel1, { autoAlpha: 0 });
const roue = q('.roue', tel1), chronoV = q('.cv', tel1), barreCharge = q('.barre-charge', tel1);
P.chrono = 0; P.charge = 0;

// widget « 0 demande »
const wid = box(mk(`<div class="carte widget-boite"><span class="ico">${I.mail('#d92d20')}</span><div><div class="lib">Demandes de devis ce mois-ci</div><div class="nb tnum">0 demande</div></div></div>`), 1760, 290, 640, 190);
set0(wid, { autoAlpha: 0 });

/* --- animation acte 1 --- */
show(rech, 0.0, { y: 30, s: 0.96, b: 18, d: 1.4 });
tl.to(P, { typed: REQ.length, duration: 1.45, ease: 'none' }, 0.75);
R.forEach((r, i) => show(r, 2.35 + i * 0.13, { y: 30, b: 8, d: 0.9 }));
// les concurrents s'allument tour à tour pendant la phrase 2
R.forEach((r, i) => { tl.to(r, { backgroundColor: '#f1f4f9', duration: .35, ease: 'power2.out' }, 4.0 + i * .32); tl.to(r, { backgroundColor: 'rgba(241,244,249,0)', duration: .6, ease: 'power2.inOut' }, 4.45 + i * .32); });
show(slot, 4.9, { y: 20, b: 10, d: 0.9 });
show(tInvisible, 4.5, { y: 20, b: 16, d: 1.0 });
hide(tInvisible, 7.3, { d: .5 });

// l'emplacement rouge devient l'ancien site
to(slot, 7.45, { left: OLD.cx - OLD.w / 2, top: OLD.cy - OLD.h / 2, width: OLD.w, height: OLD.h, borderRadius: 22, duration: 1.25, ease: 'power3.inOut' }, 1.25, 'power3.inOut');
to(q('.slot-txt', slot), 7.75, { autoAlpha: 0 }, .3, 'none');
to(q('.croix-rouge', slot), 7.75, { autoAlpha: 0 }, .3, 'none');
tl.fromTo(oldB, { autoAlpha: 0, filter: 'blur(14px)' }, { autoAlpha: 1, filter: 'blur(0px)', duration: .9, ease: 'power2.out' }, 8.25);
to(slot, 8.5, { autoAlpha: 0 }, .5, 'none');
to(rech, 7.6, { autoAlpha: 0.0, filter: 'blur(6px)' }, 1.2, 'power2.inOut');

show(tDate, 7.95, { y: 18, b: 14, d: .9 });
hide(tDate, 9.4, { d: .4 });
show(tel1, 9.0, { x: 120, y: 0, b: 10, d: 1.1 });
show(tLent, 9.75, { y: 60, s: .7, b: 14, d: 1.0 });
tl.to(P, { charge: 0.34, duration: 1.5, ease: 'power2.out' }, 9.4);
tl.to(P, { chrono: 8.4, duration: 1.6, ease: 'power1.inOut' }, 9.6);
hide(tLent, 11.15, { d: .4 });
show(wid, 11.1, { y: 60, b: 10, d: 1.0 });
tl.to(wid, { scale: 1.08, duration: .3, ease: 'power2.out' }, 11.6); tl.to(wid, { scale: 1, duration: .7, ease: 'back.out(2.2)' }, 11.9);
tl.to(q('.ico', wid), { rotation: -12, duration: .08, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 11.65);


// caméra acte 1
camTo(0, 2.2, { x: 20, y: -245, s: 1.5 }, 'sine.inOut');
camTo(2.2, 2.2, { x: 0, y: 10, s: 1.0 }, 'power3.inOut');
camTo(4.4, 3.0, { y: 20, s: 0.97 }, 'sine.inOut');
camTo(7.45, 1.35, { x: 2280, y: 0, s: 0.80, r: -0.6, ry: -3 }, 'power3.inOut');
camTo(8.8, 5.4, { x: 2240, y: 10, s: 0.84, r: 0, ry: 0 }, 'sine.inOut');

/* =====================================================================
   ACTE 2 — L'AUDIT
   ===================================================================== */
const tAudit = titre('Audit <span class="accent">gratuit</span>', 2100, -470);
const loupe = mk(`<div class="loupe"><div class="bord"></div>${I.vise('rgba(8,78,255,.55)')}<div class="reflet"></div></div>`);
P.lx = 1300; P.ly = -700; P.lr = 150; P.flou = 0;
set0(loupe, { autoAlpha: 0 });
const SPOTS = [
  { x: 2100, y: -258, t: 'Absent de Google', tx: 2100, ty: -150 },
  { x: 1690, y: 0, t: '8,4 s d\'attente', tx: 1690, ty: 175 },
  { x: 2380, y: 30, t: 'Illisible sur mobile', tx: 2380, ty: 150 },
  { x: 2050, y: 318, t: 'Aucun bouton devis', tx: 2050, ty: 210 },
];
const tags = SPOTS.map((s, i) => { const e = mk(`<div class="etiquette-audit carte-verre"><span class="num">${i + 1}</span>${s.t}</div>`); at(e, s.tx, s.ty); set0(e, { xPercent: -50, yPercent: -50, autoAlpha: 0 }); return e; });

// sortie des éléments du problème
hide(tel1, 14.2, { y: 40, d: .7 });
hide(wid, 14.25, { y: 40, d: .7 });
tl.to(P, { flou: 1, duration: 1.0, ease: 'power2.inOut' }, 14.6);
tl.fromTo(loupe, { autoAlpha: 0, scale: 2.4, filter: 'blur(18px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 1.3, ease: 'expo.out' }, 14.55);
tl.to(P, { lx: SPOTS[0].x, ly: SPOTS[0].y, duration: 1.3, ease: 'expo.out' }, 14.55);
show(tAudit, 15.0, { y: 18, b: 16, d: 1.0 });
hide(tAudit, 19.3, { d: .5 });
SPOTS.forEach((s, i) => {
  const t0 = 15.75 + i * 0.95;
  if (i) tl.to(P, { lx: s.x, ly: s.y, duration: .8, ease: 'power3.inOut' }, t0 - .55);
  show(tags[i], t0 + .15, { y: 14, s: .85, b: 8, d: .7, e: 'back.out(1.6)' });
});
tl.to(P, { lx: 2900, ly: -60, duration: 1.0, ease: 'power3.in' }, 19.55);
to(loupe, 20.1, { autoAlpha: 0, scale: .6 }, .5, 'power2.in');

// Rapport d'audit
const REP = { cx: 3560, cy: 0, w: 560, h: 700 };
const rap = box(mk(`<div class="carte rapport">
  <div class="entete-r"><span class="doc ico-bleu">${I.doc()}</span><div><h3>Rapport d'audit</h3><div class="sous">votre-entreprise.free-pages.fr</div></div></div>
  <div class="score">4 points vous font perdre des clients</div>
  ${SPOTS.map((s, i) => `<div class="ligne-r"><span class="etat"><span class="num">${i + 1}</span></span><span class="txt"><span class="avant" style="color:var(--rouge)">${s.t}</span><span class="apres"></span></span></div>`).join('')}
  <span class="pastille-illu" style="right:24px;bottom:22px">Illustration</span>
</div>`), REP.cx, REP.cy, REP.w, REP.h);
set0(rap, { autoAlpha: 0 });
const lignes = qa('.ligne-r', rap);
show(rap, 19.75, { x: 80, y: 0, b: 14, d: 1.1 });
lignes.forEach((l) => set0(l, { autoAlpha: 0 }));
// les étiquettes volent dans le rapport
const ROWY = (i) => REP.cy - REP.h / 2 + 170 + i * 88 + 38;
tags.forEach((g, i) => {
  const t0 = 20.15 + i * 0.16;
  tl.to(g, { left: REP.cx - 20, top: ROWY(i), scale: .9, duration: .85, ease: 'power3.inOut' }, t0);
  tl.to(g, { autoAlpha: 0, duration: .25, ease: 'none' }, t0 + .75);
  tl.to(lignes[i], { autoAlpha: 1, duration: .3, ease: 'none' }, t0 + .72);
});


camTo(14.4, 1.2, { x: 2130, y: 10, s: 0.95 }, 'power3.inOut');
camTo(15.6, 3.9, { x: 2160, y: 0, s: 0.97 }, 'sine.inOut');
camTo(19.5, 1.5, { x: 2780, y: 0, s: 0.74, r: -0.4 }, 'power3.inOut');
camTo(21.0, 1.6, { x: 2830, y: 0, s: 0.75, r: 0 }, 'sine.inOut');

/* =====================================================================
   ACTE 3 — LA MAQUETTE
   ===================================================================== */
const MAQ = { cx: 5000, cy: 0, w: 1180, h: 740 };
const MX = MAQ.cx - MAQ.w / 2, MY = MAQ.cy - MAQ.h / 2 + 52; // origine du contenu
const maq = box(mk(`<div class="navigateur"><div class="nav-barre"><i></i><i></i><i></i><div class="nav-url"><span class="url-maq">Maquette — votre-entreprise.fr</span></div></div><div class="nav-contenu"><div class="maquette-fond"></div><div class="wire"></div><div class="site-l"></div></div></div>`), MAQ.cx, MAQ.cy, MAQ.w, MAQ.h);
set0(maq, { autoAlpha: 0 });
const wire = q('.wire', maq);
const bloc = (cls, x, y, w, h, parent = wire) => { const b = mk(`<div class="bloc ${cls}"></div>`, parent); Object.assign(b.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }); return b; };
const WB = {
  nav: [bloc('ink', 40, 20, 34, 34), bloc('gris', 88, 30, 130, 14), bloc('gris', 640, 32, 70, 10), bloc('gris', 730, 32, 90, 10), bloc('gris', 840, 32, 80, 10), bloc('bleu', 980, 18, 160, 38)],
  titre: [bloc('ink', 40, 130, 470, 46), bloc('ink', 40, 188, 360, 46)],
  lignes: [bloc('gris', 40, 266, 440, 12), bloc('gris', 40, 288, 380, 12)],
  cta: [bloc('bleu', 40, 336, 240, 60), bloc('blanc', 296, 336, 150, 60)],
  image: [bloc('veil', 600, 108, 540, 380)],
  tuiles: [bloc('blanc', 40, 528, 355, 130), bloc('blanc', 412, 528, 355, 130), bloc('blanc', 784, 528, 355, 130)],
};
Object.values(WB).flat().forEach((b) => set0(b, { autoAlpha: 0 }));
// téléphone filaire
const tel2 = box(mk(`<div class="telephone"><div class="ecran"><span class="encoche"></span><div class="maquette-fond"></div><div class="wire-m"></div><div class="mobile-l"></div></div></div>`), 5660, 90, 290, 590);
set0(tel2, { autoAlpha: 0 });
const wm = q('.wire-m', tel2);
const WM = [bloc('ink', 18, 70, 200, 30, wm), bloc('ink', 18, 108, 150, 30, wm), bloc('bleu', 18, 160, 230, 46, wm), bloc('veil', 18, 222, 230, 150, wm), bloc('blanc', 18, 386, 110, 90, wm), bloc('blanc', 138, 386, 110, 90, wm)];
WM.forEach((b) => set0(b, { autoAlpha: 0 }));

const tMaq = titre('Votre <span class="accent">maquette</span>', 5000, -455);
const SOL = ['Visible sur Google', 'Rapide à s\'afficher', 'Lisible sur téléphone', 'Bouton devis visible'];
lignes.forEach((l, i) => { const ap = q('.apres', l); ap.textContent = SOL[i]; ap.style.color = 'var(--accent-strong)'; set0(ap, { autoAlpha: 0, y: 14 }); });

// repères numérotés
const REPERES = [[MX + 520, MY + 130], [MX + 1130, MY + 118], [5660 + 130, 90 - 280], [MX + 290, MY + 336]];
const reps = REPERES.map(([x, y], i) => { const r = mk(`<div class="repere">${i + 1}</div>`); at(r, x, y); set0(r, { autoAlpha: 0 }); return r; });

// sortie de l'ancien site, entrée de la maquette
tl.to(oldB, { x: (REP.cx - REP.w / 2 + 60) - OLD.cx, y: (REP.cy - REP.h / 2 + 60) - OLD.cy, scale: .04, duration: .9, ease: 'power3.in' }, 21.9);
tl.to(oldB, { autoAlpha: 0, duration: .25, ease: 'none' }, 22.6);
to(oldNet, 22.2, { autoAlpha: 0 }, .5, 'none');
show(maq, 22.55, { x: 60, y: 0, b: 16, d: 1.2 });
show(tMaq, 23.3, { y: 18, b: 16, d: 1.0 });
// chaque ligne du rapport passe du problème à la solution, puis un bloc vole vers la maquette
const CIBLES = [WB.titre, WB.image, null, WB.cta];
lignes.forEach((l, i) => {
  const t0 = 23.35 + i * 0.85;
  const num = q('.num', l);
  tl.to(num, { backgroundColor: '#084eff', duration: .4, ease: 'power2.out' }, t0);
  tl.to(q('.avant', l), { autoAlpha: 0, y: -16, filter: 'blur(4px)', duration: .25, ease: 'power2.in' }, t0);
  tl.to(q('.apres', l), { autoAlpha: 1, y: 0, duration: .6, ease: 'expo.out' }, t0 + .3);
  tl.to(l, { backgroundColor: '#dce5fb', duration: .5, ease: 'power2.out' }, t0);
  // fantôme : de la ligne vers sa cible
  const r0 = { x: REP.cx - REP.w / 2 + 34, y: ROWY(i) - 38, w: REP.w - 68, h: 76 };
  let tgt;
  if (i === 2) tgt = { x: 5660 - 145, y: 90 - 295, w: 290, h: 590, rad: 48 };
  else { const bs = CIBLES[i]; const xs = bs.map((b) => parseFloat(b.style.left)), ys = bs.map((b) => parseFloat(b.style.top));
    const x2 = Math.max(...bs.map((b) => parseFloat(b.style.left) + parseFloat(b.style.width))), y2 = Math.max(...bs.map((b) => parseFloat(b.style.top) + parseFloat(b.style.height)));
    tgt = { x: MX + Math.min(...xs), y: MY + Math.min(...ys), w: x2 - Math.min(...xs), h: y2 - Math.min(...ys), rad: 12 }; }
  const g = mk('<div class="ghost" style="background:rgba(8,78,255,.16);border:2px solid rgba(8,78,255,.55)"></div>');
  Object.assign(g.style, { left: r0.x + 'px', top: r0.y + 'px', width: r0.w + 'px', height: r0.h + 'px' }); set0(g, { autoAlpha: 0 });
  tl.to(g, { autoAlpha: 1, duration: .2, ease: 'none' }, t0 + .25);
  tl.to(g, { left: tgt.x, top: tgt.y, width: tgt.w, height: tgt.h, borderRadius: tgt.rad, duration: 1.0, ease: 'power3.inOut' }, t0 + .25);
  tl.to(g, { autoAlpha: 0, duration: .35, ease: 'none' }, t0 + 1.2);
  if (i === 2) { show(tel2, t0 + 1.0, { x: 40, y: 0, b: 8, d: .9 }); WM.forEach((b, k) => show(b, t0 + 1.1 + k * .06, { y: 10, b: 4, d: .6 })); }
  else CIBLES[i].forEach((b, k) => show(b, t0 + 1.05 + k * .08, { y: 10, b: 4, d: .6 }));
  show(reps[i], t0 + 1.25, { s: .5, y: 0, b: 6, d: .7, e: 'back.out(2)' });
});
// le reste de la maquette se construit
[...WB.nav, ...WB.lignes, ...WB.tuiles].forEach((b, k) => show(b, 24.0 + k * .07, { y: 14, b: 4, d: .7 }));

// validation
const souris = mk(`<div class="souris">${I.souris}</div>`); set0(souris, { autoAlpha: 0 });
P.mx = 5500; P.my = 700;
const valider = mk(`<div class="btn btn-primaire valider"><span class="v-txt">Valider la maquette</span>${I.fleche}</div>`); at(valider, 5000, 425); set0(valider, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
const pastOK = mk(`<div class="btn btn-verre valider" style="font-size:24px;padding:16px 26px;color:var(--accent-strong)"><span class="ico-bleu" style="width:36px;height:36px;border-radius:50%;display:grid;place-items:center">${I.coche('#fff', 3)}</span>Maquette validée</div>`); at(pastOK, 5000, 425); set0(pastOK, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
const clic = (x, y, t) => { const c = mk('<div class="clic"></div>'); at(c, x, y); tl.fromTo(c, { autoAlpha: .9, scale: .2 }, { autoAlpha: 0, scale: 1.4, duration: .7, ease: 'expo.out' }, t); return c; };
show(valider, 27.6, { y: 20, b: 10, d: .9 });
tl.to(souris, { autoAlpha: 1, duration: .3 }, 27.9);
tl.to(P, { mx: 5040, my: 432, duration: 1.1, ease: 'power3.inOut' }, 27.9);
tl.to(valider, { scale: .94, duration: .12, ease: 'power2.in' }, 29.0);
tl.to(valider, { scale: 1, duration: .3, ease: 'back.out(2)' }, 29.12);
clic(5040, 432, 29.05);
hide(valider, 29.35, { d: .3, y: 0 });
show(pastOK, 29.45, { y: 0, s: .85, b: 6, d: .7, e: 'back.out(1.8)' });
reps.forEach((r, i) => tl.to(r, { backgroundColor: '#084eff', color: '#fff', duration: .35, ease: 'power2.out' }, 29.45 + i * .1));
tl.to(P, { mx: 5400, my: 640, duration: 1.0, ease: 'power2.inOut' }, 29.9);
tl.to(souris, { autoAlpha: 0, duration: .4 }, 30.6);
hide(tMaq, 27.2, { d: .5 });
hide(rap, 27.0, { x: -40, y: 0, d: 1.0, b: 12 });

camTo(22.4, 1.5, { x: 4320, y: 0, s: 0.70, r: -0.3, ry: -2 }, 'power3.inOut');
camTo(23.9, 3.4, { x: 4420, y: 0, s: 0.71, r: 0, ry: 0 }, 'sine.inOut');
camTo(27.3, 1.4, { x: 5060, y: 40, s: 0.86 }, 'power3.inOut');
camTo(28.7, 3.4, { x: 5060, y: 45, s: 0.87 }, 'sine.inOut');

/* =====================================================================
   ACTE 4 — LA CONSTRUCTION
   ===================================================================== */
const siteL = q('.site-l', maq);
const illustration = (h) => `<div class="carte-bleue" style="position:absolute;inset:0"></div><div class="trame-bleue"></div>
  <svg viewBox="0 0 540 380" style="position:absolute;inset:0;width:100%;height:100%" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
    <g opacity=".95" stroke-width="5"><path d="M70 300h150a40 40 0 0 0 40-40V170a30 30 0 0 1 30-30h80"/><path d="M370 116v48"/><rect x="350" y="96" width="40" height="22" rx="6"/><path d="M342 140h56"/></g>
    <g opacity=".9" stroke-width="4"><path d="M380 190s28 30 28 50a28 28 0 0 1-56 0c0-20 28-50 28-50z"/></g>
    <g opacity=".35" stroke-width="2"><circle cx="420" cy="250" r="70"/><circle cx="420" cy="250" r="100"/></g>
  </svg>
  <div class="sphere" style="width:${h * .2}px;height:${h * .2}px;left:6%;top:9%"></div>`;
siteL.innerHTML = `<div class="site">
  <div class="nav"><span class="marque"><i class="ico-bleu">${I.goutte()}</i>Votre entreprise</span><span class="liens"><span>Services</span><span>Réalisations</span><span>Contact</span></span><span class="btn btn-primaire">Demander un devis</span></div>
  <div class="heros"><h2>Plombier à Vannes. <span class="doux">Dépannage rapide, travail soigné.</span></h2>
    <p class="chapo">Fuite, salle de bain, chauffe-eau : on intervient à Vannes et dans tout le Golfe du Morbihan.</p>
    <div class="boutons"><span class="btn btn-primaire">Demander un devis ${I.fleche}</span><span class="btn btn-verre">${I.tel('#0e2340').replace('<svg', '<svg width="20" height="20"')}Appeler</span></div></div>
  <div class="panneau">${illustration(380)}<div class="carte-verre" style="position:absolute;left:24px;bottom:24px;border-radius:16px;padding:14px 18px;font-size:17px;font-weight:600;display:flex;gap:10px;align-items:center"><i class="ico-bleu" style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center">${I.epingle()}</i>Vannes et Golfe du Morbihan</div></div>
  <div class="tuiles"><div class="tuile"><i class="ico-bleu">${I.cle()}</i><b>Dépannage</b></div><div class="tuile"><i class="ico-bleu">${I.bain()}</i><b>Salle de bain</b></div><div class="tuile"><i class="ico-bleu">${I.flamme()}</i><b>Chauffe-eau</b></div></div>
</div>`;
const site = q('.site', siteL);
const SB = [q('.nav', site), q('.heros h2', site), q('.chapo', site), q('.boutons', site), q('.panneau', site), ...qa('.tuile', site)];
set0(site, { autoAlpha: 0 }); SB.forEach((e) => set0(e, { autoAlpha: 0 }));
// version mobile
const mobileHTML = (avecSections) => `<div class="mobile">
  <div class="m-nav"><b><i class="ico-bleu">${I.goutte()}</i>Votre entreprise</b><span></span></div>
  <div class="m-defile">
    <h4>Plombier à Vannes. <span class="doux">Dépannage rapide.</span></h4>
    <span class="btn btn-primaire m-btn">Demander un devis</span>
    <div class="m-panneau">${illustration(180)}</div>
    ${avecSections ? `<div class="m-sec m-real"><h5>Nos réalisations</h5><div class="m-reals">
      ${[I.bain(), I.cle(), I.flamme(), I.goutte()].map((ic, k) => `<div class="${k % 3 ? 'carte-bleue' : ''}" style="${k % 3 ? '' : 'background:linear-gradient(160deg,#dce5fb,#9db8ff)'}"><span style="position:absolute;right:10px;bottom:10px;width:30px;height:30px;opacity:.9">${ic}</span></div>`).join('')}</div></div>
      <div class="m-sec m-hor"><h5>Horaires</h5><div class="m-horaires"><p><span>Lundi – vendredi</span><b>8 h – 19 h</b></p><p><span>Samedi</span><b>9 h – 12 h</b></p></div></div>
      <div class="m-sec m-tel"><span class="btn btn-verre m-appel">${I.tel('#0e2340').replace('<svg', '<svg width="20" height="20"')}&nbsp;Appeler</span></div>
      <div class="m-sec m-devis"><h5>Votre projet</h5><div class="m-horaires" style="line-height:1"><div class="champ-m" style="height:36px;border-radius:10px;background:#fff;border:1px solid var(--line);margin-bottom:8px"></div><div class="champ-m" style="height:36px;border-radius:10px;background:#fff;border:1px solid var(--line);margin-bottom:8px"></div><div class="champ-m" style="height:60px;border-radius:10px;background:#fff;border:1px solid var(--line)"></div></div><span class="btn btn-primaire m-btn m-envoi" style="margin:12px 0 0">Demander un devis</span></div>` : ''}
  </div></div>`;
q('.mobile-l', tel2).innerHTML = mobileHTML(false);
const mob2 = q('.mobile', tel2); set0(mob2, { autoAlpha: 0 });

const tSite = titre('Votre <span class="accent">site</span>', 5000, -455);
// carte de performance
const phare = box(mk(`<div class="carte carte-verre phare"><div class="t"><span>Performance mesurée par Google</span></div><div class="jauges">
  ${['Performance', 'Accessibilité', 'Bonnes pratiques'].map((l) => `<div class="jauge"><div class="jauge-wrap"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" stroke="#dce5fb" stroke-width="9" fill="none"/><circle class="arc" cx="50" cy="50" r="42" stroke="#084eff" stroke-width="9" fill="none" stroke-linecap="round" transform="rotate(-90 50 50)" stroke-dasharray="263.9" stroke-dashoffset="263.9"/></svg><span class="tnum">0</span></div><p>${l}</p></div>`).join('')}
</div><span class="pastille-illu" style="right:18px;top:16px">Illustration</span></div>`), 4120, -250, 600, 300);
set0(phare, { autoAlpha: 0 });
P.jauge = 0;

// ---- animation acte 4

tl.to(reps, { autoAlpha: 0, scale: .5, duration: .5, ease: 'power2.in', stagger: .05 }, 32.3);
hide(pastOK, 32.3, { d: .5 });
tl.set(site, { autoAlpha: 1 }, 32.2);
const PAIRES = [WB.nav, WB.titre, WB.lignes, WB.cta, WB.image, [WB.tuiles[0]], [WB.tuiles[1]], [WB.tuiles[2]]];
SB.forEach((e, k) => { show(e, 32.3 + k * .16, { y: 40, b: 10, d: 1.1 }); tl.to(PAIRES[k], { autoAlpha: 0, filter: 'blur(6px)', duration: .45, ease: 'power2.in' }, 32.25 + k * .16); });
show(tSite, 32.55, { y: 18, b: 16, d: 1.0 });
hide(tSite, 35.9, { d: .5 });
tl.to(q('.maquette-fond', maq), { autoAlpha: 0, duration: 1.2 }, 33.6);
tl.to(q('.url-maq', maq), { autoAlpha: 0, duration: .3 }, 32.6);
// téléphone : la maquette mobile se remplit puis le téléphone passe devant
tl.to(wm, { autoAlpha: 0, duration: .6 }, 35.6);
tl.to(q('.maquette-fond', tel2), { autoAlpha: 0, duration: .6 }, 35.6);
show(mob2, 35.7, { y: 30, b: 8, d: 1.0 });
tl.to(tel2, { x: -40, y: 20, scale: 1.18, duration: 1.6, ease: 'power3.inOut' }, 36.0);
show(phare, 36.9, { y: 30, b: 12, d: 1.0 });
tl.to(P, { jauge: 1, duration: 1.6, ease: 'power2.out' }, 37.3);

camTo(32.1, 4.0, { x: 5000, y: 10, s: 0.9 }, 'sine.inOut');
camTo(36.0, 1.6, { x: 4900, y: 10, s: 0.84 }, 'power3.inOut');
camTo(37.6, 2.6, { x: 4890, y: 40, s: 0.85 }, 'sine.inOut');

/* =====================================================================
   ACTE 5 — MISE EN LIGNE → RÉFÉRENCEMENT LOCAL
   ===================================================================== */
const enLigne = mk(`<div class="btn btn-primaire mettre-en-ligne"><span style="width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 0 0 6px rgba(255,255,255,.25)"></span>Mettre en ligne</div>`); at(enLigne, 5000, 425); set0(enLigne, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
const tEnLigne = titre('En <span class="accent">ligne</span>', 5000, -455);
show(enLigne, 40.0, { y: 20, b: 10, d: .9 });
hide(phare, 40.2, { d: .5 });
tl.to(tel2, { x: 0, y: 0, scale: 1, duration: 1.0, ease: 'power3.inOut' }, 40.0);
tl.to(souris, { autoAlpha: 1, duration: .3 }, 40.1);
tl.to(P, { mx: 5050, my: 432, duration: .9, ease: 'power3.inOut' }, 40.1);
tl.to(enLigne, { scale: .94, duration: .12, ease: 'power2.in' }, 41.05);
tl.to(enLigne, { scale: 1, duration: .3, ease: 'back.out(2)' }, 41.17);
clic(5050, 432, 41.1);
tl.to(souris, { autoAlpha: 0, duration: .4 }, 41.6);
// l'adresse devient le vrai domaine
const urlMaq = q('.nav-url', maq);
const urlLive = mk(`<span class="url-live" style="display:flex;align-items:center;gap:8px;color:var(--ink);font-weight:500">${I.cadenas}votre-entreprise.fr</span>`, urlMaq); set0(urlLive, { autoAlpha: 0 });
show(urlLive, 41.25, { y: 6, b: 6, d: .6 });
show(tEnLigne, 41.3, { y: 18, b: 16, d: 1.0 });
hide(tEnLigne, 42.35, { d: .5 });
hide(enLigne, 41.9, { d: .4, y: 0 });

// ondes
const ondes = [0, 1, 2, 3].map(() => { const o = mk('<div class="onde"></div>'); at(o, 5000, 0); set0(o, { xPercent: -50, yPercent: -50, width: 200, height: 200, autoAlpha: 0 }); return o; });
ondes.forEach((o, i) => tl.fromTo(o, { width: 300, height: 300, autoAlpha: .9, borderWidth: 4 }, { width: 3600, height: 3600, autoAlpha: 0, borderWidth: 1, duration: 2.6, ease: 'power2.out', immediateRender: false }, 41.3 + i * .35));

// Carte du Morbihan
const PAN = { x: 2350, y: -1700, w: 5300, h: 3000 };
const K = 2.6, VX = 5000 - 577.3 * K, VY = 0 - 484.8 * K; // Vannes au centre du site
const carte = mk(`<div class="carte-panneau carte-bleue"><div class="trame-large"></div><svg class="contour" viewBox="0 0 1000 824" width="${1000 * K}" height="${824 * K}" style="left:${VX - PAN.x}px;top:${VY - PAN.y}px"><path d="${D.carte.d}" fill="rgba(255,255,255,.10)" stroke="rgba(255,255,255,.62)" stroke-width="1.15" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg></div>`);
Object.assign(carte.style, { left: PAN.x + 'px', top: PAN.y + 'px', width: PAN.w + 'px', height: PAN.h + 'px' });
W.insertBefore(carte, W.querySelector('.navigateur'));
const contour = q('path', carte);
set0(carte, { clipPath: `circle(0px at ${5000 - PAN.x}px ${0 - PAN.y}px)` });
P.trace = 0;
const comms = D.carte.communes.map((c) => { const wx = VX + c.x * K, wy = VY + c.y * K; const cote = { 'Vannes': 'd v', 'Séné': 'b', 'Saint-Avé': 'h', 'Arradon': 'g', 'Plescop': 'g', 'Theix-Noyalo': 'd', 'Auray': 'b', 'Sarzeau': 'b' }[c.nom] || 'b';
  const e = mk(`<div class="commune"><div class="pt"></div><div class="nom ${cote}">${c.nom}</div></div>`); at(e, wx, wy); set0(e, { xPercent: -50, yPercent: -50, autoAlpha: 0 }); return { ...c, wx, wy, el: e }; });
const vannes = comms.find((c) => c.nom === 'Vannes');
const visee = mk(`<div class="visee">${[90, 150, 210].map((r) => `<div class="anneau" style="width:${r}px;height:${r}px"></div>`).join('')}<svg viewBox="0 0 100 100" style="position:absolute;width:260px;height:260px;left:-130px;top:-130px" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"><path d="M50 0v26M50 74v26M0 50h26M74 50h26"/></svg></div>`); at(visee, vannes.wx, vannes.wy); set0(visee, { autoAlpha: 0 });
qa('.anneau', visee).forEach((a) => set0(a, { xPercent: -50, yPercent: -50 }));

tl.to(carte, { clipPath: `circle(3700px at ${5000 - PAN.x}px ${0 - PAN.y}px)`, duration: 2.4, ease: 'power2.inOut' }, 42.0);
tl.to(P, { trace: 1, duration: 2.6, ease: 'power2.inOut' }, 43.0);
// le site se replie dans le repère de Vannes
tl.to([maq], { scale: 0.04, duration: 1.6, ease: 'power3.inOut', transformOrigin: '50% 50%' }, 42.7);
tl.to([maq], { autoAlpha: 0, duration: .4, ease: 'none' }, 44.0);
tl.to(tel2, { left: 5000 - 145, top: -295, scale: 0.04, autoAlpha: 0, duration: 1.4, ease: 'power3.inOut' }, 42.6);
show(visee, 43.9, { s: .3, y: 0, b: 8, d: 1.2 });
comms.filter((c) => c !== vannes).forEach((c, k) => show(c.el, 44.4 + k * .12, { y: -40, b: 6, d: .8, e: 'back.out(1.7)' }));
show(vannes.el, 44.2, { y: 0, s: .4, b: 6, d: .8 });

// Fiche d'établissement
const photo = (g, ic) => `<div style="background:${g}"><span style="position:absolute;right:12px;bottom:12px;width:30px;height:30px;opacity:.85">${ic}</span></div>`;
const fiche = box(mk(`<div class="carte fiche">
  <div class="photos">${photo('linear-gradient(160deg,#316bff,#063cc8)', I.cle())}${photo('linear-gradient(160deg,#dce5fb,#9db8ff)', I.bain())}${photo('linear-gradient(160deg,#1d5cff,#084eff)', I.flamme())}</div>
  <div class="corps-f"><h3>Votre entreprise</h3><div class="cat">Plombier · Vannes</div><div class="ouvert"><b>Ouvert</b> · Ferme à 19:00</div>
  <div class="actions"><div class="action"><i>${I.tel('#fff')}</i>Appeler</div><div class="action"><i>${I.route()}</i>Itinéraire</div><div class="action"><i>${I.web()}</i>Site web</div><div class="action"><i>${I.partage()}</i>Partager</div></div>
  <div class="adr">${I.epingle('#56667e').replace('<svg', '<svg width="20" height="20"')}Vannes, Golfe du Morbihan</div><div class="adr" style="border:none;margin-top:6px;padding-top:0">${I.web('#56667e').replace('<svg', '<svg width="20" height="20"')}votre-entreprise.fr</div><div class="adr" style="border:none;margin-top:6px;padding-top:0">${I.tel('#56667e').replace('<svg', '<svg width="20" height="20"')}Appel direct depuis la fiche</div></div>
  <span class="pastille-illu" style="right:16px;top:14px">Illustration</span></div>`), 5730, -40, 500, 650);
set0(fiche, { autoAlpha: 0 });
const ficheParts = [q('.photos', fiche), q('h3', fiche), q('.cat', fiche), q('.ouvert', fiche), q('.actions', fiche), ...qa('.adr', fiche)];
ficheParts.forEach((e) => set0(e, { autoAlpha: 0 }));
// trait qui relie le repère à la fiche
const lien = mk(`<svg class="abs" style="left:${vannes.wx}px;top:${vannes.wy - 40}px;overflow:visible" width="10" height="10"><path d="M0 40 C 200 40, 260 0, 480 0" stroke="#fff" stroke-width="3" fill="none" stroke-dasharray="1" stroke-dashoffset="1" pathLength="1" stroke-linecap="round"/></svg>`);
const lienP = q('path', lien);
tl.to(lienP, { strokeDashoffset: 0, duration: .9, ease: 'power2.inOut' }, 45.3);
tl.fromTo(fiche, { autoAlpha: 0, scale: .2, x: -560, filter: 'blur(10px)', transformOrigin: '0% 50%' }, { autoAlpha: 1, scale: 1, x: 0, filter: 'blur(0px)', duration: 1.3, ease: 'expo.out' }, 45.7);
ficheParts.forEach((e, k) => show(e, 46.1 + k * .14, { y: 20, b: 6, d: .8 }));

// Retour du résultat de recherche : « Votre entreprise » monte en tête
const tTrouve = titre('Vos clients vous trouvent sur Google', 4780, -590, 'blanc');
tl.set(rech, { left: 4080 - RECH.w / 2, top: -20 - RECH.h / 2, x: -1400, filter: 'blur(0px)' }, 48.6);
tl.set(R[2], { top: RTOP + 3 * PITCH }, 48.6);
tl.set(rech, { zIndex: 6 }, 48.6);
tl.to(rech, { autoAlpha: 1, x: 0, duration: 1.4, ease: 'expo.out' }, 48.75);
show(vous, 49.5, { y: 0, s: .95, b: 6, d: .6 });
tl.to(vous, { top: RTOP, duration: 1.0, ease: 'power3.inOut' }, 50.2);
tl.to(R[0], { top: RTOP + PITCH, duration: 1.0, ease: 'power3.inOut' }, 50.2);
tl.to(R[1], { top: RTOP + 2 * PITCH, duration: 1.0, ease: 'power3.inOut' }, 50.2);
show(tTrouve, 49.25, { y: 18, b: 16, d: 1.0 });
hide(tTrouve, 52.4, { d: .5 });

camTo(41.9, 2.8, { x: 5000, y: -150, s: 0.42, r: 0, rx: 4 }, 'power3.inOut');
camTo(44.7, 2.0, { x: 5170, y: 20, s: 0.80, rx: 0 }, 'power3.inOut');
camTo(46.7, 2.0, { x: 5250, y: -20, s: 0.80 }, 'sine.inOut');
camTo(48.6, 1.5, { x: 4800, y: 0, s: 0.76, r: 0.3 }, 'power3.inOut');
camTo(50.1, 2.3, { x: 4780, y: 0, s: 0.78, r: 0 }, 'sine.inOut');

/* =====================================================================
   ACTE 6 — LES VISITEURS
   ===================================================================== */
const TEL3 = { cx: 4250, cy: 20, w: 350, h: 700 };
const tel3 = box(mk(`<div class="telephone"><div class="ecran"><span class="encoche"></span>${mobileHTML(true)}</div></div>`), TEL3.cx, TEL3.cy, TEL3.w, TEL3.h);
set0(tel3, { autoAlpha: 0, zIndex: 7 });
const defile = q('.m-defile', tel3);
// le résultat « Votre entreprise » est cliqué et s'ouvre en téléphone
tl.to(souris, { autoAlpha: 1, duration: .3 }, 52.0);
tl.set(P, { mx: 4400, my: 200 }, 51.9);
tl.to(P, { mx: 4260, my: -160, duration: .7, ease: 'power3.inOut' }, 52.0);
clic(4260, -160, 52.75);
tl.to(souris, { autoAlpha: 0, duration: .3 }, 53.0);
const VR = { x: 4080 - 480, y: -20 - 330 + RTOP, w: 960, h: 112 };
const ecran3 = q('.ecran', tel3);
tl.set(tel3, { left: VR.x, top: VR.y, width: VR.w, height: VR.h, borderRadius: 16, autoAlpha: 1 }, 52.85);
tl.set(ecran3, { autoAlpha: 0 }, 52.85);
tl.to(tel3, { left: TEL3.cx - TEL3.w / 2, top: TEL3.cy - TEL3.h / 2, width: TEL3.w, height: TEL3.h, borderRadius: 48, duration: 1.05, ease: 'power3.inOut' }, 52.85);
tl.to(ecran3, { autoAlpha: 1, duration: .45, ease: 'power2.out' }, 53.45);
tl.set(vous, { autoAlpha: 0 }, 52.85);
to(rech, 52.9, { autoAlpha: 0, filter: 'blur(10px)' }, .7, 'power2.in');
hide(fiche, 52.6, { x: 60, y: 0, d: .7 });
to(lien, 52.6, { autoAlpha: 0 }, .4, 'none');

// tableau de bord
const DASH = { cx: 3640, cy: -20, w: 580, h: 480 };
const dash = box(mk(`<div class="carte carte-verre tableau"><h3>Visites de votre site</h3><div class="sous">Ces dernières semaines</div>
  <svg class="courbe" viewBox="0 0 520 220" width="520" height="220"><defs><linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#316bff" stop-opacity=".35"/><stop offset="1" stop-color="#316bff" stop-opacity="0"/></linearGradient><clipPath id="cpC"><rect class="cp" x="0" y="0" width="0" height="220"/></clipPath></defs>
    ${[50, 100, 150, 200].map((y) => `<line x1="0" x2="520" y1="${y}" y2="${y}" stroke="#d6deea" stroke-dasharray="4 6"/>`).join('')}
    <g clip-path="url(#cpC)"><path d="M0 205 C 60 200, 90 196, 130 186 S 200 170, 250 150 S 330 120, 380 90 S 460 40, 520 18 L520 220 L0 220Z" fill="url(#gC)"/>
    <path d="M0 205 C 60 200, 90 196, 130 186 S 200 170, 250 150 S 330 120, 380 90 S 460 40, 520 18" stroke="#084eff" stroke-width="5" fill="none" stroke-linecap="round"/></g>
    <circle class="bout" cx="520" cy="18" r="9" fill="#084eff" stroke="#fff" stroke-width="4"/></svg>
  <div class="sources"><span><i style="background:#084eff"></i>Recherche Google</span><span><i style="background:#9db8ff"></i>Google Maps</span></div>
  <span class="pastille-illu" style="right:20px;top:22px">Illustration</span></div>`), DASH.cx, DASH.cy, DASH.w, DASH.h);
set0(dash, { autoAlpha: 0 });
P.courbe = 0;
show(dash, 53.6, { x: -60, y: 0, b: 12, d: 1.1 });
hide(dash, 56.3, { x: -80, y: 0, d: .7 });
tl.to(P, { courbe: 1, duration: 3.6, ease: 'power2.inOut' }, 54.1);

// défilement du téléphone : travail, horaires, numéro
const focusA = mk('<div class="focus-anneau"></div>', q('.ecran', tel3)); set0(focusA, { autoAlpha: 0 });
// positions mesurées dans le téléphone (après chargement des polices) : voir mesuresTel()
P.sc = 0; P.fi = 0;
tl.to(P, { sc: 1, duration: 1.2, ease: 'power3.inOut' }, 56.5);
tl.to(P, { sc: 2, fi: 1, duration: 1.0, ease: 'power3.inOut' }, 58.1);
tl.to(P, { sc: 3, fi: 2, duration: .9, ease: 'power3.inOut' }, 59.4);
tl.to(focusA, { autoAlpha: 1, duration: .3 }, 57.2);
tl.to(focusA, { autoAlpha: 0, duration: .3 }, 60.9);
const MT = { sc: [0, 0, 0, 0, 0], rects: [], envoi: null };
const ECRAN = { x: TEL3.cx - TEL3.w / 2 + 12, y: TEL3.cy - TEL3.h / 2 + 12, w: TEL3.w - 24 };
function mesuresTel() {
  const sec = ['.m-real', '.m-hor', '.m-tel', '.m-envoi'].map((c) => q(c, tel3));
  const top = (e) => { let y = 0; while (e && e !== defile) { y += e.offsetTop; e = e.offsetParent; } return y; };
  MT.sc = [0, top(sec[0]) - 120, top(sec[1]) - 230, top(sec[2]) - 330, top(sec[3]) - 430];
  MT.rects = sec.slice(0, 3).map((e) => ({ y: top(e) - 10, h: e.offsetHeight + 20 }));
  MT.envoi = { y: top(sec[3]) + sec[3].offsetHeight / 2, x: sec[3].offsetLeft + sec[3].offsetWidth / 2 };
}
const scrollPx = () => { const i = Math.min(3, Math.floor(P.sc)), k = P.sc - i; return lerp(MT.sc[i], MT.sc[Math.min(4, i + 1)], k); };

camTo(52.6, 1.4, { x: 4180, y: 0, s: 0.84, r: 0 }, 'power3.inOut');
camTo(54.0, 2.6, { x: 4160, y: 0, s: 0.86 }, 'sine.inOut');
camTo(56.5, 1.3, { x: 4240, y: 30, s: 1.12, r: -0.3 }, 'power3.inOut');
camTo(57.8, 3.6, { x: 4250, y: 40, s: 1.16, r: 0 }, 'sine.inOut');

// points lumineux : des communes / du résultat vers le téléphone
const DOTS = [];
for (let k = 0; k < 44; k++) {
  const src = comms[k % comms.length];
  const e = mk(`<div class="point-visiteur ${k % 3 === 0 ? 'bleu' : ''}"></div>`); e.style.opacity = 0;
  DOTS.push({ el: e, t0: 53.2 + k * 0.17 + (rnd() - .5) * .12, d: 1.5 + rnd() * .5, sx: src.wx, sy: src.wy, cx: lerp(src.wx, TEL3.cx, .5) + (rnd() - .5) * 200, cy: Math.min(src.wy, -100) - 260 - rnd() * 260, ex: TEL3.cx + (rnd() - .5) * 120, ey: TEL3.cy - 230 + (rnd() - .5) * 60 });
}

/* =====================================================================
   ACTE 7 — LES DEMANDES
   ===================================================================== */
const BOX = { cx: 4300, cy: 1750, w: 1180, h: 700 };
const boite = box(mk(`<div class="carte boite"><div class="lat"><span class="btn btn-primaire ecrire">Nouveau message</span>
  <div class="dossier"><span>Boîte de réception</span><span class="badge tnum">0</span></div><div class="dossier gris"><span>Envoyés</span></div><div class="dossier gris"><span>Archives</span></div></div>
  <div class="liste"><h3>Demandes de devis</h3></div><span class="pastille-illu" style="right:20px;top:22px">Illustration</span></div>`), BOX.cx, BOX.cy, BOX.w, BOX.h);
set0(boite, { autoAlpha: 0 });
const liste = q('.liste', boite), badge = q('.badge', boite);
const MAILS = [['C', 'Claire M.', 'Rénovation salle de bain', 'Séné', '09:12'], ['T', 'Thomas L.', 'Fuite sous l\'évier', 'Vannes', '10:47'], ['S', 'Sophie R.', 'Remplacement chauffe-eau', 'Arradon', '14:05'], ['M', 'Marc D.', 'Devis plomberie neuve', 'Saint-Avé', '16:30']];
const mails = MAILS.map(([a, n, o, v, h]) => { const m = mk(`<div class="mail"><span class="nouveau"></span><span class="av">${a}</span><div><div class="de">${n} · via votre site</div><div class="obj">${o} <em>· ${v}</em></div></div><span class="h">${h}</span></div>`, liste); set0(m, { autoAlpha: 0, top: 84 }); return m; });
P.badge = 0;
const notif = mk(`<div class="notif carte-verre"><i>${I.mail()}</i><div><b>Nouvelle demande de devis</b><small>Rénovation salle de bain · Séné</small></div></div>`); at(notif, 4640, 1350); set0(notif, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 1.25 });
const notifSmall = q('small', notif);

// le visiteur appuie sur « Demander un devis »
tl.to(P, { sc: 4, duration: 1.0, ease: 'power3.inOut' }, 61.0);
const tapEl = mk('<div class="clic" style="border-color:#316bff;width:90px;height:90px;margin:-45px 0 0 -45px;z-index:9"></div>');
const tap = (t) => tl.fromTo(tapEl, { autoAlpha: .9, scale: .2 }, { autoAlpha: 0, scale: 1.3, duration: .6, ease: 'expo.out' }, t);
tap(62.1);
const envoi = q('.m-envoi', tel3);
tl.to(envoi, { scale: .94, duration: .1 }, 62.05); tl.to(envoi, { scale: 1, duration: .3, ease: 'back.out(2)' }, 62.15);
const ENVS = [62.35, 64.2, 65.4, 66.6];
const envs = ENVS.map(() => { const e = mk(`<div class="enveloppe ico-bleu">${I.mail()}</div>`); set0(e, { autoAlpha: 0, zIndex: 9 }); return e; });
P.env = ENVS.map(() => 0);
const ENV_DEST = { x: BOX.cx - BOX.w / 2 + 280 + 445, y: BOX.cy - BOX.h / 2 + 84 + 62 };
ENVS.forEach((t0, i) => {
  tl.fromTo(envs[i], { autoAlpha: 0, scale: .3 }, { autoAlpha: 1, scale: 1, duration: .45, ease: 'back.out(2)', immediateRender: false }, t0);
  tl.to(P.env, { [i]: 1, duration: 1.35, ease: 'power2.inOut' }, t0);
  tl.to(envs[i], { autoAlpha: 0, scale: .5, duration: .25 }, t0 + 1.25);
  const ta = t0 + 1.3;
  mails.forEach((m, k) => { if (k < i) tl.to(m, { top: 84 + (i - k) * 140, duration: .7, ease: 'power3.inOut' }, ta); });
  tl.fromTo(mails[i], { autoAlpha: 0, scale: .96, top: 84, backgroundColor: '#dce5fb' }, { autoAlpha: 1, scale: 1, backgroundColor: '#ffffff', duration: 1.4, ease: 'expo.out', immediateRender: false }, ta);
  tl.to(P, { badge: i + 1, duration: .01 }, ta + .1);
  if (i === 0) tl.fromTo(notif, { autoAlpha: 0, y: -30, filter: 'blur(10px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: .9, ease: 'expo.out' }, ta + .1);
  else { tl.to(notif, { y: -10, duration: .15, ease: 'power2.out' }, ta + .05); tl.to(notif, { y: 0, duration: .5, ease: 'back.out(2)' }, ta + .2);
  }
});
P.notifIdx = 0;
ENVS.forEach((t0, i) => tl.to(P, { notifIdx: i, duration: .01 }, t0 + 1.32));
show(boite, 62.7, { y: 60, b: 12, d: 1.2 });

camTo(61.3, 0.9, { x: 4250, y: 60, s: 1.1 }, 'sine.inOut');
camTo(62.5, 1.9, { x: 4330, y: 1700, s: 0.98, r: 0.4, rx: -3 }, 'power3.inOut');
camTo(64.4, 4.2, { x: 4330, y: 1720, s: 1.0, r: 0, rx: 0 }, 'sine.inOut');

/* =====================================================================
   ACTE 8 — LE RÉSULTAT EN CHIFFRES
   ===================================================================== */
const CH = [
  { cx: 3720, ico: I.calendrier(), gros: '<span class="c30">0</span><small>jours</small>', lib: 'Votre site en ligne', note: 'À partir de 30 jours après la validation de votre maquette.' },
  { cx: 4300, ico: I.jauge(), gros: '<span class="c100">0</span><small>/100</small>', lib: 'En vitesse', note: 'Score Lighthouse mobile d\'optikom.fr, mesuré en septembre 2026. Votre site est construit de la même façon.' },
  { cx: 4880, ico: I.personne(), gros: '1', lib: 'Seul interlocuteur', note: 'Le même, du devis au suivi de votre site.' },
];
const CHY = 2950, CHW = 520, CHH = 600;
const chiffres = CH.map((c) => { const e = box(mk(`<div class="carte carte-bleue chiffre" style="border:none;box-shadow:var(--shadow-accent-lg)"><div class="trame-bleue"></div><span class="ico">${c.ico}</span><div class="gros tnum">${c.gros}</div><div class="lib">${c.lib}</div><div class="note">${c.note}</div></div>`), c.cx, CHY, CHW, CHH); set0(e, { autoAlpha: 0, filter: 'brightness(1) saturate(1)' }); return e; });
const c30 = q('.c30', chiffres[0]), c100 = q('.c100', chiffres[1]);
P.n30 = 0; P.n100 = 0;
// les 3 premières lignes de la boîte deviennent les 3 cartes bleues
[0, 1, 2].forEach((i) => {
  const c = chiffres[i], t0 = 68.5 + i * .08;
  const rx = BOX.cx - BOX.w / 2 + 280 + 30, ry = BOX.cy - BOX.h / 2 + 84 + i * 140;
  const parts = qa('.ico, .gros, .lib, .note', c);
  parts.forEach((e) => set0(e, { autoAlpha: 0 }));
  tl.set(c, { left: rx, top: ry, width: 830, height: 124, borderRadius: 16 }, t0);
  tl.fromTo(c, { autoAlpha: 0 }, { autoAlpha: 1, duration: .3, ease: 'none', immediateRender: false }, t0);
  tl.to(c, { left: CH[i].cx - CHW / 2, top: CHY - CHH / 2, width: CHW, height: CHH, borderRadius: 24, duration: 1.05, ease: 'power3.inOut' }, t0);
  parts.forEach((e, k) => { if (!e.classList.contains('gros')) show(e, t0 + .6 + k * .08, { y: 24, b: 8, d: .9 }); });
});
[69.35, 73.25, 77.65].forEach((t0, i) => show(q('.gros', chiffres[i]), t0, { y: 30, s: .9, b: 16, d: 1.1 }));
tl.to(boite, { autoAlpha: 0, filter: 'blur(10px)', duration: .6 }, 68.6);
tl.to(notif, { autoAlpha: 0, duration: .4 }, 68.5);
tl.set(P, { n30: 30 }, 69.3);
tl.to(P, { n100: 100, duration: .9, ease: 'power2.out' }, 73.25);
tl.to(q('.gros', chiffres[1]), { scale: 1.07, duration: .25, ease: 'power2.out', transformOrigin: '0% 60%' }, 74.15); tl.to(q('.gros', chiffres[1]), { scale: 1, duration: .6, ease: 'back.out(2)' }, 74.4);
// mise en avant de la carte dont on parle
const focusCarte = (i, t) => chiffres.forEach((c, k) => tl.to(c, { scale: k === i ? 1.05 : .96, y: k === i ? -14 : 0, filter: k === i ? 'brightness(1) saturate(1)' : 'brightness(.93) saturate(.85)', duration: .8, ease: 'power3.inOut' }, t));
focusCarte(0, 70.6); focusCarte(1, 73.3); focusCarte(2, 77.6);
tl.to(chiffres, { scale: 1, y: 0, filter: 'brightness(1) saturate(1)', duration: .6, ease: 'power3.inOut' }, 80.4);

camTo(68.4, 1.6, { x: 4300, y: 2950, s: 0.88 }, 'power3.inOut');
camTo(70.0, 11, { x: 4300, y: 2960, s: 0.91 }, 'sine.inOut');

/* =====================================================================
   ACTE 9 — LA GARANTIE
   ===================================================================== */
const GAR = { cx: 4300, cy: 4050, w: 1260, h: 500 };
const sceau = `<svg viewBox="0 0 210 210" width="240" height="240" fill="none"><circle cx="105" cy="105" r="100" stroke="#084eff" stroke-opacity=".18" stroke-width="2"/><circle class="sc-arc" cx="105" cy="105" r="86" stroke="#084eff" stroke-width="3" stroke-dasharray="540.4" stroke-dashoffset="540.4" transform="rotate(-90 105 105)" stroke-linecap="round"/><circle cx="105" cy="105" r="64" fill="url(#gS)"/><defs><linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#1d5cff"/><stop offset="1" stop-color="#063cc8"/></linearGradient></defs><path d="M105 0v26M105 184v26M0 105h26M184 105h26" stroke="#084eff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/><g transform="translate(75 75) scale(2.5)" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${I.bouclier().replace(/<\/?svg[^>]*>/g, '')}</g></svg>`;
const gar = box(mk(`<div class="carte carte-verre garantie"><div class="sceau">${sceau}</div><div><h3>Notre garantie</h3><div class="vide">[À COMPLÉTER]</div></div></div>`), GAR.cx, GAR.cy, GAR.w, GAR.h);
set0(gar, { autoAlpha: 0 });
qa('.sceau, h3, .vide', gar).forEach((e, k) => show(e, 82.0 + k * .12, { y: 18, b: 8, d: .8 }));
const garArc = q('.sc-arc', gar);
P.arc = 0;
chiffres.forEach((c, i) => { tl.to(qa('.ico, .gros, .lib, .note', c), { autoAlpha: 0, duration: .3, ease: 'power2.in' }, 81.0);
  tl.to(c, { left: GAR.cx - CHW / 2, top: GAR.cy - CHH / 2, rotation: (i - 1) * 4, scale: .82, duration: 1.0, ease: 'power3.inOut' }, 81.05 + (2 - i) * .06);
  tl.to(c, { autoAlpha: 0, duration: .35, ease: 'none' }, 81.95); });
tl.fromTo(gar, { autoAlpha: 0, scale: .55, rotation: -3 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 1.1, ease: 'expo.out' }, 81.8);
tl.to(P, { arc: 1, duration: 1.4, ease: 'power2.inOut' }, 82.0);
camTo(80.9, 1.5, { x: 4300, y: 4050, s: 1.0 }, 'power3.inOut');
camTo(82.7, 3.3, { x: 4300, y: 4050, s: 1.03 }, 'sine.inOut');

/* =====================================================================
   ACTE 10 — LES PRIX
   ===================================================================== */
const PX = [{ cx: 3950, cls: 'bleu carte-bleue', ico: I.web('#fff'), h: 'Création de votre site', m: '1 100 €', s: '', li: ['Maquette sur mesure', 'Pensé pour le téléphone', 'Prêt pour Google'] },
            { cx: 4650, cls: 'blanc', ico: I.epingle('#fff'), h: 'Référencement local', m: '250 €', s: '/mois', li: ['Fiche Google complète', 'Présence à Vannes et dans le Golfe', 'Suivi chaque mois'] }];
const PY = 5150, PW = 660, PH = 700;
const prix = PX.map((p) => { const e = box(mk(`<div class="carte prix ${p.cls}" style="${p.cls.includes('bleu') ? 'border:none;box-shadow:var(--shadow-accent-lg)' : ''}">${p.cls.includes('bleu') ? '<div class="trame-bleue"></div>' : ''}<span class="ico ${p.cls.includes('bleu') ? '' : 'ico-bleu'}">${p.ico}</span><h3>${p.h}</h3><div class="apd">à partir de</div><div class="montant">${p.m}<small>${p.s}</small></div><ul>${p.li.map((l) => `<li><i>${I.coche(p.cls.includes('bleu') ? '#fff' : '#084eff', 3)}</i>${l}</li>`).join('')}</ul><div class="tva">TVA non applicable, art. 293 B du CGI</div></div>`), p.cx, PY, PW, PH); set0(e, { autoAlpha: 0 }); return e; });
// la garantie se divise en deux cartes
tl.to(qa('.sceau, h3, .vide', gar), { autoAlpha: 0, filter: 'blur(8px)', duration: .45, ease: 'power2.in' }, 85.9);
tl.to(gar, { autoAlpha: 0, duration: .3, ease: 'none' }, 86.25);
PX.forEach((p, i) => {
  const c = prix[i], t0 = 86.15 + i * .1;
  const parts = qa('.ico, h3, .apd, .montant, ul, .tva', c);
  parts.forEach((e) => set0(e, { autoAlpha: 0 }));
  tl.set(c, { left: GAR.cx - GAR.w / 2, top: GAR.cy - GAR.h / 2, width: GAR.w, height: GAR.h, autoAlpha: 1 }, t0);
  tl.to(c, { left: p.cx - PW / 2, top: PY - PH / 2, width: PW, height: PH, duration: 1.4, ease: 'power3.inOut' }, t0);
  parts.forEach((e, k) => show(e, t0 + .8 + k * .09, { y: 22, b: 8, d: .9 }));
});
const focusPrix = (i, t) => prix.forEach((c, k) => tl.to(c, { scale: k === i ? 1.04 : .97, y: k === i ? -14 : 0, duration: .8, ease: 'power3.inOut' }, t));
focusPrix(0, 87.6); focusPrix(1, 90.6);
tl.to(prix, { scale: 1, y: 0, duration: .6 }, 95.6);
camTo(85.9, 1.7, { x: 4300, y: 5150, s: 0.93 }, 'power3.inOut');
camTo(87.6, 9, { x: 4300, y: 5160, s: 0.95 }, 'sine.inOut');

/* =====================================================================
   ACTE 11 — APPEL À L'ACTION
   ===================================================================== */
const CTA = { cx: 4300, cy: 6330, w: 1600, h: 820 };
const cta = box(mk(`<div class="carte cta" style="border:none"><div class="fond-cta"><div class="h1" style="left:-200px;top:-300px;width:1100px;height:900px"></div><div class="h2" style="right:-300px;bottom:-400px;width:1200px;height:1000px"></div></div></div>`), CTA.cx, CTA.cy, CTA.w, CTA.h);
set0(cta, { autoAlpha: 0, clipPath: 'inset(8% 30% 78% 30% round 60px)' });
const cx0 = CTA.cx - CTA.w / 2, cy0 = CTA.cy - CTA.h / 2;
const pil1 = mk(`<div class="btn btn-primaire cta-pilule"><span class="pt"></span>Audit gratuit sous 48 h</div>`); at(pil1, cx0 + 480, cy0 + 150);
const pil2 = mk(`<div class="btn btn-inverse cta-pilule"><span class="pt"></span>Votre devis sous 24 h</div>`); at(pil2, cx0 + 1120, cy0 + 150);
const logo = mk(`<img class="cta-logo" src="assets/logo-blanc.svg" style="width:720px">`); at(logo, CTA.cx, cy0 + 395);
const url = mk(`<div class="cta-url">optikom.fr</div>`); at(url, CTA.cx, cy0 + 585);
const lieu = mk(`<div class="cta-lieu">${I.epingle('#aebbd0').replace('<svg', '<svg width="22" height="22" style="vertical-align:-3px;margin-right:8px"')}Agence web à Vannes · Golfe du Morbihan<span style="opacity:.45;margin:0 14px">|</span>${I.tel('#aebbd0').replace('<svg', '<svg width="22" height="22" style="vertical-align:-3px;margin-right:8px"')}06 33 46 79 83</div>`); at(lieu, CTA.cx, cy0 + 700);
[pil1, pil2, logo, url, lieu].forEach((e) => set0(e, { xPercent: -50, yPercent: -50, autoAlpha: 0 }));
// sphères et anneau en débord
const sph = [[cx0 - 40, cy0 + 120, 170], [cx0 + CTA.w - 90, cy0 + CTA.h - 150, 220], [cx0 + 260, cy0 + CTA.h - 20, 90]].map(([x, y, r]) => { const s = box(mk('<div class="sphere"></div>'), x, y, r, r); set0(s, { autoAlpha: 0 }); return s; });
const anneauCTA = mk(`<div class="anneau-optique" style="width:300px;height:300px">${I.vise('rgba(255,255,255,.55)')}</div>`); box(anneauCTA, cx0 + CTA.w - 10, cy0 + 240, 300, 300); set0(anneauCTA, { autoAlpha: 0 });

// les cartes de prix se transforment en boutons
PX.forEach((p, i) => {
  const g = mk(`<div class="ghost" style="background:${i ? '#fff' : '#084eff'};box-shadow:var(--shadow-lg)"></div>`);
  const tgt = i ? pil2 : pil1;
  Object.assign(g.style, { left: p.cx - PW / 2 + 'px', top: PY - PH / 2 + 'px', width: PW + 'px', height: PH + 'px', opacity: 0, borderRadius: '24px' });
  const pw = i ? 560 : 590, ph = 110;
  tl.to(qa('.ico, h3, .apd, .montant, ul, .tva, .trame-bleue', prix[i]), { autoAlpha: 0, duration: .3, ease: 'power2.in' }, 96.25 + i * .08);
  tl.set(g, { autoAlpha: 1 }, 96.5 + i * .12);
  tl.set(prix[i], { autoAlpha: 0 }, 96.5 + i * .12);
  tl.to(g, { left: parseFloat(tgt.style.left) - pw / 2, top: parseFloat(tgt.style.top) - ph / 2, width: pw, height: ph, borderRadius: 60, duration: 1.4, ease: 'power3.inOut' }, 96.5 + i * .12);
  tl.to(g, { autoAlpha: 0, duration: .3 }, 97.95 + i * .12);
});
tl.fromTo(cta, { autoAlpha: 1, clipPath: 'inset(8% 30% 78% 30% round 60px)' }, { clipPath: 'inset(0% 0% 0% 0% round 48px)', duration: 1.6, ease: 'power3.inOut' }, 96.9);
tl.to(pil1, { autoAlpha: 1, filter: 'blur(0px)', duration: .3 }, 97.85);
tl.to(pil2, { autoAlpha: .32, scale: .94, duration: .3 }, 97.97);
tl.to(pil2, { autoAlpha: 1, scale: 1, duration: .8, ease: 'back.out(2)' }, 102.6);
// mise en avant tour à tour
tl.to(pil1, { scale: 1.06, duration: .7, ease: 'power3.out' }, 97.4 + .6); tl.to(pil1, { scale: 1, duration: .8, ease: 'power3.inOut' }, 102.3);
tl.to(pil2, { scale: 1.05, duration: .5, ease: 'power3.out' }, 103.4); tl.to(pil2, { scale: 1, duration: .8, ease: 'power3.inOut' }, 105.6);
sph.forEach((s, i) => show(s, 98.2 + i * .2, { s: .7, y: 30, b: 16, d: 1.6 }));
show(anneauCTA, 98.6, { s: .7, y: 0, b: 14, d: 1.6 });
tl.fromTo(logo, { autoAlpha: 0, filter: 'blur(26px)', scale: 1.1 }, { autoAlpha: 1, filter: 'blur(0px)', scale: 1, duration: 2.0, ease: 'expo.out' }, 97.7);
show(url, 106.1, { y: 24, b: 16, d: 1.2 });
show(lieu, 106.7, { y: 20, b: 10, d: 1.1 });
const reflet = mk('<span style="position:absolute;top:0;bottom:0;width:120px;left:-160px;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg)"></span>', pil1);
pil1.style.overflow = 'hidden'; pil1.style.position = 'absolute';
tl.fromTo(reflet, { x: 0 }, { x: 800, duration: 1.1, ease: 'power2.inOut' }, 108.6);
tl.to(pil1, { scale: 1.04, duration: .5, ease: 'power2.out' }, 108.5); tl.to(pil1, { scale: 1, duration: .8, ease: 'power3.inOut' }, 109.1);
camTo(96.3, 2.0, { x: 4300, y: 6350, s: 0.98 }, 'power3.inOut');
camTo(98.3, DUREE - 98.3, { x: 4300, y: 6360, s: 1.04 }, 'sine.inOut');

/* ---------- éléments optiques de premier plan (profondeur) ---------- */
const FGS = [
  { wx: -700, wy: -380, r: 260, p: 1.55, b: 14 }, { wx: 900, wy: 420, r: 160, p: 1.35, b: 8 },
  { wx: 1300, wy: -520, r: 120, p: 1.25, b: 6 }, { wx: 3050, wy: 520, r: 220, p: 1.5, b: 14 },
  { wx: 4100, wy: -560, r: 140, p: 1.3, b: 8 }, { wx: 6000, wy: 520, r: 240, p: 1.5, b: 14 },
  { wx: 3300, wy: 1500, r: 200, p: 1.45, b: 12 }, { wx: 5300, wy: 2100, r: 150, p: 1.3, b: 8 },
  { wx: 3200, wy: 3300, r: 230, p: 1.5, b: 14 }, { wx: 5450, wy: 4300, r: 180, p: 1.4, b: 10 },
  { wx: 3100, wy: 5550, r: 150, p: 1.3, b: 8 },
].map((f) => ({ ...f, el: mk(`<div class="sphere" style="width:${f.r}px;height:${f.r}px;filter:blur(${f.b}px);opacity:.75"></div>`, FG) }));

/* ---------- synchronisation des valeurs dérivées ---------- */
const fmt1 = (v) => v.toFixed(1).replace('.', ',');
function sync(t) {
  // caméra
  const s = cam.s;
  W.style.transform = `translate(960px,540px) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) rotate(${cam.r}deg) scale(${s}) translate(${-cam.x}px,${-cam.y}px)`;
  // premier plan : parallaxe
  FGS.forEach((f) => {
    const sx = 960 + (f.wx - cam.x) * s * f.p, sy = 540 + (f.wy - cam.y) * s * f.p + Math.sin(t * 0.9 + f.wx) * 8;
    f.el.style.transform = `translate(${sx - f.r / 2}px,${sy - f.r / 2}px) scale(${s * f.p})`;
  });
  // texte tapé + curseur
  tape.textContent = REQ.slice(0, Math.round(P.typed));
  caret.style.opacity = t > 2.4 ? 0 : (Math.floor(t * 2.2) % 2 ? 0.15 : 1);
  // chargement
  roue.style.transform = `rotate(${t * 400}deg)`;
  chronoV.textContent = fmt1(P.chrono) + ' s';
  barreCharge.style.width = (P.charge * 100) + '%';
  // flou de l'ancien site + loupe nette
  const fl = Math.min(P.flou, 1) * 6, fl2 = Math.max(0, P.flou - 1);
  oldBC.style.filter = `blur(${fl + fl2 * 10}px) saturate(${1 - .3 * Math.min(P.flou, 1)})`;
  loupe.style.left = P.lx + 'px'; loupe.style.top = P.ly + 'px';
  const lvis = gsap.getProperty(loupe, 'autoAlpha');
  oldNet.style.visibility = (lvis > 0.01 && t < 22.5) ? 'visible' : 'hidden';
  oldNet.style.opacity = lvis * (1 - fl2);
  const lsc = gsap.getProperty(loupe, 'scale');
  oldNet.style.clipPath = `circle(${(P.lr - 12) * lsc}px at ${P.lx - (OLD.cx - OLD.w / 2)}px ${P.ly - (OLD.cy - OLD.h / 2)}px)`;
  // souris
  souris.style.left = P.mx + 'px'; souris.style.top = P.my + 'px';
  // jauges
  qa('.arc', phare).forEach((a) => a.setAttribute('stroke-dashoffset', 263.9 * (1 - P.jauge)));
  qa('.jauge-wrap span', phare).forEach((sp) => sp.textContent = Math.round(P.jauge * 100));
  // carte : tracé + pulsation de Vannes
  contour.setAttribute('stroke-dashoffset', 1 - P.trace);
  qa('.anneau', visee).forEach((a, i) => { const ph = ((t * 0.6 + i / 3) % 1); a.style.transform = `translate(-50%,-50%) scale(${0.6 + ph * 0.9})`; a.style.opacity = (1 - ph) * 0.9; });
  // courbe du tableau de bord
  q('.cp', dash).setAttribute('width', 520 * P.courbe);
  const bout = q('.bout', dash); bout.style.opacity = P.courbe > .98 ? 1 : 0;
  // défilement du téléphone visiteur + anneau de focus
  const scp = scrollPx();
  defile.style.transform = `translateY(${-scp}px)`;
  if (MT.rects.length) { const i = Math.min(1, Math.floor(P.fi)), k = P.fi - i, a = MT.rects[i], b = MT.rects[Math.min(2, i + 1)];
    Object.assign(focusA.style, { left: '8px', width: (ECRAN.w - 16) + 'px', top: (74 + lerp(a.y, b.y, k) - scp) + 'px', height: lerp(a.h, b.h, k) + 'px' }); }
  const envX = ECRAN.x + (MT.envoi ? MT.envoi.x : 160), envY = ECRAN.y + 74 + (MT.envoi ? MT.envoi.y : 500) - scp;
  tapEl.style.left = envX + 'px'; tapEl.style.top = envY + 'px';
  // points visiteurs
  DOTS.forEach((d) => {
    const k = (t - d.t0) / d.d;
    if (k <= 0 || k >= 1) { d.el.style.opacity = 0; return; }
    const e = easeIO(k), u = 1 - e;
    const x = u * u * d.sx + 2 * u * e * d.cx + e * e * d.ex, y = u * u * d.sy + 2 * u * e * d.cy + e * e * d.ey;
    d.el.style.opacity = Math.min(1, k * 6, (1 - k) * 5);
    d.el.style.transform = `translate(${x}px,${y}px) scale(${1 - .4 * k})`;
  });
  // enveloppes
  envs.forEach((e, i) => {
    const k = P.env[i]; const sx = ECRAN.x + (MT.envoi ? MT.envoi.x : 160), sy = ECRAN.y + 74 + (MT.envoi ? MT.envoi.y : 500) - MT.sc[4], ex = ENV_DEST.x, ey = ENV_DEST.y;
    const cx = sx + 900, cy = sy - 350; const u = 1 - k;
    const x = u * u * sx + 2 * u * k * cx + k * k * ex, y = u * u * sy + 2 * u * k * cy + k * k * ey;
    e.style.left = x + 'px'; e.style.top = y + 'px';
  });
  badge.textContent = Math.round(P.badge);
  notifSmall.textContent = MAILS[Math.round(P.notifIdx)].slice(2, 4).join(' · ');
  // compteurs
  c30.textContent = Math.round(P.n30); c100.textContent = Math.round(P.n100);
  garArc.setAttribute('stroke-dashoffset', 540.4 * (1 - P.arc));
  // flottement lent des sphères du CTA
  sph.forEach((sp, i) => { sp.style.translate = `0 ${Math.sin(t * 0.8 + i * 2) * 8}px`; });
  // sous-titres
  let cur = null;
  for (const st of D.sousTitres) if (t >= st.t0 && t < st.t1) { cur = st; break; }
  if (cur) {
    if (SUB.textContent !== cur.texte) SUB.textContent = cur.texte;
    SUB.classList.toggle('probleme', cur.acte.startsWith('1 '));
    const a = clamp((t - cur.t0) / 0.2) * clamp((cur.t1 - t) / 0.2);
    SUB.style.opacity = a; SUB.style.filter = `blur(${(1 - a) * 6}px)`; SUB.style.transform = `translateY(${(1 - a) * 8}px)`;
  } else SUB.style.opacity = 0;
}

window.__duree = DUREE;
window.__seek = (t) => { tl.seek(t, true); sync(t); };
window.__pret = document.fonts.ready.then(() => { mesuresTel(); window.__seek(0); return true; });
// lecture en direct dans un navigateur (aperçu) : ?play
if (location.search.includes('play')) { const t0 = performance.now(); const off = parseFloat(new URLSearchParams(location.search).get('t') || 0);
  const loop = () => { const t = off + (performance.now() - t0) / 1000; window.__seek(t % DUREE); requestAnimationFrame(loop); }; window.__pret.then(loop); }
if (location.search.includes('debug')) { const d = document.getElementById('debug'); d.style.display = 'block'; }
})();
