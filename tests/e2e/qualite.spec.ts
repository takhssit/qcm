import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { DEMO, expect, injecter, test } from "./outils";

const ROUTES = ["/", "/parcours", "/entrainement", "/examen", "/erreurs", "/stats"];

async function attendreRendu(page: Page) {
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await expect(page.getByText("Chargement…")).toHaveCount(0);
}

async function verifierAxe(page: Page, nom: string) {
  const r = await new AxeBuilder({ page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]["page"] }).analyze();
  const graves = r.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${nom} — ${v.id} : ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`);
  expect(graves).toEqual([]);
}

async function verifierCibles(page: Page, nom: string) {
  const petites = await page.evaluate(() => {
    const els = document.querySelectorAll<HTMLElement>("a[href], button, input:not([type=hidden]), select, textarea, [role=button]");
    const res: string[] = [];
    for (const el of els) {
      if (el.closest("[data-petite-cible]") || el.closest("dialog:not([open])")) continue;
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || style.visibility === "hidden" || el.closest(".sr-only")) continue;
      if (r.height < 44 || r.width < 44) res.push(`${el.tagName} « ${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 40)} » ${Math.round(r.width)}×${Math.round(r.height)}`);
    }
    return res;
  });
  expect(petites, `${nom} : cibles tactiles < 44 px`).toEqual([]);
}

for (const route of ROUTES) {
  test(`qualité ${route} : axe, console, débordement, cibles tactiles`, async ({ page, estMobile }) => {
    const messages: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error" || m.type() === "warning") messages.push(`${m.type()}: ${m.text()}`);
    });
    await injecter(page, DEMO);
    await page.goto(route);
    await attendreRendu(page);
    await verifierAxe(page, route);
    if (estMobile) {
      const deborde = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(deborde, "défilement horizontal à 390 px").toBe(false);
      await verifierCibles(page, route);
    }
    if (route === "/examen") {
      // même contrôles pendant l'épreuve
      await page.getByTestId("commencer-examen").click();
      await expect(page.getByTestId("epreuve")).toBeVisible();
      await verifierAxe(page, "/examen (épreuve)");
      if (estMobile) {
        expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
        await verifierCibles(page, "/examen (épreuve)");
      }
    }
    if (route === "/parcours") {
      // même contrôles après correction
      await page.getByTestId("choix-1").click();
      await page.getByTestId("action-principale").click();
      await expect(page.getByTestId("verdict")).toBeVisible();
      await verifierAxe(page, "/parcours (correction)");
      if (estMobile) await verifierCibles(page, "/parcours (correction)");
    }
    expect(messages.filter((m) => !m.includes("Download the React DevTools"))).toEqual([]);
    expect(messages.join("\n")).not.toMatch(/hydrat/i);
  });
}

test("prefers-reduced-motion : le surligneur apparaît sans animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/parcours");
  await page.getByTestId("choix-0").click();
  await page.getByTestId("action-principale").click();
  const s = page.getByTestId("surligneur");
  const style = await s.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { duree: cs.transitionDuration, taille: cs.backgroundSize };
  });
  expect(style.duree).toBe("0s");
  expect(style.taille).toBe("100% 100%");
});

test("sans préférence : le surligneur balaie en 750 ms", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/parcours");
  const duree = await page.getByTestId("choix-3").locator(".marker").evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(duree).toBe("0.75s");
});
