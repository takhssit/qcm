"use client";

import { ChartNoAxesColumn, Play, Timer } from "lucide-react";
import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";
import { useAujourdhui, useProgression } from "@/components/store";
import { BTN_PRIMAIRE, Chargement, NiveauTag, Panel, Track } from "@/components/ui";
import { LIBELLE_NIVEAU, NIVEAUX, TOTAL, questionParId, questionParOrdre, questions, themeCompact, type Question } from "@/lib/bank";
import type { Progression } from "@/lib/progress";
import {
  estFaible,
  formatDateLongue,
  formatDerniereSeance,
  formatEntier,
  formatJoursAffilee,
  formatNote,
  formatTaux,
  joursAffilee,
  noteExamen,
  progressionGlobale,
  tauxParChapitre,
  tauxParNiveau,
} from "@/lib/stats";

function resume(p: Progression, auj: Date) {
  const front = p.parcours.derniereOrdre;
  const termine = front > TOTAL;
  const position = Math.min(Math.max(1, front), TOTAL);
  const debute = Object.keys(p.questions).length > 0 || front > 1;
  return {
    global: progressionGlobale(p),
    affilee: joursAffilee(p.jours, auj),
    termine,
    position,
    debute,
    courante: questionParOrdre(position) as Question,
    niveaux: tauxParNiveau(p),
    chapitres: tauxParChapitre(p),
  };
}

const pct = (x: number) => `${Math.round(x * 100)} %`;

export default function Accueil() {
  const p = useProgression();
  const auj = useAujourdhui();
  if (!p || !auj) return <Chargement />;
  const r = resume(p, auj);
  return (
    <AppFrame>
      <AccueilMobile p={p} r={r} />
      <TableauDeBord p={p} r={r} auj={auj} />
    </AppFrame>
  );
}

type R = ReturnType<typeof resume>;

function libelleBouton(r: R, desktop: boolean) {
  if (!r.debute) return "Commencer le parcours";
  if (r.termine) return "Voir le bilan du parcours";
  return desktop ? `Continuer à la question ${r.position}` : "Continuer";
}

/* ------------------------------ Mobile (maquette 01) ------------------------------ */

