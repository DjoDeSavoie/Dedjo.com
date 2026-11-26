/* ===================================================================
   BORDURE DE CHAQUE PRODUIT — source unique
   La couleur d'un produit sur le site n'est qu'une bordure de 2 px sur fond crème carte
   (DESIGN.md, « La règle de la bordure »). Classes product-* de tailwind.config.ts, écrites en
   entier pour que Tailwind les trouve. Lues par les cartes de l'accueil, la galerie des pages
   de lieu et les aperçus Instagram du pied de page.
   =================================================================== */
import type { ProductId } from "./catalog";

export const BORDURE_PRODUIT: Record<ProductId, string> = {
  lune: "border-product-croissant",
  cabosse: "border-product-chocolat",
  grappe: "border-product-raisin",
  rose: "border-product-rose",
  montagne: "border-product-montagne",
  foret: "border-product-foret",
  goet: "border-product-goet",
  noix: "border-product-noix",
};
