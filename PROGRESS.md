# PROGRESS — Mission complète

## Fait
- Phase 1 — Socle : Next.js 16.4.6 (App Router, TypeScript strict, Tailwind v4), tokens DESIGN.md dans `app/globals.css`, police Atkinson Hyperlegible (next/font), barre d'onglets mobile + rail desktop (`components/AppFrame.tsx`), scripts npm (dev, build, start, lint, test, test:e2e, verify).
- Phase 2 — Logique : `lib/bank.ts`, `lib/progress.ts`, `lib/stats.ts`, `lib/exam.ts`, `lib/shuffle.ts` ; 26 tests vitest verts.
- Phase 3 — Écrans : composant Question (`components/QuestionScreen.tsx`), /parcours, /entrainement, /examen, /erreurs, /stats, accueil mobile + tableau de bord desktop. Build OK.
- Phase 4 — Tests e2e : 10 scénarios obligatoires sur mobile et desktop (`tests/e2e/*.spec.ts`), axe sans violation grave, aucune erreur console. 42 tests verts.
- Phase 5 — `tests/fixtures/progression-demo.json`, 9 captures (`tests/captures/`), deux tours de comparaison avec corrections, assertions de design (`tests/e2e/design.spec.ts`), `RAPPORT-CONFORMITE.md`.
- Phase 6 — États vides, métadonnées (noindex, `app/icon.svg`), README.md, .gitignore.

- Boucle finale : `npm run verify` vert deux fois de suite (lint 0 erreur, 26/26 tests unitaires, build OK, 57/57 tests e2e mobile + desktop). Commit local fait (sans push).

- Mission 2 — Mise en ligne (à ta demande) : code poussé sur GitHub `takhssit/qcm` (branche `claude/laughing-mayer-68u1t6`), projet Vercel `qcm-pedagogie` (équipe Syntevo) relié au dépôt. En ligne : https://qcm-pedagogie.vercel.app. Chaque push sur cette branche redéploie le site.

## Reste à faire
- Relancer les tests e2e contre l'adresse en ligne (`BASE_URL=https://qcm-pedagogie.vercel.app npm run test:e2e`) : impossible depuis l'environnement cloud, qui n'a pas le droit d'ouvrir les adresses vercel.app.

## Décisions
- `cacheComponents` / `partialPrefetching` (activés par défaut par create-next-app 16.4) retirés de `next.config.ts` : tout le site lit la progression dans le navigateur, ces options n'apportent rien et ajoutent des contraintes.
- `@types/node` passé de ^20 à ^22 (exigé par vitest 5) ; `@playwright/test` figé en 1.63.0 (version du Chromium préinstallé).
- Écrans de question (parcours, série d'entraînement, série d'erreurs, correction) en « mode focus », sans barre d'onglets ni rail, comme les maquettes 02, 03 et 09.
- Examen blanc : SPEC §2 impose que la barre d'onglets et le rail restent visibles pendant l'épreuve ; la maquette 05 ne les montre pas. SPEC > maquette : la barre d'onglets reste affichée, la barre Précédente/Suivante se pose au-dessus (comme sur la maquette 04). Quitter (onglet, rail, croix, rechargement) demande confirmation.
- `/examen` sans épreuve en cours affiche un écran d'accueil (règles + « Commencer l'examen blanc ») pour qu'un clic sur l'onglet ne lance pas le chronomètre par erreur. « Lancer un examen blanc » (tableau de bord) démarre directement (`/examen?lancer=1`).
- Bouton « Terminer l'épreuve » (absent de la maquette 05) : lien souligné sous « Marquer pour revoir », et « Suivante » devient « Terminer » sur la question 40.
- Question sans réponse à l'examen : comptée fausse dans la note, mais pas enregistrée dans la progression (le format ne permet pas une « dernière réponse » vide) ; elle apparaît dans « Revoir mes N erreurs ».
- Parcours : `derniereOrdre` = question la plus avancée atteinte (325 = parcours terminé). Revenir en arrière affiche la question déjà corrigée en lecture.
- Entraînement : « Tout sélectionner » devient « Tout désélectionner » quand les 12 chapitres sont cochés ; filtres par défaut = 3 niveaux, 12 chapitres, 20 questions.
- Statistiques : lien « Importer une progression » ajouté sous « Exporter / Réinitialiser » (absent de la maquette 07, exigé par SPEC §10) ; dans l'historique, la meilleure note est surlignée.
- Rail desktop : 248 px (valeur réelle de la maquette 08 à 1440 px).
- Données de démonstration : 193 questions tentées, 126 réussies, 14 erreurs (les plus récentes), chapitres 3, 6, 10 sous 50 %, examens 12 / 13,5 / 15,5, 6 jours d'affilée au 18/11/2026. Les taux par niveau (71 / 61 / 33 %) ne peuvent pas reproduire exactement ceux de la maquette tout en respectant 126 réussies.
- Captures : tirage des séries rendu reproductible dans le test (Math.random remplacé pendant le test uniquement) pour retrouver la question exacte des maquettes 03 et 09 ; les tests propres à un seul format portent les étiquettes `@mobile-seul` / `@desktop-seul`.
- Le compteur desktop « N bonnes sur M » compte les questions précédant la question affichée (comme la maquette 09).
- Cases de la grille d'examen (14 px de haut, 20 par ligne) : exception assumée à la règle des 44 px (WCAG 2.5.8 : les boutons Précédente/Suivante offrent la même fonction) ; elles portent `data-petite-cible` et sont exclues du test de taille.
- La date réelle du 18 novembre 2026 est un mercredi (la maquette indique « Mardi ») : les dates affichées sont calculées.

## Blocages
- Aucun en cours. Résolus pendant la boucle finale : (1) ESLint prenait le paramètre `use` des fixtures Playwright pour un hook React → renommé ; (2) un test d'examen figeait l'horloge avant le chargement de la page, ce qui bloquait parfois l'affichage → l'horloge est figée après l'affichage (test répété 24 fois puis suite complète ×2 : 114/114).
