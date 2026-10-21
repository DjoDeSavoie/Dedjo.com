import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatutSite, statutSecours } from "@/lib/catalog";

/* Disponibilité des produits, calculée depuis le stock de Marseille par GET /api/dispo.
   La réponse ne contient que des statuts (jamais de quantité). Si l'adresse ne répond pas, ou si le
   stock n'est pas encore actif (STOCK_ACTIF), le site garde DISPONIBILITE_SECOURS (catalog.ts). */

const STATUTS: StatutSite[] = ["disponible", "victime", "bientot"];

/** Statuts par produit, ou null : le site utilise alors la disponibilité de secours. */
async function chargerStatuts(): Promise<Record<string, StatutSite> | null> {
  const res = await fetch("/api/dispo", { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data: unknown = await res.json().catch(() => null);
  if (!data || typeof data !== "object") return null;
  const { actif, produits } = data as { actif?: unknown; produits?: unknown };
  if (actif !== true || !produits || typeof produits !== "object") return null;
  const statuts: Record<string, StatutSite> = {};
  Object.entries(produits as Record<string, unknown>).forEach(([id, statut]) => {
    if (STATUTS.includes(statut as StatutSite)) statuts[id] = statut as StatutSite;
  });
  return statuts;
}

export const CLE_DISPONIBILITE = ["disponibilite"];

/** `statut(id)` : disponible, victime ou bientot. Données fraîches 60 s, rechargées au retour sur l'onglet. */
export function useDisponibilite() {
  const { data } = useQuery({
    queryKey: CLE_DISPONIBILITE,
    queryFn: chargerStatuts,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
  const statuts = data ?? null;
  const statut = useCallback((id: string): StatutSite => (statuts && statuts[id]) || statutSecours(id), [statuts]);
  return { statut, depuisStock: statuts !== null };
}
