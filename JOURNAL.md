# Journal de production — film Optikom

## Décision (3 octobre 2026)
Motion (MCP) abandonné à la demande d'Arthur (compte sans crédit). Le film est **fabriqué en code** :
scène HTML/CSS + timeline GSAP déterministe (`film/`), rendue image par image dans Chromium (`film/render.mjs`),
montée avec ffmpeg (`outils/monter.sh`). Musique et bruitages synthétisés (`outils/audio.py`), pistes séparées.

## Reprendre le travail
```bash
cd film && node render.mjs --at 12,45,98 --scale 0.5 --out /tmp/chk        # images de contrôle
node render.mjs --fps 60 --scale 1 --workers 4 --out ../versions/frames-vX  # rendu complet
cd .. && python3 outils/audio.py && outils/monter.sh versions/frames-vX 60 versions/optikom-film-vX.mp4 18
```
Les images rendues (`versions/frames-*`) ne sont pas versionnées (régénérables).
Pour changer un texte du script : `script/lignes.json` → `python3 outils/timing.py` → `python3 outils/donnees_film.py`
(attention : la timeline de `film/scene.js` est calée sur les timecodes actuels).

## État
- [x] Étude du site (code source du dépôt optikom-site + build local + captures).
- [x] Script et timecodes (`script/`).
- [x] Moteur de rendu + film v1 complet (11 actes, une seule caméra, sous-titres incrustés).
- [x] Musique + bruitages v1 (`audio/`).
- [x] 4 passes de revue DA (relecteur indépendant) → v5 jugée diffusable.

## Versions
| Version | Fichier | Notes |
|---|---|---|
| aperçu | versions/apercu-v1-540p.mp4 | premier montage basse définition (contrôle interne) |
| v1 | versions/optikom-film-v1.mp4 | 1080p 30 i/s |
| v2 | versions/optikom-film-v2.mp4 | 1080p 60 i/s, corrections de la revue DA (cartes noires, CTA, carte plein cadre, titres nés des objets, morphings) |
| v3 | versions/optikom-film-v3.mp4 | 2e revue DA : flash 1:26, pops, recadrages, carton final, caméra adoucie |
| v4 | (non versionnée) | 3e revue : transitions garantie → prix et prix → appel à l action |
| **v5** | versions/optikom-film-v5.mp4 | **version livrée** : textes secondaires masqués avant rétraction, panneau final centré, étiquette Theix-Noyalo |

## Points ouverts
- Garantie : « [À COMPLÉTER] » (phrase 21, `film/scene.js` acte 9 + `script/lignes.json`).
- Chiffres : uniquement réels (30 jours, 100/100 optikom.fr sept. 2026, 1 interlocuteur, 48 h, 24 h, prix). Tableau de bord, fiche Google, boîte mail = « Illustration ». Noms des demandes (Claire M., Thomas L.…) fictifs.
- Délais 24 h / 48 h : « ouvrées » sur le site.
