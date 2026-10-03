#!/usr/bin/env bash
# Monte les images rendues + l'audio en MP4.
# Usage : outils/monter.sh <dossier_images> <fps> <sortie.mp4> [crf]
set -euo pipefail
D="${1:?dossier}"; FPS="${2:?fps}"; OUT="${3:?sortie}"; CRF="${4:-18}"
EXT=$(find "$D" -maxdepth 1 -name "f000000.*" -printf "%f" | sed "s/.*\.//")
R="$(cd "$(dirname "$0")/.." && pwd)"
ffmpeg -hide_banner -loglevel error -y -framerate "$FPS" -i "$D/f%06d.$EXT" -i "$R/audio/mix.wav" \
  -c:v libx264 -preset slow -crf "$CRF" -pix_fmt yuv420p -profile:v high -movflags +faststart \
  -c:a aac -b:a 256k -shortest "$OUT"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$OUT"
