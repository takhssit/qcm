import fs from "node:fs";
import { DEMO, PAR_ID, expect, injecter, lireProgression, test } from "./outils";

test("erreurs : entrée après une erreur, sortie après 2 réussites consécutives, état vide", async ({ page, estMobile }) => {
  await page.goto("/erreurs");
  await expect(page.getByTestId("erreurs-vide")).toContainText("Aucune erreur à revoir pour le moment.");
  await expect(page.getByTestId("erreurs-vide").getByRole("link", { name: "S'entraîner" })).toHaveAttribute("href", "/entrainement");

  // une question ratée dans le parcours
  await page.goto("/parcours");
  const q = PAR_ID.get("Q001")!;
  await page.getByTestId(`choix-${(q.bonneReponse + 1) % 4}`).click();
  await page.getByTestId("action-principale").click();
  await page.goto("/erreurs");
  await expect(page.getByTestId("liste-erreurs").locator('[data-question-id="Q001"]')).toBeVisible();
  await expect(page.getByTestId(estMobile ? "tabbar-badge" : "rail-badge")).toHaveText(/(^|\D)1$/);

  // 1re réussite : la question reste
  for (const resteAttendu of [true, false]) {
    await page.getByTestId("revoir-erreurs").click();
    await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q001");
    await page.getByTestId(`choix-${q.bonneReponse}`).click();
    await page.getByTestId("action-principale").click();
    await page.getByTestId("action-principale").click(); // Voir le résultat
    await expect(page.getByTestId("score-serie")).toHaveText("1 / 1");
    await page.getByRole("button", { name: "Nouvelle série" }).click();
    if (resteAttendu) await expect(page.getByTestId("liste-erreurs").locator('[data-question-id="Q001"]')).toBeVisible();
  }
  // 2e réussite consécutive : la liste est vide
  await expect(page.getByTestId("erreurs-vide")).toBeVisible();
  await expect(page.getByTestId(estMobile ? "tabbar-badge" : "rail-badge")).toHaveCount(0);
  expect((await lireProgression(page)).erreurs).toEqual([]);
});

test("statistiques : export JSON valide, réinitialisation confirmée, import restauré", async ({ page }, info) => {
  await injecter(page, DEMO);
  await page.goto("/stats");
  await expect(page.getByRole("heading", { level: 1, name: "Statistiques" })).toBeVisible();
  const avant = await lireProgression(page);

  // export
  const telechargement = page.waitForEvent("download");
  await page.getByTestId("exporter").click();
  const dl = await telechargement;
  expect(dl.suggestedFilename()).toMatch(/^progression-qcm-\d{4}-\d{2}-\d{2}\.json$/);
  const chemin = info.outputPath("export.json");
  await dl.saveAs(chemin);
  const exporte = JSON.parse(fs.readFileSync(chemin, "utf8"));
  expect(exporte).toEqual(avant);
  expect(exporte.version).toBe(1);

  // réinitialisation : annuler ne touche à rien, confirmer remet à zéro
  await page.getByTestId("reinitialiser").click();
  await page.getByRole("button", { name: "Annuler" }).click();
  expect(await lireProgression(page)).toEqual(avant);
  await page.getByTestId("reinitialiser").click();
  await page.getByTestId("confirmer-reinitialiser").click();
  await expect(page.getByText("Aucune réponse pour le moment")).toBeVisible();
  expect(await lireProgression(page)).toBeNull();
  await expect(page.getByTestId("stat-chapitre-1")).toContainText("—");
  await expect(page.getByTestId("affilee")).toHaveText("· 0 jour d'affilée");

  // fichier invalide refusé
  await page.getByTestId("fichier-import").setInputFiles({ name: "faux.json", mimeType: "application/json", buffer: Buffer.from("{}") });
  await expect(page.getByTestId("message-stats")).toHaveText("Ce fichier n'est pas une progression valide : rien n'a été modifié.");
  expect(await lireProgression(page)).toBeNull();

  // import : confirmation puis restauration à l'identique
  await page.getByTestId("fichier-import").setInputFiles({ name: dl.suggestedFilename(), mimeType: "application/json", buffer: fs.readFileSync(chemin) });
  await expect(page.getByRole("heading", { name: "Remplacer votre progression ?" })).toBeVisible();
  await page.getByTestId("confirmer-import").click();
  await expect(page.getByTestId("message-stats")).toHaveText("Progression importée.");
  expect(await lireProgression(page)).toEqual(avant);
  await expect(page.getByText(/1\s248 réponses depuis le 3 novembre/)).toBeVisible();
});

test("premier lancement : aucune erreur, valeurs à zéro, « Commencer le parcours »", async ({ page, estMobile }) => {
  const messages: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") messages.push(m.text());
  });
  await page.goto("/");
  const zone = page.getByTestId(estMobile ? "accueil-mobile" : "accueil-desktop");
  await expect(zone).toBeVisible();
  await expect(zone.getByRole("link", { name: "Commencer le parcours" })).toBeVisible();
  await expect(zone).toContainText("0 questions réussies sur 324");
  await expect(zone).toContainText("0 %");
  await expect(zone).toContainText("0 jour d'entraînement d'affilée");
  await expect(zone).toContainText("Question 1 sur 324");
  if (estMobile) {
    for (const n of ["facile", "moyen", "difficile"]) await expect(page.getByTestId(`taux-${n}`)).toHaveText("—");
  } else {
    await expect(zone).toContainText("Aucune erreur à revoir pour le moment.");
    await expect(zone).toContainText("Aucun examen blanc pour le moment.");
    await expect(page.getByTestId("ligne-chapitre-1")).toContainText("0 / 27");
  }
  await zone.getByRole("link", { name: "Commencer le parcours" }).click();
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q001");
  for (const route of ["/entrainement", "/examen", "/erreurs", "/stats"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  }
  expect(messages).toEqual([]);
});
