#!/usr/bin/env bash
# Rendu final par morceaux de 18 s (reprend là où il s'est arrêté si la machine redémarre), puis assemblage.
set -euo pipefail
R="$(cd "$(dirname "$0")/.." && pwd)"; M="$R/versions/morceaux"; mkdir -p "$M"
cd "$R/film"
D=$(node -e "const s=require('fs').readFileSync('data.js','utf8');console.log(/\"duree\":\s*([\d.]+)/.exec(s)[1])")
for a in 0 18 36 54; do
  b=$((a + 18)); [ $a -eq 54 ] && b=$D
  f="$M/m$(printf %02d $a).mp4"
  [ -s "$f" ] && { echo "déjà fait : $f"; continue; }
  node render.mjs --video "$f.tmp.mp4" --from $a --to $b --fps 60 --flou 4 --obturateur 0.5 --workers 4
  mv "$f.tmp.mp4" "$f"; echo "morceau $a → $b terminé"
done
ls "$M"/m*.mp4 | sed "s/.*/file '&'/" > "$M/liste.txt"
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$M/liste.txt" -c copy "$R/versions/optikom-film-v6-sans-son.mp4"
echo "RENDU TERMINÉ"
