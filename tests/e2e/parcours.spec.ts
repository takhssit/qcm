import { PAR_ID, QUESTIONS, expect, injecter, progressionAvec, test } from "./outils";

test("bonne réponse : surligneur, explication et source ; mauvaise réponse : erreurs ; reprise après rechargement", async ({ page }) => {
  await page.goto("/parcours");
  const q1 = PAR_ID.get("Q001")!;
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q001");
  await expect(page.getByTestId("action-principale")).toBeDisabled();

  // bonne réponse
  await page.getByTestId(`choix-${q1.bonneReponse}`).click();
  await expect(page.getByTestId(`choix-${q1.bonneReponse}`)).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("action-principale").click();
  const juste = page.getByTestId(`choix-${q1.bonneReponse}`);
  await expect(juste).toHaveAttribute("data-etat", "correct");
  await expect(juste).toContainText("Bonne réponse");
  await expect(page.getByTestId("surligneur")).toHaveClass(/marker-on/);
  await expect(page.getByTestId("surligneur")).toHaveText(q1.choix[q1.bonneReponse]);
  await expect(page.getByTestId("verdict")).toHaveText("Bien joué : c'est la bonne réponse.");
  await expect(page.getByTestId("explication")).toHaveText(q1.explication);
  await expect(page.getByTestId("source")).toHaveText(`Source : ${q1.source}`);
  await expect(page.getByText("Votre réponse")).toHaveCount(0);
  await expect(page.getByTestId("action-principale")).toHaveText(/Question suivante/);

  // mauvaise réponse
  await page.getByTestId("action-principale").click();
  const q2 = PAR_ID.get("Q002")!;
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q002");
  const faux = (q2.bonneReponse + 2) % 4;
  await page.getByTestId(`choix-${faux}`).click();
  await page.getByTestId("action-principale").click();
  await expect(page.getByTestId(`choix-${faux}`)).toHaveAttribute("data-etat", "faux");
  await expect(page.getByTestId(`choix-${faux}`)).toContainText("Votre réponse");
  await expect(page.getByTestId(`choix-${q2.bonneReponse}`)).toContainText("Bonne réponse");
  await expect(page.getByTestId("verdict")).toHaveText("Pas tout à fait. La question rejoint vos erreurs à revoir.");
  await page.getByTestId("action-principale").click();
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q003");

  // reprise après rechargement
  await page.reload();
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q003");

  // revenir en arrière : la question est affichée corrigée
  await page.getByRole("button", { name: "Question précédente" }).click();
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q002");
  await expect(page.getByTestId(`choix-${faux}`)).toHaveAttribute("data-etat", "faux");

  // la question ratée apparaît dans /erreurs
  await page.goto("/erreurs");
  await expect(page.getByTestId("liste-erreurs").locator("[data-question-id]")).toHaveCount(1);
  await expect(page.getByTestId("liste-erreurs").locator('[data-question-id="Q002"]')).toContainText(q2.question);
});

test("clavier : 1–4 et A–D sélectionnent, Entrée valide puis passe à la suivante", async ({ page }) => {
  await page.goto("/parcours");
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q001");
  const attendus: [string, number][] = [
    ["2", 1],
    ["c", 2],
    ["4", 3],
    ["A", 0],
    ["1", 0],
    ["B", 1],
    ["3", 2],
    ["d", 3],
  ];
  for (const [touche, idx] of attendus) {
    await page.keyboard.press(touche);
    await expect(page.getByTestId(`choix-${idx}`)).toHaveAttribute("aria-pressed", "true");
    for (const autre of [0, 1, 2, 3].filter((i) => i !== idx)) {
      await expect(page.getByTestId(`choix-${autre}`)).toHaveAttribute("aria-pressed", "false");
    }
  }
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("verdict")).toBeVisible();
  await expect(page.getByTestId("choix-3")).toHaveAttribute("data-etat", "correct"); // Q001 : bonne réponse D
  // après validation, les touches ne changent plus la réponse
  await page.keyboard.press("1");
  await expect(page.getByTestId("choix-0")).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q002");
  await expect(page.getByTestId("verdict")).toHaveCount(0);
  // Entrée sans choix ne valide pas
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("verdict")).toHaveCount(0);
});

test("fidélité des données sur 30 questions (dont Q001 et Q324)", async ({ page }) => {
  test.setTimeout(120_000);
  const pas = Math.floor(QUESTIONS.length / 29);
  const ids = new Set(["Q001", "Q324", ...Array.from({ length: 28 }, (_, i) => QUESTIONS[(i + 1) * pas].id)]);
  expect(ids.size).toBe(30);
  await injecter(page, progressionAvec(1));
  await page.goto("/");
  for (const id of ids) {
    const q = PAR_ID.get(id)!;
    await page.evaluate((o) => localStorage.setItem("qcm-pedago-v1", JSON.stringify(o)), progressionAvec(q.ordre));
    await page.goto("/parcours");
    await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", id);
    await expect(page.getByTestId("enonce")).toHaveText(q.question);
    // ordre A–D identique au JSON
    for (let i = 0; i < 4; i++) {
      await expect(page.getByTestId(`choix-${i}`).locator(".marker")).toHaveText(q.choix[i]);
      await expect(page.getByTestId(`choix-${i}`).locator(".letter")).toHaveText("ABCD"[i]);
    }
    await page.getByTestId("choix-0").click();
    await page.getByTestId("action-principale").click();
    const corrects = page.locator('[data-etat="correct"]');
    await expect(corrects).toHaveCount(1);
    await expect(corrects).toHaveAttribute("data-testid", `choix-${q.bonneReponse}`);
    await expect(corrects.locator(".marker")).toHaveText(q.choix[q.bonneReponse]);
    await expect(page.getByTestId("explication")).toHaveText(q.explication);
    await expect(page.getByTestId("source")).toHaveText(`Source : ${q.source}`);
  }
});
