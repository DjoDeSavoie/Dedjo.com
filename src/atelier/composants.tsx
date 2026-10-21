/* Briques de l'interface de l'Atelier : feuilles qui montent, puces, pas à pas +/−, pied de formulaire.
   Pensé pour le téléphone : zones tactiles de 44 px au moins. */

import { ReactNode, useContext, useEffect, useRef } from "react";
import { ChevronLeft, X } from "lucide-react";
import { NiveauFeuille, useAtelier } from "./contexte";
import { couleur, lireNombre, arrondi } from "./outils";
import type { Article } from "./types";

/* ---------- Classes communes ---------- */

export const CARTE = "rounded-xl border border-[#E6DCC6] bg-[#FFFCF6]";
export const LIGNE = "flex w-full items-start gap-3 border-t border-[#E6DCC6] px-3.5 py-3 text-left first:border-t-0";
export const BOUTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-45";
export const BOUTON_PRINCIPAL = `${BOUTON} bg-[#163F6B] text-[#FBF5E9] hover:bg-[#1d4f85]`;
export const BOUTON_SECONDAIRE = `${BOUTON} border border-[#E6DCC6] bg-[#FFFCF6] text-[#163F6B] hover:border-[#163F6B]`;
export const BOUTON_DANGER = `${BOUTON} bg-[#B1262E] text-white`;
export const LIEN = "min-h-11 px-1 text-[15px] font-bold text-[#163F6B] underline underline-offset-4";
export const CHAMP =
  "min-h-11 w-full min-w-0 rounded-[10px] border border-[#E6DCC6] bg-[#FFFCF6] px-3 py-2.5 text-base text-[#1A2B40] focus:border-[#163F6B] focus:outline-none focus:ring-2 focus:ring-[#7DC3E8]";
export const ETIQUETTE = "text-[11.5px] font-black uppercase tracking-[0.08em] text-[#5E6A78]";
export const TITRE_SECTION = "font-display text-xl font-semibold text-[#163F6B]";
export const DISCRET = "text-[13px] text-[#5E6A78]";

/* ---------- Petits éléments ---------- */

/** Pastille de couleur (produit fini) ou cercle vide (matière, emballage). */
export function Pastille({ article, petite = false }: { article?: Article; petite?: boolean }) {
  const c = couleur(article);
  const taille = petite ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span
      aria-hidden="true"
      className={`inline-block flex-none rounded-full ${taille} ${c ? "" : "border-2 border-[#C9BFA9]"}`}
      style={c ? { backgroundColor: c } : undefined}
    />
  );
}

const TEINTES = {
  bad: "bg-[#F7E0E0] text-[#B1262E]",
  warn: "bg-[#FAEDCF] text-[#94600A]",
  ok: "bg-[#E0EFE4] text-[#2C7A4C]",
  info: "bg-[#DCEBF6] text-[#1D6CA3]",
  mute: "bg-[#EDE5D4] text-[#5E6A78]",
};

export function Badge({ teinte, children }: { teinte: keyof typeof TEINTES; children: ReactNode }) {
  return <span className={`inline-block whitespace-nowrap rounded-md px-1.5 py-1 text-[11px] font-bold leading-none ${TEINTES[teinte]}`}>{children}</span>;
}

