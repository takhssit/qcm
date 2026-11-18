import type { ReactNode } from "react";
import { LIBELLE_NIVEAU, type NiveauId } from "@/lib/bank";

const FOND_NIVEAU: Record<NiveauId, string> = { facile: "bg-lvl-1", moyen: "bg-lvl-2", difficile: "bg-lvl-3" };

export function NiveauTag({ niveau, className = "" }: { niveau: NiveauId; className?: string }) {
  return (
    <span
      data-testid="niveau"
      className={`inline-block rounded-full px-2.5 py-[3px] text-[13px] leading-[1.3] font-bold text-ink ${FOND_NIVEAU[niveau]} ${className}`}
    >
      {LIBELLE_NIVEAU[niveau]}
    </span>
  );
}

export const COULEUR_NIVEAU: Record<NiveauId, string> = { facile: "var(--lvl-1)", moyen: "var(--lvl-2)", difficile: "var(--lvl-3)" };

/** Barre de progression dessinée au trait de surligneur. */
export function Track({
  valeur,
  hauteur = 12,
  sombre = false,
  label,
  className = "",
}: {
  valeur: number; // 0..1
  hauteur?: number;
  sombre?: boolean;
  label?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, valeur)) * 100;
  return (
    <div
      className={`track ${sombre ? "track-dark" : ""} ${className}`}
      style={{ ["--h" as string]: `${hauteur}px` }}
      {...(label
        ? { role: "progressbar", "aria-label": label, "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": Math.round(pct) }
        : { "aria-hidden": true })}
    >
      {pct > 0 && <div className="stroke" style={{ width: `${pct}%` }} />}
    </div>
  );
}

export function Panel({ children, className = "", ombre = false, ...rest }: { children: ReactNode; className?: string; ombre?: boolean } & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={`rounded-2xl border border-line bg-surface ${ombre ? "shadow-action" : ""} ${className}`} {...rest}>
      {children}
    </section>
  );
}

export const BTN_PRIMAIRE =
  "flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl border-0 bg-ink text-[17px] font-bold text-white! no-underline cursor-pointer disabled:cursor-not-allowed disabled:bg-[#C9CFDD] disabled:text-ink-2!";

export const BTN_SECONDAIRE =
  "flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-ink bg-surface text-[17px] font-bold text-ink no-underline cursor-pointer";

export function Chargement() {
  return (
    <div role="status" aria-live="polite" className="p-6 text-[15px] text-ink-2">
      Chargement…
    </div>
  );
}

export function SrOnly({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
