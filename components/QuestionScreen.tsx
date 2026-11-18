"use client";

import { Check, ChevronLeft, ChevronRight, Pencil, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Question } from "@/lib/bank";
import { BTN_PRIMAIRE, NiveauTag, Track } from "./ui";

const LETTRES = ["A", "B", "C", "D"] as const;

export interface QuestionScreenProps {
  question: Question;
  /** « Parcours », « Entraînement »… (en-tête) */
  section: string;
  position: number;
  total: number;
  /** avancement 0..1 pour la barre */
  avancement: number;
  /** libellé à droite de la barre sur desktop, ex. « 9 bonnes sur 11 » */
  score?: string;
  /** retour mobile : lien ou action */
  hrefRetour?: string;
  onRetour?: () => void;
  /** défini = question déjà corrigée, affichée en lecture (null = sans réponse) */
  choixInitial?: number | null;
  onValider?: (choix: number) => void;
  onSuivante: () => void;
  libelleSuivante?: string;
  onPrecedente?: () => void;
}

type Etat = "repos" | "choisi" | "correct" | "faux" | "ecarte";

export function QuestionScreen(props: QuestionScreenProps) {
  const { question: q, choixInitial } = props;
  const lecture = choixInitial !== undefined;
  const [choix, setChoix] = useState<number | null>(lecture ? choixInitial : null);
  const [valide, setValide] = useState(lecture);
  const { onValider, onSuivante } = props;

  const valider = useCallback(() => {
    if (valide || choix === null) return;
    setValide(true);
    onValider?.(choix);
  }, [valide, choix, onValider]);

  const action = valide ? onSuivante : valider;

  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const cible = e.target as HTMLElement | null;
      if (cible?.closest("a, input, textarea, select, dialog, [data-natif]")) return;
      const k = e.key.toLowerCase();
      const idx = ["1", "2", "3", "4"].indexOf(k) >= 0 ? Number(k) - 1 : ["a", "b", "c", "d"].indexOf(k);
      if (idx >= 0 && !valide) {
        e.preventDefault();
        setChoix(idx);
      } else if (e.key === "Enter") {
        e.preventDefault();
        action();
      }
    }
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [valide, action]);

  const etat = (i: number): Etat => {
    if (!valide) return choix === i ? "choisi" : "repos";
    if (i === q.bonneReponse) return "correct";
    if (i === choix) return "faux";
    return "ecarte";
  };

  const juste = valide && choix === q.bonneReponse;
  const verdict = juste
    ? "Bien joué : c'est la bonne réponse."
    : choix === null
      ? "Sans réponse : la bonne réponse est surlignée."
      : "Pas tout à fait. La question rejoint vos erreurs à revoir.";

  const retourMobile = props.onRetour ? (
    <button type="button" onClick={props.onRetour} className={RETOUR}>
      <ChevronLeft size={22} strokeWidth={2} aria-hidden />
      {props.section}
    </button>
  ) : (
    <Link href={props.hrefRetour ?? "/"} className={RETOUR}>
      <ChevronLeft size={22} strokeWidth={2} aria-hidden />
      {props.section}
    </Link>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      {/* En-tête mobile */}
      <header className="flex flex-col gap-2.5 border-b border-line bg-surface px-4 pt-3 pb-3.5 lg:hidden">
        <div className="flex items-center justify-between">
          {retourMobile}
          <p className="tnum m-0 text-[15px] text-ink-2">
            Question <strong className="text-ink">{props.position}</strong> / {props.total}
          </p>
        </div>
        <Track valeur={props.avancement} hauteur={8} label={`Avancement : question ${props.position} sur ${props.total}`} />
      </header>

      {/* En-tête desktop */}
      <header className="hidden border-b border-line bg-surface px-10 lg:block">
        <div className="mx-auto flex min-h-[72px] max-w-[1200px] items-center justify-between gap-6">
          <div className="flex items-center gap-[18px]">
            <Link href="/" className="flex h-11 items-center gap-1.5 text-[16px] font-bold no-underline">
              <ChevronLeft size={22} strokeWidth={2} aria-hidden />
              Tableau de bord
            </Link>
            <span className="h-6 w-px bg-line" aria-hidden />
            <p className="m-0 text-[16px]">
              {props.section} · Question <strong>{props.position}</strong> sur {props.total}
            </p>
          </div>
          <div className="flex flex-[0_1_360px] items-center gap-3">
            <Track valeur={props.avancement} hauteur={8} className="flex-1" />
            {props.score && <span className="tnum text-[14px] whitespace-nowrap text-ink-2">{props.score}</span>}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-[18px] pb-[110px] lg:px-10 lg:pt-10 lg:pb-16">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
          <article
            data-testid="question"
            data-question-id={q.id}
            aria-labelledby="enonce"
            className="flex min-w-0 flex-col gap-[18px] lg:flex-[999_1_520px] lg:gap-[22px]"
          >
            <div className="flex flex-wrap items-center gap-2 lg:gap-2.5">
              <NiveauTag niveau={q.niveau} />
              <span className="text-[14px] text-ink-2 lg:text-[15px]">
                Chapitre {q.chapitre} · {q.theme}
              </span>
            </div>
            <h1 id="enonce" data-testid="enonce" className="m-0 text-[21px] leading-[1.35] font-bold lg:max-w-[30ch] lg:text-[28px] lg:leading-[1.3]">
              {q.question}
            </h1>
            <div role="group" aria-label="Choix de réponse" className="flex flex-col gap-2.5 lg:gap-3">
              {q.choix.map((texte, i) => {
                const e = etat(i);
                return (
                  <button
                    key={i}
                    type="button"
                    className="choice"
                    data-testid={`choix-${i}`}
                    data-etat={e}
                    data-choisi={choix === i}
                    aria-pressed={choix === i}
                    aria-disabled={valide || undefined}
                    onClick={() => !valide && setChoix(i)}
                  >
                    <span className="letter" aria-hidden>
                      {LETTRES[i]}
                    </span>
                    <span className="body">
                      <span>
                        <span className="sr-only">Réponse {LETTRES[i]} : </span>
                        <span className={`marker ${e === "correct" ? "marker-on" : ""}`} data-testid={e === "correct" ? "surligneur" : undefined}>
                          {texte}
                        </span>
                      </span>
                      {e === "correct" && (
                        <span className="flex items-center gap-1.5 text-[13px] font-bold lg:text-[14px]">
                          <Check size={16} strokeWidth={2.4} aria-hidden />
                          {choix === i ? "Bonne réponse · votre choix" : "Bonne réponse"}
                        </span>
                      )}
                      {e === "faux" && (
                        <span className="flex items-center gap-1.5 text-[13px] font-bold">
                          <X size={16} strokeWidth={2.4} aria-hidden />
                          Votre réponse
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </article>

          <aside aria-label="Correction" className="flex min-w-0 flex-col gap-4 lg:flex-[1_1_340px]">
            <section
              className={`flex flex-col gap-2.5 lg:gap-3 lg:rounded-2xl lg:border lg:border-line lg:bg-surface lg:p-[22px] lg:shadow-action ${
                valide ? "rounded-2xl border border-line bg-surface p-4" : ""
              }`}
            >
              <div aria-live="polite" className="flex flex-col gap-2.5 lg:gap-3">
                {valide ? (
                  <>
                    <p data-testid="verdict" className={`m-0 text-[16px] font-bold lg:text-[17px] ${juste ? "text-ink" : "text-pen-text"}`}>
                      {verdict}
                    </p>
                    <h2 className="m-0 flex items-center gap-2 text-[15px] font-bold">
                      <Pencil size={18} strokeWidth={2} color="var(--pen)" aria-hidden />
                      Explication
                    </h2>
                    <p data-testid="explication" className="m-0 text-[16px] leading-[1.55] lg:leading-[1.6]">
                      {q.explication}
                    </p>
                    <p data-testid="source" className="m-0 text-[13px] text-ink-2">
                      Source : {q.source}
                    </p>
                  </>
                ) : (
                  <p className="m-0 hidden text-[16px] leading-normal text-ink-2 lg:block">Choisissez une réponse, puis validez pour voir la correction.</p>
                )}
              </div>
              <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface px-4 pt-3 pb-[22px] lg:static lg:z-auto lg:mt-1.5 lg:border-0 lg:bg-transparent lg:p-0">
                <button
                  type="button"
                  data-testid="action-principale"
                  className={`${BTN_PRIMAIRE} lg:h-[50px] lg:text-[16px]`}
                  disabled={!valide && choix === null}
                  onClick={action}
                >
                  {valide ? (
                    <>
                      {props.libelleSuivante ?? "Question suivante"}
                      <ChevronRight size={20} strokeWidth={2} aria-hidden />
                    </>
                  ) : (
                    "Valider"
                  )}
                </button>
              </div>
            </section>
            {props.onPrecedente && (
              <button
                type="button"
                onClick={props.onPrecedente}
                data-natif
                className="flex h-11 items-center gap-1.5 self-start border-0 bg-transparent px-1 text-[15px] font-bold text-ink underline underline-offset-[3px]"
              >
                <ChevronLeft size={18} strokeWidth={2} aria-hidden />
                Question précédente
              </button>
            )}
            <p className="m-0 hidden flex-wrap items-center gap-1.5 px-1 text-[14px] text-ink-2 lg:flex">
              Raccourcis : <kbd>1</kbd>–<kbd>4</kbd> pour choisir, <kbd>Entrée</kbd> pour valider puis passer à la suite
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}

const RETOUR = "-ml-1.5 flex h-11 items-center gap-1.5 border-0 bg-transparent px-1.5 text-[16px] font-bold text-ink no-underline cursor-pointer";
