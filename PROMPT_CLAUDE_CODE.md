# Prompts pour Claude Code

Lance Claude Code **dans ce dossier** (celui qui contient `CLAUDE.md`), en mode automatique et sans mise en veille du Mac :

```bash
caffeinate -i claude --permission-mode auto
```

Puis colle le bloc « Mission complète » ci-dessous, ou tape simplement :

```
Lis PROMPT_CLAUDE_CODE.md et exécute la Mission complète.
```

---

## Mission complète — construire, tester, valider (autonome)

```
MISSION COMPLÈTE — Construire, tester et valider le site QCM « Pédagogie moderne », en autonomie totale.

MODE DE TRAVAIL
- Tu travailles seul jusqu'à la fin. Ne me pose aucune question et n'attends aucune validation. Quand un choix n'est pas tranché par les documents, prends l'option la plus simple qui respecte docs/SPEC.md et docs/DESIGN.md, note-la dans PROGRESS.md (section « Décisions ») et continue.
- Tu ne t'arrêtes que lorsque la DÉFINITION DE TERMINÉ (en bas) est entièrement remplie, preuves à l'appui. Un test en échec n'est jamais une fin : corrige, relance, recommence.
- Crée PROGRESS.md dès le début et mets-le à jour à la fin de chaque phase : fait, reste à faire, décisions, blocages. Si ta conversation est compactée, relis CLAUDE.md et PROGRESS.md, puis reprends exactement où tu en étais.
- Suis les phases avec ta liste de tâches.

POINT DE DÉPART
Ce dossier contient CLAUDE.md (règles du projet), docs/SPEC.md (fonctionnel), docs/DESIGN.md (design), maquettes/png et maquettes/html (9 écrans, index dans maquettes/README.md) et data/questions.json (324 questions). Aucun code n'existe encore. Lis tous ces fichiers et ouvre chacune des 9 images avant d'écrire du code.

CIBLE
Un site Next.js 16 (App Router, TypeScript strict, Tailwind CSS v4) qui implémente tout docs/SPEC.md, reproduit les maquettes sur mobile (390 px) et desktop (1440 px), est couvert par des tests automatiques, et se déploie sur Vercel sans réglage particulier.

INTERDITS PENDANT TOUTE LA MISSION
- Modifier data/questions.json, docs/ ou maquettes/ ; supprimer un fichier que tu n'as pas créé.
- git push, création de dépôt distant, déploiement, service payant, clé d'API.
- Ajouter une dépendance absente de la liste de CLAUDE.md.
- Affaiblir un test pour le faire passer (retirer une assertion, élargir une tolérance, skip, fixme) : corrige le code, pas le test.

PHASE 1 — Socle
Initialise Next.js 16 à la racine sans toucher à data/, docs/, maquettes/, CLAUDE.md, PROMPT_CLAUDE_CODE.md, LISEZ-MOI.md ni .claude/ (si create-next-app refuse le dossier non vide, génère dans .scaffold/ puis déplace les fichiers et supprime .scaffold/). Tokens de DESIGN.md dans app/globals.css (@theme), police Atkinson Hyperlegible via next/font, mise en page avec barre d'onglets mobile et rail desktop. Scripts package.json : dev, build, start, lint, test (vitest run), test:e2e (playwright test), verify (lint + test + build + test:e2e, s'arrête au premier échec).

PHASE 2 — Logique et tests unitaires
lib/bank.ts, lib/progress.ts, lib/stats.ts, lib/exam.ts, lib/shuffle.ts. Tests vitest couvrant au minimum : note sur 20 et format « 15,5 » ; tirage 12/16/12 sans doublon ; un choix n'est jamais re-mélangé ; entrée dans les erreurs puis sortie après 2 réussites consécutives ; jours d'affilée (aujourd'hui, hier, trou) ; taux par niveau et chapitre (« — » si rien tenté) ; validation et import/export de la progression.

PHASE 3 — Écrans
Composant Question avec le balayage du surligneur, puis /parcours, /entrainement, /examen (épreuve, sauvegarde, remise, résultat, correction), /erreurs, /stats, accueil mobile et tableau de bord desktop. Ajoute des attributs data-testid et data-question-id stables pour les tests.

PHASE 4 — Tests de bout en bout (Playwright + @axe-core/playwright)
Configure playwright.config.ts : Chromium, serveur = build de production (npm run build && npm run start -- -p 3100), deux projets « mobile » (390×844) et « desktop » (1440×900). Si la variable BASE_URL est définie, les tests visent cette URL sans démarrer de serveur. Scénarios obligatoires, sur les deux projets sauf mention :
1. Navigation : les 5 onglets (mobile) et les 6 entrées du rail (desktop) ouvrent la bonne page ; badge Erreurs exact, masqué à 0.
2. Parcours : bonne réponse → « Bonne réponse », surligneur, explication et source ; mauvaise réponse → « Votre réponse » et la question apparaît dans /erreurs ; après rechargement, reprise sur la bonne question.
3. Clavier : 1–4 et A–D sélectionnent, Entrée valide puis passe à la suivante.
4. Fidélité des données : sur 30 questions dont Q001 et Q324, le choix affiché comme correct est exactement choix[bonneReponse] du JSON, dans l'ordre A–D, avec la même explication et la même source.
5. Entraînement : chapitre 3 + Facile → « 9 questions correspondent », la série lancée compte 9 questions ; filtres retrouvés après rechargement ; /entrainement?chapitre=3 pré-filtre.
6. Examen blanc : 40 questions réparties 12/16/12 ; aucune correction ni indice pendant l'épreuve ; « Marquer pour revoir » et navigation par la grille ; après rechargement, épreuve et temps restant conservés ; remise avec confirmation indiquant les questions sans réponse ; note = bonnes réponses ÷ 2 ; chrono avancé de 40 min avec l'horloge Playwright → remise automatique.
7. Erreurs : une question ratée entre dans la liste, en sort après 2 réussites consécutives ; état vide affiché.
8. Statistiques : l'export télécharge un JSON valide, l'import le restaure, la réinitialisation remet tout à zéro après confirmation.
9. Premier lancement (stockage vide) : aucune erreur, valeurs à zéro, bouton « Commencer le parcours ».
10. Qualité, sur les 6 routes : aucune violation axe « serious » ou « critical » ; aucune erreur console ni avertissement d'hydratation ; aucun défilement horizontal à 390 px ; cibles tactiles ≥ 44 px ; avec prefers-reduced-motion, le surligneur apparaît sans animation.

PHASE 5 — Conformité aux maquettes
a) Crée tests/fixtures/progression-demo.json : une progression réaliste proche des maquettes (environ 126 questions réussies sur 324, chapitres 3, 6 et 10 sous 50 %, 14 erreurs, 3 examens blancs à 12, 13,5 et 15,5 sur 20, 6 jours d'affilée), injectée dans le stockage par Playwright.
b) tests/e2e/captures.spec.ts : pour chacun des 9 écrans listés dans maquettes/README.md, reproduis le même état (choix B sélectionné, correction d'une mauvaise réponse, filtres, examen en cours, résultat, statistiques, desktop…) au même viewport et enregistre tests/captures/<même nom que la maquette>.png.
c) Ouvre chaque capture et sa maquette, compare-les avec cette grille : structure et ordre des blocs ; police, tailles et graisses ; couleurs ; espacements et alignements ; composants et états (surligneur, étiquettes de niveau, barre d'onglets, rail, grille d'examen) ; libellés. Corrige chaque écart, recapture, recompare. Fais au moins deux tours complets, et continue tant qu'il reste un écart visible qui ne vient pas des données.
d) Ajoute des assertions automatiques sur ce qui se mesure : police Atkinson Hyperlegible appliquée, fond #F3F5F9, texte #172041, surligneur #FFE45C sur la bonne réponse, rouge #C4283A sur la mauvaise, barre d'onglets visible uniquement en mobile et rail uniquement en desktop.
e) Écris RAPPORT-CONFORMITE.md : un tableau écran par écran (maquette, capture, conforme oui/non, écarts restants et pourquoi).

PHASE 6 — Finitions
États vides, métadonnées (noindex, app/icon.svg), README.md (installation, scripts, structure, mise à jour des questions, déploiement Vercel), .gitignore (node_modules, .next, test-results, playwright-report, .env*).

BOUCLE DE VALIDATION FINALE (obligatoire)
Lance npm run verify. En cas d'échec : corrige, puis relance verify en entier. Recommence jusqu'à deux exécutions complètes consécutives sans aucun échec. Si un problème résiste à 5 tentatives avec des approches différentes, consigne-le dans PROGRESS.md, avance sur le reste, puis reviens-y avant de conclure. Ensuite seulement : git init si besoin et un commit local en français (sans push).

DÉFINITION DE TERMINÉ
- Toutes les fonctionnalités de docs/SPEC.md §2 à §11 sont implémentées.
- npm run verify passe deux fois de suite (lint, tests unitaires, build, tests e2e mobile et desktop : 0 échec).
- Les 9 captures existent dans tests/captures/ et RAPPORT-CONFORMITE.md est rempli.
- README.md, PROGRESS.md à jour, commit local fait.

RAPPORT FINAL (en français, sans jargon, court)
Ce qui est fait ; résultat chiffré de chaque commande (tests passés / total) ; écarts restants avec les maquettes ; décisions prises ; ce qui n'a pas pu être fait et pourquoi (le cas échéant) ; la commande pour lancer le site en local ; prochaine étape : la Mission 2 (mise en ligne).
```

