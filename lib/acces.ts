/**
 * Accès réservé (application interne) : authentification HTTP « Basic ».
 * Les comptes viennent de la variable d'environnement QCM_ACCES :
 *   "identifiant1:empreinte1,identifiant2:empreinte2"
 * où l'empreinte est le SHA-256 (hexadécimal) du mot de passe : aucun mot de passe en clair.
 */

export function lireComptes(conf: string | undefined): Map<string, string> {
  const comptes = new Map<string, string>();
  for (const entree of (conf ?? "").split(",")) {
    const i = entree.indexOf(":");
    if (i <= 0) continue;
    const nom = entree.slice(0, i).trim();
    const empreinte = entree.slice(i + 1).trim().toLowerCase();
    if (nom && /^[0-9a-f]{64}$/.test(empreinte)) comptes.set(nom, empreinte);
  }
  return comptes;
}

export async function sha256Hex(texte: string): Promise<string> {
  const octets = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte)));
  return Array.from(octets, (o) => o.toString(16).padStart(2, "0")).join("");
}

/** Comparaison en temps constant (évite de deviner l'empreinte caractère par caractère). */
function egales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Renvoie l'identifiant si l'en-tête Authorization est valide, sinon null. */
export async function verifierAutorisation(entete: string | null, comptes: Map<string, string>): Promise<string | null> {
  if (!entete?.startsWith("Basic ")) return null;
  let decode: string;
  try {
    decode = new TextDecoder().decode(Uint8Array.from(atob(entete.slice(6).trim()), (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
  const i = decode.indexOf(":");
  if (i <= 0) return null;
  const nom = decode.slice(0, i);
  const attendue = comptes.get(nom);
  const recue = await sha256Hex(decode.slice(i + 1));
  return attendue && egales(recue, attendue) ? nom : null;
}
