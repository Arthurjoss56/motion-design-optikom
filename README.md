# Film de motion design Optikom

Film de marque de 72 s pour l'agence web Optikom (Vannes). Il est entièrement fabriqué en code : une scène HTML/CSS et une timeline GSAP, rendues image par image. Il n'y a aucune capture d'écran collée.

## Où en est-on ? (pour reprendre si la session coupe)
Voir `JOURNAL.md` : décisions, état, versions, commandes pour reprendre.

## Livrables
| Fichier | Contenu |
|---|---|
| `versions/optikom-film-v6.mp4` | Film : 1920×1080, 60 i/s, H.264, flou de mouvement, texte intégré à l'animation, musique et bruitages (mix −16 LUFS, crête vraie −1 dBTP) |
| `script/script-voix-off.md` | Script de la voix off : timecodes de début et de fin de chaque phrase, texte à dire, texte à l'image, ce qu'on voit |
| `script/sous-titres.srt` / `.vtt` | Sous-titres séparés, aux mêmes timecodes (pour les plateformes) |
| `audio/musique.flac`, `audio/bruitages.flac`, `audio/mix.flac` | Pistes séparées (48 kHz) : musique et bruitages à −27 LUFS chacun, pour poser la voix par-dessus ; `mix` = son du film |

## Arborescence
- `script/lignes.json` : texte source du script (texte à l'image, voix off). **C'est le seul fichier à modifier pour changer un texte.**
- `outils/timing.py` : recalcule les timecodes. Il produit `script/sous-titres.srt|.vtt`, `script/timecodes.json` et `script/script-voix-off.md`.
- `outils/donnees_film.py` : produit `film/data.js` (timecodes, carte du Golfe) pour la scène.
- `film/index.html`, `film/style.css`, `film/scene.js` : la scène (une seule caméra, une timeline accrochée aux phrases du script).
- `film/render.mjs` : rendu en images, en vidéo avec flou de mouvement, ou export des repères sonores.
- `film/verif-texte.mjs` : contrôle automatique des règles du texte à l'écran.
- `outils/audio.py` : synthèse de la musique et des bruitages, calés sur les repères de la scène.
- `references/` : captures et étude du site preview.optikom.fr. Elles servent de référence et ne sont jamais collées dans le film.
- `versions/` : vidéos rendues.
- `film/archive-v5/`, `script/archive-v5/` : sources de la v5.

## Fabrication
- **Identité** : tokens du site preview.optikom.fr (bleu `#084eff`, encre `#0e2340`, verre dépoli, Bricolage Grotesque).
- **Rendu** : Chromium headless.
- **Flou de mouvement** : 4 sous-images par image, obturateur 180°, moyennées par ffmpeg.
- **Son** : la musique est synthétisée à 112 BPM. Les bruitages (clics, frappe, notifications…) sont placés sur les repères exportés par la scène.
