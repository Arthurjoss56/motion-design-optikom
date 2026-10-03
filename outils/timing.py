#!/usr/bin/env python3
"""Calcule les timecodes de la voix off / des sous-titres à partir de script/lignes.json.

Règles : débit de lecture naturel (~14 caractères/s, voix posée), chaque texte
affiché au moins 1,8 s (> 1,5 s exigé), jamais deux textes en même temps
(écart minimal 0,3 s entre deux sous-titres), respiration plus longue entre deux actes.
Sorties : script/sous-titres.srt, script/sous-titres.vtt, script/timecodes.json,
script/script-voix-off.md
"""
import json, pathlib, sys

RACINE = pathlib.Path(__file__).resolve().parent.parent
CPS = 14.0          # caractères par seconde (voix off posée)
MIN_DUREE = 1.8     # secondes
TENUE = 0.35        # le sous-titre reste un peu après la fin de la phrase
ECART = 0.3         # blanc entre deux sous-titres
PAUSE_ACTE = 0.9    # respiration entre deux actes

def tc(s, sep=","):
    ms = round(s * 1000)
    h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); sec, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{sec:02d}{sep}{ms:03d}"

def court(s):
    m, sec = divmod(s, 60)
    return f"{int(m)}:{sec:05.2f}"

def main():
    data = json.loads((RACINE / "script/lignes.json").read_text())
    t = data["debut"]
    sortie, acte_prec = [], None
    for ligne in data["lignes"]:
        if acte_prec is not None and ligne["acte"] != acte_prec:
            t += PAUSE_ACTE
        if "debut_force" in ligne:
            t = max(t, ligne["debut_force"])
        dite = len(ligne.get("voix", ligne["texte"])) / CPS
        duree = max(MIN_DUREE, dite + TENUE, len(ligne["texte"]) / 17 + 0.4)
        sortie.append({**ligne, "debut": round(t, 2), "fin": round(t + duree, 2),
                       "duree_voix": round(dite, 2)})
        t += duree + ECART
        acte_prec = ligne["acte"]
    fin_film = round(t - ECART + data["queue"], 2)
    # Contrôles
    for a, b in zip(sortie, sortie[1:]):
        assert a["fin"] <= b["debut"], (a, b)
    assert all(l["fin"] - l["debut"] >= 1.5 for l in sortie)

    srt, vtt = [], ["WEBVTT", ""]
    for i, l in enumerate(sortie, 1):
        srt += [str(i), f"{tc(l['debut'])} --> {tc(l['fin'])}", l["texte"], ""]
        vtt += [f"{tc(l['debut'], '.')} --> {tc(l['fin'], '.')}", l["texte"], ""]
    (RACINE / "script/sous-titres.srt").write_text("\n".join(srt))
    (RACINE / "script/sous-titres.vtt").write_text("\n".join(vtt))
    (RACINE / "script/timecodes.json").write_text(json.dumps(
        {"duree_film": fin_film, "lignes": sortie}, ensure_ascii=False, indent=2))

    md = [f"# Script de la voix off — film Optikom", "",
          f"Durée du film : **{court(fin_film)}** ({fin_film} s). Débit visé : ~{CPS:.0f} caractères/s, voix posée, souriante, sans emphase publicitaire.",
          "Chaque phrase commence au timecode indiqué (début du sous-titre). Le sous-titre reste affiché jusqu'à la fin indiquée : finir la phrase avant.",
          "", "| # | Acte | Début | Fin | Voix off (à dire) | Sous-titre affiché | À l'image |", "|---|---|---|---|---|---|---|"]
    for i, l in enumerate(sortie, 1):
        md.append(f"| {i} | {l['acte']} | {court(l['debut'])} | {court(l['fin'])} | {l.get('voix', l['texte'])} | {l['texte']} | {l.get('image', '')} |")
    md += ["", f"Fin du film (carton final tenu) : {court(fin_film)}", ""]
    (RACINE / "script/script-voix-off.md").write_text("\n".join(md))
    print(f"{len(sortie)} lignes, film {fin_film} s")
    for i, l in enumerate(sortie, 1):
        print(f"{i:2d} {court(l['debut'])} → {court(l['fin'])}  [{l['acte']}] {l['texte']}")

if __name__ == "__main__":
    main()
