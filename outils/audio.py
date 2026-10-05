#!/usr/bin/env python3
"""Musique et bruitages du film Optikom (v6), synthétisés : aucun échantillon externe, libres de droits.

Les bruitages suivent les repères exportés par la scène (film/render.mjs --cues audio/cues.json) :
chaque clic, frappe, notification… est donc calé à l'image près, même si la timeline bouge.

Sorties (48 kHz, stéréo) dans audio/ :
  musique.wav / .flac    pulsation électronique douce, 112 BPM, discrète (place pour la voix off)
  bruitages.wav / .flac  interface « digital » : clics, frappe, whooshs, notifications
  mix.wav / .flac        musique + bruitages (~ -25 LUFS : la voix off viendra par-dessus)
"""
import json, pathlib, subprocess, wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

R = pathlib.Path(__file__).resolve().parent.parent
SR = 48000
CUES = json.loads((R / "audio/cues.json").read_text())
DUREE = CUES["duree"]
TL = json.loads((R / "script/timecodes.json").read_text())
LIG = {l["id"]: l for l in TL["lignes"]}
N = int(DUREE * SR) + SR
rng = np.random.default_rng(56)
OUT = R / "audio"; OUT.mkdir(exist_ok=True)

def t_(d): return np.arange(max(1, int(d * SR))) / SR
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, f1, f2, o=2): return sosfilt(butter(o, [f1, f2], 'band', fs=SR, output='sos'), x)
def midi(n): return 440 * 2 ** ((n - 69) / 12)
def add(buf, x, t0, pan=0.0, g=1.0):
    i = int(t0 * SR)
    if i >= buf.shape[1] or i + len(x) <= 0: return
    if i < 0: x, i = x[-i:], 0
    x = x[: buf.shape[1] - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(x)] += x * g * l * 1.414; buf[1, i:i + len(x)] += x * g * r * 1.414
