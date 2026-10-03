#!/usr/bin/env python3
"""Génère film/data.js : sous-titres (script/timecodes.json) + carte du Morbihan (dépôt optikom-site)."""
import json, pathlib, re
R = pathlib.Path(__file__).resolve().parent.parent
tc = json.loads((R / "script/timecodes.json").read_text())
carte = pathlib.Path("/home/user/optikom-site/src/data/carte-morbihan.ts")
src = carte.read_text() if carte.exists() else (R / "film/assets/carte-morbihan.ts").read_text()
d = re.search(r"d: '([^']+)'", src).group(1)
(R / "film/assets").mkdir(exist_ok=True)
(R / "film/assets/carte-morbihan.ts").write_text(src)
communes = [
  ("Vannes", -2.7485, 47.6577), ("Séné", -2.7394, 47.6227), ("Arradon", -2.8239, 47.6331),
  ("Saint-Avé", -2.7434, 47.7008), ("Theix-Noyalo", -2.6472, 47.6304), ("Plescop", -2.8318, 47.6972),
  ("Auray", -2.9901, 47.6684), ("Sarzeau", -2.7584, 47.5253),
]
p = dict(lonMin=-3.73483, latMax=48.21088, kLon=0.6724360516376464, echelle=840.2508720442286, marge=20)
pts = [{"nom": n, "x": p["marge"] + (lo - p["lonMin"]) * p["kLon"] * p["echelle"], "y": p["marge"] + (p["latMax"] - la) * p["echelle"]} for n, lo, la in communes]
out = {"duree": tc["duree_film"], "sousTitres": [{"t0": l["debut"], "t1": l["fin"], "texte": l["texte"], "acte": l["acte"]} for l in tc["lignes"]],
       "carte": {"d": d, "w": 1000, "h": 824, "communes": pts}}
(R / "film/data.js").write_text("window.DATA = " + json.dumps(out, ensure_ascii=False) + ";\n")
print("data.js ok", out["duree"], len(out["sousTitres"]))
