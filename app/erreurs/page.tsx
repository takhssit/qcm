"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AppFrame, Page } from "@/components/AppFrame";
import { Serie } from "@/components/Serie";
import { useProgression } from "@/components/store";
import { BTN_PRIMAIRE, Chargement, NiveauTag } from "@/components/ui";
import { questionParId, type Question } from "@/lib/bank";
import { melanger } from "@/lib/shuffle";

export default function ErreursPage() {
  const p = useProgression();
  const [serie, setSerie] = useState<Question[] | null>(null);
  if (!p) return <Chargement />;

  const liste = p.erreurs
    .map(questionParId)
    .filter((q): q is Question => !!q)
    .sort((a, b) => a.chapitre - b.chapitre || a.ordre - b.ordre);
  const lancer = () => setSerie(melanger(liste));

  if (serie) {
    return (
      <Serie
        key={serie.map((q) => q.id).join()}
        questions={serie}
        section="Erreurs à revoir"
        onQuitter={() => setSerie(null)}
        onNouvelleSerie={() => setSerie(null)}
      />
    );
  }

  const n = liste.length;
  return (
    <AppFrame>
      <Page
        titre="Erreurs à revoir"
        sousTitre={n ? `${n} ${n > 1 ? "questions" : "question"} à revoir · une question sort de la liste après 2 bonnes réponses d'affilée` : "Les questions ratées apparaissent ici"}
        testid="erreurs"
      >
        {n === 0 ? (
          <section data-testid="erreurs-vide" className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface p-[18px] lg:p-[22px]">
            <p className="m-0 text-[17px] font-bold">Aucune erreur à revoir pour le moment.</p>
            <Link href="/entrainement" className="flex h-11 items-center text-[15px] font-bold">
              S&apos;entraîner
            </Link>
          </section>
        ) : (
          <>
            <button type="button" data-testid="revoir-erreurs" className={`${BTN_PRIMAIRE} lg:w-auto lg:self-start lg:px-6`} onClick={lancer}>
              <RotateCcw size={18} strokeWidth={2} aria-hidden />
              Revoir mes erreurs
            </button>
            <ul data-testid="liste-erreurs" className="m-0 flex list-none flex-col rounded-2xl border border-line bg-surface px-4 py-1 lg:px-[22px]">
              {liste.map((q) => (
                <li key={q.id} data-question-id={q.id} className="flex flex-col gap-1.5 border-b border-line-2 py-3 last:border-b-0">
                  <span className="text-[15px] leading-[1.45]">{q.question}</span>
                  <span className="flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
                    <NiveauTag niveau={q.niveau} className="py-px! text-[12px]!" />
                    Chapitre {q.chapitre} · {q.theme}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Page>
    </AppFrame>
  );
}