def env(n, a, r, sus=1.0):
    e = np.ones(n) * sus; na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na: e[:na] = np.linspace(0, sus, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def reverb(x, sec=2.4, mix=.3, seed=1):
    g = np.random.default_rng(seed); n = int(sec * SR)
    ir = g.standard_normal((2, n)) * np.exp(-np.arange(n) / SR * 6.9 / sec)
    ir = np.stack([lp(ir[0], 7000), lp(ir[1], 6500)]); ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    wet = np.stack([fftconvolve(x[0], ir[0])[: x.shape[1]], fftconvolve(x[1], ir[1])[: x.shape[1]]])
    return x * (1 - mix) + wet * mix * .6

# ------------------------------------------------------------------ musique
mus = np.zeros((2, N))
BPM = 112; BEAT = 60 / BPM; BAR = 4 * BEAT
t_aud = LIG["a1"]["debut"] - .7          # le problème se termine, l'audit commence
t_loc = LIG["l1"]["debut"] - .5          # mise en ligne : la musique s'ouvre
t_fin = LIG["k2"]["debut"] + .4          # résolution sur le logo
SOMBRE = [[38, 50, 53, 57, 60, 64], [34, 50, 53, 57, 62, 65]]             # Dm9, Bbmaj7
CLAIR = [[41, 53, 57, 60, 64, 67], [36, 52, 55, 59, 62, 67], [38, 50, 53, 57, 60, 65], [34, 50, 53, 57, 62, 65]]  # F C/E Dm Bb

def nappe(notes, d, bri):
    tt = t_(d); x = np.zeros(len(tt))
    for k, n in enumerate(notes):
        for det in (-.08, 0, .08):
            ph = rng.uniform(0, 1)
            x += (2 * ((tt * midi(n) * 2 ** (det / 12) + ph) % 1) - 1) * (.5 if k == 0 else .3)
    return lp(x, bri, 2) * env(len(x), .9, 1.6)
def accord(t):
    if t < t_aud: return SOMBRE[int(t // (2 * BAR)) % 2]
    return CLAIR[int((t - t_aud) // (2 * BAR)) % 4]

t = 0.0
while t < DUREE - 1:
    bri = 600 if t < t_aud else (1300 if t < t_loc else 1900)
    if t > t_fin: bri = 2200
    add(mus, nappe(accord(t + .1), 2 * BAR + 1.6, bri), t, -.15 if int(t / BAR) % 2 else .15, .03)
    t += 2 * BAR

def kick(d=.42):
    tt = t_(d); f = 48 + 75 * np.exp(-tt * 34)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 8)
def hat(d=.06, ouvert=False):
    n = rng.standard_normal(int((.18 if ouvert else d) * SR)); return hp(n, 7000, 4) * np.exp(-np.arange(len(n)) / SR * (18 if ouvert else 70))
def clap():
    n = rng.standard_normal(int(.2 * SR)); e = np.exp(-np.arange(len(n)) / SR * 22)
    return bp(n, 900, 3500) * e
def pluck(f, d=.35):
    tt = t_(d); x = np.sign(np.sin(2 * np.pi * f * tt)) * .5 + np.sin(2 * np.pi * f * tt)
    return lp(x, 2600) * np.exp(-tt * 9) * env(len(tt), .002, .03)
def basse(n, d):
    tt = t_(d); f = midi(n)
    x = np.sin(2 * np.pi * f * tt) + .35 * np.sin(4 * np.pi * f * tt)
    return lp(x, 380) * env(len(tt), .01, .12) * np.exp(-tt * 1.2)

b = 0
t = 0.0
while t < t_fin + .2:
    pas = int(round(t / (BEAT / 2)))   # croche
    sombre = t < t_aud
    if pas % 4 == 0:   # temps 1 et 3
        add(mus, kick(), t, 0, .055 if not sombre else .04)
    if not sombre and pas % 8 == 4:   # contretemps : clap discret
        add(mus, clap(), t, .1, .018)
    add(mus, hat(), t, .3 if pas % 2 else -.3, (.012 if pas % 2 else .007) * (.6 if sombre else 1))
    if not sombre and pas % 2 == 0:
        ch = accord(t)
        add(mus, basse(ch[0] + 12, BEAT * .9), t, 0, .045 if pas % 4 == 0 else .03)
    if t >= t_aud + 2 * BAR:   # arpège numérique en doubles croches
        ch = accord(t)
        seq = [ch[2] + 12, ch[3] + 12, ch[4] + 12, ch[5] + 12, ch[4] + 12, ch[3] + 12, ch[2] + 24, ch[3] + 12]
        for k in range(2):
            add(mus, pluck(midi(seq[(pas * 2 + k) % 8])), t + k * BEAT / 4, -.45 if k else .45, .012)
    t += BEAT / 2
# accord final
add(mus, nappe(CLAIR[0], DUREE - t_fin + .3, 2400) * np.linspace(1, 0, int((DUREE - t_fin + .3) * SR)) ** .7, t_fin, 0, .05)
mus = reverb(mus, 2.6, .3, 3)
mus = lp(mus, 11000)
fade = np.ones(N); fade[: int(.4 * SR)] = np.linspace(0, 1, int(.4 * SR))
f0, f1 = int((DUREE - 3.2) * SR), int((DUREE - .1) * SR)
fade[f0:f1] = np.linspace(1, 0, f1 - f0) ** 1.4; fade[f1:] = 0
mus *= fade

# ------------------------------------------------------------------ bruitages (interface « digital »)
fx = np.zeros((2, N))
def bruit(d): return rng.standard_normal(max(1, int(d * SR)))
def s_clic():
    a = bp(bruit(.018), 2000, 7000) * np.exp(-np.arange(int(.018 * SR)) / SR * 320)
    tt = t_(.05); b = np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 90) * .35
    out = np.zeros(len(tt)); out[:len(a)] += a; return out + b
def s_frappe():
    d = .028; x = bp(bruit(d), 1800 + rng.uniform(0, 1500), 6500) * np.exp(-np.arange(int(d * SR)) / SR * 200)
    return x * rng.uniform(.6, 1)
def s_entree():
    d = .09; x = bp(bruit(d), 500, 3000) * np.exp(-np.arange(int(d * SR)) / SR * 60)
    tt = t_(d); return x + np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 50) * .5
def s_pop(f=700):
    tt = t_(.14); fr = f * (1 + .7 * np.exp(-tt * 55)); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 34)
def ton(f, d=.5, dec=7, h=.2):
    tt = t_(d); return (np.sin(2 * np.pi * f * tt) + h * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * dec) * env(len(tt), .003, .04)
def s_erreur(): return np.concatenate([ton(midi(50), .13, 9, .6), ton(midi(46), .42, 7, .6)]) * .9
def s_whoosh(d=.8, f1=300, f2=2600):
    n = bruit(d); tt = t_(d); out = np.zeros_like(n); seg = 512
    for s in range(0, len(n), seg):
        k = s / len(n); fc = f1 + (f2 - f1) * np.sin(np.pi * k) ** .8
        out[s:s + seg] = bp(n[max(0, s - 2048):s + seg], fc * .7, fc * 1.3)[-len(n[s:s + seg]):]
    return out * np.sin(np.pi * tt / d) ** 2
def s_ding(): return np.concatenate([ton(midi(84), .09, 12) * .8, ton(midi(91), .7, 6)])
def s_valide(): return np.concatenate([ton(midi(76), .1, 10) * .8, ton(midi(80), .1, 10) * .8, ton(midi(83), .8, 5)])
def s_pin(i=0): return ton(midi(88 + 2 * i), .5, 9, .4)
def s_montee(d=.9, f1=400, f2=1400):
    tt = t_(d); f = f1 * (f2 / f1) ** (tt / d); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), d * .8, d * .15) * .6
