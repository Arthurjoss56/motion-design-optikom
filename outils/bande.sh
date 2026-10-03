#!/usr/bin/env bash
# bande.sh <dossier_images> <fps> <t0> <t1> <n> <sortie.jpg> : planche de n images entre t0 et t1
D=$1; FPS=$2; T0=$3; T1=$4; NB=$5; OUT=$6
F=$(python3 -c "
t0,t1,n,f=$T0,$T1,$NB,$FPS
print(' '.join('$D/f%06d.jpg'%round((t0+(t1-t0)*i/(n-1))*f) for i in range(n)))")
COLS=4 LARG=480 python3 "$(dirname "$0")/planche.py" "$OUT" $F
