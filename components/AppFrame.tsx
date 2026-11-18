"use client";

import { BookOpen, ChartNoAxesColumn, House, ListFilter, RotateCcw, Timer } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { lireExamenEnCours } from "@/lib/progress";
import { useProgression } from "./store";

const MSG_QUITTER = "Quitter l'examen blanc ? Votre épreuve est sauvegardée : vous pourrez la reprendre là où vous en êtes.";

/** Demande confirmation avant de quitter une épreuve en cours. */
export function confirmerSortieExamen(e: MouseEvent, pathname: string) {
  if (pathname === "/examen" && lireExamenEnCours() && !window.confirm(MSG_QUITTER)) e.preventDefault();
}

function useBadge() {
  const p = useProgression();
  return p?.erreurs.length ?? 0;
}

const estActif = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

const ONGLETS = [
  { href: "/", label: "Accueil", Icon: House },
  { href: "/entrainement", label: "Entraîner", Icon: ListFilter },
  { href: "/examen", label: "Examen", Icon: Timer },
  { href: "/erreurs", label: "Erreurs", Icon: RotateCcw },
  { href: "/stats", label: "Stats", Icon: ChartNoAxesColumn },
];

const ENTREES = [
  { href: "/", label: "Tableau de bord", Icon: House },
  { href: "/parcours", label: "Parcours", Icon: BookOpen },
  { href: "/entrainement", label: "Entraînement", Icon: ListFilter },
  { href: "/examen", label: "Examen blanc", Icon: Timer },
  { href: "/erreurs", label: "Erreurs à revoir", Icon: RotateCcw },
  { href: "/stats", label: "Statistiques", Icon: ChartNoAxesColumn },
];

function TabBar() {
  const pathname = usePathname();
  const badge = useBadge();
  return (
    <nav
      aria-label="Navigation principale"
      data-testid="tabbar"
      className="fixed inset-x-0 bottom-0 z-30 grid h-[76px] grid-cols-5 border-t border-line bg-surface px-1 pt-1.5 pb-2.5 lg:hidden"
    >
      {ONGLETS.map(({ href, label, Icon }) => {
        const actif = estActif(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={actif ? "page" : undefined}
            onClick={(e) => confirmerSortieExamen(e, pathname)}
            className={`relative flex flex-col items-center justify-center gap-1 text-[12px] no-underline ${actif ? "font-bold text-ink" : "text-ink-3"}`}
          >
            <Icon size={22} strokeWidth={actif ? 1.9 : 1.8} aria-hidden />
            <span className={actif ? "hl" : undefined}>{label}</span>
            {href === "/erreurs" && badge > 0 && (
              <span
                data-testid="tabbar-badge"
                className="absolute top-0.5 left-1/2 ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-pen px-1.5 text-[11px] font-bold text-white"
              >
                <span className="sr-only">Erreurs à revoir : </span>
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function Rail() {
  const pathname = usePathname();
  const badge = useBadge();
  return (
    <aside data-testid="rail" className="hidden w-[248px] shrink-0 bg-ink text-white lg:block">
      <div className="sticky top-0 flex h-dvh flex-col gap-8 overflow-y-auto px-[18px] py-7">
      <div className="flex flex-col gap-1 px-2">
        <p className="m-0 text-[20px] font-bold">Pédagogie moderne</p>
        <p className="m-0 text-[13px] text-on-ink-2">Concours de promotion interne</p>
      </div>
      <nav aria-label="Navigation principale" className="flex flex-col gap-1">
        {ENTREES.map(({ href, label, Icon }) => {
          const actif = estActif(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={actif ? "page" : undefined}
              onClick={(e) => confirmerSortieExamen(e, pathname)}
              className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3.5 text-[15px] no-underline hover:bg-white/8 hover:text-white ${
                actif ? "bg-white/10 font-bold text-white!" : "text-on-ink-2!"
              }`}
            >
              <Icon size={20} strokeWidth={actif ? 1.9 : 1.8} aria-hidden />
              <span className="flex-1">{label}</span>
              {href === "/erreurs" && badge > 0 && (
                <span
                  data-testid="rail-badge"
                  className="flex h-[22px] min-w-6 items-center justify-center rounded-full bg-pen px-[7px] text-[12px] font-bold text-white"
                >
                  <span className="sr-only">à revoir : </span>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <p className="mt-auto mb-0 px-2 text-[13px] leading-normal text-on-ink-2">
        Votre progression est enregistrée sur cet appareil. Exportez-la depuis Statistiques pour la retrouver ailleurs.
      </p>
      </div>
    </aside>
  );
}

/** Cadre de page : rail (desktop) + barre d'onglets (mobile). `nav={false}` pour les écrans de question. */
export function AppFrame({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  if (!nav) return <div className="min-h-dvh">{children}</div>;
  return (
    <div className="min-h-dvh lg:flex">
      <Rail />
      <div className="min-w-0 flex-1 pb-[76px] lg:pb-0">{children}</div>
      <TabBar />
    </div>
  );
}

/** En-tête de page : bandeau bleu nuit sur mobile, titre simple sur desktop. */
export function PageHeader({ titre, sousTitre, action }: { titre: string; sousTitre?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex flex-col gap-1 bg-ink px-5 pt-[22px] pb-5 text-white lg:mx-auto lg:max-w-[1120px] lg:flex-row lg:items-end lg:justify-between lg:gap-4 lg:bg-transparent lg:px-0 lg:pt-0 lg:pb-0 lg:text-ink">
      <div className="flex flex-col gap-1 lg:gap-1.5">
        <h1 className="m-0 text-[22px] font-bold lg:text-[30px]">{titre}</h1>
        {sousTitre && <p className="m-0 text-[14px] text-on-ink-2 lg:text-[15px] lg:text-ink-2">{sousTitre}</p>}
      </div>
      {action}
    </header>
  );
}

/** Page avec en-tête : bandeau pleine largeur sur mobile, colonne de 1120 px max sur desktop. */
export function Page({
  titre,
  sousTitre,
  action,
  children,
  testid,
}: {
  titre: string;
  sousTitre?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  testid?: string;
}) {
  return (
    <div data-testid={testid} className="lg:px-12 lg:pt-9 lg:pb-14">
      <PageHeader titre={titre} sousTitre={sousTitre} action={action} />
      <div className="flex flex-col gap-[22px] px-4 pt-[18px] pb-6 lg:mx-auto lg:max-w-[1120px] lg:gap-7 lg:px-0 lg:pt-7">{children}</div>
    </div>
  );
}
