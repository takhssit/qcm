import { NIVEAUX, questionParId, questions, themeChapitre, type NiveauId, type Question } from "./bank";
import type { ExamenEnCours, ExamenTermine } from "./progress";
import { melanger, tirer } from "./shuffle";

export const DUREE_EXAMEN_SEC = 40 * 60;
export const REPARTITION: Record<NiveauId, number> = { facile: 12, moyen: 16, difficile: 12 };
export const NB_QUESTIONS_EXAMEN = 40;

/** 40 questions sans remise (12 / 16 / 12), mélangées entre elles. Les choix ne sont jamais touchés. */
export function tirerExamen(rng: () => number = Math.random): string[] {
  const ids = NIVEAUX.flatMap((n) =>
    tirer(
      questions.filter((q) => q.niveau === n),
      REPARTITION[n],
      rng,
    ).map((q) => q.id),
  );
  return melanger(ids, rng);
}

export function nouvelExamen(now: number, rng: () => number = Math.random): ExamenEnCours {
  const ids = tirerExamen(rng);
  return { ids, reponses: ids.map(() => null), marques: ids.map(() => false), debut: now, index: 0 };
}

export function tempsRestantSec(e: ExamenEnCours, now: number): number {
  return Math.max(0, DUREE_EXAMEN_SEC - Math.floor((now - e.debut) / 1000));
}

/** « 27:42 » */
export function formatChrono(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function corrigerExamen(e: ExamenEnCours, now: number): ExamenTermine {
  const parNiveau = Object.fromEntries(NIVEAUX.map((n) => [n, { bonnes: 0, total: 0 }])) as ExamenTermine["parNiveau"];
  let bonnes = 0;
  e.ids.forEach((id, i) => {
    const q = questionParId(id);
    if (!q) return;
    const juste = e.reponses[i] === q.bonneReponse;
    parNiveau[q.niveau].total++;
    if (juste) {
      parNiveau[q.niveau].bonnes++;
      bonnes++;
    }
  });
  return {
    date: new Date(now).toISOString(),
    bonnes,
    total: 40,
    dureeSec: Math.min(DUREE_EXAMEN_SEC, Math.round((now - e.debut) / 1000)),
    parNiveau,
    reponses: e.ids.map((id, i) => ({ id, choix: e.reponses[i] })),
  };
}

export interface PrioriteChapitre {
  num: number;
  theme: string;
  bonnes: number;
  total: number;
}

/** Les 3 chapitres au plus faible taux de réussite dans cet examen. */
export function prioritesChapitres(e: ExamenTermine, n = 3): PrioriteChapitre[] {
  const parChap = new Map<number, PrioriteChapitre>();
  for (const r of e.reponses) {
    const q = questionParId(r.id);
    if (!q) continue;
    const c = parChap.get(q.chapitre) ?? { num: q.chapitre, theme: themeChapitre(q.chapitre), bonnes: 0, total: 0 };
    c.total++;
    if (r.choix === q.bonneReponse) c.bonnes++;
    parChap.set(q.chapitre, c);
  }
  return [...parChap.values()]
    .sort((a, b) => a.bonnes / a.total - b.bonnes / b.total || b.total - a.total || a.num - b.num)
    .slice(0, n);
}

/** Questions ratées (ou sans réponse) d'un examen, avec le choix fait. */
export function erreursExamen(e: ExamenTermine): { question: Question; choix: number | null }[] {
  return e.reponses
    .map((r) => ({ question: questionParId(r.id), choix: r.choix }))
    .filter((x): x is { question: Question; choix: number | null } => !!x.question && x.choix !== x.question.bonneReponse);
}
