import { request as client } from "@playwright/test";
import { expect, test } from "./outils";

test("sans identifiants ou avec un mauvais mot de passe, tout est refusé", async ({ baseURL }) => {
  for (const identifiants of [undefined, { username: "test-e2e", password: "faux" }, { username: "inconnu", password: "mot-de-passe-de-test" }]) {
    const ctx = await client.newContext({ baseURL, httpCredentials: identifiants });
    for (const chemin of ["/", "/parcours", "/stats", "/icon.svg"]) {
      const r = await ctx.get(chemin);
      expect(r.status(), `${chemin} ${identifiants?.username ?? "anonyme"}`).toBe(401);
      expect(r.headers()["www-authenticate"]).toContain("Basic");
      expect(await r.text()).not.toContain("Pédagogie moderne — QCM");
    }
    await ctx.dispose();
  }
});

test("avec le bon compte, le site s'ouvre", async ({ page }) => {
  const r = await page.goto("/");
  expect(r?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
});
