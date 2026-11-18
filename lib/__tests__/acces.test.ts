import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { lireComptes, sha256Hex, verifierAutorisation } from "@/lib/acces";

const empreinte = (mdp: string) => createHash("sha256").update(mdp).digest("hex");
const basic = (nom: string, mdp: string) => `Basic ${Buffer.from(`${nom}:${mdp}`, "utf8").toString("base64")}`;
const COMPTES = lireComptes(`alice:${empreinte("Café-123")}, bob:${empreinte("b:o:b")}`);

describe("accès réservé", () => {
  it("lit les comptes et ignore les entrées invalides", () => {
    expect([...COMPTES.keys()]).toEqual(["alice", "bob"]);
    expect(lireComptes(undefined).size).toBe(0);
    expect(lireComptes("sansmotdepasse,x:pasunhash,:abc").size).toBe(0);
  });

  it("calcule la même empreinte SHA-256 que Node", async () => {
    expect(await sha256Hex("Café-123")).toBe(empreinte("Café-123"));
  });

  it("accepte le bon couple, y compris accents et « : » dans le mot de passe", async () => {
    expect(await verifierAutorisation(basic("alice", "Café-123"), COMPTES)).toBe("alice");
    expect(await verifierAutorisation(basic("bob", "b:o:b"), COMPTES)).toBe("bob");
  });

  it("refuse mauvais mot de passe, compte inconnu, mot de passe d'un autre compte et en-tête invalide", async () => {
    expect(await verifierAutorisation(basic("alice", "cafe-123"), COMPTES)).toBeNull();
    expect(await verifierAutorisation(basic("carol", "Café-123"), COMPTES)).toBeNull();
    expect(await verifierAutorisation(basic("bob", "Café-123"), COMPTES)).toBeNull();
    expect(await verifierAutorisation(null, COMPTES)).toBeNull();
    expect(await verifierAutorisation("Bearer xyz", COMPTES)).toBeNull();
    expect(await verifierAutorisation("Basic !!!pas-du-base64", COMPTES)).toBeNull();
  });
});
