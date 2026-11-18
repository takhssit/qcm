"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LIBELLE_NIVEAU, themeCompact, type Question } from "@/lib/bank";
import { enregistrerReponse, modifierProgression } from "@/lib/progress";
import { AppFrame, Page } from "./AppFrame";
import { Correction } from "./Correction";
import { QuestionScreen } from "./QuestionScreen";
import { BTN_PRIMAIRE, BTN_SECONDAIRE, Panel } from "./ui";

/** Enchaînement d'une série (entraînement, erreurs) puis écran de fin. */
export function Serie({
  questions,
  section,
  onQuitter,
  onNouvelleSerie,
}: {
  questions: Question[];
  section: string;
  onQuitter: () => void;
  onNouvelleSerie: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [reponses, setReponses] = useState<(number | null)[]>(() => questions.map(() => null));
  const [revoir, setRevoir] = useState<number | null>(null);

  const total = questions.length;
  const bonnes = reponses.filter((r, i) => r === questions[i].bonneReponse).length;
  // score affiché pendant la série : questions précédentes (comme la maquette 09)
  const bonnesAvant = reponses.slice(0, index).filter((r, i) => r === questions[i].bonneReponse).length;
  const ratees = questions.map((question, i) => ({ question, choix: reponses[i] })).filter((x) => x.choix !== x.question.bonneReponse);

  if (revoir !== null) {
    return <Correction items={ratees} depart={revoir} section="Correction" onFermer={() => setRevoir(null)} libelleFermer="Retour au résultat" />;
  }

  if (index >= total) {
    return (
      <AppFrame>
        <Page titre="Série terminée" sousTitre={section} testid="fin-serie">
          <Panel ombre className="flex flex-col gap-2 p-[18px] lg:p-[22px]">
            <h2 data-testid="score-serie" className="tnum m-0 text-[34px] leading-[1.15] font-bold">
              <span className="hl hl-note">
                {bonnes} / {total}
              </span>
            </h2>
            <p className="m-0 text-[16px] leading-normal">
              {bonnes} {bonnes > 1 ? "bonnes réponses" : "bonne réponse"} sur {total}.
            </p>
          </Panel>
          {ratees.length > 0 && (
            <section aria-labelledby="ratees" className="flex flex-col gap-2.5">
              <h2 id="ratees" className="m-0 text-[17px] font-bold">
                Questions ratées
              </h2>
              <ul className="m-0 list-none rounded-2xl border border-line bg-surface p-0">
                {ratees.map((r, i) => (
                  <li key={r.question.id} className="border-b border-line-2 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setRevoir(i)}
                      className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent px-4 py-2.5 text-left text-ink"
                    >
                      <span className="flex flex-col gap-0.5">
                        <span className="text-[15px]">{r.question.question}</span>
                        <span className="text-[13px] text-ink-2">
                          {LIBELLE_NIVEAU[r.question.niveau]} · {themeCompact(r.question.theme)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-[15px] font-bold underline underline-offset-[3px]">
                        Revoir
                        <ChevronRight size={18} aria-hidden />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="flex flex-col gap-2.5 lg:max-w-[420px]">
            <button type="button" className={BTN_PRIMAIRE} onClick={onNouvelleSerie}>
              Nouvelle série
            </button>
            <Link href="/" className={BTN_SECONDAIRE}>
              Accueil
            </Link>
          </div>
        </Page>
      </AppFrame>
    );
  }

  const q = questions[index];
  return (
    <QuestionScreen
      key={q.id}
      question={q}
      section={section}
      position={index + 1}
      total={total}
      avancement={(index + 1) / total}
      score={`${bonnesAvant} ${bonnesAvant > 1 ? "bonnes" : "bonne"} sur ${index}`}
      onRetour={onQuitter}
      onValider={(choix) => {
        setReponses((r) => r.map((x, i) => (i === index ? choix : x)));
        modifierProgression((p) => enregistrerReponse(p, q, choix, new Date()));
      }}
      onSuivante={() => setIndex(index + 1)}
      libelleSuivante={index === total - 1 ? "Voir le résultat" : undefined}
    />
  );
}
