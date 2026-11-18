# Rapport de conformité aux maquettes

Captures produites par `tests/e2e/captures.spec.ts` (même viewport et même densité que les maquettes, données de `tests/fixtures/progression-demo.json`, date figée au 18 novembre 2026). Deux tours complets de comparaison ont été faits ; les écarts corrigés entre les deux tours sont listés en bas.

Grille appliquée à chaque écran : structure et ordre des blocs ; police, tailles, graisses ; couleurs ; espacements et alignements ; composants et états ; libellés.

| # | Maquette | Capture | Conforme | Écarts restants et pourquoi |
|---|---|---|---|---|
| 01 | `maquettes/png/01-accueil-mobile.png` | `tests/captures/01-accueil-mobile.png` | Oui | Pourcentages (71 / 61 / 33 % par niveau, 79 % chapitre 1) : ils sont calculés à partir des données de démonstration, cohérentes avec les règles de calcul (126 réussies, 14 erreurs), alors que les chiffres de la maquette sont illustratifs. |
| 02 | `02-question-mobile.png` | `02-question-mobile.png` | Oui | Lien « Question précédente » sous les choix : exigé par SPEC §4 (revenir à la question précédente), absent de la maquette. Le choix A passe à la ligne un mot plus loin (différence de rendu de police d'environ 1 px). |
| 03 | `03-correction-mobile.png` | `03-correction-mobile.png` | Oui | Aucun écart visible. |
| 04 | `04-entrainement-mobile.png` | `04-entrainement-mobile.png` | Oui | Le lien « Tout sélectionner » a une cible tactile de 44 px (règle d'accessibilité) : les puces commencent 4 px plus bas. |
| 05 | `05-examen-mobile.png` | `05-examen-mobile.png` | Oui, avec écart voulu | La barre d'onglets reste visible pendant l'épreuve (SPEC §2 : « la barre d'onglets et le rail restent visibles ») : la barre Précédente / Suivante se pose au-dessus, comme sur la maquette 04. SPEC > maquette. Le bouton « Terminer l'épreuve » (exigé par SPEC §6) est sous « Marquer pour revoir », hors de l'écran visible. |
| 06 | `06-resultat-examen-mobile.png` | `06-resultat-examen-mobile.png` | Oui | « Mercredi » au lieu de « Mardi » : le 18 novembre 2026 est un mercredi, la date est calculée. Chapitres 3 et 10 à égalité (2 sur 4) : affichés par numéro de chapitre. Badge 14 au lieu de 23 (données). |
| 07 | `07-stats-mobile.png` | `07-stats-mobile.png` | Oui | Jours affichés Jeu → Mer (le jour du jour est un mercredi). Pourcentages : données. Plus bas dans la page, lien « Importer une progression » ajouté (exigé par SPEC §10). |
| 08 | `08-accueil-desktop.png` | `08-accueil-desktop.png` | Oui | « Dernier examen blanc » : 15,5 (le plus récent des données de démonstration, comme sur les maquettes 06 et 07 ; la maquette 08 montre 13,5, elle se contredit avec 06/07). Pourcentages et « Dernière séance » : données. |
| 09 | `09-question-desktop.png` | `09-question-desktop.png` | Oui | Source « ch.10 » au lieu de « ch. 10 » : texte exact de `data/questions.json`, qui ne doit pas être modifié. |

## Corrections faites entre le tour 1 et le tour 2

- Interlignage global : Tailwind impose 1,5 par défaut, les maquettes utilisent l'interlignage normal de la police → en-têtes et listes trop hauts. Corrigé dans `app/globals.css`.
- Liens texte (« Voir les 12 », « Tout revoir », « S'entraîner ») non soulignés → soulignés comme sur les maquettes.
- Rail desktop trop large (280 px) et coupé en bas sur une page longue → 248 px, fond sur toute la hauteur.
- Statistiques : ordre des blocs (Régularité, Réussite par chapitre, Examens blancs, actions), libellés compacts (« Approche par compétences » sans « (APC) »), « Exporter » et « Réinitialiser » sur la même ligne.
- Séparateur des milliers absent (« 1248 ») : l'espace fine n'existe pas dans la police → espace insécable (« 1 248 »).
- « À retravailler en priorité » : sous-titres toujours en rouge stylo, comme la maquette.
- Compteur « N bonnes sur M » du desktop : compte les questions précédentes, comme la maquette 09.
- Captures prises pendant une transition (pastille B grisée) → attente de la fin des transitions.

## Vérifications automatiques (tests/e2e/design.spec.ts)

Police Atkinson Hyperlegible chargée et appliquée ; fond `#F3F5F9` ; texte `#172041` ; surligneur `#FFE45C` (trait et pastille) sur la bonne réponse uniquement ; bordure et pastille `#C4283A`, texte `#A3192B` sur la mauvaise réponse ; barre d'onglets visible uniquement en mobile (76 px, collée en bas) ; rail visible uniquement en desktop (248–280 px, bleu nuit).
