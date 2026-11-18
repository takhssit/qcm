"use client";

import { Check, ChevronLeft, ChevronRight, Flag, ListChecks, Timer, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppFrame, Page } from "@/components/AppFrame";
import { Correction } from "@/components/Correction";
import { useExamenEnCours, useProgression } from "@/components/store";
import { BTN_PRIMAIRE, BTN_SECONDAIRE, Chargement, NiveauTag, Panel, Track } from "@/components/ui";
import { NIVEAUX, questionParId } from "@/lib/bank";
import { DUREE_EXAMEN_SEC, corrigerExamen, erreursExamen, formatChrono, nouvelExamen, prioritesChapitres, tempsRestantSec } from "@/lib/exam";
import {
  ecrireExamenEnCours,
  enregistrerReponse,
  lireExamenEnCours,
  modifierProgression,
  type ExamenEnCours,
  type ExamenTermine,
} from "@/lib/progress";
import { formatDateLongue, formatDuree, formatNote, noteExamen } from "@/lib/stats";

const LETTRES = ["A", "B", "C", "D"];
const MSG_QUITTER = "Quitter l'examen blanc ? Votre épreuve est sauvegardée : vous pourrez la reprendre là où vous en êtes.";

function maj(f: (e: ExamenEnCours) => ExamenEnCours) {
  const e = lireExamenEnCours();
  if (e) ecrireExamenEnCours(f(e));
}

function demarrer() {
  ecrireExamenEnCours(nouvelExamen(Date.now()));
}

