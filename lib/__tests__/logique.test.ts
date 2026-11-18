import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { filtrerQuestions, questionParId, questions, themeCompact, validerBanque, type Question } from "@/lib/bank";
import { corrigerExamen, erreursExamen, nouvelExamen, prioritesChapitres, tempsRestantSec, formatChrono, tirerExamen } from "@/lib/exam";
import {
  enregistrerReponse,
  exporterProgression,
  importerProgression,
  nomFichierExport,
  progressionVide,
  validerProgression,
  type Progression,
} from "@/lib/progress";
import { melanger, tirer } from "@/lib/shuffle";
import {
  formatJoursAffilee,
  formatNote,
  formatTaux,
  joursAffilee,
  noteSur20,
  progressionGlobale,
  septDerniersJours,
  tauxParChapitre,
  tauxParNiveau,
} from "@/lib/stats";

const json = JSON.parse(readFileSync(new URL("../../data/questions.json", import.meta.url), "utf8")) as {
  questions: Question[];
};

/** Générateur pseudo-aléatoire reproductible. */
function rngFixe(graine = 42) {
  let s = graine;
  return () => {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    return s / 2 ** 31;
  };
}

const NOW = new Date(2026, 10, 18, 10, 0, 0); // mercredi 18 novembre 2026, heure locale
const q = (id: string) => questionParId(id)!;
const mauvais = (x: Question) => (x.bonneReponse + 1) % 4;

describe("banque", () => {
  it("contient 324 questions valides, triées par ordre", () => {
    expect(questions).toHaveLength(324);
    expect(validerBanque(questions)).toEqual([]);
    expect(questions.map((x) => x.ordre)).toEqual(Array.from({ length: 324 }, (_, i) => i + 1));
  });

  it("détecte un id en double et une bonne réponse hors limites", () => {
    const a = { ...questions[0] };
    const b = { ...questions[0], bonneReponse: 7 } as unknown as Question;
    expect(validerBanque([a, b])).toHaveLength(2);
  });

  it("ne re-mélange jamais les choix (identiques au JSON)", () => {
    for (const brut of json.questions) {
      expect(q(brut.id).choix).toEqual(brut.choix);
      expect(q(brut.id).bonneReponse).toBe(brut.bonneReponse);
    }
  });

  it("filtre par niveau et chapitre : chapitre 3 + facile = 9 questions", () => {
    expect(filtrerQuestions(["facile"], [3])).toHaveLength(9);
    expect(filtrerQuestions(["facile", "moyen", "difficile"], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toHaveLength(324);
  });

  it("retire la parenthèse finale du thème", () => {
    expect(themeCompact("Approche par compétences (APC)")).toBe("Approche par compétences");
  });
});

describe("mélange et tirage", () => {
  it("melanger renvoie une permutation sans toucher l'original", () => {
    const base = [1, 2, 3, 4, 5, 6];
    const m = melanger(base, rngFixe());
    expect(base).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...m].sort()).toEqual(base);
  });

  it("tirer ne dépasse jamais la taille et ne répète rien", () => {
    expect(tirer([1, 2, 3], 10)).toHaveLength(3);
    const t = tirer(questions, 20, rngFixe(7));
    expect(new Set(t.map((x) => x.id)).size).toBe(20);
  });

  it("un tirage garde les choix des questions intacts", () => {
    for (const x of tirer(questions, 50, rngFixe(3))) {
      const brut = json.questions.find((b) => b.id === x.id)!;
      expect(x.choix).toEqual(brut.choix);
    }
  });
});

