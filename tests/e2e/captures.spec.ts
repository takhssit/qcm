import path from "node:path";
import type { Page } from "@playwright/test";
import { DEMO, MAINTENANT_DEMO, PAR_ID, QUESTIONS, expect, hasardControle, injecter, test } from "./outils";

/**
 * Captures des 9 écrans de maquettes/README.md, dans le même état et au même format,
 * enregistrées dans tests/captures/<nom de la maquette>.png pour comparaison visuelle.
 */
const DOSSIER = path.join(__dirname, "../captures");
const fichier = (nom: string) => path.join(DOSSIER, `${nom}.png`);

async function preparer(page: Page, progression: unknown, examen: unknown = null) {
  await page.clock.setFixedTime(MAINTENANT_DEMO);
  await injecter(page, progression, examen);
}

async function stabiliser(page: Page) {
  await expect(page.getByText("Chargement…")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400); // fin des transitions d'état (150–250 ms)
}

/** Tire une série d'entraînement où la question voulue tombe à la position demandée. */
async function serieAvec(page: Page, nbFiltrees: number, position: number, indexCible: number) {
  await page.goto("/entrainement");
  await expect(page.getByTestId("lancer")).toBeEnabled();
  // Fisher-Yates : identité jusqu'à la position voulue, puis échange avec la question cible
  const valeurs = [...Array(nbFiltrees - 1 - (position - 1)).fill(0.9999), (indexCible + 0.5) / position];
  await hasardControle(page, valeurs);
  await page.getByTestId("lancer").click();
}

async function repondreN(page: Page, n: number, fausses: number[] = []) {
  for (let i = 1; i <= n; i++) {
    const id = await page.getByTestId("question").getAttribute("data-question-id");
    const q = PAR_ID.get(id!)!;
    const choix = fausses.includes(i) ? (q.bonneReponse + 1) % 4 : q.bonneReponse;
    await page.getByTestId(`choix-${choix}`).click();
    await page.getByTestId("action-principale").click();
    await page.getByTestId("action-principale").click();
  }
}

test.describe("captures mobiles @mobile-seul", () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

  test("01-accueil-mobile", async ({ page }) => {
    await preparer(page, DEMO);
    await page.goto("/");
    await stabiliser(page);
    await page.screenshot({ path: fichier("01-accueil-mobile") });
  });

  test("02-question-mobile", async ({ page }) => {
    await preparer(page, DEMO);
    await page.goto("/parcours");
    await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q127");
    await page.getByTestId("choix-1").click();
    await stabiliser(page);
    await page.screenshot({ path: fichier("02-question-mobile") });
  });

  test("03-correction-mobile", async ({ page }) => {
    const filtres = { niveaux: ["difficile"], chapitres: [6, 7, 8], nombre: 20 };
    await preparer(page, { ...DEMO, filtresEntrainement: filtres });
    await serieAvec(page, 27, 8, 4); // Q266 = 5e question difficile du chapitre 6
    await repondreN(page, 7, [2, 5]);
    await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q266");
    await page.getByTestId("choix-1").click();
    await page.getByTestId("action-principale").click();
    await expect(page.getByTestId("choix-1")).toHaveAttribute("data-etat", "faux");
    await stabiliser(page);
    await page.waitForTimeout(900); // fin du balayage du surligneur
    await page.screenshot({ path: fichier("03-correction-mobile") });
  });

  test("04-entrainement-mobile", async ({ page }) => {
    await preparer(page, { ...DEMO, filtresEntrainement: { niveaux: ["facile", "moyen"], chapitres: [3, 5, 6, 10], nombre: 20 } });
    await page.goto("/entrainement");
    await expect(page.getByTestId("compteur")).toHaveText("72 questions correspondent à votre sélection");
    await stabiliser(page);
    await page.screenshot({ path: fichier("04-entrainement-mobile") });
  });

  test("05-examen-mobile", async ({ page }) => {
    // épreuve en cours : question 17 (Q021), 16 répondues, 2 marquées, 27:42 restantes
    const parNiveau = (n: string, k: number, sauf: string[]) => QUESTIONS.filter((q) => q.niveau === n && !sauf.includes(q.id)).slice(0, k).map((q) => q.id);
    const autres = [...parNiveau("facile", 11, ["Q021"]), ...parNiveau("moyen", 16, []), ...parNiveau("difficile", 12, [])];
    const ids = [...autres.slice(0, 16), "Q021", ...autres.slice(16)];
    const reponses = ids.map((id, i) => (i < 16 && i !== 11 ? PAR_ID.get(id)!.bonneReponse : i === 16 ? 3 : null));
    const examen = {
      ids,
      reponses,
      marques: ids.map((_, i) => i === 4 || i === 11),
      debut: MAINTENANT_DEMO.getTime() - (40 * 60 - (27 * 60 + 42)) * 1000,
      index: 16,
    };
    await preparer(page, DEMO, examen);
    await page.goto("/examen");
    await expect(page.getByTestId("chrono")).toContainText("27:42");
    await expect(page.getByTestId("compteurs-examen")).toHaveText("16 répondues · 2 marquées");
    await stabiliser(page);
    await page.screenshot({ path: fichier("05-examen-mobile") });
  });

  test("06-resultat-examen-mobile", async ({ page }) => {
    await preparer(page, DEMO);
    await page.goto("/examen");
    await page.getByTestId("voir-dernier-resultat").click();
    await expect(page.getByTestId("note")).toHaveText("15,5 sur 20");
    await stabiliser(page);
    await page.screenshot({ path: fichier("06-resultat-examen-mobile") });
  });

  test("07-stats-mobile", async ({ page }) => {
    await preparer(page, DEMO);
    await page.goto("/stats");
    await stabiliser(page);
    await page.screenshot({ path: fichier("07-stats-mobile") });
  });
});

test.describe("capture tableau de bord @desktop-seul", () => {
  test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  test("08-accueil-desktop", async ({ page }) => {
    await preparer(page, DEMO);
    await page.goto("/");
    await stabiliser(page);
    await page.screenshot({ path: fichier("08-accueil-desktop"), fullPage: true });
  });
});

test.describe("capture question desktop @desktop-seul", () => {
  test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  test("09-question-desktop", async ({ page }) => {
    const filtres = { niveaux: ["moyen"], chapitres: [10, 11, 12], nombre: 20 };
    await preparer(page, { ...DEMO, filtresEntrainement: filtres });
    await serieAvec(page, 27, 12, 4); // Q194 = 5e question moyenne du chapitre 10
    await repondreN(page, 11, [3, 7]);
    await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q194");
    await page.getByTestId("choix-2").click();
    await page.getByTestId("action-principale").click();
    await expect(page.getByTestId("choix-2")).toHaveAttribute("data-etat", "correct");
    await stabiliser(page);
    await page.waitForTimeout(900);
    await page.screenshot({ path: fichier("09-question-desktop") });
  });
});
