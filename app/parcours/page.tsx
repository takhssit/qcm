"use client";

import Link from "next/link";
import { useState } from "react";
import { AppFrame, Page } from "@/components/AppFrame";
import { QuestionScreen } from "@/components/QuestionScreen";
import { useProgression } from "@/components/store";
import { BTN_PRIMAIRE, BTN_SECONDAIRE, Chargement, Panel } from "@/components/ui";
import { TOTAL, questionParOrdre } from "@/lib/bank";
import { enregistrerReponse, modifierProgression } from "@/lib/progress";
import { formatEntier, nbReussies } from "@/lib/stats";

export default function ParcoursPage() {
  const p = useProgression();
  const [pos, setPos] = useState<number | null>(null);
  if (!p) return <Chargement />;

  // derniereOrdre = question la plus avancée atteinte ; TOTAL + 1 = parcours terminé
  const front = p.parcours.derniereOrdre;
  const position = pos ?? Math.min(Math.max(1, front), TOTAL + 1);

  const aller = (n: number) => {
    setPos(n);
    if (n > front) modifierProgression((x) => ({ ...x, parcours: { derniereOrdre: n } }));
  };

  if (position > TOTAL) {
    const reussies = nbReussies(p);
    return (
      <AppFrame>
        <Page titre="Parcours terminé" sousTitre={`${TOTAL} questions parcourues`} testid="fin-parcours">
          <Panel ombre className="flex flex-col gap-3 p-[18px] lg:max-w-[640px] lg:p-[22px]">
            <p className="m-0 text-[20px] font-bold">
              <span className="hl">{formatEntier(reussies)}</span> questions réussies sur {TOTAL}
            </p>
            <p className="m-0 text-[16px] leading-normal">Revoyez vos erreurs ou mesurez-vous en conditions réelles avec un examen blanc.</p>
            <div className="mt-2 flex flex-col gap-2.5">
              <Link href="/erreurs" className={BTN_PRIMAIRE}>
                Revoir mes erreurs
              </Link>
              <Link href="/examen" className={BTN_SECONDAIRE}>
                Passer un examen blanc
              </Link>
              <button type="button" className="h-11 border-0 bg-transparent text-[15px] font-bold text-ink underline underline-offset-[3px]" onClick={() => {
                  modifierProgression((x) => ({ ...x, parcours: { derniereOrdre: 1 } }));
                  setPos(1);
                }}
              >
                Reprendre depuis la question 1
              </button>
            </div>
          </Panel>
        </Page>
      </AppFrame>
    );
  }

  const q = questionParOrdre(position)!;
  const suivi = p.questions[q.id];
  return (
    <QuestionScreen
      key={q.id}
      question={q}
      section="Parcours"
      position={position}
      total={TOTAL}
      avancement={position / TOTAL}
      score={`${formatEntier(nbReussies(p))} réussies sur ${TOTAL}`}
      hrefRetour="/"
      choixInitial={position < front && suivi ? suivi.derniereReponse : undefined}
      onValider={(choix) => modifierProgression((x) => enregistrerReponse(x, q, choix, new Date()))}
      onSuivante={() => aller(position + 1)}
      libelleSuivante={position === TOTAL ? "Terminer le parcours" : undefined}
      onPrecedente={position > 1 ? () => setPos(position - 1) : undefined}
    />
  );
}