function AccueilMobile({ p, r }: { p: Progression; r: R }) {
  const q = r.courante;
  return (
    <div data-testid="accueil-mobile" className="lg:hidden">
      <header className="flex flex-col gap-[18px] bg-ink px-5 py-[22px] text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-[22px] leading-[1.2] font-bold">Pédagogie moderne</h1>
            <p className="m-0 text-[14px] text-on-ink-2">Concours de promotion interne · {TOTAL} questions</p>
          </div>
          <Link href="/stats" aria-label="Voir mes statistiques" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white!">
            <ChartNoAxesColumn size={20} strokeWidth={1.8} aria-hidden />
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <p data-testid="reussies" className="m-0 text-[16px]">
              <strong>{formatEntier(r.global.reussies)}</strong> questions réussies sur {TOTAL}
            </p>
            <p className="tnum m-0 text-[16px] font-bold">{pct(r.global.pourcentage)}</p>
          </div>
          <Track valeur={r.global.pourcentage} sombre label="Progression globale" />
          <p data-testid="affilee" className="m-0 text-[13px] text-on-ink-2">
            {formatJoursAffilee(r.affilee)}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-[22px] px-4 pt-4 pb-6">
        <Panel ombre aria-labelledby="m-reprendre" className="flex flex-col gap-3.5 p-[18px]">
          <div className="flex flex-col gap-2">
            <h2 id="m-reprendre" className="m-0 text-[18px] font-bold">
              Reprendre le parcours
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <NiveauTag niveau={q.niveau} />
              <span className="text-[14px] text-ink-2">
                Question {r.position} sur {TOTAL} · {themeCompact(q.theme)}
              </span>
            </div>
          </div>
          <Link href="/parcours" data-testid="bouton-parcours" className={BTN_PRIMAIRE}>
            <Play size={18} fill="currentColor" strokeWidth={0} aria-hidden />
            {libelleBouton(r, false)}
          </Link>
        </Panel>

        <section aria-labelledby="m-niveaux" className="flex flex-col gap-2.5">
          <h2 id="m-niveaux" className="m-0 text-[17px] font-bold">
            Par niveau
          </h2>
          <div className="flex flex-col rounded-2xl border border-line bg-surface">
            {NIVEAUX.map((n) => (
              <Link key={n} href="/entrainement" className="flex flex-col gap-[9px] border-b border-line-2 px-4 py-3.5 text-ink no-underline last:border-b-0">
                <span className="flex items-center justify-between">
                  <span className="flex items-center gap-2.5">
                    <NiveauTag niveau={n} />
                    <span className="text-[14px] text-ink-2">{questions.filter((q) => q.niveau === n).length} questions</span>
                  </span>
                  <span data-testid={`taux-${n}`} className="tnum text-[15px] font-bold">
                    {formatTaux(r.niveaux[n].taux)}
                  </span>
                </span>
                <Track valeur={r.niveaux[n].taux ?? 0} />
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="m-chapitres" className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <h2 id="m-chapitres" className="m-0 text-[17px] font-bold">
              Par chapitre
            </h2>
            <Link href="/stats" className="inline-flex min-h-11 items-center text-[15px] font-bold">
              Voir les 12
            </Link>
          </div>
          <div className="flex flex-col rounded-2xl border border-line bg-surface">
            {r.chapitres.slice(0, 3).map((c) => (
              <Link
                key={c.num}
                href={`/entrainement?chapitre=${c.num}`}
                className="flex flex-col gap-2 border-b border-line-2 px-4 py-[13px] text-ink no-underline last:border-b-0"
              >
                <span className="flex justify-between text-[15px]">
                  <span>
                    {c.num} · {themeCompact(c.theme)}
                  </span>
                  <span className={`tnum font-bold ${estFaible(c.taux) ? "text-pen-text" : ""}`}>{formatTaux(c.taux)}</span>
                </span>
                <Track valeur={c.taux ?? 0} />
              </Link>
            ))}
          </div>
        </section>
        {p.erreurs.length === 0 && r.debute && <p className="m-0 text-[14px] text-ink-2">Aucune erreur à revoir pour le moment.</p>}
      </div>
    </div>
  );
}

/* ------------------------------ Desktop (maquette 08) ------------------------------ */

function TableauDeBord({ p, r, auj }: { p: Progression; r: R; auj: Date }) {
  const q = r.courante;
  const erreurs = [...p.erreurs]
    .reverse()
    .map(questionParId)
    .filter((x): x is Question => !!x)
    .slice(0, 3);
  const dernier = p.examens.at(-1);
  return (
    <div data-testid="accueil-desktop" className="hidden px-12 pt-9 pb-14 lg:block">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-[30px] font-bold">Tableau de bord</h1>
            <p data-testid="affilee-desktop" className="m-0 text-[15px] text-ink-2">
              {formatDateLongue(auj)} · {formatJoursAffilee(r.affilee)}
            </p>
          </div>
          <Link
            href="/examen?lancer=1"
            className="flex h-[46px] items-center gap-2 rounded-xl border-[1.5px] border-ink px-[18px] text-[15px] font-bold no-underline"
          >
            <Timer size={18} strokeWidth={2} aria-hidden />
            Lancer un examen blanc
          </Link>
        </div>

        <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-5">
          <Panel aria-labelledby="d-reprendre" className="flex flex-col gap-[18px] p-[22px]">
            <div className="flex flex-col gap-2">
              <h2 id="d-reprendre" className="m-0 text-[20px] font-bold">
                Reprendre le parcours
              </h2>
              <div className="flex flex-wrap items-center gap-2.5">
                <NiveauTag niveau={q.niveau} />
                <span className="text-[15px] text-ink-2">
                  Question {r.position} sur {TOTAL} · Chapitre {q.chapitre}, {themeCompact(q.theme)}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[15px]">
                <span>
                  <strong>{formatEntier(r.global.reussies)}</strong> questions réussies sur {TOTAL}
                </span>
                <strong className="tnum">{pct(r.global.pourcentage)}</strong>
              </div>
              <Track valeur={r.global.pourcentage} hauteur={14} label="Progression globale" />
            </div>
            <Link href="/parcours" data-testid="bouton-parcours-desktop" className="flex h-[50px] items-center gap-2.5 self-start rounded-xl bg-ink px-[22px] text-[16px] font-bold text-white! no-underline">
              <Play size={18} fill="currentColor" strokeWidth={0} aria-hidden />
              {libelleBouton(r, true)}
            </Link>
          </Panel>

          <Panel aria-labelledby="d-erreurs" className="flex flex-col gap-3 p-[22px]">
            <div className="flex items-baseline justify-between">
              <h2 id="d-erreurs" className="m-0 text-[18px] font-bold">
                Erreurs à revoir {p.erreurs.length > 0 && <span className="text-pen-text">· {p.erreurs.length}</span>}
              </h2>
              {p.erreurs.length > 0 && (
                <Link href="/erreurs" className="text-[15px] font-bold">
                  Tout revoir
                </Link>
              )}
            </div>
            {erreurs.length ? (
              <ul className="m-0 flex list-none flex-col p-0">
                {erreurs.map((x) => (
                  <li key={x.id} className="flex flex-col gap-[3px] border-b border-line-2 py-2.5 last:border-b-0">
                    <Link href="/erreurs" className="text-[15px] no-underline">
                      {x.question}
                    </Link>
                    <span className="text-[13px] text-ink-2">
                      {LIBELLE_NIVEAU[x.niveau]} · {themeCompact(x.theme)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-[15px] text-ink-2">Aucune erreur à revoir pour le moment.</p>
            )}
          </Panel>
        </div>

        <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-5">
          <Panel aria-labelledby="d-niveaux" className="flex flex-col gap-1.5 p-[22px]">
            <h2 id="d-niveaux" className="m-0 mb-1.5 text-[18px] font-bold">
              Réussite par niveau
            </h2>
            <div className="grid grid-cols-[96px_minmax(0,1fr)_56px] items-center gap-x-4 gap-y-3.5">
              {NIVEAUX.map((n) => (
                <div key={n} className="contents">
                  <NiveauTag niveau={n} className="justify-self-start" />
                  <Track valeur={r.niveaux[n].taux ?? 0} hauteur={10} />
                  <strong className="tnum text-right">{formatTaux(r.niveaux[n].taux)}</strong>
                </div>
              ))}
            </div>
          </Panel>

          <Panel aria-labelledby="d-examen" className="flex flex-col gap-2.5 p-[22px]">
            <h2 id="d-examen" className="m-0 text-[18px] font-bold">
              Dernier examen blanc
            </h2>
            {dernier ? (
              <>
                <p className="tnum m-0 text-[26px] font-bold">
                  <span className="hl hl-note">{formatNote(noteExamen(dernier))}</span> sur 20
                </p>
                <p className="m-0 text-[15px] text-ink-2">
                  {formatDateLongue(new Date(dernier.date))} · {dernier.bonnes} bonnes réponses sur 40
                </p>
              </>
            ) : (
              <p className="m-0 text-[15px] text-ink-2">
                Aucun examen blanc pour le moment.{" "}
                <Link href="/examen" className="font-bold text-ink">
                  En passer un
                </Link>
              </p>
            )}
          </Panel>
        </div>

        <Panel aria-labelledby="d-chapitres" className="flex flex-col gap-2.5 p-[22px] pb-2.5">
          <h2 id="d-chapitres" className="m-0 text-[18px] font-bold">
            Chapitres
          </h2>
          <table className="w-full border-collapse text-[15px]">
            <thead>
              <tr className="text-left text-[13px] whitespace-nowrap text-ink-2">
                <th scope="col" className="border-b border-line px-3 py-2.5 font-bold">
                  Chapitre
                </th>
                <th scope="col" className="border-b border-line px-3 py-2.5 font-bold">
                  Tentées
                </th>
                <th scope="col" className="w-[34%] border-b border-line px-3 py-2.5 font-bold">
                  Réussite
                </th>
                <th scope="col" className="border-b border-line px-3 py-2.5 font-bold">
                  Dernière séance
                </th>
                <th scope="col" className="border-b border-line px-3 py-2.5">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {r.chapitres.map((c) => (
                <tr key={c.num} data-testid={`ligne-chapitre-${c.num}`} className="hover:bg-[#F8F9FC]">
                  <td className="border-b border-line-2 p-3 last:border-b-0">
                    {c.num} · {themeCompact(c.theme)}
                  </td>
                  <td className="tnum border-b border-line-2 p-3">
                    {c.tentees} / {c.total}
                  </td>
                  <td className="border-b border-line-2 p-3">
                    <div className="flex items-center gap-3">
                      <Track valeur={c.taux ?? 0} hauteur={10} className="flex-1" />
                      <strong className={`tnum w-11 text-right whitespace-nowrap ${estFaible(c.taux) ? "text-pen-text" : ""}`}>{formatTaux(c.taux)}</strong>
                    </div>
                  </td>
                  <td className="border-b border-line-2 p-3">{formatDerniereSeance(c.derniereSeance, auj)}</td>
                  <td className="border-b border-line-2 p-3 text-right">
                    <Link href={`/entrainement?chapitre=${c.num}`} className="font-bold">
                      S&apos;entraîner<span className="sr-only"> : chapitre {c.num}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
