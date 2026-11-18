import { NIVEAUX, chapitres, questions, type NiveauId, type Question } from "./bank";
import { cleJour, type ExamenTermine, type Progression } from "./progress";

const NBSP = " ";
export const SEUIL_FAIBLE = 0.5;

export interface Taux {
  tentees: number;
  reussies: number;
  total: number;
  /** réussies ÷ tentées, null si rien n'a été tenté */
  taux: number | null;
}

function tauxSur(p: Progression, qs: readonly Question[]): Taux {
  let tentees = 0;
  let reussies = 0;
  for (const q of qs) {
    const s = p.questions[q.id];
    if (!s) continue;
    tentees++;
    if (s.derniereJuste) reussies++;
  }
  return { tentees, reussies, total: qs.length, taux: tentees ? reussies / tentees : null };
}

/** Questions dont la dernière réponse est juste. */
export function nbReussies(p: Progression): number {
  return Object.values(p.questions).filter((s) => s.derniereJuste).length;
}

export function progressionGlobale(p: Progression) {
  const reussies = nbReussies(p);
  return { reussies, total: questions.length, pourcentage: reussies / questions.length };
}

export function tauxParNiveau(p: Progression): Record<NiveauId, Taux> {
  return Object.fromEntries(NIVEAUX.map((n) => [n, tauxSur(p, questions.filter((q) => q.niveau === n))])) as Record<
    NiveauId,
    Taux
  >;
}

export interface TauxChapitre extends Taux {
  num: number;
  theme: string;
  derniereSeance: string | null; // ISO
}

export function tauxParChapitre(p: Progression): TauxChapitre[] {
  return chapitres.map((c) => {
    const qs = questions.filter((q) => q.chapitre === c.num);
    let derniere: string | null = null;
    for (const q of qs) {
      const v = p.questions[q.id]?.vueLe;
      if (v && (!derniere || v > derniere)) derniere = v;
    }
    return { num: c.num, theme: c.theme, derniereSeance: derniere, ...tauxSur(p, qs) };
  });
}

export function estFaible(taux: number | null): boolean {
  return taux !== null && taux < SEUIL_FAIBLE;
}

/** « 39 % » (espace insécable) ou « — » si rien n'a été tenté. */
export function formatTaux(taux: number | null): string {
  return taux === null ? "—" : `${Math.round(taux * 100)}${NBSP}%`;
}

/** Jours locaux consécutifs avec au moins une réponse, en partant d'aujourd'hui ou, à défaut, d'hier. */
export function joursAffilee(jours: Record<string, number>, aujourdhui: Date): number {
  const d = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate());
  if (!(jours[cleJour(d)] > 0)) d.setDate(d.getDate() - 1);
  let n = 0;
  while (jours[cleJour(d)] > 0) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function formatJoursAffilee(n: number): string {
  return `${n} ${n > 1 ? "jours" : "jour"} d'entraînement d'affilée`;
}

/** Les 7 derniers jours (le dernier = aujourd'hui). */
export function septDerniersJours(jours: Record<string, number>, aujourdhui: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate() - (6 - i));
    const court = new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(d).replace(".", "");
    return {
      cle: cleJour(d),
      libelle: court.charAt(0).toUpperCase() + court.slice(1),
      nombre: jours[cleJour(d)] ?? 0,
      aujourdhui: i === 6,
    };
  });
}

export function totalReponses(p: Progression): number {
  return Object.values(p.jours).reduce((a, b) => a + b, 0);
}

/* ---------- Notes d'examen ---------- */

export function noteSur20(bonnes: number): number {
  return bonnes / 2;
}

/** 15.5 → « 15,5 » ; 12 → « 12 ». */
export function formatNote(note: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(note);
}

export function noteExamen(e: ExamenTermine): number {
  return noteSur20(e.bonnes);
}

/* ---------- Dates ---------- */

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « Mardi 18 novembre » (+ année si demandée). */
export function formatDateLongue(d: Date, annee = false): string {
  return majuscule(
    new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", ...(annee ? { year: "numeric" } : {}) }).format(d),
  );
}

/** « 18 novembre » */
export function formatJourMois(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(d);
}

/** « Aujourd'hui », « Hier », « 16 nov. » ou « — ». */
export function formatDerniereSeance(iso: string | null, aujourdhui: Date): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const j = cleJour(d);
  if (j === cleJour(aujourdhui)) return "Aujourd'hui";
  const hier = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate() - 1);
  if (j === cleJour(hier)) return "Hier";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(d);
}

/** « 33 min 12 s » */
export function formatDuree(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m} min ${s} s` : `${s} s`;
}

export function formatEntier(n: number): string {
  // espace insécable ordinaire : l'espace fine (U+202F) n'existe pas dans la police
  return new Intl.NumberFormat("fr-FR").format(n).replace(/\u202F/g, "\u00A0");
}
