/* Production (lot 6) : lecture des réglages et du plan en cours (onglet Production du classeur),
   familles des produits et produits à renflouer. Le calcul de l'organigramme est dans
   planification.ts ; aucune valeur de réglage n'est écrite ici. */

import { useQuery } from "@tanstack/react-query";
import { FEUILLETES, VIENNOISERIES } from "@/lib/catalog";
import { appeler } from "./api";
import { ErreurReglages, rendement, validerPlan, validerReglages, type Famille, type PlanEnCours, type Reglages, type Rendement } from "./planification";
import { articlesDe, EPS, stockArticle } from "./outils";
import type { Article, Etat } from "./types";

export const CLE_PRODUCTION = ["atelier", "production"];

export interface DonneesProduction {
  reglages: unknown;
  plan: unknown;
}

/** Réglages et plan en cours, lus à chaque ouverture (pas de cache côté script). */
export function useProduction() {
  const requete = useQuery({
    queryKey: CLE_PRODUCTION,
    queryFn: () => appeler<DonneesProduction>("stock.production"),
    staleTime: 60_000,
  });
  let reglages: Reglages | null = null;
  let erreurReglages = "";
  let plan: PlanEnCours | null = null;
  if (requete.data && requete.data.reglages) {
    try {
      reglages = validerReglages(requete.data.reglages);
    } catch (e) {
      erreurReglages = e instanceof ErreurReglages ? e.message : "Réglages de production illisibles.";
    }
  }
  if (requete.data && requete.data.plan) {
    try {
      plan = validerPlan(requete.data.plan);
    } catch (e) {
      plan = null; // plan abîmé : on repart d'un plan vierge
    }
  }
  return { requete, reglages, erreurReglages, plan };
}

/** Famille d'un produit, d'après le catalogue du site ; null s'il n'est dans aucune des deux listes. */
export function familleDe(id: string): Famille | null {
  if (VIENNOISERIES.some((p) => p.id === id)) return "v";
  if (FEUILLETES.some((p) => p.id === id)) return "f";
  return null;
}

export const NOM_FAMILLE: Record<Famille, string> = { v: "Viennoiseries", f: "Feuilletés" };

/** Pièces par sachet : celles de l'article, sinon celles du catalogue. */
export function piecesParSachet(a: Article): number {
  if (a.piecesParSachet && a.piecesParSachet > 0) return a.piecesParSachet;
  const p = [...VIENNOISERIES, ...FEUILLETES].find((x) => x.id === a.id);
  return p ? p.pieces : 1;
}

/** Limite d'un produit à Marseille : son seuil s'il est réglé, sinon la limite des réglages de production. */
export const limiteDe = (a: Article, r: Reglages) => (a.seuilMarseille && a.seuilMarseille > 0 ? a.seuilMarseille : r.seuil);

export interface ProduitPlanifiable {
  a: Article;
  fam: Famille;
  limite: number;
  /** Disponible à Marseille (réservations, réserve hors site et lots bloqués déduits). */
  dispo: number;
  ferme: number;
  aRenflouer: boolean;
  rupture: boolean;
  rendement: Rendement;
}

/** Un produit est à renflouer quand son disponible à Marseille est inférieur ou égal à sa limite. */
export function estARenflouer(etat: Etat, a: Article, r: Reglages): boolean {
  return familleDe(a.id) !== null && (etat.disponibles[a.id] || 0) <= limiteDe(a, r) + EPS;
}

/**
 * Produits de la production, par famille : d'abord ceux à renflouer, du plus urgent au moins urgent
 * (disponible ÷ limite), puis les autres dans l'ordre du catalogue.
 */
export function produitsPlanifiables(etat: Etat, r: Reglages): ProduitPlanifiable[] {
  const liste = articlesDe(etat, "produit")
    .map((a, i) => {
      const fam = familleDe(a.id);
      if (!fam) return null;
      const limite = limiteDe(a, r);
      const dispo = etat.disponibles[a.id] || 0;
      const aRenflouer = dispo <= limite + EPS;
      return {
        i,
        p: { a, fam, limite, dispo, ferme: stockArticle(etat, a.id, "ferme"), aRenflouer, rupture: dispo <= EPS, rendement: rendement(r, a.id, fam, piecesParSachet(a)) },
      };
    })
    .filter((x): x is { i: number; p: ProduitPlanifiable } => x !== null);
  const urgence = (p: ProduitPlanifiable) => (p.aRenflouer ? p.dispo / Math.max(1, p.limite) : Infinity);
  return liste.sort((x, y) => urgence(x.p) - urgence(y.p) || x.i - y.i).map((x) => x.p);
}
