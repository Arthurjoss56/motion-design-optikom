#!/usr/bin/env python3
"""Musique et bruitages du film Optikom, synthétisés (aucun échantillon externe, donc libres de droits).

Sorties (48 kHz, stéréo, 24 bits) dans audio/ :
  musique.wav    nappe + arpège + pulsation, discrète (laisse la place à la voix off)
  bruitages.wav  clics, whooshs, carillons, synchronisés sur la timeline du film
  mix.wav        musique + bruitages, niveau final (~ -26 LUFS : la voix off viendra par-dessus)
Les instants des bruitages suivent film/scene.js (à mettre à jour si la timeline bouge).
"""
import json, pathlib, subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

R = pathlib.Path(__file__).resolve().parent.parent
SR = 48000
DUREE = json.loads((R / "script/timecodes.json").read_text())["duree_film"]
N = int(DUREE * SR) + SR
rng = np.random.default_rng(56)
OUT = R / "audio"; OUT.mkdir(exist_ok=True)

def t_(d): return np.arange(int(d * SR)) / SR
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, f1, f2, o=2): return sosfilt(butter(o, [f1, f2], 'band', fs=SR, output='sos'), x)
def midi(n): return 440 * 2 ** ((n - 69) / 12)
def add(buf, x, t0, pan=0.0, g=1.0):
    i = int(t0 * SR); x = x[: max(0, len(buf[0]) - i)]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(x)] += x * g * l * 1.414; buf[1, i:i + len(x)] += x * g * r * 1.414
def env(n, a, r, sus=1.0):
    e = np.ones(n) * sus; na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, sus, na) if na else e[:na]
    if nr: e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def reverb(x, sec=2.8, mix=.35, seed=1):
    g = np.random.default_rng(seed); n = int(sec * SR)
    ir = g.standard_normal((2, n)) * np.exp(-np.arange(n) / SR * 6.9 / sec)
    ir = np.stack([lp(ir[0], 6000), lp(ir[1], 5600)]); ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    wet = np.stack([fftconvolve(x[0], ir[0])[: x.shape[1]], fftconvolve(x[1], ir[1])[: x.shape[1]]])
    return x * (1 - mix) + wet * mix * 0.6

# ------------------------------------------------------------------ musique
mus = np.zeros((2, N))
BPM = 90; BEAT = 60 / BPM; BAR = 4 * BEAT
# Acte 1 (problème) : ré mineur, sombre et filtré. Ensuite : progression lumineuse en fa majeur.
SOMBRE = [[38, 50, 53, 57, 60, 64]]                      # Dm9
CLAIR = [[41, 53, 57, 60, 64, 67],   # Fmaj9
         [36, 52, 55, 59, 62, 67],   # C/E (add9)
         [38, 50, 53, 57, 60, 65],   # Dm7(add11)
         [34, 50, 53, 57, 62, 65]]   # Bbmaj7(9)

def nappe(notes, d, brillance):
    tt = t_(d); x = np.zeros(len(tt))
    for k, n in enumerate(notes):
        f = midi(n)
        for det in (-0.07, 0.0, 0.08):
            ph = rng.uniform(0, 2 * np.pi)
            saw = 2 * ((tt * f * 2 ** (det / 12) + ph / (2 * np.pi)) % 1) - 1
            x += saw * (0.55 if k == 0 else 0.32)
    x = lp(x, brillance, 2)
    return x * env(len(x), 2.2, 2.6, 1.0)

t = 0.0
while t < 14.6:  # acte 1 : une seule nappe sombre, respirante
    d = min(5.4, 14.6 - t + 1.5)
    add(mus, nappe(SOMBRE[0], d, 700), t, 0, 0.040); t += 5.2
t = 14.4; k = 0
fin_prog = 106.0
while t < fin_prog:
    d = 2 * BAR + 2.6
    bri = 1100 + 900 * min(1, (t - 14) / 40)
    add(mus, nappe(CLAIR[k % 4], d, bri), t, -0.15 if k % 2 else 0.15, 0.036); t += 2 * BAR; k += 1
add(mus, nappe(CLAIR[0], DUREE - fin_prog + 0.5, 1600) * np.linspace(1, 0.0, int((DUREE - fin_prog + 0.5) * SR)) ** 0.5, fin_prog, 0, 0.04)

# arpège (pluck doux) à partir de la maquette
def pluck(f, d=0.9):
    tt = t_(d); x = np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt) + 0.08 * np.sin(6 * np.pi * f * tt)
    return x * np.exp(-tt * 5.5) * env(len(tt), 0.004, 0.05)