def s_deploi(): return s_montee(.55, 300, 1800) + s_whoosh(.55, 400, 4000) * .5
def s_boom():
    tt = t_(1.8); f = 42 + 36 * np.exp(-tt * 7); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.2)
    return x + lp(bruit(1.8), 280) * np.exp(-tt * 5) * .3 + s_whoosh(1.8, 200, 1500)[:len(tt)] * .4
def s_goutte():
    tt = t_(.25); f = 1500 * np.exp(-tt * 9) + 500; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 18)
def s_defile(): return s_whoosh(.3, 1500, 5000) * .6
def s_envoi(): return s_whoosh(.45, 800, 5000) * .7
def s_tick(): return bp(bruit(.012), 3000, 9000) * np.exp(-np.arange(int(.012 * SR)) / SR * 500)
def s_lent():
    out = np.zeros(int(1.4 * SR)); t = 0.0
    for k in range(6):
        c = s_tick() * 1.6; i = int(t * SR); out[i:i + len(c)] += c[: len(out) - i]; t += .12 + k * .05
    return out
def s_scan(): return s_montee(.7, 900, 2600) * .5 + bp(bruit(.7), 3000, 7000) * env(int(.7 * SR), .5, .2) * .05
def s_aspire(): return s_whoosh(.6, 2500, 400)[::-1] * .8
def s_logo():
    d = 2.2; tt = t_(d); x = sum(np.sin(2 * np.pi * midi(n) * tt) for n in (77, 81, 84, 88)) / 4
    return x * env(len(tt), .02, 1.5) * np.exp(-tt * 1.1) + bp(bruit(d), 5000, 9000) * env(len(tt), 1.0, 1.0) * .012
def s_brillance():
    d = 1.0; tt = t_(d); return bp(bruit(d), 5000, 9000, 2) * np.sin(np.pi * tt / d) ** 2 * .12

SONS = {'clic': (s_clic, .9), 'frappe': (s_frappe, .55), 'entree': (s_entree, .9), 'pop': (s_pop, .6), 'erreur': (s_erreur, .8),
        'whoosh': (s_whoosh, .55), 'ding': (s_ding, .6), 'valide': (s_valide, .6), 'pin': (None, .6), 'montee': (s_montee, .4),
        'deploi': (s_deploi, .6), 'boom': (s_boom, .9), 'goutte': (s_goutte, .35), 'defile': (s_defile, .4), 'envoi': (s_envoi, .5),
        'tick': (s_tick, .5), 'lent': (s_lent, .7), 'scan': (s_scan, .35), 'aspire': (s_aspire, .5), 'logo': (s_logo, .6), 'brillance': (s_brillance, .25)}
npin = 0
for c in CUES["cues"]:
    fn, g = SONS.get(c["type"], (None, 0))
    if c["type"] == 'pin': x = s_pin(npin); npin += 1
    elif fn is None: continue
    else: x = fn()
    pan = rng.uniform(-.25, .25) if c["type"] in ('frappe', 'tick', 'goutte') else 0
    add(fx, x, c["t"], pan, g * c.get("v", 1))
fx = reverb(fx, 1.3, .18, 9)

def ecrire(path, x):
    x = np.clip(x, -1, 1); raw = (x.T * 8388607).astype(np.int32)
    b = np.zeros((raw.shape[0], 2, 3), dtype=np.uint8)
    for c in range(2):
        v = raw[:, c].astype(np.int64) & 0xFFFFFF
        b[:, c, 0] = v & 0xFF; b[:, c, 1] = (v >> 8) & 0xFF; b[:, c, 2] = (v >> 16) & 0xFF
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR); w.writeframes(b.tobytes())
def lufs(path):
    o = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float([l for l in o.splitlines() if l.strip().startswith("I:")][-1].split()[1])

n = int(DUREE * SR)
mus, fx = mus[:, :n], fx[:, :n]
for x, nom, cible in ((mus, "musique", -27.0), (fx, "bruitages", -29.5)):
    x /= np.abs(x).max() + 1e-9; x *= .5
    ecrire(OUT / f"{nom}.wav", x); g = 10 ** ((cible - lufs(OUT / f"{nom}.wav")) / 20); x *= g
    ecrire(OUT / f"{nom}.wav", x); print(nom, round(lufs(OUT / f"{nom}.wav"), 1), "LUFS, crête", round(20 * np.log10(np.abs(x).max() + 1e-9), 1), "dBFS")
ecrire(OUT / "mix.wav", mus + fx); print("mix", round(lufs(OUT / "mix.wav"), 1), "LUFS")
for nom in ("musique", "bruitages", "mix"):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(OUT / f"{nom}.wav"), "-c:a", "flac", str(OUT / f"{nom}.flac")], check=True)