describe("examen blanc", () => {
  it("tire 40 questions 12/16/12 sans doublon", () => {
    for (let g = 1; g <= 20; g++) {
      const ids = tirerExamen(rngFixe(g));
      expect(ids).toHaveLength(40);
      expect(new Set(ids).size).toBe(40);
      const n = (niv: string) => ids.filter((id) => q(id).niveau === niv).length;
      expect([n("facile"), n("moyen"), n("difficile")]).toEqual([12, 16, 12]);
    }
  });

  it("note sur 20 = bonnes ÷ 2, au format « 15,5 »", () => {
    expect(noteSur20(31)).toBe(15.5);
    expect(formatNote(noteSur20(31))).toBe("15,5");
    expect(formatNote(noteSur20(24))).toBe("12");
    expect(formatNote(noteSur20(27))).toBe("13,5");
    expect(formatNote(0)).toBe("0");
  });

  it("corrige : sans réponse = faux, score par niveau, durée", () => {
    const e = nouvelExamen(NOW.getTime(), rngFixe(5));
    // 31 bonnes réponses, 4 fausses, 5 sans réponse
    e.ids.forEach((id, i) => {
      if (i < 31) e.reponses[i] = q(id).bonneReponse;
      else if (i < 35) e.reponses[i] = mauvais(q(id));
    });
    const r = corrigerExamen(e, NOW.getTime() + (33 * 60 + 12) * 1000);
    expect(r.bonnes).toBe(31);
    expect(formatNote(noteSur20(r.bonnes))).toBe("15,5");
    expect(r.dureeSec).toBe(33 * 60 + 12);
    const tot = r.parNiveau.facile.total + r.parNiveau.moyen.total + r.parNiveau.difficile.total;
    expect(tot).toBe(40);
    expect(r.parNiveau.facile.bonnes + r.parNiveau.moyen.bonnes + r.parNiveau.difficile.bonnes).toBe(31);
    expect(erreursExamen(r)).toHaveLength(9);
    expect(prioritesChapitres(r)).toHaveLength(3);
  });

  it("chronomètre : temps restant réel et format", () => {
    const e = nouvelExamen(0, rngFixe());
    expect(tempsRestantSec(e, 0)).toBe(2400);
    expect(tempsRestantSec(e, (12 * 60 + 18) * 1000)).toBe(27 * 60 + 42);
    expect(formatChrono(27 * 60 + 42)).toBe("27:42");
    expect(tempsRestantSec(e, 50 * 60 * 1000)).toBe(0);
  });
});

describe("progression et erreurs à revoir", () => {
  it("une mauvaise réponse ajoute aux erreurs ; 2 réussites consécutives l'en sortent", () => {
    const x = q("Q010");
    let p = enregistrerReponse(progressionVide(), x, mauvais(x), NOW);
    expect(p.erreurs).toEqual(["Q010"]);
    expect(p.questions.Q010.serie).toBe(0);
    p = enregistrerReponse(p, x, x.bonneReponse, NOW);
    expect(p.erreurs).toEqual(["Q010"]);
    expect(p.questions.Q010.serie).toBe(1);
    // une nouvelle erreur remet la série à zéro
    p = enregistrerReponse(p, x, mauvais(x), NOW);
    expect(p.questions.Q010.serie).toBe(0);
    p = enregistrerReponse(p, x, x.bonneReponse, NOW);
    expect(p.erreurs).toEqual(["Q010"]);
    p = enregistrerReponse(p, x, x.bonneReponse, NOW);
    expect(p.erreurs).toEqual([]);
    expect(p.questions.Q010).toMatchObject({ tentatives: 5, reussites: 3, derniereJuste: true, serie: 2 });
  });

  it("n'ajoute pas deux fois la même erreur et compte les réponses du jour", () => {
    const x = q("Q001");
    let p = enregistrerReponse(progressionVide(), x, mauvais(x), NOW);
    p = enregistrerReponse(p, x, mauvais(x), NOW);
    expect(p.erreurs).toEqual(["Q001"]);
    expect(p.jours["2026-11-18"]).toBe(2);
    expect(p.debut).toBe(NOW.toISOString());
  });

  it("ne modifie pas la progression reçue (fonction pure)", () => {
    const p0 = progressionVide();
    enregistrerReponse(p0, q("Q001"), 0, NOW);
    expect(p0).toEqual(progressionVide());
  });
});

