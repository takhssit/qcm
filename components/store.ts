"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { abonner, lireExamenEnCours, lireProgression, type ExamenEnCours, type Progression } from "@/lib/progress";

const rien = () => null;

/** Progression stockée ; null pendant le rendu serveur et l'hydratation (aucune erreur d'hydratation). */
export function useProgression(): Progression | null {
  return useSyncExternalStore(abonner, lireProgression, rien);
}

export function useExamenEnCours(): ExamenEnCours | null | undefined {
  // undefined = pas encore lu (serveur / hydratation)
  return useSyncExternalStore(abonner, lireExamenEnCours, () => undefined);
}

/** Date du jour, lue après le montage seulement. */
export function useAujourdhui(): Date | null {
  const [d, setD] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture de l'horloge après hydratation
    setD(new Date());
  }, []);
  return d;
}
