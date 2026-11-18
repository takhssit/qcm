# SPEC — Site QCM « Pédagogie moderne » (V1)

## 1. Données : `data/questions.json`

324 questions : 108 faciles, 108 moyennes, 108 difficiles ; 27 par chapitre ; déjà triées du facile au difficile (champ `ordre`, de 1 à 324).

```ts
type NiveauId = "facile" | "moyen" | "difficile";
interface Question {
  id: string;          // "Q001" … "Q324", unique
  ordre: number;       // 1 … 324
  niveau: NiveauId;
  niveauNum: 1 | 2 | 3;
  chapitre: number;    // 1 … 12
  theme: string;       // libellé long du chapitre
  question: string;
  choix: [string, string, string, string];
  bonneReponse: 0 | 1 | 2 | 3;   // index dans choix
  explication: string;
  source: string;
}
interface Banque {
  titre: string; version: string; langue: "fr"; total: number;
  niveaux: { id: NiveauId; num: number; total: number }[];
  chapitres: { num: number; theme: string; total: number }[];
  questions: Question[];
}
```

- Les choix sont déjà mélangés et la bonne réponse est équilibrée entre A, B, C et D. **Ne jamais re-mélanger les choix** : seul l'ordre des questions peut être aléatoire.
- Le fichier est importé statiquement au build (aucun appel réseau). Au chargement, une validation légère en développement (`process.env.NODE_ENV !== "production"`) vérifie : ids uniques, 4 choix, `bonneReponse` entre 0 et 3.
- Libellés courts des chapitres pour les filtres (maquette 04) : APC, Charge cognitive, Métacognition, Scénario, Questionnement, Ludopédagogie, Différenciation, Inclusion, Transfert, Réflexivité, Déontologie (et « Andragogie » pour le chapitre 1). Partout ailleurs : le `theme` complet, sans la parenthèse « (APC) » dans les listes compactes.

## 2. Navigation

| Écran | Route | Maquettes |
|---|---|---|
| Accueil / tableau de bord | `/` | 01 (mobile), 08 (desktop) |
| Parcours | `/parcours` | 02, 03 (mobile), 09 (desktop) |
| Entraînement : filtres puis série | `/entrainement` | 04, puis 02 / 03 |
| Examen blanc : épreuve puis résultat | `/examen` | 05, 06 |
| Erreurs à revoir | `/erreurs` | pas de maquette : reprendre le style des listes de 01 et 08 |
| Statistiques | `/stats` | 07 |

- **Mobile (< 1024 px)** : barre d'onglets fixe en bas, 5 onglets : Accueil, Entraîner, Examen, Erreurs (badge rouge = nombre d'erreurs à revoir, masqué à 0), Stats. Le parcours s'ouvre depuis la carte « Reprendre le parcours » de l'accueil.
- **Desktop (≥ 1024 px)** : rail bleu nuit à gauche (248–280 px) avec 6 entrées : Tableau de bord, Parcours, Entraînement, Examen blanc, Erreurs à revoir (badge), Statistiques. Contenu dans une colonne de 1120–1200 px maximum.
- Pendant un examen blanc, la barre d'onglets et le rail restent visibles mais quitter la page demande une confirmation (l'épreuve en cours est sauvegardée, voir §6).

## 3. Composant Question (parcours, entraînement, erreurs)

