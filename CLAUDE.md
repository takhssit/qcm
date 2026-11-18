# CLAUDE.md — Site QCM « Pédagogie moderne »

Site d'entraînement au concours de promotion interne (domaine pédagogique) : 324 questions à choix multiples en français, avec correction expliquée. Une seule personne par navigateur, aucune donnée sur serveur. Déploiement sur Vercel.

## Sources de vérité (à lire avant de coder)

| Fichier | Rôle | Règle |
|---|---|---|
| `data/questions.json` | Banque de 324 questions | **Lecture seule.** Ne jamais modifier, reformuler, re-trier ni re-mélanger les choix. |
| `docs/SPEC.md` | Règles fonctionnelles (pages, calculs, progression) | Fait foi en cas de doute sur le comportement. |
| `docs/DESIGN.md` | Tokens, typographie, composants, interdits | Fait foi pour tout ce qui est visuel. |
| `maquettes/png/*.png` | Rendu attendu, mobile 390 px et desktop 1440 px | Référence visuelle à reproduire. |
| `maquettes/html/*.html` | Mêmes écrans en HTML/CSS | Pour lire les valeurs exactes. Ne pas copier tel quel : recomposer en composants React. |
| `PROGRESS.md` | Journal de la mission (créé par toi) | À relire en premier après une reprise ou une compaction. |

Si la spec, le design et les maquettes se contredisent : SPEC > DESIGN > maquettes. Note l'écart dans `PROGRESS.md`.

## Stack verrouillée

- Next.js 16 (dernière version stable), App Router, TypeScript strict, Turbopack par défaut.
- Tailwind CSS v4 : tokens de `docs/DESIGN.md` en variables CSS et dans `@theme` (`app/globals.css`).
- Police : `Atkinson_Hyperlegible` via `next/font/google` (400 et 700).
- Icônes : `lucide-react`.
- Tests : `vitest` (logique de `lib/`), `@playwright/test` et `@axe-core/playwright` (bout en bout, accessibilité, captures).
- **Aucune autre dépendance** que celles-ci et celles installées par `create-next-app`. Pas de shadcn/ui, pas de recharts, pas de bibliothèque d'état, pas de base de données : barres et graphiques en CSS (trait de surligneur), conformément aux maquettes.

## Commandes

```bash
npm run dev       # serveur local http://localhost:3000
npm run lint      # eslint
npm run test      # vitest run
npm run build     # build de production
npm run test:e2e  # playwright test (mobile 390 px + desktop 1440 px)
npm run verify    # lint + test + build + test:e2e : doit être vert avant toute livraison
```

## Organisation du code

```
app/              routes : / /parcours /entrainement /examen /erreurs /stats
components/       QuestionCard, ChoiceButton, Explanation, ProgressStroke, TabBar, Rail…
lib/              logique pure : bank.ts, progress.ts, stats.ts, exam.ts, shuffle.ts
lib/__tests__/    tests vitest
tests/e2e/        tests Playwright ; tests/fixtures/ ; tests/captures/ (captures comparées aux maquettes)
```

- Interface 100 % en français, `<html lang="fr">`, nombres au format fr-FR (`15,5`, `39 %` avec espace insécable).
- `"use client"` uniquement là où c'est nécessaire.
- `localStorage` : accès **exclusivement** via `lib/progress.ts`, avec `try/catch`, lu après le montage (aucune erreur d'hydratation).
- Attributs `data-testid` et `data-question-id` stables sur les éléments utilisés par les tests.
- Pas d'emoji. Pas de mode sombre en V1.
- Accessibilité : vrais `<button>`, `aria-pressed` sur les choix, `aria-live` sur la correction, focus visible, cibles de 44 px minimum, contrastes AA, `prefers-reduced-motion` respecté.

## Interdits

- Modifier `data/questions.json`, `docs/` ou `maquettes/` sans demande explicite de ma part dans le message en cours.
- Supprimer un fichier que tu n'as pas créé.
- `git push`, création de dépôt distant, déploiement : uniquement pendant la Mission 2, avec mon accord.
- Service payant, clé d'API, secret dans le code.
- Affaiblir un test pour le faire passer : on corrige le code, pas le test.

## Travail autonome

- Pendant une mission autonome, ne t'arrête pas pour poser une question : prends l'option la plus simple conforme à SPEC et DESIGN, note-la dans `PROGRESS.md` (« Décisions ») et continue.
- Si un problème résiste à 5 tentatives avec des approches différentes : consigne-le dans `PROGRESS.md` (« Blocages »), avance sur le reste, puis reviens-y avant de conclure. Le rapport final dit clairement ce qui n'est pas résolu.
- Mets `PROGRESS.md` à jour à la fin de chaque phase.

## Définition de « terminé »

1. Toutes les fonctionnalités de `docs/SPEC.md` fonctionnent, sur mobile (390 px) et desktop (1440 px).
2. `npm run verify` passe deux fois de suite sans aucun échec.
3. Les 9 captures de `tests/captures/` ont été comparées aux maquettes et `RAPPORT-CONFORMITE.md` est rempli.
4. `README.md` à jour (installation, scripts, structure, mise à jour des questions, déploiement Vercel).
5. Rapport final court : ce qui est fait, résultat chiffré des commandes, écarts éventuels avec les maquettes.

Je ne suis pas développeur : explique tes choix en une phrase, sans jargon inutile.
