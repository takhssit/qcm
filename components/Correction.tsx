"use client";

import { useState } from "react";
import type { Question } from "@/lib/bank";
import { QuestionScreen } from "./QuestionScreen";

/** Correction détaillée question par question (lecture seule), même rendu que le composant Question validé. */
export function Correction({
  items,
  depart = 0,
  section,
  onFermer,
  libelleFermer,
}: {
  items: { question: Question; choix: number | null }[];
  depart?: number;
  section: string;
  onFermer: () => void;
  libelleFermer: string;
}) {
  const [i, setI] = useState(depart);
  const item = items[i];
  const dernier = i === items.length - 1;
  return (
    <QuestionScreen
      key={item.question.id}
      question={item.question}
      section={section}
      position={i + 1}
      total={items.length}
      avancement={(i + 1) / items.length}
      onRetour={onFermer}
      choixInitial={item.choix}
      onSuivante={() => (dernier ? onFermer() : setI(i + 1))}
      libelleSuivante={dernier ? libelleFermer : undefined}
      onPrecedente={i > 0 ? () => setI(i - 1) : undefined}
    />
  );
}
