import { expect, injecter, progressionAvec, test } from "./outils";

const ONGLETS = [
  { nom: "Accueil", url: "/", titre: "Pédagogie moderne" },
  { nom: "Entraîner", url: "/entrainement", titre: "Entraînement" },
  { nom: "Examen", url: "/examen", titre: "Examen blanc" },
  { nom: "Erreurs", url: "/erreurs", titre: "Erreurs à revoir" },
  { nom: "Stats", url: "/stats", titre: "Statistiques" },
];

const ENTREES = [
  { nom: "Tableau de bord", url: "/", titre: "Tableau de bord" },
  { nom: "Parcours", url: "/parcours", titre: null },
  { nom: "Entraînement", url: "/entrainement", titre: "Entraînement" },
  { nom: "Examen blanc", url: "/examen", titre: "Examen blanc" },
  { nom: "Erreurs à revoir", url: "/erreurs", titre: "Erreurs à revoir" },
  { nom: "Statistiques", url: "/stats", titre: "Statistiques" },
];

test("chaque onglet ou entrée du rail ouvre la bonne page", async ({ page, estMobile }) => {
  if (estMobile) {
    await page.goto("/stats");
    const barre = page.getByTestId("tabbar");
    await expect(barre.getByRole("link")).toHaveCount(5);
    for (const o of ONGLETS) {
      await barre.getByRole("link", { name: new RegExp(`^${o.nom}`) }).click();
      await expect(page).toHaveURL(new RegExp(`${o.url === "/" ? "/$" : o.url + "$"}`));
      await expect(page.getByRole("heading", { level: 1, name: o.titre })).toBeVisible();
      await expect(barre.getByRole("link", { name: new RegExp(`^${o.nom}`) })).toHaveAttribute("aria-current", "page");
    }
    await expect(page.getByTestId("rail")).toBeHidden();
  } else {
    await expect(page.getByTestId("tabbar")).toHaveCount(0);
    for (const e of ENTREES) {
      await page.goto("/stats");
      const rail = page.getByTestId("rail");
      await expect(rail.getByRole("link")).toHaveCount(6);
      await rail.getByRole("link", { name: new RegExp(`^${e.nom}`) }).click();
      await expect(page).toHaveURL(new RegExp(`${e.url === "/" ? "/$" : e.url + "$"}`));
      if (e.titre) await expect(page.getByRole("heading", { level: 1, name: e.titre })).toBeVisible();
      else await expect(page.getByTestId("question")).toHaveAttribute("data-question-id", "Q001");
    }
    await page.goto("/");
    await expect(page.getByTestId("tabbar")).toBeHidden();
  }
});

test("badge Erreurs : nombre exact, masqué à 0", async ({ page, estMobile }) => {
  const badge = estMobile ? "tabbar-badge" : "rail-badge";
  await injecter(page, progressionAvec(1, { erreurs: ["Q001", "Q050", "Q200"] }));
  await page.goto("/");
  await expect(page.getByTestId(badge)).toHaveText(/(^|\D)3$/);
  // on vide les erreurs : le badge disparaît
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem("qcm-pedago-v1")!);
    p.erreurs = [];
    localStorage.setItem("qcm-pedago-v1", JSON.stringify(p));
  });
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeAttached();
  await expect(page.getByTestId(estMobile ? "tabbar" : "rail")).toBeVisible();
  await expect(page.getByTestId(badge)).toHaveCount(0);
});
