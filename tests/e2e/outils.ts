import { test as base, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export interface QuestionJSON {
  id: string;
  ordre: number;
  niveau: "facile" | "moyen" | "difficile";
  chapitre: number;
  theme: string;
  question: string;
  choix: string[];
  bonneReponse: number;
  explication: string;
  source: string;
}

export const QUESTIONS: QuestionJSON[] = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/questions.json"), "utf8")).questions;
export const PAR_ID = new Map(QUESTIONS.map((q) => [q.id, q]));
export const DEMO = JSON.parse(fs.readFileSync(path.join(__dirname, "../fixtures/progression-demo.json"), "utf8"));
export const CLE = "qcm-pedago-v1";
export const CLE_EXAMEN = "qcm-pedago-v1-examen";
/** Instant de référence des données de démonstration. */
export const MAINTENANT_DEMO = new Date("2026-11-18T10:00:00+01:00");

/** Toute exception JavaScript non rattrapée fait échouer le test. */
export const test = base.extend<{ estMobile: boolean; erreursPage: string[] }>({
  estMobile: async ({}, fournir, info) => {
    await fournir(info.project.name === "mobile");
  },
  erreursPage: [
    async ({ page }, fournir) => {
      const erreurs: string[] = [];
      page.on("pageerror", (e) => erreurs.push(e.message));
      await fournir(erreurs);
      expect(erreurs, "exceptions JavaScript dans la page").toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

/** Place une progression (et éventuellement une épreuve) dans le stockage avant le premier chargement. */
export async function injecter(page: Page, progression: unknown, examen: unknown = null) {
  await page.addInitScript(
    ([p, e, cle, cleE]) => {
      if (sessionStorage.getItem("__injecte")) return;
      sessionStorage.setItem("__injecte", "1");
      localStorage.clear();
      if (p) localStorage.setItem(cle as string, JSON.stringify(p));
      if (e) localStorage.setItem(cleE as string, JSON.stringify(e));
    },
    [progression, examen, CLE, CLE_EXAMEN] as const,
  );
}

export async function lireProgression(page: Page) {
  return page.evaluate((cle) => JSON.parse(localStorage.getItem(cle) ?? "null"), CLE);
}

export async function lireExamen(page: Page) {
  return page.evaluate((cle) => JSON.parse(localStorage.getItem(cle) ?? "null"), CLE_EXAMEN);
}

export function progressionAvec(parcours: number, extra: Record<string, unknown> = {}) {
  return { version: 1, debut: "", questions: {}, erreurs: [], parcours: { derniereOrdre: parcours }, jours: {}, examens: [], ...extra };
}

/** Répond à la question affichée (juste ou faux) et valide. */
export async function repondre(page: Page, juste: boolean) {
  const id = await page.getByTestId("question").getAttribute("data-question-id");
  const q = PAR_ID.get(id!)!;
  const choix = juste ? q.bonneReponse : (q.bonneReponse + 1) % 4;
  await page.getByTestId(`choix-${choix}`).click();
  await page.getByTestId("action-principale").click();
  await expect(page.getByTestId("verdict")).toBeVisible();
  return q;
}

/** Remplace Math.random par une suite de valeurs (puis 0,9999 = ordre conservé) : tirages reproductibles. */
export async function hasardControle(page: Page, valeurs: number[] = []) {
  await page.evaluate((v) => {
    const file = [...v];
    Math.random = () => (file.length ? (file.shift() as number) : 0.9999);
  }, valeurs);
}
