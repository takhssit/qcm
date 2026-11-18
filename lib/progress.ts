import type { NiveauId, Question } from "./bank";

export const CLE = "qcm-pedago-v1";
export const CLE_EXAMEN = "qcm-pedago-v1-examen";

export interface SuiviQuestion {
  tentatives: number;
  reussites: number;
  derniereReponse: number;
  derniereJuste: boolean;
  serie: number;
  vueLe: string;
}

export interface FiltresEntrainement {
  niveaux: string[];
  chapitres: number[];
  nombre: 10 | 20 | 40;
}

export interface ExamenTermine {
  date: string;
  bonnes: number;
  total: 40;
  dureeSec: number;
  parNiveau: Record<NiveauId, { bonnes: number; total: number }>;
  reponses: { id: string; choix: number | null }[];
}

export interface Progression {
  version: 1;
  debut: string;
  questions: Record<string, SuiviQuestion>;
  erreurs: string[];
  parcours: { derniereOrdre: number };
  filtresEntrainement?: FiltresEntrainement;
  jours: Record<string, number>;
  examens: ExamenTermine[];
}

/** Épreuve en cours, stockée sous CLE_EXAMEN. */
export interface ExamenEnCours {
  ids: string[];
  reponses: (number | null)[];
  marques: boolean[];
  debut: number; // horodatage ms
  index: number;
}

export function progressionVide(): Progression {
  return { version: 1, debut: "", questions: {}, erreurs: [], parcours: { derniereOrdre: 0 }, jours: {}, examens: [] };
}

/** "AAAA-MM-JJ" en date locale. */
export function cleJour(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Enregistre une réponse (fonction pure) : suivi, erreurs à revoir, jours. */
export function enregistrerReponse(p: Progression, q: Question, choix: number, now: Date): Progression {
  const juste = choix === q.bonneReponse;
  const avant = p.questions[q.id];
  const suivi: SuiviQuestion = {
    tentatives: (avant?.tentatives ?? 0) + 1,
    reussites: (avant?.reussites ?? 0) + (juste ? 1 : 0),
    derniereReponse: choix,
    derniereJuste: juste,
    serie: juste ? (avant?.serie ?? 0) + 1 : 0,
    vueLe: now.toISOString(),
  };
  let erreurs = p.erreurs;
  if (!juste && !erreurs.includes(q.id)) erreurs = [...erreurs, q.id];
  if (juste && suivi.serie >= 2 && erreurs.includes(q.id)) erreurs = erreurs.filter((id) => id !== q.id);
  const jour = cleJour(now);
  return {
    ...p,
    debut: p.debut || now.toISOString(),
    questions: { ...p.questions, [q.id]: suivi },
    erreurs,
    jours: { ...p.jours, [jour]: (p.jours[jour] ?? 0) + 1 },
  };
}

const estObjet = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const estNombre = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

/** Vérifie le format d'une progression (fichier importé ou stockage). Renvoie null si invalide. */
export function validerProgression(x: unknown): Progression | null {
  if (!estObjet(x) || x.version !== 1 || typeof x.debut !== "string") return null;
  if (!estObjet(x.questions) || !Array.isArray(x.erreurs) || !estObjet(x.parcours) || !estObjet(x.jours)) return null;
  if (!Array.isArray(x.examens) || !estNombre(x.parcours.derniereOrdre)) return null;
  for (const s of Object.values(x.questions)) {
    if (!estObjet(s)) return null;
    if (![s.tentatives, s.reussites, s.derniereReponse, s.serie].every(estNombre)) return null;
    if (typeof s.derniereJuste !== "boolean" || typeof s.vueLe !== "string") return null;
  }
  if (!x.erreurs.every((e) => typeof e === "string")) return null;
  if (!Object.values(x.jours).every(estNombre)) return null;
  for (const e of x.examens) {
    if (!estObjet(e) || typeof e.date !== "string" || !estNombre(e.bonnes) || !estNombre(e.dureeSec)) return null;
    if (!estObjet(e.parNiveau) || !Array.isArray(e.reponses)) return null;
  }
  if (x.filtresEntrainement !== undefined) {
    const f = x.filtresEntrainement;
    if (!estObjet(f) || !Array.isArray(f.niveaux) || !Array.isArray(f.chapitres) || ![10, 20, 40].includes(f.nombre as number))
      return null;
  }
  return x as unknown as Progression;
}

export function exporterProgression(p: Progression): string {
  return JSON.stringify(p, null, 2);
}

export function nomFichierExport(d: Date): string {
  return `progression-qcm-${cleJour(d)}.json`;
}

export function importerProgression(texte: string): Progression | null {
  try {
    return validerProgression(JSON.parse(texte));
  } catch {
    return null;
  }
}

function validerExamenEnCours(x: unknown): ExamenEnCours | null {
  if (!estObjet(x) || !Array.isArray(x.ids) || !Array.isArray(x.reponses) || !Array.isArray(x.marques)) return null;
  if (!estNombre(x.debut) || !estNombre(x.index) || x.ids.length !== x.reponses.length) return null;
  return x as unknown as ExamenEnCours;
}

/* ---------- Accès au stockage (seul endroit qui touche localStorage) ---------- */

const abonnes = new Set<() => void>();

function lireBrut(cle: string): string | null {
  try {
    return window.localStorage.getItem(cle);
  } catch {
    return null;
  }
}

function ecrireBrut(cle: string, valeur: string | null) {
  try {
    if (valeur === null) window.localStorage.removeItem(cle);
    else window.localStorage.setItem(cle, valeur);
  } catch {
    // stockage indisponible (navigation privée stricte) : on continue sans sauvegarde
  }
  abonnes.forEach((f) => f());
}

export function abonner(f: () => void): () => void {
  abonnes.add(f);
  const surStockage = (e: StorageEvent) => {
    if (!e.key || e.key.startsWith(CLE)) f();
  };
  window.addEventListener("storage", surStockage);
  return () => {
    abonnes.delete(f);
    window.removeEventListener("storage", surStockage);
  };
}

// Caches : même texte stocké → même objet (exigé par useSyncExternalStore).
let cacheP: { brut: string | null; val: Progression } | null = null;
let cacheE: { brut: string | null; val: ExamenEnCours | null } | null = null;

export function lireProgression(): Progression {
  const brut = lireBrut(CLE);
  if (cacheP && cacheP.brut === brut) return cacheP.val;
  const val = (brut && importerProgression(brut)) || progressionVide();
  cacheP = { brut, val };
  return val;
}

export function ecrireProgression(p: Progression) {
  ecrireBrut(CLE, JSON.stringify(p));
}

export function modifierProgression(f: (p: Progression) => Progression) {
  ecrireProgression(f(lireProgression()));
}

export function lireExamenEnCours(): ExamenEnCours | null {
  const brut = lireBrut(CLE_EXAMEN);
  if (cacheE && cacheE.brut === brut) return cacheE.val;
  let val: ExamenEnCours | null = null;
  try {
    val = brut ? validerExamenEnCours(JSON.parse(brut)) : null;
  } catch {
    val = null;
  }
  cacheE = { brut, val };
  return val;
}

export function ecrireExamenEnCours(e: ExamenEnCours | null) {
  ecrireBrut(CLE_EXAMEN, e ? JSON.stringify(e) : null);
}

export function reinitialiserTout() {
  ecrireBrut(CLE_EXAMEN, null);
  ecrireBrut(CLE, null);
}
