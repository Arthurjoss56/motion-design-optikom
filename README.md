# Film de motion design Optikom

Production d'un film de marque (~1 min 53) pour l'agence web Optikom (Vannes), généré avec Motion (MCP).

## Où en est-on ? (pour reprendre si la session coupe)
Voir `JOURNAL.md` (état, numéro de job Motion, versions, prochaine étape).

## Arborescence
- `script/lignes.json` : texte source du script (sous-titres + voix off). **Seul fichier à modifier** pour changer un texte.
- `outils/timing.py` : recalcule les timecodes → `script/sous-titres.srt|.vtt`, `script/timecodes.json`, `script/script-voix-off.md`.
- `brief/DESIGN.md` : identité visuelle (tokens du site preview.optikom.fr) envoyée à Motion.
- `brief/brief-motion-v*.md` : brief exact envoyé à Motion pour chaque version.
- `references/style/` : références de style (captures du site, logo) — uniquement pour guider Motion, jamais collées dans le film.
- `references/site/sections/` : captures du site découpé par sections (source : build local du dépôt optikom-site).
- `versions/` : vidéos rendues (v1, v2…) + images-clés de contrôle.

## Livrables
| Fichier | Contenu |
|---|---|
| `versions/optikom-film-v5.mp4` | Film final : 1920×1080, 60 i/s, H.264, sous-titres incrustés, musique + bruitages (−26,5 LUFS, place laissée à la voix) |
| `script/script-voix-off.md` | Script de la voix off : timecode de début/fin de chaque phrase, texte à dire, ce qu'on voit à l'image |
| `script/sous-titres.srt` / `.vtt` | Sous-titres séparés (mêmes timecodes) |
| `audio/musique.flac`, `audio/bruitages.flac`, `audio/mix.flac` | Pistes séparées (48 kHz) pour le mixage avec la voix |

## Fabrication
Le film est entièrement reconstruit en code (aucune capture d'écran collée) : `film/index.html` + `film/style.css`
(tokens du site preview.optikom.fr) + `film/scene.js` (scène unique, une seule caméra, timeline GSAP déterministe),
rendu image par image dans Chromium (`film/render.mjs`), monté avec ffmpeg (`outils/monter.sh`).
Musique et bruitages synthétisés par `outils/audio.py` (libres de droits).