/** Puce cliquable (filtre, choix unique). */
export function Puce({ actif, onClick, children, disabled }: { actif: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-11 flex-none rounded-full border px-4 text-[14px] font-bold transition-colors disabled:opacity-35 ${
        actif ? "border-[#163F6B] bg-[#163F6B] text-[#FBF5E9]" : "border-[#E6DCC6] bg-[#FFFCF6] text-[#1A2B40]"
      }`}
    >
      {children}
    </button>
  );
}

/** Choix unique parmi des puces, avec sa légende. */
export function ChoixPuces<T extends string>({
  legende,
  options,
  valeur,
  onChange,
  desactive,
}: {
  legende: string;
  options: { valeur: T; libelle: string }[];
  valeur: T;
  onChange: (v: T) => void;
  desactive?: (v: T) => boolean;
}) {
  return (
    <fieldset className="grid min-w-0 gap-2">
      <legend className={`${ETIQUETTE} mb-2`}>{legende}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={legende}>
        {options.map((o) => (
          <Puce key={o.valeur} actif={o.valeur === valeur} disabled={desactive ? desactive(o.valeur) : false} onClick={() => onChange(o.valeur)}>
            {o.libelle}
          </Puce>
        ))}
      </div>
    </fieldset>
  );
}

/** Champ avec son étiquette. */
export function Champ({ id, libelle, aide, children }: { id?: string; libelle: string; aide?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={ETIQUETTE}>
        {libelle}
      </label>
      {children}
      {aide ? <p className={DISCRET}>{aide}</p> : null}
    </div>
  );
}

/**
 * Pas à pas +/− avec clavier numérique. La valeur reste un texte (« 1,5 ») tant qu'on tape.
 * `entier` : sachets, pièces, unités.
 */
export function PasAPas({
  id,
  valeur,
  onChange,
  entier,
  max,
  grand = false,
  libelle,
}: {
  id?: string;
  valeur: string;
  onChange: (v: string) => void;
  entier: boolean;
  max?: number;
  grand?: boolean;
  libelle?: string;
}) {
  const changer = (pas: number) => {
    const actuel = lireNombre(valeur);
    let v = (Number.isFinite(actuel) ? actuel : 0) + pas;
    if (v < 0) v = 0;
    if (max !== undefined && v > max) v = max;
    onChange(String(entier ? Math.round(v) : arrondi(v)).replace(".", ","));
  };
  const bouton = "h-11 w-11 flex-none bg-[#EDE5D4] text-xl font-bold text-[#163F6B] active:bg-[#E0D5C0]";
  return (
    <div className="flex flex-none items-center overflow-hidden rounded-[10px] border border-[#E6DCC6] bg-[#FFFCF6]">
      <button type="button" className={bouton} aria-label="Moins" onClick={() => changer(-1)}>
        −
      </button>
      <input
        id={id}
        aria-label={libelle}
        inputMode={entier ? "numeric" : "decimal"}
        autoComplete="off"
        placeholder="0"
        value={valeur}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
        className={`h-11 border-0 bg-transparent text-center tabular-nums focus:outline-none ${grand ? "w-24 text-[19px] font-bold" : "w-16 text-base"}`}
      />
      <button type="button" className={bouton} aria-label="Plus" onClick={() => changer(1)}>
        +
      </button>
    </div>
  );
}

/** Lignes grises animées pendant le chargement. */
export function Squelette({ lignes = 3 }: { lignes?: number }) {
  return (
    <div className={`${CARTE} overflow-hidden`} aria-busy="true">
      {Array.from({ length: lignes }, (_, i) => (
        <div key={i} className="h-[58px] animate-pulse border-t border-[#E6DCC6] bg-[#F3ECDD] first:border-t-0" />
      ))}
    </div>
  );
}

/* ---------- Feuille qui monte ---------- */

/** Feuille plein écran (fiche ou formulaire), au-dessus de la vue. Échap ou × la ferme. */
export function Feuille({ titre, children, pied }: { titre: ReactNode; children: ReactNode; pied?: ReactNode }) {
  const { retour, fermer, profondeur } = useAtelier();
  const niveau = useContext(NiveauFeuille);
  // Les feuilles du dessous restent montées (leur saisie est gardée) mais seule la dernière réagit
  const active = niveau === profondeur - 1;
  const fermerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!active) return;
    fermerRef.current?.focus({ preventScroll: true });
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") retour();
    };
    document.addEventListener("keydown", touche);
    return () => document.removeEventListener("keydown", touche);
  }, [active, retour]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(12,26,43,0.42)]" onClick={(e) => e.target === e.currentTarget && fermer()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feuille-titre"
        className="flex h-[calc(100%-14px)] w-full max-w-[720px] motion-safe:animate-feuille flex-col rounded-t-[18px] bg-[#FBF5E9] shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-[#E6DCC6] px-4 py-2.5">
          {niveau > 0 ? (
            <button type="button" onClick={retour} className="-ml-2 flex min-h-11 items-center gap-0.5 pr-2 text-[15px] font-bold text-[#163F6B]">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              Retour
            </button>
          ) : null}
          <h2 id="feuille-titre" className="min-w-0 flex-1 break-words font-display text-[21px] font-semibold leading-tight text-[#163F6B]">
            {titre}
          </h2>
          <button
            ref={fermerRef}
            type="button"
            onClick={fermer}
            aria-label="Fermer"
            className="grid h-11 w-11 flex-none place-items-center rounded-[10px] border border-[#E6DCC6] bg-[#FFFCF6] text-[#163F6B]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-7 pt-4">{children}</div>
        {pied ? <div className="border-t border-[#E6DCC6] px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">{pied}</div> : null}
      </div>
    </div>
  );
}

/** Pied d'un formulaire : erreur éventuelle, puis le bouton d'envoi (« Réessayer » si le réseau a coupé). */
export function PiedFormulaire({
  formulaire,
  libelle,
  envoi,
  erreur,
  reseau,
  desactive,
}: {
  formulaire: string;
  libelle: string;
  envoi: boolean;
  erreur: string;
  reseau: boolean;
  desactive?: boolean;
}) {
  return (
    <>
      {erreur ? (
        <p role="alert" className="mb-2.5 text-[14px] font-bold text-[#B1262E]">
          {erreur}
        </p>
      ) : null}
      <button type="submit" form={formulaire} disabled={envoi || desactive} className={`${BOUTON_PRINCIPAL} w-full`}>
        {envoi ? "Enregistrement…" : reseau ? "Réessayer" : libelle}
      </button>
    </>
  );
}
