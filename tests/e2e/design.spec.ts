import { DEMO, PAR_ID, expect, injecter, test } from "./outils";

const JAUNE = "rgb(255, 228, 92)";
const ROUGE = "rgb(196, 40, 58)";

test("police, fond et couleur de texte des tokens DESIGN.md", async ({ page }) => {
  await injecter(page, DEMO);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  const s = await page.evaluate(async () => {
    await document.fonts.ready;
    const cs = getComputedStyle(document.body);
    return {
      famille: cs.fontFamily,
      chargee: document.fonts.check('16px "Atkinson Hyperlegible"') && [...document.fonts].some((f) => f.family.includes("Atkinson Hyperlegible") && f.status === "loaded"),
      fond: cs.backgroundColor,
      texte: cs.color,
    };
  });
  expect(s.famille).toContain("Atkinson Hyperlegible");
  expect(s.chargee).toBe(true);
  expect(s.fond).toBe("rgb(243, 245, 249)"); // #F3F5F9
  expect(s.texte).toBe("rgb(23, 32, 65)"); // #172041
});

test("surligneur #FFE45C sur la bonne réponse, rouge #C4283A sur la mauvaise", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/parcours");
  const q = PAR_ID.get("Q001")!;
  const faux = (q.bonneReponse + 1) % 4;
  await page.getByTestId(`choix-${faux}`).click();
  await page.getByTestId("action-principale").click();

  const bonne = page.getByTestId(`choix-${q.bonneReponse}`);
  const marque = await bonne.locator(".marker").evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(marque).toContain(JAUNE);
  expect(await bonne.locator(".marker").evaluate((el) => getComputedStyle(el).backgroundSize)).toBe("100% 100%");
  expect(await bonne.locator(".letter").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(JAUNE);

  const mauvaise = page.getByTestId(`choix-${faux}`);
  expect(await mauvaise.evaluate((el) => getComputedStyle(el).borderColor)).toBe(ROUGE);
  expect(await mauvaise.locator(".letter").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(ROUGE);
  expect(await mauvaise.evaluate((el) => getComputedStyle(el).color)).toBe("rgb(163, 25, 43)"); // #A3192B
  // le surligneur n'est posé que sur la bonne réponse
  expect(await page.locator(".marker-on").count()).toBe(1);
});

test("barre d'onglets uniquement en mobile, rail uniquement en desktop", async ({ page, estMobile }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  if (estMobile) {
    await expect(page.getByTestId("tabbar")).toBeVisible();
    await expect(page.getByTestId("rail")).toBeHidden();
    const barre = await page.getByTestId("tabbar").boundingBox();
    expect(barre!.y + barre!.height).toBeCloseTo(844, 0);
    expect(barre!.height).toBe(76);
  } else {
    await expect(page.getByTestId("rail")).toBeVisible();
    await expect(page.getByTestId("tabbar")).toBeHidden();
    const rail = await page.getByTestId("rail").boundingBox();
    expect(rail!.x).toBe(0);
    expect(rail!.width).toBeGreaterThanOrEqual(248);
    expect(rail!.width).toBeLessThanOrEqual(280);
    expect(await page.getByTestId("rail").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(23, 32, 65)");
  }
});
