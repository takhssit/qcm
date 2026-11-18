# Kit de lancement — Site QCM « Pédagogie moderne »

Tout ce qu'il faut pour que Claude Code construise le site, puis le mettre en ligne sur Vercel.

## Contenu du kit

| Élément | À quoi il sert |
|---|---|
| `PROMPT_CLAUDE_CODE.md` | Les prompts à donner à Claude Code : Mission complète (construire, tester, valider sans s'arrêter), Mission 2 (mettre en ligne), prompts de suivi |
| `CLAUDE.md` | Les règles du projet, lues automatiquement par Claude Code à chaque session (stack, interdits, travail autonome, définition de « terminé ») |
| `.claude/settings.json` | Les autorisations du projet : commandes de build et de test autorisées ; confirmation demandée avant de toucher aux questions, au design, aux maquettes, ou de pousser et déployer (dossier masqué sur Mac : `Cmd + Maj + .` pour l'afficher) |
| `docs/SPEC.md` | Le cahier des charges fonctionnel : pages, examen blanc, calculs, progression |
| `docs/DESIGN.md` | Le système visuel : couleurs, typographie, surligneur, composants |
| `maquettes/` | Les 9 écrans en images (`png/`) et en HTML (`html/`) |
| `data/questions.json` | Les 324 questions validées (108 par niveau, 27 par chapitre) |

## 1. À installer une seule fois (sur ton Mac)

1. **Node.js** : version LTS sur nodejs.org (Next.js 16 demande au minimum la 20.9). Vérifie avec `node -v`.
2. **Git** : `git --version` ; s'il manque, `xcode-select --install`.
3. **Claude Code** : `curl -fsSL https://claude.ai/install.sh | bash`, puis `claude` et connexion avec ton compte Claude (ton abonnement inclut Claude Code). Tu peux aussi utiliser l'onglet Code de l'application Claude desktop.
4. **Optionnel mais pratique** : GitHub CLI (`brew install gh`, puis `gh auth login`) pour que Claude Code crée le dépôt GitHub à ta place.

Comptes : **GitHub** (gratuit) et **Vercel** (crée-le avec « Continue with GitHub »).

## 2. Construire le site

1. Mets Claude Code à jour (`claude update`) : le mode automatique demande une version récente.
2. Dézippe le kit, par exemple dans `~/Projets/qcm-pedagogie`.
3. Dans le Terminal : `cd ~/Projets/qcm-pedagogie` puis `caffeinate -i claude --permission-mode auto`. `caffeinate` empêche le Mac de se mettre en veille pendant le travail ; laisse-le branché sur secteur.
4. Au premier lancement, Claude Code te demande si tu fais confiance au dossier : réponds oui.
5. Tape : `Lis PROMPT_CLAUDE_CODE.md et exécute la Mission complète.`
6. Il construit, teste et compare chaque écran aux maquettes jusqu'à ce que tout passe, sans te poser de question. Tu peux suivre l'avancement dans `PROGRESS.md`. Il ne te sollicitera que s'il tente une action réservée (modifier les questions, pousser sur GitHub, déployer).
7. À la fin, lis son rapport et `RAPPORT-CONFORMITE.md`, compare `tests/captures/` à `maquettes/png/`, puis lance `npm run dev` et ouvre http://localhost:3000.

## 3. Mettre en ligne sur Vercel

1. Dans Claude Code : `Exécute la Mission 2 de PROMPT_CLAUDE_CODE.md.` Il prépare le dépôt GitHub privé `qcm-pedagogie`.
2. Sur **vercel.com/new** : « Import » à côté du dépôt `qcm-pedagogie`.
3. Garde les réglages par défaut (Next.js est détecté) et clique sur « Deploy ».
4. Environ une minute plus tard, le site est en ligne sur une adresse en `.vercel.app`. Chaque `git push` redéploie automatiquement.

**Domaine personnalisé (optionnel)** : dans Vercel, Settings → Domains → ajoute par exemple `qcm.takhssit.com`, puis crée chez ton hébergeur DNS l'enregistrement CNAME indiqué par Vercel.

## 4. Bon à savoir

- **Progression par appareil** : elle est stockée dans le navigateur. Ton iPhone et ton Mac ont chacun leur progression ; pour passer de l'un à l'autre, utilise « Exporter » puis « Importer » dans Statistiques. La synchronisation automatique demanderait une V2 avec comptes (Supabase).
- **Site non référencé** : il est configuré pour ne pas apparaître dans Google (`noindex`). Toute personne qui a le lien peut néanmoins l'ouvrir.
- **Vercel gratuit (Hobby)** : réservé à un usage personnel et non commercial. Si tu vends l'accès, ajoutes de la publicité ou l'utilises pour un client, il faut l'offre Pro (20 $ par mois, un membre inclus).
- **Mettre à jour les questions** : utilise le prompt de suivi « Ajouter ou corriger des questions », puis `git push`.