t = 22.6; i = 0
while t < 104.5:
    ch = CLAIR[int((t - 14.4) // (2 * BAR)) % 4]
    seq = [ch[2] + 12, ch[3] + 12, ch[4] + 12, ch[5] + 12, ch[4] + 12, ch[3] + 12, ch[2] + 12, ch[3] + 12]
    g = 0.022 * min(1, (t - 22.6) / 6) * (0.75 if 81 < t < 97 else 1)
    add(mus, pluck(midi(seq[i % 8])), t, -0.4 if i % 2 else 0.4, g)
    t += BEAT / 2; i += 1

# pulsation grave (à partir de la mise en ligne) + basse
def kick(d=0.45):
    tt = t_(d); f = 52 + 60 * np.exp(-tt * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7)
t = 41.1
while t < 104.0:
    g = 0.05 if t < 68.5 else 0.04
    add(mus, kick(), t, 0, g); t += BEAT * 2
def basse(n, d):
    tt = t_(d); f = midi(n)
    x = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)
    return lp(x, 400) * env(len(tt), 0.05, 0.6)
t = 41.1; k = int((41.1 - 14.4) // (2 * BAR))
while t < 104.0:
    ch = CLAIR[int((t - 14.4) // (2 * BAR)) % 4]
    add(mus, basse(ch[0] + 12, BEAT * 1.8), t, 0, 0.05); t += BEAT * 2

# scintillement aigu discret (actes 5, 11)
def shimmer(d):
    n = rng.standard_normal(int(d * SR)); x = bp(n, 6000, 11000)
    return x * env(len(x), d * 0.5, d * 0.5)
add(mus, shimmer(4), 41.0, 0, 0.012); add(mus, shimmer(6), 98.5, 0, 0.012)

mus = reverb(mus, 3.2, 0.42, 3)
mus = lp(mus, 9000)
fade = np.ones(N); fade[: int(.6 * SR)] = np.linspace(0, 1, int(.6 * SR))
f0, f1 = int((DUREE - 4.5) * SR), int((DUREE - 0.2) * SR)
fade[f0:f1] = np.linspace(1, 0, f1 - f0) ** 1.5; fade[f1:] = 0
mus *= fade

# ------------------------------------------------------------------ bruitages
fx = np.zeros((2, N))
def clic(g=1.0):
    n = rng.standard_normal(int(0.02 * SR)); return bp(n, 1800, 6000) * np.exp(-np.arange(len(n)) / SR * 300) * g
def frappe():
    n = rng.standard_normal(int(0.03 * SR)); return bp(n, 2500, 7000) * np.exp(-np.arange(len(n)) / SR * 220) * 0.6
def whoosh(d=0.9, f1=300, f2=2500):
    n = rng.standard_normal(int(d * SR)); tt = t_(d)
    out = np.zeros_like(n); seg = 512
    for s in range(0, len(n), seg):
        k = s / len(n); fc = f1 + (f2 - f1) * np.sin(np.pi * k)
        out[s:s + seg] = bp(n[max(0, s - 2048):s + seg], fc * .7, fc * 1.3)[-len(n[s:s + seg]):]
    return out * np.sin(np.pi * tt / d) ** 2
def ton(f, d=0.6, dec=6, h=0.2):
    tt = t_(d); return (np.sin(2 * np.pi * f * tt) + h * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * dec) * env(len(tt), 0.003, 0.05)
def carillon(n0, n1, g=1.0):
    return np.concatenate([ton(midi(n0), 0.12, 8) * 0.8, ton(midi(n1), 0.9, 5)]) * g
def erreur():
    return np.concatenate([ton(midi(50), .16, 8, .5), ton(midi(46), .5, 6, .5)]) * 0.8
def thud():
    tt = t_(0.5); f = 70 + 50 * np.exp(-tt * 25); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)
def pop(f=900):
    tt = t_(0.12); fr = f * (1 + 0.6 * np.exp(-tt * 60)); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 40)
def montee(d=1.4, f1=300, f2=1200):
    tt = t_(d); f = f1 * (f2 / f1) ** (tt / d); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), d * .8, d * .2) * 0.5
def boom():
    tt = t_(1.6); f = 46 + 30 * np.exp(-tt * 8); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.5)
    return x + lp(rng.standard_normal(len(tt)), 300) * np.exp(-tt * 6) * 0.3