1. En-tête : lien retour, « Question N / total » en chiffres tabulaires, barre de progression (trait de surligneur).
2. Étiquette de niveau colorée + « Chapitre N · Thème », énoncé (21 px mobile, 28 px desktop).
3. Quatre choix A–D (vrais boutons). Cliquer sélectionne ; on peut changer d'avis avant de valider.
4. Bouton principal « Valider » (désactivé tant que rien n'est sélectionné), fixé en bas sur mobile.
5. Après validation :
   - la bonne réponse reçoit le **balayage du surligneur** (750 ms), une coche et « Bonne réponse » ;
   - le choix faux sélectionné passe en rouge stylo avec une croix et « Votre réponse » ;
   - les autres choix s'atténuent ;
   - panneau de correction (`aria-live="polite"`) : verdict (« Bien joué : c'est la bonne réponse. » ou « Pas tout à fait. La question rejoint vos erreurs à revoir. »), titre « Explication » avec l'icône stylo, texte de `explication`, puis « Source : … » en 13 px ;
   - le bouton devient « Question suivante ».
6. Clavier : `1`–`4` ou `A`–`D` pour choisir, `Entrée` pour valider puis passer à la suivante.
7. Desktop : mise en page de la maquette 09.

Chaque validation enregistre la réponse dans la progression (§7).

## 4. Parcours (`/parcours`)

- Les 324 questions dans l'ordre du champ `ordre`, une par écran.
- Reprise automatique à la dernière question vue ; possibilité de revenir à la question précédente (en lecture : déjà corrigée si elle a été répondue dans ce parcours).
- En fin de parcours : écran de fin avec le nombre de questions réussies et des liens vers Erreurs et Examen blanc.

## 5. Entraînement (`/entrainement`)

- Filtres (maquette 04) : niveaux (multi-sélection, cartes avec le nombre de questions), chapitres (puces multi-sélection, « Tout sélectionner », compteur « N sur 12 »), nombre de questions 10 / 20 / 40.
- Compteur en direct : « N questions correspondent à votre sélection ». Si N est inférieur au nombre demandé, la série prend les N questions.
- Bouton « Lancer N questions » : tirage aléatoire sans remise parmi les questions filtrées, puis enchaînement avec le composant Question.
- Les filtres choisis sont mémorisés pour la prochaine visite.
- Fin de série : score « X / N », liste des questions ratées avec lien « Revoir », boutons « Nouvelle série » et « Accueil ».
- Un lien depuis chaque chapitre (accueil, stats) ouvre `/entrainement` pré-filtré sur ce chapitre (paramètre d'URL `?chapitre=3`).

## 6. Examen blanc (`/examen`)

- **Tirage** : 40 questions sans remise, 12 faciles + 16 moyennes + 12 difficiles, mélangées entre elles.
- **Chronomètre** : 40:00 en compte à rebours, pastille bleu nuit. À 00:00, l'épreuve est remise automatiquement.
- **Pendant l'épreuve** (maquette 05) : « Question N sur 40 », « X répondues · Y marquées », grille de 40 cases (répondue = encre, à revoir = surligneur cerclé, en cours = contour, à faire = vide) cliquable pour naviguer, boutons « Précédente » / « Suivante », case « Marquer pour revoir », mention « Correction à la fin de l'épreuve ». **Aucune correction ni indice avant la remise.**
- **Remise** : bouton « Terminer l'épreuve » avec confirmation qui indique le nombre de questions sans réponse. Une question sans réponse compte comme fausse.
- **Sauvegarde** : l'épreuve en cours (questions tirées, réponses, marques, heure de début) est stockée ; si la page est rechargée, l'épreuve reprend avec le temps restant réel.
- **Résultat** (maquette 06) : note sur 20 = bonnes réponses ÷ 2 (ex. « 15,5 sur 20 »), surlignée ; « X bonnes réponses sur 40 » ; durée réelle ; comparaison avec le meilleur examen précédent ; score par niveau (« 11 / 12 ») ; « À retravailler en priorité » = les 3 chapitres au plus faible taux dans cet examen ; boutons « Revoir mes N erreurs » (correction détaillée question par question, même rendu que le composant Question après validation) et « Nouvel examen blanc ».
- Les réponses de l'examen sont enregistrées dans la progression au moment de la remise (une question ratée rejoint les erreurs).

## 7. Progression et calculs

Stockage dans `localStorage`, clé `qcm-pedago-v1`, objet versionné :

```ts
interface Progression {
  version: 1;
  debut: string;                                   // date ISO de la première réponse
  questions: Record<string, {                      // clé = id de question
    tentatives: number;
    reussites: number;
    derniereReponse: number;                       // index choisi
    derniereJuste: boolean;
    serie: number;                                 // réussites consécutives
    vueLe: string;                                 // ISO
  }>;
  erreurs: string[];                               // ids à revoir
  parcours: { derniereOrdre: number };
  filtresEntrainement?: { niveaux: string[]; chapitres: number[]; nombre: 10 | 20 | 40 };
  jours: Record<string, number>;                   // "AAAA-MM-JJ" (date locale) → nombre de réponses
  examens: { date: string; bonnes: number; total: 40; dureeSec: number;
             parNiveau: Record<NiveauId, { bonnes: number; total: number }>;
             reponses: { id: string; choix: number | null }[] }[];
}
```

Clé séparée pour l'examen en cours : `qcm-pedago-v1-examen`.

Règles de calcul (fonctions pures dans `lib/stats.ts`, couvertes par des tests) :

- **Question réussie** = sa dernière réponse est juste.
- **Progression globale** = questions réussies ÷ 324 (« 126 questions réussies sur 324 · 39 % »).
- **Réussite par niveau / par chapitre** = questions réussies ÷ questions tentées dans ce périmètre ; « — » si rien n'a été tenté. Afficher aussi « tentées / total » sur desktop (maquette 08).
- **Chapitre faible** : taux < 50 % → pourcentage en rouge stylo (`--pen-text`).
- **Erreurs à revoir** : une réponse fausse ajoute la question (si absente) et remet `serie` à 0 ; une question sort de la liste après **2 réussites consécutives**.
- **Jours d'affilée** : nombre de jours locaux consécutifs avec au moins une réponse, en comptant aujourd'hui ou, si rien encore aujourd'hui, à partir d'hier.

## 8. Accueil (`/`)

- Mobile (maquette 01) : titre « Pédagogie moderne », sous-titre « Concours de promotion interne · 324 questions », progression globale, jours d'affilée, carte « Reprendre le parcours » (niveau, « Question N sur 324 · thème », bouton « Continuer »), « Par niveau » (3 lignes avec barre et %), « Par chapitre » (3 premières lignes + lien « Voir les 12 »).
- Desktop (maquette 08) : « Tableau de bord », date du jour et jours d'affilée, bouton « Lancer un examen blanc », carte « Reprendre le parcours », carte « Erreurs à revoir » (3 premières + « Tout revoir »), « Réussite par niveau », « Dernier examen blanc », tableau des 12 chapitres (Tentées, Réussite, Dernière séance, lien « S'entraîner »).
- Premier lancement (aucune donnée) : mêmes écrans avec des valeurs à zéro et un bouton « Commencer le parcours ».

## 9. Erreurs à revoir (`/erreurs`)

- Liste des questions à revoir (énoncé, niveau, chapitre), triée par chapitre.
- Bouton « Revoir mes erreurs » : série avec le composant Question sur toutes les erreurs, ordre aléatoire.
- État vide : « Aucune erreur à revoir pour le moment. » + lien vers l'entraînement.

## 10. Statistiques (`/stats`)

- Maquette 07 : « N réponses depuis le JJ mois », régularité sur les 7 derniers jours (barres verticales en CSS, nombre de réponses par jour, « – » si 0) avec les jours d'affilée, réussite par chapitre (12 lignes), historique des examens blancs (date, note).
- **Exporter ma progression** : téléchargement d'un fichier `progression-qcm-AAAA-MM-JJ.json`.
- **Importer** : sélection d'un fichier exporté, validation du format, confirmation avant d'écraser.
- **Réinitialiser** : confirmation explicite (boîte de dialogue `<dialog>` native), puis remise à zéro.

## 11. Exigences transverses

- Pensé d'abord pour le téléphone ; testé à 390 px et 1440 px.
- Métadonnées : titre « Pédagogie moderne — QCM », description en français, `robots: { index: false, follow: false }` (site d'entraînement personnel, non référencé), icône `app/icon.svg` (carré bleu nuit `#172041` avec un trait de surligneur `#FFE45C`).
- Aucune donnée personnelle collectée, aucun traceur, aucun appel réseau à l'exécution en dehors des fichiers du site.
- Performances : pages statiques, pas de chargement de la banque côté serveur à chaque requête.

## 12. Hors périmètre V1

Comptes utilisateurs, synchronisation entre appareils, tableau de bord formateur, paiement, mode sombre, PWA hors ligne. (V2 possible : Supabase pour l'authentification et la progression partagée.)
