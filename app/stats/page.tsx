"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AppFrame, Page } from "@/components/AppFrame";
import { useAujourdhui, useProgression } from "@/components/store";
import { themeCompact } from "@/lib/bank";
import { BTN_PRIMAIRE, BTN_SECONDAIRE, Chargement, Track } from "@/components/ui";
import {
  ecrireProgression,
  exporterProgression,
  importerProgression,
  nomFichierExport,
  reinitialiserTout,
  type Progression,
} from "@/lib/progress";
import {
  estFaible,
  formatEntier,
  formatJourMois,
  formatNote,
  formatTaux,
  joursAffilee,
  noteExamen,
  septDerniersJours,
  tauxParChapitre,
  totalReponses,
} from "@/lib/stats";

export default function StatsPage() {
  const p = useProgression();
  const auj = useAujourdhui();
  const dlgImport = useRef<HTMLDialogElement>(null);
  const dlgReset = useRef<HTMLDialogElement>(null);
  const fichier = useRef<HTMLInputElement>(null);
  const [aImporter, setAImporter] = useState<Progression | null>(null);
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null);
  if (!p || !auj) return <Chargement />;

  const total = totalReponses(p);
  const affilee = joursAffilee(p.jours, auj);
  const jours = septDerniersJours(p.jours, auj);
  const chapitres = tauxParChapitre(p);
  const examens = [...p.examens].reverse();
  const meilleure = examens.length ? Math.max(...examens.map(noteExamen)) : null;

  const exporter = () => {
    const url = URL.createObjectURL(new Blob([exporterProgression(p)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = nomFichierExport(new Date());
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const choisirFichier = async (f: File | undefined) => {
    if (!f) return;
    const prog = importerProgression(await f.text());
    if (fichier.current) fichier.current.value = "";
    if (!prog) {
      setMessage({ texte: "Ce fichier n'est pas une progression valide : rien n'a été modifié.", erreur: true });
      return;
    }
    setAImporter(prog);
    dlgImport.current?.showModal();
  };

  return (
    <AppFrame>
      <Page
        titre="Statistiques"
        sousTitre={total ? `${formatEntier(total)} ${total > 1 ? "réponses" : "réponse"} depuis le ${formatJourMois(new Date(p.debut))}` : "Aucune réponse pour le moment"}
        testid="stats"
      >
        <div className="flex flex-col gap-[22px] lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:grid-rows-[auto_auto_1fr] lg:items-start lg:gap-5">
            <section aria-labelledby="s-regularite" className="flex flex-col gap-2.5 lg:col-start-2 lg:row-start-1">
              <h2 id="s-regularite" className="m-0 text-[17px] font-bold">
                Régularité{" "}
                <span data-testid="affilee" className="text-[15px] font-normal text-ink-2">
                  · {affilee} {affilee > 1 ? "jours" : "jour"} d&apos;affilée
                </span>
              </h2>
              <ol aria-label="Sept derniers jours" className="m-0 grid list-none grid-cols-7 gap-1.5 p-0">
                {jours.map((j) => (
                  <li
                    key={j.cle}
                    data-testid={`jour-${j.cle}`}
                    className={`flex h-10 flex-col items-center justify-center gap-0.5 rounded-[10px] text-[12px] leading-none ${
                      j.aujourdhui ? "bg-ink font-bold text-white" : j.nombre ? "bg-marker font-bold" : "border border-line bg-surface text-ink-2"
                    }`}
                  >
                    {j.libelle}
                    <span className="tnum">
                      {j.nombre ? j.nombre : <span aria-label="aucune réponse">–</span>}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="m-0 text-[13px] text-ink-2">Nombre de questions travaillées par jour</p>
            </section>
          <section aria-labelledby="s-chapitres" className="flex flex-col gap-1.5 lg:col-start-1 lg:row-span-3 lg:row-start-1">
            <h2 id="s-chapitres" className="m-0 text-[17px] font-bold">
              Réussite par chapitre
            </h2>
            <div className="rounded-2xl border border-line bg-surface px-4 pt-1 pb-2">
              {chapitres.map((c) => (
                <Link
                  key={c.num}
                  href={`/entrainement?chapitre=${c.num}`}
                  data-testid={`stat-chapitre-${c.num}`}
                  className="grid grid-cols-[minmax(0,1fr)_48px] items-center gap-x-3 gap-y-1.5 border-b border-line-2 py-[9px] text-ink no-underline last:border-b-0"
                >
                  <span className="text-[14px]">
                    {c.num} · {themeCompact(c.theme)}
                  </span>
                  <span className={`tnum text-right text-[14px] font-bold ${estFaible(c.taux) ? "text-pen-text" : ""}`}>{formatTaux(c.taux)}</span>
                  <Track valeur={c.taux ?? 0} className="col-span-2" />
                </Link>
              ))}
            </div>
          </section>
            <section aria-labelledby="s-examens" className="flex flex-col gap-2.5 lg:col-start-2 lg:row-start-2">
              <h2 id="s-examens" className="m-0 text-[17px] font-bold">
                Examens blancs
              </h2>
              {examens.length ? (
                <ul data-testid="historique-examens" className="m-0 list-none rounded-2xl border border-line bg-surface px-4 py-0">
                  {examens.map((e) => {
                    const n = noteExamen(e);
                    return (
                      <li key={e.date} className="flex justify-between border-b border-line-2 py-[13px] text-[15px] last:border-b-0">
                        <span>{formatJourMois(new Date(e.date))}</span>
                        <strong className="tnum">
                          <span className={n === meilleure ? "hl" : undefined}>{formatNote(n)}</span> / 20
                        </strong>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="m-0 rounded-2xl border border-line bg-surface px-4 py-[13px] text-[15px] text-ink-2">
                  Aucun examen blanc pour le moment.{" "}
                  <Link href="/examen" className="font-bold text-ink">
                    Passer un examen blanc
                  </Link>
                </p>
              )}
            </section>
            <section aria-label="Sauvegarde de la progression" className="flex flex-col gap-2.5 lg:col-start-2 lg:row-start-3">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  data-testid="exporter"
                  onClick={exporter}
                  className="h-11 cursor-pointer rounded-xl border-[1.5px] border-ink bg-surface px-3.5 text-[15px] font-bold text-ink"
                >
                  Exporter ma progression
                </button>
                <button
                  type="button"
                  data-testid="reinitialiser"
                  onClick={() => dlgReset.current?.showModal()}
                  className="h-11 cursor-pointer border-0 bg-transparent px-1 text-[15px] font-bold text-pen-text underline underline-offset-[3px]"
                >
                  Réinitialiser
                </button>
              </div>
              <button
                type="button"
                data-testid="importer"
                onClick={() => fichier.current?.click()}
                className="h-11 cursor-pointer self-start border-0 bg-transparent px-1 text-[15px] font-bold text-ink underline underline-offset-[3px]"
              >
                Importer une progression
              </button>
              <input
                ref={fichier}
                type="file"
                accept="application/json,.json"
                data-testid="fichier-import"
                aria-label="Fichier de progression à importer"
                className="hidden"
                onChange={(e) => choisirFichier(e.target.files?.[0])}
              />
              <p role="status" data-testid="message-stats" className={`m-0 text-[14px] ${message?.erreur ? "text-pen-text" : "text-ink-2"}`}>
                {message?.texte}
              </p>
            </section>
        </div>

        <dialog ref={dlgImport} aria-labelledby="dlg-import" className="m-auto w-[calc(100%-32px)] max-w-[440px] rounded-2xl border border-line bg-surface p-[22px] text-ink">
          <h2 id="dlg-import" className="m-0 text-[20px] font-bold">
            Remplacer votre progression ?
          </h2>
          <p className="mt-2.5 mb-5 text-[16px] leading-normal">La progression de ce fichier remplacera celle enregistrée sur cet appareil.</p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              data-testid="confirmer-import"
              className={BTN_PRIMAIRE}
              onClick={() => {
                if (aImporter) ecrireProgression(aImporter);
                setAImporter(null);
                dlgImport.current?.close();
                setMessage({ texte: "Progression importée.", erreur: false });
              }}
            >
              Remplacer
            </button>
            <button type="button" className={BTN_SECONDAIRE} onClick={() => dlgImport.current?.close()}>
              Annuler
            </button>
          </div>
        </dialog>

        <dialog ref={dlgReset} aria-labelledby="dlg-reset" className="m-auto w-[calc(100%-32px)] max-w-[440px] rounded-2xl border border-line bg-surface p-[22px] text-ink">
          <h2 id="dlg-reset" className="m-0 text-[20px] font-bold">
            Réinitialiser votre progression ?
          </h2>
          <p className="mt-2.5 mb-5 text-[16px] leading-normal">
            Toutes vos réponses, vos erreurs à revoir et vos examens blancs seront effacés de cet appareil. Pensez à exporter votre progression avant.
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              data-testid="confirmer-reinitialiser"
              className="flex h-[52px] w-full cursor-pointer items-center justify-center rounded-xl border-0 bg-pen text-[17px] font-bold text-white"
              onClick={() => {
                reinitialiserTout();
                dlgReset.current?.close();
                setMessage({ texte: "Progression réinitialisée.", erreur: false });
              }}
            >
              Tout effacer
            </button>
            <button type="button" className={BTN_SECONDAIRE} onClick={() => dlgReset.current?.close()}>
              Annuler
            </button>
          </div>
        </dialog>
      </Page>
    </AppFrame>
  );
}
