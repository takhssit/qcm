# DESIGN.md — QCM « Pédagogie moderne »

Direction : **fiche de révision et surligneur**. Un écran de quiz standard, propre et familier ; le monde de la révision n'apparaît que par la typographie, la palette, la densité et un seul geste signature : le **trait de surligneur jaune**.

## Couleurs

| Rôle | Token | Valeur | Usage |
|---|---|---|---|
| Fond | `--ground` | `#F3F5F9` | Fond de page (papier froid) |
| Surface | `--surface` | `#FFFFFF` | Panneaux, choix de réponse, barres |
| Encre | `--ink` | `#172041` | Texte principal, boutons principaux, barre de navigation |
| Encre secondaire | `--ink-2` | `#4B5470` | Métadonnées, sous-titres |
| Encre atténuée | `--ink-3` | `#5B6482` | Onglets inactifs, choix écartés |
| Texte sur encre | `--on-ink-2` | `#C9D0E6` | Sous-titres dans la barre bleu nuit |
| Trait | `--line` | `#DDE2EC` | Bordures de panneaux |
| Trait léger | `--line-2` | `#E6EAF2` | Séparateurs, pistes de progression |
| Bordure de choix | `--line-choice` | `#D3D9E6` | Choix au repos |
| Surligneur | `--marker` | `#FFE45C` | Bonne réponse, progression, onglet actif, note |
| Stylo rouge | `--pen` | `#C4283A` | Badges d'erreurs, icône « Explication », bordure de mauvaise réponse |
| Texte d'erreur | `--pen-text` | `#A3192B` | Texte de mauvaise réponse et chapitres faibles |
| Niveau facile | `--lvl-1` | `#A6E9F5` | Étiquette « Facile » |
| Niveau moyen | `--lvl-2` | `#FFC978` | Étiquette « Moyen » |
| Niveau difficile | `--lvl-3` | `#FFA8D6` | Étiquette « Difficile » |

Le texte des étiquettes de niveau et du surligneur reste toujours `--ink`. Une couleur ne porte jamais seule une information : chaque état a aussi une icône ou un libellé (« Bonne réponse », « Votre réponse »).

## Typographie

- Une seule famille : **Atkinson Hyperlegible** (400, 700), conçue pour la lisibilité. Repli : `system-ui, sans-serif`.
- Échelle (px) : 12 · 13 · 14 · 15 · 16 · 17 · 18 · 20 · 21–22 · 28–30 · 34.
- Énoncé de question : 21 px mobile, 28 px desktop, gras, interligne 1,3–1,35.
- Choix et explications : 16–17 px, interligne 1,45–1,6.
- Chiffres : `font-variant-numeric: tabular-nums` partout où il y a des scores et des pourcentages.

## Formes et espacement

- Rayons : 9 px (pastille de lettre), 12 px (boutons, puces), 14 px (choix), 16 px (panneaux), 999 px (étiquettes).
- Espacement : marges de page de 16 px sur mobile, 40–48 px sur desktop ; 22 px entre sections, 10 px entre un titre de section et son contenu.
- Cibles tactiles : 44 px minimum ; bouton principal de 52 px sur mobile.
- Ombre unique, réservée au bloc d'action principal : `0 2px 8px rgba(23,32,65,.06)`.

## Geste signature : le surligneur

```css
.marker {
  background-image: linear-gradient(100deg,
    rgba(255,228,92,0) .6%, #FFE45C 2.4%, rgba(255,228,92,.85) 8%,
    rgba(255,228,92,.74) 92%, #FFE45C 97%, rgba(255,228,92,0) 99.4%);
  background-repeat: no-repeat;
  background-size: 0% 100%;               /* 100% 100% une fois corrigée */
  box-decoration-break: clone;
  border-radius: 7px 3px 8px 4px;
  padding: 1px 5px; margin: 0 -5px;
  transition: background-size .75s cubic-bezier(.16,1,.3,1);
}
@media (prefers-reduced-motion: reduce) { .marker { transition: none; } }
```

- **Validation d'une réponse :** le trait balaie la bonne réponse de gauche à droite en 750 ms, c'est le seul mouvement « signature » du produit.
- **Progression :** les barres de progression sont dessinées avec le même trait, sur une piste `--line-2`.
- **Onglet actif et note d'examen :** même trait, posé sous le libellé.
- Les autres transitions durent 150 à 250 ms et ne font que signaler un changement d'état.

## Composants

- **Choix de réponse :** un vrai `<button>` (`aria-pressed`) ; lettre A–D dans une pastille de 30 px. États :
  - repos (bordure `--line-choice`) ;
  - survol (bordure `#8B93AE`) ;
  - sélectionné (bordure et pastille `--ink`) ;
  - bonne réponse (surligneur, pastille jaune, coche, « Bonne réponse ») ;
  - mauvaise réponse choisie (bordure et pastille `--pen`, texte `--pen-text`, croix, « Votre réponse ») ;
  - écarté (texte `--ink-3`).
- **Panneau d'explication :** verdict en une phrase, titre « Explication » avec l'icône de stylo rouge, texte, puis la source en 13 px.
- **Barre d'onglets mobile :** 5 onglets (Accueil, Entraîner, Examen, Erreurs avec badge rouge, Stats) ; onglet actif en gras et surligné.
- **Rail desktop :** bleu nuit, 248–280 px, puis le contenu dans une colonne de 1120–1200 px maximum.
- **Examen blanc :** chronomètre en pastille bleu nuit ; grille de 40 cases (répondue = encre, à revoir = surligneur cerclé, en cours = contour) ; aucune correction avant la fin.
- **Icônes :** traits de 1,8–2 px, 20–22 px (style Lucide), jamais d'emoji.

## Interdits

Pas de dégradé décoratif, pas de confettis ni de mascotte, pas de bordure colorée à gauche des cartes, pas de « big number » isolé avec une rangée de mini-statistiques. Le jaune est réservé au surligneur.
