# Pédagogie moderne — QCM

Site d'entraînement au concours de promotion interne (domaine pédagogique) : 324 questions à choix multiples avec correction expliquée, parcours guidé, séries d'entraînement filtrées, examens blancs chronométrés, erreurs à revoir et statistiques. La progression est enregistrée **uniquement dans le navigateur** (aucun compte, aucun serveur, aucun traceur).

## Installation

Prérequis : Node.js 20.9 ou plus récent (LTS conseillée).

```bash
npm install
npx playwright install chromium   # une seule fois, pour les tests de bout en bout
npm run dev                       # http://localhost:3000
```

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement (http://localhost:3000) |
| `npm run build` | Build de production |
| `npm run start` | Sert le build de production |
| `npm run lint` | Vérification ESLint |
| `npm run test` | Tests unitaires de la logique (`lib/`, vitest) |
| `npm run test:e2e` | Tests de bout en bout Playwright, mobile 390 px et desktop 1440 px (construit et lance le site sur le port 3100) |
| `npm run verify` | lint + tests unitaires + build + tests e2e ; s'arrête au premier échec. Doit être vert avant toute livraison. |

Pour viser un site déjà en ligne sans démarrer de serveur : `BASE_URL=https://mon-site.vercel.app npm run test:e2e`.

## Structure

```
app/                  pages : / (accueil + tableau de bord), /parcours, /entrainement, /examen, /erreurs, /stats
  globals.css         jetons de couleur de docs/DESIGN.md (@theme Tailwind v4), surligneur, choix de réponse
  icon.svg            icône du site
components/           AppFrame (barre d'onglets mobile + rail desktop), QuestionScreen (composant Question),
                      Serie, Correction, store (lecture de la progression), ui (étiquettes, barres…)
lib/                  logique pure, sans interface
  bank.ts             banque de questions (data/questions.json), libellés, filtres
  progress.ts         progression : format, enregistrement d'une réponse, import/export, seul accès au localStorage
  stats.ts            calculs : taux, jours d'affilée, notes, formats fr-FR
  exam.ts             examen blanc : tirage 12/16/12, chronomètre, correction
  shuffle.ts          mélange et tirage sans remise
  __tests__/          tests vitest
tests/
  e2e/                scénarios Playwright (+ axe pour l'accessibilité)
  fixtures/           progression-demo.json (données réalistes pour les captures)
  captures/           captures des 9 écrans, à comparer à maquettes/png
data/questions.json   les 324 questions (lecture seule)
docs/                 SPEC.md (fonctionnel), DESIGN.md (visuel)
maquettes/            maquettes de référence (png + html)
```

## Mettre à jour les questions

1. Modifier `data/questions.json` en respectant le format décrit dans `docs/SPEC.md` §1 (ids uniques `Q001`…, 4 choix, `bonneReponse` entre 0 et 3, champ `ordre`).
2. Ne pas re-mélanger les choix : le site les affiche toujours dans l'ordre du fichier.
3. Lancer `npm run verify` : en développement, une validation automatique signale tout id en double ou toute réponse hors limites ; les tests vérifient que le site affiche fidèlement le fichier.
4. Committer puis `git push` : Vercel redéploie automatiquement.

Attention : la progression des utilisateurs est rattachée aux ids. Changer l'id d'une question existante efface son historique.

## Déploiement sur Vercel

1. Pousser le dépôt sur GitHub.
2. Sur vercel.com/new, importer le dépôt : Next.js est détecté, garder les réglages par défaut, cliquer sur « Deploy ».
3. Aucune variable d'environnement, base de données ou clé n'est nécessaire. Chaque `git push` sur la branche principale redéploie le site.

Le site est configuré pour ne pas être indexé par les moteurs de recherche (`noindex`). Toute personne qui a le lien peut néanmoins l'ouvrir.

## Accès réservé (comptes)

Le site est une application interne : chaque page demande un identifiant et un mot de passe (fenêtre standard du navigateur). Les comptes sont définis dans la variable d'environnement Vercel `QCM_ACCES`, jamais dans le code :

```
QCM_ACCES = identifiant1:empreinte1,identifiant2:empreinte2
```

L'empreinte est le SHA-256 du mot de passe. Pour la calculer sur Mac :

```bash
printf '%s' 'le-mot-de-passe' | shasum -a 256
```

Ajouter, retirer un compte ou changer un mot de passe : Vercel → projet `qcm-pedagogie` → Settings → Environment Variables → modifier `QCM_ACCES`, puis Deployments → « Redeploy ».

- Sans `QCM_ACCES`, le site en ligne répond « Accès non configuré » (fermé par sécurité) ; en local (`npm run dev`), il reste ouvert.
- Pour changer d'utilisateur sur un même navigateur, fermer complètement le navigateur. La progression est rangée par navigateur : deux personnes qui partagent le même navigateur partagent aussi la progression.
- Tests sur le site en ligne : `QCM_UTILISATEUR=… QCM_MOT_DE_PASSE=… BASE_URL=https://qcm-pedagogie.vercel.app npm run test:e2e`.

## Bon à savoir

- La progression est propre à chaque navigateur et appareil ; pour la transférer : Statistiques → « Exporter ma progression », puis « Importer une progression » sur l'autre appareil.
- Choix de réalisation et écarts avec les maquettes : voir `PROGRESS.md` et `RAPPORT-CONFORMITE.md`.
