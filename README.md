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
