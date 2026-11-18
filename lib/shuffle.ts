/** Mélange de Fisher-Yates : renvoie une copie, ne modifie jamais le tableau reçu. */
export function melanger<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const copie = [...items];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/** Tirage sans remise de n éléments (tous si n dépasse la taille). */
export function tirer<T>(items: readonly T[], n: number, rng: () => number = Math.random): T[] {
  return melanger(items, rng).slice(0, Math.max(0, n));
}