---

## Mission 2 — Mettre le site en ligne (GitHub + Vercel)

À lancer quand la Mission complète est terminée. Le mode automatique de Claude Code bloque volontairement les déploiements en production sans ton accord : cette mission te demandera donc une ou deux confirmations.

```
Mission 2 : mettre le site en ligne sur Vercel via GitHub.

1. Vérifie que npm run verify passe et que .gitignore exclut node_modules, .next, test-results, playwright-report et les fichiers .env.
2. Si gh est installé et connecté (gh auth status), crée un dépôt GitHub PRIVÉ nommé qcm-pedagogie et pousse le code. Sinon, donne-moi les commandes exactes à taper.
3. N'utilise pas la CLI Vercel : explique-moi en 4 étapes comment importer le dépôt sur vercel.com/new (réglages par défaut, Next.js détecté automatiquement).
4. Une fois que je t'ai donné l'URL en ligne, relance les tests e2e contre cette URL (variable BASE_URL dans playwright.config.ts) et donne-moi le résultat.
```

---

## Prompts de suivi utiles

**Corriger un écran qui ne ressemble pas à la maquette**
```
L'écran [route] ne correspond pas à maquettes/png/[fichier].png : [ce que tu vois]. Compare les deux, corrige uniquement cet écran, recapture-le dans tests/captures/, puis relance npm run verify jusqu'au vert.
```

**Ajouter ou corriger des questions**
```
Je veux modifier data/questions.json : [décris le changement]. Montre-moi d'abord le diff proposé et attends mon accord. Vérifie ensuite : ids uniques, 4 choix, bonneReponse entre 0 et 3, totaux par niveau et par chapitre recalculés dans l'en-tête du fichier, puis npm run verify.
```

**Audit avant mise en ligne**
```
Fais un audit de fin de projet sans rien modifier : accessibilité, mobile 390 px, performance du build, cohérence avec docs/SPEC.md. Classe les points par gravité et propose les corrections ; attends mon accord avant d'en appliquer.
```