G = 0.16  # gain global des bruitages (discrets)
for i in range(15): add(fx, frappe(), 0.75 + i * 1.45 / 15 + rng.uniform(0, .02), 0.1, G * .8)
for i in range(3): add(fx, pop(500 + i * 60), 2.35 + i * .13, 0, G * .6)
add(fx, erreur(), 4.9, 0, G * 1.1)
for tt0 in (4.5, 7.95, 9.75, 11.45): add(fx, thud(), tt0, 0, G * 1.2)
add(fx, whoosh(1.2, 250, 1800), 7.35, 0.3, G * 1.4)
for i in range(16): add(fx, clic(.5), 9.6 + i * 0.1, 0.5, G * .5)
add(fx, whoosh(1.2, 400, 3000), 14.4, -0.3, G * 1.3); add(fx, montee(1.0, 900, 1800), 14.7, 0, G * .5)
for i in range(4): add(fx, carillon(76 + i * 2, 81 + i * 2, .7), 15.9 + i * .95, -0.3 + i * .2, G * .9)
add(fx, whoosh(.9, 500, 2500), 20.1, 0.4, G * 1.1)
for i in range(4): add(fx, carillon(72 + i * 2, 79 + i * 2, .6), 23.35 + i * .85, 0, G * .9)
add(fx, whoosh(1.2, 300, 2000), 22.4, 0.3, G * 1.1); add(fx, whoosh(1.0, 300, 2000), 27.3, -0.2, G)
add(fx, clic(1), 29.02, 0, G * 1.4); add(fx, carillon(77, 84), 29.45, 0, G * 1.2)
add(fx, montee(1.6, 400, 1600), 32.4, 0, G * .7)
add(fx, whoosh(1.4, 250, 1500), 36.0, 0.4, G); add(fx, montee(1.6, 500, 1500), 37.3, 0, G * .6)
add(fx, clic(1), 41.08, 0, G * 1.4); add(fx, boom(), 41.2, 0, G * 1.6); add(fx, whoosh(2.4, 200, 1200), 42.0, 0, G * 1.2)
for i in range(7): add(fx, pop(1100 + i * 90), 44.4 + i * .12, -0.5 + i * .15, G * .5)
add(fx, whoosh(1.0, 400, 2200), 45.6, 0.5, G)
add(fx, whoosh(1.2, 300, 2000), 48.7, -0.5, G * 1.1); add(fx, montee(1.0, 600, 1500), 50.2, 0, G * .6); add(fx, carillon(79, 86, .8), 51.15, 0, G)
add(fx, clic(1), 52.73, 0, G * 1.3); add(fx, whoosh(1.0, 300, 1800), 52.9, 0, G)
add(fx, clic(.8), 62.08, 0, G * 1.2)
for t0 in (62.35, 64.2, 65.4, 66.6):
    add(fx, whoosh(1.2, 500, 2600), t0, 0.3, G * .9); add(fx, carillon(81, 88, .8), t0 + 1.32, 0.2, G * 1.0)
add(fx, whoosh(1.4, 250, 1600), 68.5, 0, G * 1.1)
for i in range(14): add(fx, clic(.4), 69.9 + i * .1, 0, G * .5)
for i in range(16): add(fx, clic(.4), 73.4 + i * .1, 0, G * .5)
add(fx, whoosh(1.4, 250, 1600), 81.0, 0, G); add(fx, carillon(74, 81), 82.1, 0, G * 1.1)
add(fx, whoosh(1.4, 250, 1600), 86.0, 0, G)
add(fx, whoosh(1.6, 200, 1400), 96.4, 0, G * 1.1); add(fx, montee(2.0, 300, 900), 98.8, 0, G * .5)
add(fx, carillon(77, 84, .8), 106.1, 0, G)
fx = reverb(fx, 1.6, 0.25, 9)

def wav(path, x):
    x = np.clip(x, -1, 1)
    raw = (x.T * 8388607).astype(np.int32)
    b = np.zeros((raw.shape[0], 2, 3), dtype=np.uint8)
    for c in range(2):
        v = raw[:, c].astype(np.int64) & 0xFFFFFF
        b[:, c, 0] = v & 0xFF; b[:, c, 1] = (v >> 8) & 0xFF; b[:, c, 2] = (v >> 16) & 0xFF
    import wave
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR); w.writeframes(b.tobytes())

def lufs(path):
    o = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float([l for l in o.splitlines() if l.strip().startswith("I:")][-1].split()[1])

n = int(DUREE * SR)
mus, fx = mus[:, :n], fx[:, :n]
# normalisation : musique -27 LUFS, bruitages -31 LUFS (mesurés), puis mix
for x, nom, cible in ((mus, "musique", -27.0), (fx, "bruitages", -31.0)):
    x /= np.abs(x).max() + 1e-9; x *= 0.5
    wav(OUT / f"{nom}.wav", x); g = 10 ** ((cible - lufs(OUT / f"{nom}.wav")) / 20); x *= g
    wav(OUT / f"{nom}.wav", x); print(nom, round(lufs(OUT / f"{nom}.wav"), 1), "LUFS, crête", round(20 * np.log10(np.abs(x).max()), 1), "dBFS")
wav(OUT / "mix.wav", mus + fx); print("mix", round(lufs(OUT / "mix.wav"), 1), "LUFS")
# copies FLAC (sans perte, plus légères) pour l'archivage Git
for nom in ("musique", "bruitages", "mix"):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(OUT / f"{nom}.wav"), "-c:a", "flac", str(OUT / f"{nom}.flac")], check=True)
