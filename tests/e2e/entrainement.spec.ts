import { PAR_ID, expect, repondre, test } from "./outils";

test("chapitre 3 + Facile : 9 questions, série de 9, filtres mémorisés", async ({ page }) => {
  await page.goto("/entrainement");
  await expect(page.getByTestId("compteur")).toHaveText("324 questions correspondent à votre sélection");
  await page.getByRole("button", { name: "Tout désélectionner" }).click();
  await expect(page.getByTestId("compteur-chapitres")).toHaveText("· 0 sur 12");
  await expect(page.getByTestId("lancer")).toBeDisabled();
  await page.getByTestId("chapitre-3").click();
  await page.getByTestId("niveau-moyen").click();
  await page.getByTestId("niveau-difficile").click();
  await expect(page.getByTestId("compteur")).toHaveText("9 questions correspondent à votre sélection");
  await expect(page.getByTestId("compteur-chapitres")).toHaveText("· 1 sur 12");
  await expect(page.getByTestId("lancer")).toHaveText("Lancer 9 questions"); // 20 demandées, 9 disponibles

  // filtres retrouvés après rechargement
  await page.reload();
  await expect(page.getByTestId("compteur")).toHaveText("9 questions correspondent à votre sélection");
  await expect(page.getByTestId("chapitre-3")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("chapitre-4")).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("niveau-facile")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("niveau-moyen")).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("nombre-20")).toHaveAttribute("aria-pressed", "true");

  // la série lancée compte 9 questions, toutes du chapitre 3, niveau facile, sans doublon
  await page.getByTestId("lancer").click();
  const vues = new Set<string>();
  for (let i = 1; i <= 9; i++) {
    const q = await repondre(page, i % 2 === 0);
    expect(q.chapitre).toBe(3);
    expect(q.niveau).toBe("facile");
    vues.add(q.id);
    await expect(page.getByTestId("action-principale")).toHaveText(i === 9 ? /Voir le résultat/ : /Question suivante/);
    await page.getByTestId("action-principale").click();
  }
  expect(vues.size).toBe(9);
  await expect(page.getByTestId("score-serie")).toHaveText("4 / 9");
  // les ratées sont listées avec « Revoir »
  await expect(page.getByRole("button", { name: /Revoir/ })).toHaveCount(5);
  await page.getByRole("button", { name: /Revoir/ }).first().click();
  await expect(page.locator('[data-etat="faux"]')).toHaveCount(1);
  await page.getByTestId("action-principale").click(); // question suivante dans la correction
  await expect(page.getByTestId("question")).toBeVisible();
});

test("/entrainement?chapitre=3 pré-filtre sur ce chapitre", async ({ page }) => {
  await page.goto("/entrainement?chapitre=3");
  await expect(page.getByTestId("chapitre-3")).toHaveAttribute("aria-pressed", "true");
  for (const n of [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12]) await expect(page.getByTestId(`chapitre-${n}`)).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("compteur")).toHaveText("27 questions correspondent à votre sélection");
  await page.getByTestId("nombre-10").click();
  await expect(page.getByTestId("lancer")).toHaveText("Lancer 10 questions");
  await page.getByTestId("lancer").click();
  const id = await page.getByTestId("question").getAttribute("data-question-id");
  expect(PAR_ID.get(id!)!.chapitre).toBe(3);
});