describe("jours d'affilée", () => {
  it("compte à partir d'aujourd'hui", () => {
    expect(joursAffilee({ "2026-11-18": 3, "2026-11-17": 1, "2026-11-16": 5 }, NOW)).toBe(3);
  });
  it("part d'hier si rien encore aujourd'hui", () => {
    expect(joursAffilee({ "2026-11-17": 1, "2026-11-16": 5 }, NOW)).toBe(2);
  });
  it("s'arrête au premier trou", () => {
    expect(joursAffilee({ "2026-11-18": 2, "2026-11-17": 1, "2026-11-15": 9 }, NOW)).toBe(2);
    expect(joursAffilee({ "2026-11-16": 4 }, NOW)).toBe(0);
    expect(joursAffilee({}, NOW)).toBe(0);
  });
  it("traverse un changement de mois", () => {
    expect(joursAffilee({ "2026-12-01": 1, "2026-11-30": 1 }, new Date(2026, 11, 1, 9))).toBe(2);
  });
  it("libellé", () => {
    expect(formatJoursAffilee(6)).toBe("6 jours d'entraînement d'affilée");
    expect(formatJoursAffilee(1)).toBe("1 jour d'entraînement d'affilée");
  });
  it("sept derniers jours, le dernier est aujourd'hui", () => {
    const j = septDerniersJours({ "2026-11-18": 40, "2026-11-12": 3 }, NOW);
    expect(j.map((d) => d.libelle)).toEqual(["Jeu", "Ven", "Sam", "Dim", "Lun", "Mar", "Mer"]);
    expect(j[6]).toMatchObject({ nombre: 40, aujourdhui: true });
    expect(j[0].nombre).toBe(3);
  });
});

describe("taux de réussite", () => {
  it("« — » si rien n'a été tenté", () => {
    const p = progressionVide();
    expect(formatTaux(tauxParNiveau(p).facile.taux)).toBe("—");
    expect(tauxParChapitre(p).every((c) => c.taux === null)).toBe(true);
    expect(progressionGlobale(p)).toEqual({ reussies: 0, total: 324, pourcentage: 0 });
  });

  it("réussies ÷ tentées par niveau et par chapitre (dernière réponse)", () => {
    let p: Progression = progressionVide();
    const faciles3 = questions.filter((x) => x.niveau === "facile" && x.chapitre === 3).slice(0, 4);
    faciles3.forEach((x, i) => (p = enregistrerReponse(p, x, i < 3 ? x.bonneReponse : mauvais(x), NOW)));
    const niv = tauxParNiveau(p);
    expect(niv.facile).toMatchObject({ tentees: 4, reussies: 3, total: 108, taux: 0.75 });
    expect(niv.moyen.taux).toBeNull();
    const ch3 = tauxParChapitre(p).find((c) => c.num === 3)!;
    expect(ch3).toMatchObject({ tentees: 4, reussies: 3, total: 27 });
    expect(formatTaux(ch3.taux)).toBe("75 %");
    expect(ch3.derniereSeance).toBe(NOW.toISOString());
    // la dernière réponse fait foi
    p = enregistrerReponse(p, faciles3[0], mauvais(faciles3[0]), NOW);
    expect(tauxParNiveau(p).facile.reussies).toBe(2);
    expect(progressionGlobale(p).reussies).toBe(2);
  });
});

describe("import / export", () => {
  it("l'export se relit à l'identique", () => {
    const p = enregistrerReponse(progressionVide(), q("Q005"), 1, NOW);
    expect(importerProgression(exporterProgression(p))).toEqual(p);
    expect(nomFichierExport(NOW)).toBe("progression-qcm-2026-11-18.json");
  });

  it("refuse un fichier invalide", () => {
    expect(importerProgression("pas du json")).toBeNull();
    expect(importerProgression("{}")).toBeNull();
    expect(validerProgression({ ...progressionVide(), version: 2 })).toBeNull();
    expect(validerProgression({ ...progressionVide(), erreurs: [1] })).toBeNull();
    expect(validerProgression({ ...progressionVide(), questions: { Q001: { tentatives: "x" } } })).toBeNull();
    expect(validerProgression({ ...progressionVide(), filtresEntrainement: { niveaux: [], chapitres: [], nombre: 15 } })).toBeNull();
    expect(validerProgression(progressionVide())).toEqual(progressionVide());
  });
});

describe("données de démonstration", () => {
  it("la progression de démonstration est un fichier valide", () => {
    const demo = JSON.parse(readFileSync(new URL("../../tests/fixtures/progression-demo.json", import.meta.url), "utf8"));
    expect(validerProgression(demo)).not.toBeNull();
    expect(progressionGlobale(demo).reussies).toBe(126);
    expect(demo.erreurs).toHaveLength(14);
    expect(demo.examens.map((e: { bonnes: number }) => formatNote(noteSur20(e.bonnes)))).toEqual(["12", "13,5", "15,5"]);
    expect(joursAffilee(demo.jours, NOW)).toBe(6);
    const faibles = tauxParChapitre(demo).filter((c) => c.taux !== null && c.taux < 0.5).map((c) => c.num);
    expect(faibles).toEqual([3, 6, 10]);
  });
});
