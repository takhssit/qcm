import { createHash } from "node:crypto";
import { defineConfig } from "@playwright/test";

const BASE_URL = process.env.BASE_URL;
const PORT = 3100;

// Accès réservé : compte de test pour le serveur local ; pour un site en ligne,
// fournir QCM_UTILISATEUR et QCM_MOT_DE_PASSE (un des comptes réels).
const UTILISATEUR = process.env.QCM_UTILISATEUR ?? "test-e2e";
const MOT_DE_PASSE = process.env.QCM_MOT_DE_PASSE ?? "mot-de-passe-de-test";
const QCM_ACCES = `${UTILISATEUR}:${createHash("sha256").update(MOT_DE_PASSE).digest("hex")}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [["list"]],
  timeout: 60_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: BASE_URL ?? `http://localhost:${PORT}`,
    browserName: "chromium",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    trace: "off",
    httpCredentials: { username: UTILISATEUR, password: MOT_DE_PASSE },
  },
  projects: [
    // Les tests marqués @desktop-seul / @mobile-seul (captures) ne tournent que sur leur projet.
    { name: "mobile", grepInvert: /@desktop-seul/, use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: "desktop", grepInvert: /@mobile-seul/, use: { viewport: { width: 1440, height: 900 } } },
  ],
  // Si BASE_URL est défini, on teste cette adresse sans démarrer de serveur.
  webServer: BASE_URL
    ? undefined
    : {
        command: `npm run build && npm run start -- -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: false,
        env: { QCM_ACCES },
        timeout: 240_000,
      },
});