export function Examen() {
  const exam = useExamenEnCours();
  const p = useProgression();
  const params = useSearchParams();
  const router = useRouter();
  const [resultat, setResultat] = useState<number | null>(null); // index dans p.examens
  const [correction, setCorrection] = useState(false);
  const auto = useRef(false);

  // /examen?lancer=1 (bouton « Lancer un examen blanc ») : démarre directement
  useEffect(() => {
    if (exam !== null || auto.current) return;
    auto.current = true;
    if (params.get("lancer") === "1") {
      demarrer();
      router.replace("/examen");
    }
  }, [exam, params, router]);

  if (exam === undefined || !p) return <Chargement />;
  if (exam) return <Epreuve exam={exam} onTermine={(i) => setResultat(i)} />;

  if (resultat !== null && p.examens[resultat]) {
    const e = p.examens[resultat];
    if (correction) {
      return (
        <Correction
          items={erreursExamen(e)}
          section="Correction"
          onFermer={() => setCorrection(false)}
          libelleFermer="Retour au résultat"
        />
      );
    }
    return (
      <Resultat
        e={e}
        precedents={p.examens.slice(0, resultat)}
        onCorrection={() => setCorrection(true)}
        onNouvel={() => {
          setResultat(null);
          demarrer();
        }}
      />
    );
  }

  const dernier = p.examens.length ? p.examens[p.examens.length - 1] : null;
  return (
    <AppFrame>
      <Page titre="Examen blanc" sousTitre="40 questions · 40 minutes · correction à la fin" testid="examen-accueil">
        <Panel ombre className="flex flex-col gap-4 p-[18px] lg:max-w-[720px] lg:p-[22px]">
          <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[16px] leading-normal">
            {[
              "12 questions faciles, 16 moyennes et 12 difficiles, tirées au hasard.",
              "Chronomètre de 40 minutes : l'épreuve est remise automatiquement à 00:00.",
              "Aucune correction avant la remise. Une question sans réponse compte comme fausse.",
              "Votre épreuve est sauvegardée : vous pouvez recharger la page sans rien perdre.",
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <Check size={20} strokeWidth={2.2} className="mt-0.5 shrink-0" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
          <button type="button" data-testid="commencer-examen" className={BTN_PRIMAIRE} onClick={demarrer}>
            <Timer size={20} strokeWidth={2} aria-hidden />
            Commencer l&apos;examen blanc
          </button>
        </Panel>
        {dernier && (
          <Panel className="flex flex-col items-start gap-2 p-[18px] lg:max-w-[720px] lg:p-[22px]">
            <h2 className="m-0 text-[17px] font-bold">Dernier examen blanc</h2>
            <p className="tnum m-0 text-[26px] font-bold">
              <span className="hl hl-note">{formatNote(noteExamen(dernier))}</span> sur 20
            </p>
            <p className="m-0 text-[15px] text-ink-2">
              {formatDateLongue(new Date(dernier.date))} · {dernier.bonnes} bonnes réponses sur 40
            </p>
            <button
              type="button"
              data-testid="voir-dernier-resultat"
              className="flex h-11 cursor-pointer items-center border-0 bg-transparent p-0 text-[15px] font-bold text-ink underline underline-offset-[3px]"
              onClick={() => setResultat(p.examens.length - 1)}
            >
              Voir le résultat détaillé
            </button>
          </Panel>
        )}
      </Page>
    </AppFrame>
  );
}

/* ------------------------------------------------------------------ */

function Epreuve({ exam, onTermine }: { exam: ExamenEnCours; onTermine: (index: number) => void }) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const dialogue = useRef<HTMLDialogElement>(null);
  const restant = tempsRestantSec(exam, now);
  const i = exam.index;
  const q = questionParId(exam.ids[i])!;
  const repondues = exam.reponses.filter((r) => r !== null).length;
  const marquees = exam.marques.filter(Boolean).length;
  const sansReponse = exam.ids.length - repondues;

  const terminer = useCallback(() => {
    const e = lireExamenEnCours();
    if (!e) return;
    const fin = Math.min(Date.now(), e.debut + DUREE_EXAMEN_SEC * 1000);
    const res = corrigerExamen(e, fin);
    let index = 0;
    modifierProgression((p) => {
      let x = p;
      const date = new Date(fin);
      res.reponses.forEach((r) => {
        const question = questionParId(r.id);
        if (question && r.choix !== null) x = enregistrerReponse(x, question, r.choix, date);
      });
      index = x.examens.length;
      return { ...x, examens: [...x.examens, res] };
    });
    onTermine(index);
    ecrireExamenEnCours(null);
  }, [onTermine]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    const avantDepart = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avantDepart);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("beforeunload", avantDepart);
    };
  }, []);

  useEffect(() => {
    if (restant <= 0) terminer();
  }, [restant, terminer]);

  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || dialogue.current?.open) return;
      const k = e.key.toLowerCase();
      const idx = ["1", "2", "3", "4"].includes(k) ? Number(k) - 1 : ["a", "b", "c", "d"].indexOf(k);
      if (idx >= 0) maj((x) => ({ ...x, reponses: x.reponses.map((r, j) => (j === x.index ? idx : r)) }));
    }
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, []);

  const aller = (n: number) => maj((x) => ({ ...x, index: Math.max(0, Math.min(x.ids.length - 1, n)) }));
  const mm = Math.floor(restant / 60);
  const ss = restant % 60;

  return (
    <AppFrame>
      <div data-testid="epreuve" className="flex min-h-[calc(100dvh-76px)] flex-col lg:min-h-dvh">
        <header className="border-b border-line bg-surface px-4 pt-2.5 pb-4 lg:px-12">
          <div className="mx-auto flex max-w-[880px] flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Quitter l'examen"
                className="-ml-2.5 flex size-11 cursor-pointer items-center justify-center border-0 bg-transparent text-ink"
                onClick={() => window.confirm(MSG_QUITTER) && router.push("/")}
              >
                <X size={22} strokeWidth={2} aria-hidden />
              </button>
              <p className="m-0 text-[16px] font-bold">Examen blanc</p>
              <p
                role="timer"
                data-testid="chrono"
                aria-label={`Temps restant ${mm} minutes ${ss} secondes`}
                className="tnum m-0 flex h-9 items-center gap-1.5 rounded-full bg-ink px-3 text-[16px] font-bold text-white"
              >
                <Timer size={16} strokeWidth={2} aria-hidden />
                <span aria-hidden>{formatChrono(restant)}</span>
              </p>
            </div>
            <div className="flex items-baseline justify-between">
              <p data-testid="position-examen" className="m-0 text-[16px]">
                Question <strong>{i + 1}</strong> sur {exam.ids.length}
              </p>
              <p data-testid="compteurs-examen" className="m-0 text-[13px] text-ink-2">
                {repondues} {repondues > 1 ? "répondues" : "répondue"} · {marquees} {marquees > 1 ? "marquées" : "marquée"}
              </p>
            </div>
            <nav aria-label="Grille des questions" className="grid grid-cols-20 gap-1">
              {exam.ids.map((id, j) => {
                const etat = j === i ? "en-cours" : exam.marques[j] ? "a-revoir" : exam.reponses[j] !== null ? "repondue" : "a-faire";
                return (
                  <button
                    key={id}
                    type="button"
                    data-testid={`case-${j}`}
                    data-etat={etat}
                    data-petite-cible
                    aria-current={j === i ? "step" : undefined}
                    aria-label={`Question ${j + 1}, ${{ "en-cours": "en cours", "a-revoir": "à revoir", repondue: "répondue", "a-faire": "à faire" }[etat]}`}
                    onClick={() => aller(j)}
                    className={`h-3.5 cursor-pointer rounded-[3px] border-0 p-0 ${
                      {
                        "en-cours": "bg-surface shadow-[inset_0_0_0_2px_var(--ink)]",
                        "a-revoir": "bg-marker shadow-[inset_0_0_0_1.5px_var(--ink)]",
                        repondue: "bg-ink",
                        "a-faire": "bg-line",
                      }[etat]
                    }`}
                  />
                );
              })}
            </nav>
            <div className="flex gap-3.5 text-[12px] text-ink-2" aria-hidden>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-[3px] bg-ink" />
                Répondue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-[3px] bg-marker shadow-[inset_0_0_0_1.5px_var(--ink)]" />À revoir
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-[3px] bg-line" />À faire
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pt-5 pb-[110px] lg:px-12 lg:pb-10">
          <div className="mx-auto flex max-w-[880px] flex-col gap-[18px]">
            <h1 data-testid="enonce" data-question-id={q.id} className="m-0 text-[21px] leading-[1.35] font-bold lg:text-[26px]">
              {q.question}
            </h1>
            <div role="group" aria-label="Choix de réponse" className="flex flex-col gap-2.5">
              {q.choix.map((texte, j) => {
                const on = exam.reponses[i] === j;
                return (
                  <button
                    key={j}
                    type="button"
                    className="choice"
                    data-testid={`choix-${j}`}
                    data-etat={on ? "choisi" : "repos"}
                    aria-pressed={on}
                    onClick={() => maj((x) => ({ ...x, reponses: x.reponses.map((r, k) => (k === x.index ? j : r)) }))}
                  >
                    <span className="letter" aria-hidden>
                      {LETTRES[j]}
                    </span>
                    <span className="body">
                      <span>
                        <span className="sr-only">Réponse {LETTRES[j]} : </span>
                        {texte}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                data-testid="marquer"
                aria-pressed={exam.marques[i]}
                onClick={() => maj((x) => ({ ...x, marques: x.marques.map((m, k) => (k === x.index ? !m : m)) }))}
                className={`flex h-11 cursor-pointer items-center gap-2 rounded-xl border-[1.5px] px-3.5 text-[15px] font-bold text-ink ${
                  exam.marques[i] ? "border-ink bg-marker" : "border-line-choice bg-surface"
                }`}
              >
                <Flag size={18} strokeWidth={2} aria-hidden />
                {exam.marques[i] ? "Marquée pour revoir" : "Marquer pour revoir"}
              </button>
              <p className="m-0 text-right text-[13px] text-ink-2">Correction à la fin de l&apos;épreuve</p>
            </div>
            <button
              type="button"
              data-testid="terminer"
              onClick={() => dialogue.current?.showModal()}
              className="flex h-11 cursor-pointer items-center gap-2 self-start border-0 bg-transparent p-0 text-[15px] font-bold text-ink underline underline-offset-[3px]"
            >
              <ListChecks size={18} strokeWidth={2} aria-hidden />
              Terminer l&apos;épreuve
            </button>
          </div>
        </main>

        <div className="fixed inset-x-0 bottom-[76px] z-20 border-t border-line bg-surface px-4 pt-3 pb-3.5 lg:sticky lg:bottom-0 lg:px-12 lg:pb-5">
          <div className="mx-auto grid max-w-[880px] grid-cols-2 gap-2.5">
            <button type="button" data-testid="precedente" className={BTN_SECONDAIRE} disabled={i === 0} onClick={() => aller(i - 1)}>
              <ChevronLeft size={20} strokeWidth={2} aria-hidden />
              Précédente
            </button>
            {i < exam.ids.length - 1 ? (
              <button type="button" data-testid="suivante" className={BTN_PRIMAIRE} onClick={() => aller(i + 1)}>
                Suivante
                <ChevronRight size={20} strokeWidth={2} aria-hidden />
              </button>
            ) : (
              <button type="button" data-testid="suivante" className={BTN_PRIMAIRE} onClick={() => dialogue.current?.showModal()}>
                Terminer
              </button>
            )}
          </div>
        </div>

        <dialog
          ref={dialogue}
          aria-labelledby="dlg-titre"
          data-testid="dialogue-remise"
          className="m-auto w-[calc(100%-32px)] max-w-[440px] rounded-2xl border border-line bg-surface p-[22px] text-ink"
        >
          <h2 id="dlg-titre" className="m-0 text-[20px] font-bold">
            Terminer l&apos;épreuve ?
          </h2>
          <p data-testid="sans-reponse" className="mt-2.5 mb-5 text-[16px] leading-normal">
            {sansReponse === 0
              ? "Toutes les questions ont une réponse."
              : `${sansReponse} ${sansReponse > 1 ? "questions sans réponse : elles compteront" : "question sans réponse : elle comptera"} comme ${sansReponse > 1 ? "fausses" : "fausse"}.`}
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              data-testid="confirmer-remise"
              className={BTN_PRIMAIRE}
              onClick={() => {
                dialogue.current?.close();
                terminer();
              }}
            >
              Terminer et voir ma note
            </button>
            <button type="button" className={BTN_SECONDAIRE} onClick={() => dialogue.current?.close()}>
              Continuer l&apos;épreuve
            </button>
          </div>
        </dialog>
      </div>
    </AppFrame>
  );
}

/* ------------------------------------------------------------------ */

function Resultat({
  e,
  precedents,
  onCorrection,
  onNouvel,
}: {
  e: ExamenTermine;
  precedents: ExamenTermine[];
  onCorrection: () => void;
  onNouvel: () => void;
}) {
  const note = noteExamen(e);
  const meilleure = precedents.length ? Math.max(...precedents.map(noteExamen)) : null;
  const precedent = precedents.length ? noteExamen(precedents[precedents.length - 1]) : null;
  let comparaison = "C'est votre premier examen blanc.";
  if (meilleure !== null && precedent !== null) {
    if (note > meilleure) comparaison = `C'est votre meilleure note : le précédent examen blanc était à ${formatNote(precedent)}.`;
    else if (note === meilleure) comparaison = "Vous égalez votre meilleure note.";
    else comparaison = `Votre meilleure note reste ${formatNote(meilleure)} sur 20.`;
  }
  const erreurs = erreursExamen(e);
  const priorites = prioritesChapitres(e);

  return (
    <AppFrame>
      <Page
        titre="Examen blanc terminé"
        sousTitre={`${formatDateLongue(new Date(e.date), true)} · ${e.total} questions · ${formatDuree(e.dureeSec)}`}
        testid="resultat"
      >
        <div className="flex flex-col gap-[22px] lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-5">
          <div className="flex flex-col gap-[22px]">
            <Panel ombre className="flex flex-col gap-2 p-[18px] lg:p-[22px]" aria-labelledby="note">
              <h2 id="note" data-testid="note" className="tnum m-0 text-[34px] leading-[1.15] font-bold">
                <span className="hl hl-note">{formatNote(note)}</span> sur 20
              </h2>
              <p className="m-0 text-[16px] leading-normal">
                <span data-testid="bonnes">
                  {e.bonnes} {e.bonnes > 1 ? "bonnes réponses" : "bonne réponse"} sur {e.total}.
                </span>{" "}
                {comparaison}
              </p>
            </Panel>
            <section aria-labelledby="r-niveaux" className="flex flex-col gap-2.5">
              <h2 id="r-niveaux" className="m-0 text-[17px] font-bold">
                Par niveau
              </h2>
              <div className="rounded-2xl border border-line bg-surface px-4 py-1">
                {NIVEAUX.map((n) => {
                  const s = e.parNiveau[n];
                  return (
                    <div key={n} data-testid={`res-${n}`} className="flex flex-col gap-2 border-b border-line-2 py-3 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <NiveauTag niveau={n} />
                        <span className="tnum text-[15px] font-bold">
                          {s.bonnes} / {s.total}
                        </span>
                      </div>
                      <Track valeur={s.total ? s.bonnes / s.total : 0} />
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
          <div className="flex flex-col gap-[22px]">
            <section aria-labelledby="r-priorites" className="flex flex-col gap-2.5">
              <h2 id="r-priorites" className="m-0 text-[17px] font-bold">
                À retravailler en priorité
              </h2>
              <ul className="m-0 list-none rounded-2xl border border-line bg-surface p-0">
                {priorites.map((c) => (
                  <li key={c.num} className="border-b border-line-2 last:border-b-0">
                    <Link href={`/entrainement?chapitre=${c.num}`} className="flex min-h-14 items-center justify-between gap-3 px-4 py-2.5 no-underline">
                      <span className="flex flex-col gap-0.5">
                        <span className="text-[15px] font-bold">
                          {c.num} · {c.theme}
                        </span>
                        <span className="text-[13px] text-pen-text">
                          {c.bonnes} {c.bonnes > 1 ? "bonnes réponses" : "bonne réponse"} sur {c.total}
                        </span>
                      </span>
                      <ChevronRight size={20} strokeWidth={2} aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
            <div className="flex flex-col gap-2.5">
              {erreurs.length > 0 && (
                <button type="button" data-testid="revoir-erreurs-examen" className={BTN_PRIMAIRE} onClick={onCorrection}>
                  Revoir mes {erreurs.length} {erreurs.length > 1 ? "erreurs" : "erreur"}
                </button>
              )}
              <button type="button" data-testid="nouvel-examen" className={BTN_SECONDAIRE} onClick={onNouvel}>
                Nouvel examen blanc
              </button>
            </div>
          </div>
        </div>
      </Page>
    </AppFrame>
  );
}
