#!/usr/bin/env python3
"""Calcule les timecodes de la voix off et du texte à l'image à partir de script/lignes.json.

Règles : débit de lecture naturel (réglage « cps »), chaque phrase affichée au moins
« min_duree » secondes (> 1,5 s exigé ; « min » par ligne si l'animation du texte le demande), jamais deux phrases en même temps (« ecart » entre
deux phrases), respiration plus longue entre deux actes (« pause_acte »).
Chaque phrase porte un identifiant (« id ») : la timeline du film (film/scene.js) s'accroche
à ces identifiants, donc l'image suit automatiquement si le script change.
Sorties : script/sous-titres.srt, script/sous-titres.vtt, script/timecodes.json,
script/script-voix-off.md
"""
import json, pathlib

RACINE = pathlib.Path(__file__).resolve().parent.parent

def tc(s, sep=","):
    ms = round(s * 1000)
    h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); sec, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{sec:02d}{sep}{ms:03d}"

def court(s):
    m, sec = divmod(s, 60)
    return f"{int(m)}:{sec:05.2f}"

def main():
    data = json.loads((RACINE / "script/lignes.json").read_text())
    reg = {"cps": 14.0, "min_duree": 1.8, "tenue": 0.35, "ecart": 0.3, "pause_acte": 0.9, **data.get("reglages", {})}
    CPS, MIN_DUREE, TENUE, ECART, PAUSE_ACTE = reg["cps"], reg["min_duree"], reg["tenue"], reg["ecart"], reg["pause_acte"]
    t = data["debut"]
    sortie, acte_prec = [], None
    for ligne in data["lignes"]:
        if acte_prec is not None and ligne["acte"] != acte_prec:
            t += PAUSE_ACTE
        if "debut_force" in ligne:
            t = max(t, ligne["debut_force"])
        dite = len(ligne.get("voix", ligne["texte"])) / CPS
        duree = max(ligne.get("min", MIN_DUREE), dite + TENUE, len(ligne["texte"]) / 17 + 0.4)
        sortie.append({**ligne, "debut": round(t, 2), "fin": round(t + duree, 2), "duree_voix": round(dite, 2)})
        t += duree + ECART
        acte_prec = ligne["acte"]
    fin_film = round(t - ECART + data["queue"], 2)
    ids = [l["id"] for l in sortie]
    assert len(ids) == len(set(ids)), "identifiants en double"
    for a, b in zip(sortie, sortie[1:]):
        assert a["fin"] <= b["debut"], (a["id"], b["id"])
    assert all(l["fin"] - l["debut"] >= 1.5 for l in sortie)

    srt, vtt = [], ["WEBVTT", ""]
    for i, l in enumerate(sortie, 1):
        srt += [str(i), f"{tc(l['debut'])} --> {tc(l['fin'])}", l["texte"], ""]
        vtt += [f"{tc(l['debut'], '.')} --> {tc(l['fin'], '.')}", l["texte"], ""]
    (RACINE / "script/sous-titres.srt").write_text("\n".join(srt))
    (RACINE / "script/sous-titres.vtt").write_text("\n".join(vtt))
    (RACINE / "script/timecodes.json").write_text(json.dumps(
        {"version": data.get("version", ""), "duree_film": fin_film, "lignes": sortie}, ensure_ascii=False, indent=2))

    md = ["# Script de la voix off — film Optikom", "",
          f"Version : {data.get('version', '')}.",
          f"Durée du film : **{court(fin_film)}** ({fin_film} s). Débit visé : ~{CPS:.0f} caractères/s, voix dynamique mais posée, souriante, sans emphase publicitaire.",
          "Chaque phrase commence au timecode indiqué : c'est l'instant où le même texte apparaît à l'image. Finir la phrase avant le timecode de fin.",
          "Les nombres sont écrits en toutes lettres dans la colonne « Voix off » pour la lecture.",
          "", "| # | Acte | Début | Fin | Voix off (à dire) | Texte à l'image | À l'image |", "|---|---|---|---|---|---|---|"]
    for i, l in enumerate(sortie, 1):
        md.append(f"| {i} | {l['acte']} | {court(l['debut'])} | {court(l['fin'])} | {l.get('voix', l['texte'])} | {l['texte']} | {l.get('image', '')} |")
    md += ["", f"Fin du film (carton final tenu) : {court(fin_film)}", ""]
    (RACINE / "script/script-voix-off.md").write_text("\n".join(md))
    print(f"{len(sortie)} lignes, film {fin_film} s")
    for l in sortie:
        print(f"{l['id']:3s} {court(l['debut'])} → {court(l['fin'])}  ({l['fin'] - l['debut']:.2f} s) [{l['acte']}] {l['texte']}")

if __name__ == "__main__":
    main()
