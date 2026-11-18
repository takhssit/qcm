# Maquettes — QCM « Pédagogie moderne »

Direction « fiche de révision et surligneur » (voir `docs/DESIGN.md`). Neuf écrans, chacun en deux formats :

- `png/` : capture à reproduire (densité ×2 ; mobile 390 × 844 px, desktop 1440 px de large) ;
- `html/` : la même page en HTML/CSS statique, ouvrable dans un navigateur, pour lire les valeurs exactes (tailles, espacements, CSS du surligneur). Les liens entre écrans fonctionnent.

| # | Fichier | Écran | Route |
|---|---|---|---|
| 01 | `01-accueil-mobile` | Accueil | `/` |
| 02 | `02-question-mobile` | Question, choix B sélectionné, avant validation | `/parcours` |
| 03 | `03-correction-mobile` | Correction après une mauvaise réponse | `/entrainement` (série) |
| 04 | `04-entrainement-mobile` | Filtres de l'entraînement | `/entrainement` |
| 05 | `05-examen-mobile` | Examen blanc en cours | `/examen` |
| 06 | `06-resultat-examen-mobile` | Résultat de l'examen blanc | `/examen` (après remise) |
| 07 | `07-stats-mobile` | Statistiques | `/stats` |
| 08 | `08-accueil-desktop` | Tableau de bord desktop | `/` |
| 09 | `09-question-desktop` | Question corrigée (bonne réponse), desktop | `/parcours`, `/entrainement` |

Les chiffres affichés (126 questions réussies, 15,5 / 20, etc.) sont des données d'exemple : dans le site, tout est calculé à partir de la progression réelle.

Version interactive (on peut cliquer un choix puis « Valider » sur l'écran 02) : https://claude.ai/artifact/5EV6hvM5bz3iSEN1dpFKpV (accessible avec ton compte Claude).
