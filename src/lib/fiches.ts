/* ===================================================================
   FICHES PRODUITS — une page par produit (src/pages/FicheProduit.tsx)
   Ici : l'adresse de chaque fiche, son titre et sa description pour
   Google, et son texte d'intro. Tout le reste (prix, sachet, cuisson,
   ingrédients, allergènes) vient de catalog.ts, les photos de photos.ts.

   Ajouter une fiche : une entrée ci-dessous, puis sa route dans
   src/App.tsx, sa règle dans netlify.toml et son adresse dans
   public/sitemap.xml.
   =================================================================== */
import { ALL_PRODUCTS, CUISSON, Product, ProductId, eur } from "./catalog";

/* --- Adresses des pages citées à plusieurs endroits du site (menu, pied de page, liens) --- */
export const CHEMIN_MARSEILLE = "/marseille";
export const CHEMIN_SAVOIE = "/savoie";
export const CHEMIN_GUIDE = "/cuisson-viennoiseries-surgelees";

/** Texte du lien vers le guide de cuisson, le même partout. */
export const LIEN_GUIDE = "Tous mes conseils de cuisson";

export interface Fiche {
  id: ProductId;
  /** Adresse de la fiche, ex. « /la-lune ». */
  chemin: string;
  /** Titre de l'onglet et des résultats de recherche. */
  titre: string;
  /** Résumé affiché sous le titre dans les résultats de recherche. */
  description: string;
  /** Ce qui suit le nom dans le grand titre de la fiche ; absent : le type du catalogue. */
  type?: string;
  /** Texte d'intro, affiché avant la description de l'étiquette. */
  intro: string;
}

const produit = (id: ProductId): Product => ALL_PRODUCTS.find((p) => p.id === id)!;
const MINUTES = CUISSON.minutes;

/** « Sachet de 6 à 10 € » : pièces et prix lus dans le catalogue. */
const sachet = (id: ProductId) => `Sachet de ${produit(id).pieces} à ${eur(produit(id).price)}`;

/* ███  TEXTES — À MODIFIER  ███
   Les chiffres (minutes, pièces, prix) viennent du catalogue. Les durées écrites en lettres
   dans les intros (« Vingt minutes », « Trente minutes ») sont à corriger ici si CUISSON change. */
export const FICHES: Fiche[] = [
  {
    id: "lune",
    chemin: "/la-lune",
    titre: "La Lune · Croissant pur beurre artisanal à cuire · Dedjo",
    description: `Croissant pur beurre façonné à la main, surgelé cru : ${MINUTES.viennoiseries} minutes au four, direct du congélateur. ${sachet("lune")}, livré à Marseille.`,
    intro:
      "La Lune, c'est mon croissant pur beurre. Je tourne le beurre dans la pâte et je roule chaque croissant à la main, puis je le surgèle cru. Il gonfle et dore dans ton four, sans décongélation : tu le manges à la sortie, au moment où il est le meilleur.",
  },
  {
    id: "cabosse",
    chemin: "/la-cabosse",
    titre: "La Cabosse · Pain au chocolat pur beurre à cuire · Dedjo",
    description: `Pain au chocolat pur beurre façonné à la main, surgelé cru : ${MINUTES.viennoiseries} minutes au four, direct du congélateur. ${sachet("cabosse")}, livré à Marseille.`,
    intro:
      "Pain au chocolat ou chocolatine ? Ici, c'est La Cabosse. Une pâte levée feuilletée pur beurre, roulée à la main autour du chocolat, puis surgelée crue. Vingt minutes au four, et le chocolat coule encore quand tu la croques.",
  },
  {
    id: "montagne",
    chemin: "/la-montagne",
    titre: "La Montagne · Friand reblochon, lardons et oignons à cuire · Dedjo",
    description: `Friand feuilleté pur beurre au reblochon AOP, lardons et oignons, surgelé cru : ${MINUTES.feuilletes} minutes au four. ${sachet("montagne")}, à Marseille et en Savoie.`,
    type: "Friand au reblochon, lardons et oignons",
    intro:
      "La Montagne, c'est la tartiflette en feuilleté. Du reblochon AOP, des lardons fumés et des oignons, dans une pâte feuilletée pur beurre. Trente minutes au four, direct du congélateur : le feuilletage croustille et le reblochon fond.",
  },
  {
    id: "foret",
    chemin: "/la-foret",
    titre: "La Forêt · Feuilleté champignons et fromages savoyards · Dedjo",
    description: `Feuilleté pur beurre aux champignons, béchamel et fromages à fondue savoyarde, surgelé cru : ${MINUTES.feuilletes} minutes au four. ${sachet("foret")}.`,
    type: "Feuilleté aux champignons et fromages savoyards",
    intro:
      "La Forêt, c'est le goût d'une fondue savoyarde dans un feuilleté. Des champignons de Paris, une béchamel douce et des fromages à fondue de Savoie (Beaufort, Abondance, Meule de Savoie), dans une pâte feuilletée pur beurre. Trente minutes au four, et le fromage file.",
  },
];

/** La fiche d'un produit ; rien s'il n'en a pas (encore). */
export const ficheDe = (id: string): Fiche | undefined => FICHES.find((f) => f.id === id);

/** Type affiché à côté du nom : celui de la fiche, sinon celui du catalogue (les feuilletés n'en ont pas). */
export const typeDe = (p: Product): string => ficheDe(p.id)?.type ?? p.type ?? "Friand feuilleté salé";

/** Grand titre d'une fiche, aussi utilisé comme texte des liens vers elle : « La Lune — Croissant pur beurre ». */
export const titreFiche = (p: Product): string => `${p.name} — ${typeDe(p)}`;

/** Liens vers les fiches, pour les blocs de liens en bas de page ; `sauf` retire la fiche affichée. */
export const liensFiches = (sauf?: string) =>
  FICHES.filter((f) => f.id !== sauf).map((f) => {
    const p = produit(f.id);
    return { to: f.chemin, label: titreFiche(p), emoji: p.emoji };
  });
