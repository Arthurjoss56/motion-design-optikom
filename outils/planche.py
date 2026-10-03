#!/usr/bin/env python3
"""Planche contact : python3 planche.py sortie.jpg img1 img2 ... (2 colonnes, légende = nom)."""
import sys
from PIL import Image, ImageDraw, ImageFont
out, fs = sys.argv[1], sys.argv[2:]
cols = int(__import__('os').environ.get('COLS', 2)); w = int(__import__('os').environ.get('LARG', 960))
ims = [Image.open(f).convert('RGB') for f in fs]
ims = [i.resize((w, int(i.height * w / i.width))) for i in ims]
h = ims[0].height; rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cols * w + (cols - 1) * 6, rows * (h + 30)), '#222')
d = ImageDraw.Draw(S); f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
for k, (im, fn) in enumerate(zip(ims, fs)):
    x, y = (k % cols) * (w + 6), (k // cols) * (h + 30)
    S.paste(im, (x, y + 30)); d.text((x + 6, y + 4), fn.split('/')[-1], fill='#fff', font=f)
S.save(out, quality=85)
