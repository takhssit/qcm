"use client";

import { Check, Play } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppFrame, Page } from "@/components/AppFrame";
import { Serie } from "@/components/Serie";
import { useProgression } from "@/components/store";
import { BTN_PRIMAIRE, COULEUR_NIVEAU, Chargement } from "@/components/ui";
import { LIBELLE_COURT, LIBELLE_NIVEAU, NIVEAUX, chapitres, filtrerQuestions, questions, type Question } from "@/lib/bank";
import { modifierProgression, type FiltresEntrainement } from "@/lib/progress";
import { tirer } from "@/lib/shuffle";

const TOUS_CHAPITRES = chapitres.map((c) => c.num);
const DEFAUT: FiltresEntrainement = { niveaux: [...NIVEAUX], chapitres: TOUS_CHAPITRES, nombre: 20 };

const enregistrer = (f: FiltresEntrainement) => modifierProgression((p) => ({ ...p, filtresEntrainement: f }));
const basculer = <T,>(liste: T[], x: T) => (liste.includes(x) ? liste.filter((y) => y !== x) : [...liste, x]);

export function Entrainement() {
  const p = useProgression();
  const params = useSearchParams();
  const [serie, setSerie] = useState<Question[] | null>(null);
  const prefiltre = useRef(false);

  // /entrainement?chapitre=3 : pré-filtre sur ce chapitre
  useEffect(() => {
    if (!p || prefiltre.current) return;
    prefiltre.current = true;
    const n = Number(params.get("chapitre"));
    if (TOUS_CHAPITRES.includes(n)) {
      const f = p.filtresEntrainement ?? DEFAUT;
      enregistrer({ ...f, niveaux: f.niveaux.length ? f.niveaux : [...NIVEAUX], chapitres: [n] });
    }
  }, [p, params]);

  if (!p) return <Chargement />;
  const f = p.filtresEntrainement ?? DEFAUT;
  const correspondantes = filtrerQuestions(f.niveaux, f.chapitres);
  const n = correspondantes.length;
  const aLancer = Math.min(f.nombre, n);
  const lancer = () => setSerie(tirer(correspondantes, aLancer));

  if (serie) {
    return <Serie key={serie.map((q) => q.id).join()} questions={serie} section="Entraînement" onQuitter={() => setSerie(null)} onNouvelleSerie={lancer} />;
  }

  const tousChapitres = f.chapitres.length === TOUS_CHAPITRES.length;
  return (
    <AppFrame>
      <Page titre="Entraînement" sousTitre="Composez une série sur mesure, en ordre aléatoire" testid="filtres">
        <section aria-labelledby="f-niveaux" className="flex flex-col gap-2.5">
          <h2 id="f-niveaux" className="m-0 text-[17px] font-bold">
            Niveaux
          </h2>
          <div className="grid grid-cols-3 gap-2 lg:max-w-[720px]">
            {NIVEAUX.map((niv) => {
              const on = f.niveaux.includes(niv);
              return (
                <button
                  key={niv}
                  type="button"
                  aria-pressed={on}
                  data-testid={`niveau-${niv}`}
                  onClick={() => enregistrer({ ...f, niveaux: basculer(f.niveaux, niv) })}
                  className={`flex h-16 cursor-pointer flex-col items-start justify-center gap-1 rounded-xl bg-surface px-3 ${
                    on ? "border-2 border-ink text-ink" : "border-[1.5px] border-line-choice text-ink-2"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[15px] font-bold">
                    <span
                      aria-hidden
                      className={`size-2.5 rounded-[3px] border ${on ? "border-ink" : "border-ink-2"}`}
                      style={{ background: COULEUR_NIVEAU[niv] }}
                    />
                    {LIBELLE_NIVEAU[niv]}
                  </span>
                  <span className="text-[13px] text-ink-2">{questions.filter((q) => q.niveau === niv).length} questions</span>
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="f-chapitres" className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <h2 id="f-chapitres" className="m-0 text-[17px] font-bold">
              Chapitres{" "}
              <span data-testid="compteur-chapitres" className="text-[15px] font-normal text-ink-2">
                · {f.chapitres.length} sur 12
              </span>
            </h2>
            <button
              type="button"
              onClick={() => enregistrer({ ...f, chapitres: tousChapitres ? [] : TOUS_CHAPITRES })}
              className="min-h-11 cursor-pointer border-0 bg-transparent py-2.5 text-[15px] font-bold text-ink underline underline-offset-[3px]"
            >
              {tousChapitres ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {chapitres.map((c) => {
              const on = f.chapitres.includes(c.num);
              return (
                <button
                  key={c.num}
                  type="button"
                  aria-pressed={on}
                  data-testid={`chapitre-${c.num}`}
                  onClick={() => enregistrer({ ...f, chapitres: basculer(f.chapitres, c.num).sort((a, b) => a - b) })}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-[1.5px] px-3 py-1 text-left text-[14px] ${
                    on ? "border-ink bg-ink font-bold text-white" : "border-line-choice bg-surface text-ink"
                  }`}
                >
                  {on && <Check size={16} strokeWidth={2.6} className="shrink-0" aria-hidden />}
                  <span>
                    {c.num} · {LIBELLE_COURT[c.num]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="f-nombre" className="flex flex-col gap-2.5">
          <h2 id="f-nombre" className="m-0 text-[17px] font-bold">
            Nombre de questions
          </h2>
          <div role="group" aria-labelledby="f-nombre" className="grid grid-cols-3 gap-1 rounded-[13px] bg-line-2 p-1 lg:max-w-[480px]">
            {([10, 20, 40] as const).map((nb) => (
              <button
                key={nb}
                type="button"
                aria-pressed={f.nombre === nb}
                data-testid={`nombre-${nb}`}
                onClick={() => enregistrer({ ...f, nombre: nb })}
                className={`h-11 cursor-pointer rounded-[10px] border-0 text-[16px] font-bold ${
                  f.nombre === nb ? "bg-surface text-ink shadow-[0_1px_3px_rgba(23,32,65,.18)]" : "bg-transparent text-ink-2"
                }`}
              >
                {nb}
              </button>
            ))}
          </div>
        </section>

        <div className="h-[170px] lg:hidden" aria-hidden />
        <div className="fixed inset-x-0 bottom-[76px] z-20 flex flex-col gap-2.5 border-t border-line bg-surface px-4 pt-3 pb-3.5 lg:static lg:max-w-[480px] lg:rounded-2xl lg:border lg:p-[22px] lg:shadow-action">
          <p data-testid="compteur" aria-live="polite" className="m-0 text-[14px] text-ink-2">
            <strong className="text-ink">
              {n} {n > 1 ? "questions" : "question"}
            </strong>{" "}
            {n > 1 ? "correspondent" : "correspond"} à votre sélection
          </p>
          <button type="button" data-testid="lancer" className={BTN_PRIMAIRE} disabled={n === 0} onClick={lancer}>
            <Play size={18} fill="currentColor" strokeWidth={0} aria-hidden />
            Lancer {aLancer} {aLancer > 1 ? "questions" : "question"}
          </button>
        </div>
      </Page>
    </AppFrame>
  );
}
