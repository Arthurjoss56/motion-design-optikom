# DESIGN.md — Optikom (agence web, Vannes)

Source : système de design de preview.optikom.fr (`src/styles/global.css`, `CLAUDE.md` du dépôt optikom-site).
Direction artistique : « mise au point » — ce qui est flou devient net. Bleu et blanc, profondeur, verre liquide.

## Couleurs (tokens exacts)
| Token | Hex | Usage |
|---|---|---|
| surface | #FFFFFF | fond principal |
| mist | #F1F4F9 | fond secondaire, tuiles |
| ink | #0E2340 | texte, panneaux sombres |
| ink-soft | #56667E | texte secondaire sur clair |
| fog | #AEBBD0 | texte secondaire sur ink |
| line | #D6DEEA | bordures fines |
| veil | #DCE5FB | surlignage doux, aplats clairs |
| accent | #316BFF | bleu du logo (aplats, icônes, jamais de petit texte) |
| accent-mid | #1D5CFF | haut du dégradé des boutons |
| accent-strong | #084EFF | texte bleu, boutons |
| accent-deep | #063CC8 | bas des cartes bleues |
| problème (vidéo seulement) | #E5484D / fond #FDECEC | uniquement pour l'acte « problème » et les défauts relevés par l'audit |

Dégradé « carte bleue » : linear 175° accent-strong → accent-deep, avec une tache accent radiale dans le coin haut-droit et une trame de points blancs 14 % (pas 14 px) masquée en radial dans ce coin. Jamais de texte sur la tache claire.

## Typographie
Police unique : **Bricolage Grotesque** (variable, Google Fonts). Titres : graisse 600–700, interlettrage −0,035 em, interlignage 1,0. Texte : 400–500. Chiffres tabulaires pour les compteurs. Typographie française : espace insécable avant « : ? ! » et entre nombre et unité (1 100 €, 48 h).

## Matières et profondeur
- Ombres en couches teintées ink (douces, faibles opacités) ; ombres teintées bleu sous les éléments bleus.
- Verre liquide : blanc 60 %, flou 16 px, saturation 180 %, bordure blanche 70 %, reflet interne d'1 px en haut. Version sombre : blanc 6–14 % sur ink ou bleu.
- Éléments optiques : disques de verre bleuté (sphères translucides avec reflet spéculaire), anneaux de mise au point (cercles concentriques fins + réticule de visée).
- Rayons : 16 px (blocs), 24 px (médias), 32 px (grands panneaux).
- Pastilles en verre (« Illustration », « Basé à Vannes »), boutons pilule.

## Composants à reconstruire (vectoriels, jamais de capture collée)
- Bouton principal : pilule, dégradé accent-mid → accent-strong, texte blanc, flèche → ; bouton secondaire en verre.
- Fenêtre de navigateur minimaliste (3 points, barre d'adresse arrondie), téléphone aux bords ink arrondis.
- Maquette de page d'accueil type : barres ink pour le titre, lignes grises, bouton bleu, bloc image veil, 3 tuiles mist.
- Résultat Google : barre de recherche arrondie avec loupe, résultats (url grise, titre bleu, deux lignes) ; « Votre entreprise » encadrée d'un liseré accent-strong 2 px.
- Bloc Google Maps : carte en aplats veil/blanc avec routes blanches, repères en goutte (bleu pour « Votre entreprise », gris pour les autres), liste de 3 fiches.
- Jauges Lighthouse : anneaux bleus avec le score « 100 » au centre.
- Cartes bleues tramées (« Invisible / Trop lent / Sans suite »), icônes au trait blanc (œil barré, jauge, chemin interrompu).
- Notification en verre « Nouvelle demande de devis » avec icône enveloppe dans un rond bleu.
- Mention discrète « Illustration » (pastille grise) sur toute interface qui ne montre pas une donnée réelle.

## Mouvement
- Signature : mise au point, flou 8–12 px → net, sur les titres et les éléments clés.
- Entrées en cascade : translation verticale 16–32 px + opacité, décalage 0,06–0,12 s, courbes ease-out longues (type expo/quint out), jamais de rebond cartoon.
- Flottement lent des éléments de verre (±6 px, 6 s), légère parallaxe en profondeur.
- Tracés qui se dessinent (stroke), compteurs qui montent, éléments qui se construisent comme au scroll.

## Ton
Simple, direct, rassurant. Zéro jargon. On parle du bénéfice pour le client (« Vos clients vous trouvent sur Google »), jamais de la technique.
Interdits : faux avis, fausses notes/étoiles, faux logos clients, chiffres inventés, promesse de première place garantie.
