import { PAR_ID, expect, lireExamen, lireProgression, test } from "./outils";

const DEBUT = new Date("2026-11-18T09:00:00+01:00");

test("épreuve : 12/16/12, aucune correction, marquage, grille, sauvegarde, remise", async ({ page, estMobile }) => {
  await page.clock.install({ time: DEBUT });
  await page.goto("/examen");
  await expect(page.getByTestId("commencer-examen")).toBeVisible();
  // l'horloge n'est figée qu'une fois la page affichée (figée avant, elle bloque l'hydratation)
  const t0 = DEBUT.getTime() + 30_000;
  await page.clock.pauseAt(t0);
  await page.getByTestId("commencer-examen").click();
  await expect(page.getByTestId("epreuve")).toBeVisible();
  await expect(page.getByTestId("chrono")).toContainText("40:00");

  // 40 questions, 12 / 16 / 12, sans doublon
  await expect(page.locator('[data-testid^="case-"]')).toHaveCount(40);
  const exam = await lireExamen(page);
  expect(exam.ids).toHaveLength(40);
  expect(new Set(exam.ids).size).toBe(40);
  const niv = (n: string) => exam.ids.filter((id: string) => PAR_ID.get(id)!.niveau === n).length;
  expect([niv("facile"), niv("moyen"), niv("difficile")]).toEqual([12, 16, 12]);
  await expect(page.getByTestId("enonce")).toHaveAttribute("data-question-id", exam.ids[0]);

  // aucune correction ni indice pendant l'épreuve
  const sansIndice = async () => {
    await expect(page.getByText(/Bonne réponse|Votre réponse|Explication|Source :/)).toHaveCount(0);
    await expect(page.locator('[data-etat="correct"], [data-etat="faux"], .marker-on, [data-testid="niveau"]')).toHaveCount(0);
  };
  await sansIndice();
  await page.getByTestId("choix-0").click();
  await expect(page.getByTestId("choix-0")).toHaveAttribute("aria-pressed", "true");
  await sansIndice();

  // marquer pour revoir, puis naviguer par la grille
  await page.getByTestId("marquer").click();
  await expect(page.getByTestId("marquer")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("case-5").click();
  await expect(page.getByTestId("position-examen")).toHaveText("Question 6 sur 40");
  await expect(page.getByTestId("case-0")).toHaveAttribute("data-etat", "a-revoir");
  await expect(page.getByTestId("case-5")).toHaveAttribute("data-etat", "en-cours");
  await page.getByTestId("choix-2").click();
  await page.getByTestId("suivante").click();
  await expect(page.getByTestId("position-examen")).toHaveText("Question 7 sur 40");
  await expect(page.getByTestId("case-5")).toHaveAttribute("data-etat", "repondue");
  await expect(page.getByTestId("compteurs-examen")).toHaveText("2 répondues · 1 marquée");
  await page.getByTestId("precedente").click();
  await expect(page.getByTestId("position-examen")).toHaveText("Question 6 sur 40");
  await expect(page.getByTestId("choix-2")).toHaveAttribute("aria-pressed", "true");
  await sansIndice();

  // quitter demande confirmation (refusée : on reste sur l'épreuve)
  page.once("dialog", (d) => {
    expect(d.message()).toContain("Quitter l'examen blanc");
    d.dismiss();
  });
  if (estMobile) await page.getByTestId("tabbar").getByRole("link", { name: "Accueil" }).click();
  else await page.getByTestId("rail").getByRole("link", { name: "Tableau de bord" }).click();
  await expect(page).toHaveURL(/\/examen$/);
  await expect(page.getByTestId("epreuve")).toBeVisible();

  // après rechargement : épreuve et temps restant conservés
  await page.clock.fastForward("05:00");
  await expect(page.getByTestId("chrono")).toContainText("35:00");
  page.on("dialog", (d) => d.accept());
  await page.clock.resume();
  await page.reload();
  await expect(page.getByTestId("epreuve")).toBeVisible();
  await expect(page.getByTestId("chrono")).toContainText(/3[45]:\d\d/);
  await page.clock.pauseAt(t0 + 330_000);
  await expect(page.getByTestId("chrono")).toContainText("34:30");
  await expect(page.getByTestId("position-examen")).toHaveText("Question 6 sur 40");
  await expect(page.getByTestId("case-0")).toHaveAttribute("data-etat", "a-revoir");
  await expect(page.getByTestId("choix-2")).toHaveAttribute("aria-pressed", "true");
  expect((await lireExamen(page)).ids).toEqual(exam.ids);

  // remise avec confirmation indiquant les questions sans réponse
  await page.getByTestId("terminer").click();
  await expect(page.getByTestId("dialogue-remise")).toBeVisible();
  await expect(page.getByTestId("sans-reponse")).toHaveText("38 questions sans réponse : elles compteront comme fausses.");
  await page.getByRole("button", { name: "Continuer l'épreuve" }).click();
  await expect(page.getByTestId("dialogue-remise")).toBeHidden();
  await page.getByTestId("terminer").click();
  await page.getByTestId("confirmer-remise").click();
  await expect(page.getByTestId("resultat")).toBeVisible();
  const q0 = PAR_ID.get(exam.ids[0])!;
  const q5 = PAR_ID.get(exam.ids[5])!;
  const bonnes = (q0.bonneReponse === 0 ? 1 : 0) + (q5.bonneReponse === 2 ? 1 : 0);
  await expect(page.getByTestId("bonnes")).toHaveText(`${bonnes} ${bonnes > 1 ? "bonnes réponses" : "bonne réponse"} sur 40.`);
  await expect(page.getByTestId("note")).toHaveText(`${String(bonnes / 2).replace(".", ",")} sur 20`);
  expect(await lireExamen(page)).toBeNull();
  const p = await lireProgression(page);
  expect(p.examens).toHaveLength(1);
  expect(p.examens[0].dureeSec).toBe(330);
});

test("note = bonnes réponses ÷ 2 (31 bonnes → 15,5) et erreurs enregistrées", async ({ page }) => {
  test.setTimeout(120_000);
  await page.clock.install({ time: DEBUT });
  await page.goto("/examen");
  await page.getByTestId("commencer-examen").click();
  const exam = await lireExamen(page);
  for (let i = 0; i < 40; i++) {
    const q = PAR_ID.get(exam.ids[i])!;
    await expect(page.getByTestId("enonce")).toHaveAttribute("data-question-id", q.id);
    await page.getByTestId(`choix-${i < 31 ? q.bonneReponse : (q.bonneReponse + 1) % 4}`).click();
    if (i < 39) await page.getByTestId("suivante").click();
  }
  await expect(page.getByTestId("compteurs-examen")).toHaveText("40 répondues · 0 marquée");
  await page.getByTestId("suivante").click(); // « Terminer » sur la dernière question
  await expect(page.getByTestId("sans-reponse")).toHaveText("Toutes les questions ont une réponse.");
  await page.getByTestId("confirmer-remise").click();
  await expect(page.getByTestId("note")).toHaveText("15,5 sur 20");
  await expect(page.getByTestId("bonnes")).toHaveText("31 bonnes réponses sur 40.");
  const p = await lireProgression(page);
  const par = p.examens[0].parNiveau;
  expect(par.facile.total + par.moyen.total + par.difficile.total).toBe(40);
  expect(par.facile.bonnes + par.moyen.bonnes + par.difficile.bonnes).toBe(31);
  for (const n of ["facile", "moyen", "difficile"]) {
    await expect(page.getByTestId(`res-${n}`)).toContainText(`${par[n].bonnes} / ${par[n].total}`);
  }
  expect(p.erreurs).toHaveLength(9);
  expect(Object.keys(p.questions)).toHaveLength(40);

  // correction détaillée : 9 erreurs, même rendu que le composant Question
  await page.getByTestId("revoir-erreurs-examen").click();
  await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", exam.ids[31]);
  await expect(page.locator('[data-etat="faux"]')).toContainText("Votre réponse");
  await expect(page.getByTestId("explication")).toBeVisible();
});

test("à 00:00 l'épreuve est remise automatiquement", async ({ page }) => {
  await page.clock.install({ time: DEBUT });
  await page.goto("/examen");
  await page.getByTestId("commencer-examen").click();
  await expect(page.getByTestId("chrono")).toContainText("40:00");
  await page.getByTestId("choix-1").click();
  await page.clock.fastForward("39:58");
  await expect(page.getByTestId("chrono")).toContainText("00:0");
  await expect(page.getByTestId("epreuve")).toBeVisible();
  await page.clock.fastForward("00:05");
  await expect(page.getByTestId("resultat")).toBeVisible();
  await expect(page.getByText("40 min 0 s")).toBeVisible();
  const p = await lireProgression(page);
  expect(p.examens).toHaveLength(1);
  expect(p.examens[0].dureeSec).toBe(2400);
});
