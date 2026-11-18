import data from "@/data/questions.json";

export type NiveauId = "facile" | "moyen" | "difficile";

export interface Question {
  id: string;
  ordre: number;
  niveau: NiveauId;
  niveauNum: 1 | 2 | 3;
  chapitre: number;
  theme: string;
  question: string;
  choix: [string, string, string, string];
  bonneReponse: 0 | 1 | 2 | 3;
  explication: string;
  source: string;
}

export interface Banque {
  titre: string;
  version: string;
  langue: "fr";
  total: number;
  niveaux: { id: NiveauId; num: number; total: number }[];
  chapitres: { num: number; theme: string; total: number }[];
  questions: Question[];
}

export const banque = data as unknown as Banque;

/** Questions triées par `ordre` (le fichier l'est déjà ; on ne touche jamais aux choix). */
export const questions: readonly Question[] = [...banque.questions].sort((a, b) => a.ordre - b.ordre);
export const TOTAL = questions.length;
export const chapitres = banque.chapitres;
export const NIVEAUX: readonly NiveauId[] = ["facile", "moyen", "difficile"];

export const LIBELLE_NIVEAU: Record<NiveauId, string> = {
  facile: "Facile",
  moyen: "Moyen",
  difficile: "Difficile",
};

/** Libellés courts des chapitres pour les filtres (SPEC §1). */
export const LIBELLE_COURT: Record<number, string> = {
  1: "Andragogie",
  2: "APC",
  3: "Charge cognitive",
  4: "Métacognition",
  5: "Scénario",
  6: "Questionnement",
  7: "Ludopédagogie",
  8: "Différenciation",
  9: "Inclusion",
  10: "Transfert",
  11: "Réflexivité",
  12: "Déontologie",
};

const parId = new Map(questions.map((q) => [q.id, q]));

export function questionParId(id: string): Question | undefined {
  return parId.get(id);
}

export function questionParOrdre(ordre: number): Question | undefined {
  return questions[ordre - 1];
}

/** Thème complet sans la parenthèse finale, ex. « Approche par compétences ». */
export function themeCompact(theme: string): string {
  return theme.replace(/\s*\([^)]*\)\s*$/, "");
}

export function themeChapitre(num: number): string {
  return chapitres.find((c) => c.num === num)?.theme ?? "";
}

export function filtrerQuestions(niveaux: readonly string[], chaps: readonly number[]): Question[] {
  return questions.filter((q) => niveaux.includes(q.niveau) && chaps.includes(q.chapitre));
}

/** Validation légère de la banque (SPEC §1). Renvoie la liste des problèmes. */
export function validerBanque(qs: readonly Question[]): string[] {
  const erreurs: string[] = [];
  const vus = new Set<string>();
  for (const q of qs) {
    if (vus.has(q.id)) erreurs.push(`id en double : ${q.id}`);
    vus.add(q.id);
    if (!Array.isArray(q.choix) || q.choix.length !== 4) erreurs.push(`${q.id} : il faut 4 choix`);
    if (!Number.isInteger(q.bonneReponse) || q.bonneReponse < 0 || q.bonneReponse > 3)
      erreurs.push(`${q.id} : bonneReponse hors limites`);
  }
  return erreurs;
}

if (process.env.NODE_ENV !== "production") {
  const pb = validerBanque(questions);
  if (pb.length) throw new Error(`data/questions.json invalide :\n${pb.join("\n")}`);
}
