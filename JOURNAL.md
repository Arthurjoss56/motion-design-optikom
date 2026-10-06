# Journal de production — film Optikom

## Décision (3 octobre 2026)
Motion (MCP) abandonné à la demande d'Arthur (compte sans crédit). Le film est **fabriqué en code** :
scène HTML/CSS + timeline GSAP déterministe (`film/`), rendue image par image dans Chromium (`film/render.mjs`),
montée avec ffmpeg. Musique et bruitages synthétisés (`outils/audio.py`), pistes séparées.

## Demande d'Arthur après la v5 (5 octobre 2026)
« Pas assez dynamique encore, sûrement la raccourcir, le maximum d'info, une timeline correcte, ajouter le texte
directement dans l'animation, une flèche de souris numérique avec un clic si besoin. Toujours un peu plus digital. »
→ **v6** : film ramené de ~95 s à **72 s**, 20 phrases courtes. Le texte n'est plus dans une pastille de sous-titre : chaque
phrase du script **vit dans l'animation** (texte cinétique, `<h1>` tapé qui devient le titre, boutons, barre d'adresse).
Curseurs étiquetés « Votre client », « Optikom », « Vous » qui cliquent ; interface plus numérique (éditeur de maquette,
code qui construit le site, déploiement, carte, formulaire, boîte mail). Flou de mouvement au rendu (obturateur 180°).

## Reprendre le travail
```bash
# 1. changer un texte : script/lignes.json, puis
python3 outils/timing.py && python3 outils/donnees_film.py      # timecodes, SRT/VTT, script voix off, film/data.js
# la timeline de film/scene.js est accrochée aux identifiants des phrases (T('p1'), F('p1')) : l'image suit le script.
# 2. contrôler
cd film && node verif-texte.mjs                                   # chaque phrase lisible ≥ 1,5 s, jamais deux à la fois, texte = script
node render.mjs --at 12,45,60 --scale 0.5 --out /tmp/chk          # images de contrôle
node render.mjs --fps 30 --scale 0.5 --out ../versions/frames-vX # aperçu basse définition (images)
# 3. son (repères exportés par la scène) puis rendu final avec flou de mouvement
node render.mjs --cues ../audio/cues.json && cd .. && python3 outils/audio.py
cd film && node render.mjs --video ../versions/optikom-film-vX-sans-son.mp4 --fps 60 --flou 4 --obturateur 0.5 --workers 4
cd .. && ffmpeg -i versions/optikom-film-vX-sans-son.mp4 -i audio/mix.wav -vf noise=c0s=3:c0f=t -c:v libx264 -preset slow \
  -crf 18 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 256k -shortest versions/optikom-film-vX.mp4
```
Les images rendues (`versions/frames-*`) et les WAV ne sont pas versionnés (régénérables).

## État
- [x] Étude du site (code source du dépôt optikom-site + build local + captures).
- [x] v1 → v5 (4 passes de revue DA) — v5 livrée le 3 octobre.
- [x] v6 : script court (20 phrases, identifiants), scène réécrite, texte intégré, curseurs, flou de mouvement.
- [x] Revue DA de la v6a → v6b : phrases lisibles en entier ≥ 1,5 s (contrôle automatique `film/verif-texte.mjs`),
      espaces insécables visibles, `<h1>` transformé sur place, plus aucun texte recouvert (loupe, notification,
      carte Performance, étiquettes de communes, particules, enveloppe), seconde moitié animée (caméra de carte en
      carte, frise / jauge / parcours, garantie qui s'ouvre de la pile avec poussée et reflet, prix mis en avant à tour
      de rôle avec points cochés), appel à l'action en grand avec clic et confirmation, panneau final opaque,
      iris de la carte sur 0,5 s, curseur « Vous » clair sur fond sombre, pointes de curseur jamais sur le texte.
- [x] 2e revue DA (v6b) → v6c : état « envoyé » conservé (coches, point vert) et clic dans la barre d'adresse ; caméra qui
      attend la fin de la phrase c3 ; « 1 interlocuteur » gardé jusqu'à l'ouverture de la garantie ; garantie qui descend
      avec la caméra et se partage au centre (remplissage bleu opaque) ; appel à l'action sur place (les prix deviennent
      les boutons, libellés en fondu, cercle bleu nuit depuis les boutons) ; boîte mail et écran du téléphone opaques ;
      bas de carte découpé en côte ; jauge visible ; cartes voisines entières, floutées ; son à −16 LUFS / −1 dBTP.
- [x] Contrôles automatiques : `film/verif-texte.mjs` (texte, caméra) ; animations sans chevauchement de propriété
      (rendu identique quel que soit le processus qui calcule l'image).
- [x] Rendu final 1080p60 avec flou de mouvement → `versions/optikom-film-v6.mp4` (52 Mo, −16,1 LUFS), livré le 5 octobre.

## Versions
| Version | Fichier | Notes |
|---|---|---|
| aperçu | versions/apercu-v1-540p.mp4 | premier montage basse définition (contrôle interne) |
| v1 | versions/optikom-film-v1.mp4 | 1080p 30 i/s |
| v2–v4 | (non versionnées) | revues DA successives |
| v5 | versions/optikom-film-v5.mp4 | livrée le 3 octobre (~95 s, sous-titres en pastille) |
| v6a | versions/apercu-v6a-540p.mp4 | aperçu interne de la v6 (72 s) — revue DA : seconde moitié trop statique, CTA vide |
| v6b | (non versionné) | aperçu après la 1re revue — envoyé à Arthur comme aperçu intermédiaire |
| v6c | versions/apercu-v6c-540p.mp4 | aperçu après la 2e revue (charnières, son) |
| **v6** | versions/optikom-film-v6.mp4 | **version livrée** : 1080p 60 i/s, flou de mouvement, son −16 LUFS |

## Points ouverts
- Garantie : « [À COMPLÉTER] » (ligne g1 de `script/lignes.json` + carte de l'acte 8 dans `film/scene.js`).
- Chiffres : uniquement réels (30 jours à partir de la validation de la maquette, 100/100 Lighthouse mobile optikom.fr
  sept. 2026, 1 interlocuteur, 48 h, 24 h, prix, TVA art. 293 B). Fiche Google, boîte mail, résultats de recherche,
  score de performance = « Illustration ». Noms des demandes (Claire M., Thomas L., Sophie R.) et concurrents fictifs.
- Délais 24 h / 48 h : « ouvrés » sur le site.

## v7 (6 octobre 2026)
Demande d'Arthur : retirer les tarifs ; garantie « Vous rendre visible sur Google ». Le film passe à 64 s, la garantie se tape dans la carte puis se partage directement en boutons d'appel à l'action. Fichier : `versions/optikom-film-v7.mp4`.
