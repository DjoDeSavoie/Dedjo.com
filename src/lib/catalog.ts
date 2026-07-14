/* ===================================================================
   CATALOGUE DEDJO — source unique de vérité
   Utilisé à la fois par le site principal (boutons « Ajouter au panier »)
   et par la page de commande (/commande).

   ███  CONFIG — À MODIFIER  ███
   =================================================================== */
export const CONFIG = {
  whatsapp: "33612345678", // ← TON numéro WhatsApp, format international SANS le « + »
  email: "bonjour@dedjo.fr", // ← TON email
  leadDays: 3, // nb de jours mini avant la date souhaitée
  minFriands: 2, // friands minimum (mets 3 si tu préfères imposer 3 friands)
};

/* --- Tarif viennoiseries (paliers) — facile à éditer --- */
export const VIENNO_MIN = 5; // minimum de pièces
export const VIENNO_TIERS = [
  { qty: 5, price: 10 },
  { qty: 8, price: 15 },
  { qty: 12, price: 20 },
];
export const VIENNO_EXTRA = 1.5; // au-delà de 12 pièces : +1,5 €/pièce

/* --- Tarif feuilletés --- */
export const FRIAND_UNIT = 5; // prix d'un friand à l'unité

/* ===================================================================
   TYPES
   =================================================================== */
export interface ProductLabel {
  description: string;
  ingredients: string[];
  /** Allergènes — mets les mots importants entre **doubles astérisques** pour le gras. */
  allergenes: string;
  cuisson: string;
  conservation: string;
  ddm: string;
}

export interface Product {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type?: string;
  allergen?: boolean;
  label: ProductLabel;
}

/* ===================================================================
   PRODUITS — parfums, couleurs, étiquettes
   (⚠️ Complète/ajuste les textes d'étiquette : ingrédients, allergènes,
    cuisson, conservation, DDM avant mise en ligne — sécurité alimentaire.)
   =================================================================== */
export const VIENNOISERIES: Product[] = [
  {
    id: "lune",
    name: "La Lune",
    type: "Croissant pur beurre",
    emoji: "🥐",
    color: "#F5C842",
    label: {
      description: "Le classique. Un croissant feuilleté au beurre AOP, façonné à la main.",
      ingredients: ["Farine de blé", "Beurre AOP", "Eau", "Lait", "Levure", "Sucre", "Sel"],
      allergenes: "Contient **gluten**, **lait**. Peut contenir des traces de **fruits à coque**.",
      cuisson: "Surgelé → four à 180 °C, 25 min, sans décongeler.",
      conservation: "À conserver surgelé jusqu'à la cuisson.",
      ddm: "À consommer dans les 3 mois (voir étiquette du sachet).",
    },
  },
  {
    id: "cabosse",
    name: "La Cabosse",
    type: "Pain au chocolat",
    emoji: "🍫",
    color: "#C9905A",
    label: {
      description: "Deux bâtons de chocolat noir dans un feuilletage au beurre.",
      ingredients: [
        "Base de pâte à croissant (farine, beurre AOP, lait, levure)",
        "Bâtonnets de chocolat noir",
      ],
      allergenes: "Contient **gluten**, **lait**, **soja**. Peut contenir des traces de **fruits à coque**.",
      cuisson: "Surgelé → four à 180 °C, 25 min, sans décongeler.",
      conservation: "À conserver surgelé jusqu'à la cuisson.",
      ddm: "À consommer dans les 3 mois (voir étiquette du sachet).",
    },
  },
  {
    id: "grappe",
    name: "La Grappe",
    type: "Pain aux raisins",
    emoji: "🍇",
    color: "#B8A4D4",
    label: {
      description: "Crème pâtissière vanille et raisins secs, roulés dans la pâte à croissant.",
      ingredients: [
        "Base de pâte à croissant",
        "Crème pâtissière (lait, œufs, vanille)",
        "Raisins secs",
      ],
      allergenes: "Contient **gluten**, **lait**, **œufs**. Peut contenir des traces de **fruits à coque**.",
      cuisson: "Surgelé → four à 180 °C, 25 min, sans décongeler.",
      conservation: "À conserver surgelé jusqu'à la cuisson.",
      ddm: "À consommer dans les 3 mois (voir étiquette du sachet).",
    },
  },
  {
    id: "rose",
    name: "La Rose",
    type: "Praline rose",
    emoji: "🌹",
    color: "#E8A0BC",
    label: {
      description: "Ma signature. Spirale de praline rose croquante et crème pâtissière vanille.",
      ingredients: [
        "Base de pâte à croissant",
        "Crème pâtissière (lait, œufs, vanille)",
        "Praline rose (amandes, sucre)",
      ],
      allergenes: "Contient **gluten**, **lait**, **œufs**, **fruits à coque (amandes)**.",
      cuisson: "Surgelé → four à 180 °C, 25 min, sans décongeler.",
      conservation: "À conserver surgelé jusqu'à la cuisson.",
      ddm: "À consommer dans les 3 mois (voir étiquette du sachet).",
    },
  },
];

export const FEUILLETES: Product[] = [
  {
    id: "montagne",
    name: "La Montagne",
    emoji: "🏔️",
    color: "#ffaa8c",
    allergen: false,
    label: {
      description: "Lardons, oignons et reblochon — un clin d'œil à la tartiflette.",
      ingredients: ["Pâte feuilletée (farine, beurre, eau, sel)", "Lardons", "Oignons", "Reblochon"],
      allergenes: "Contient **gluten**, **lait**.",
      cuisson: "Surgelé → four à 180 °C, 25 min, sans décongeler.",
      conservation: "À conserver surgelé jusqu'à la cuisson.",
      ddm: "À consommer dans les 3 mois (voir étiquette du sachet).",
    },
  },
  {
    id: "foret",
    name: "La Forêt",
    emoji: "🌲",
    color: "#ffb84d",
    allergen: false,
    label: {
      description: "Champignons des bois, béchamel douce et fromage à fondue.",
      ingredients: [
        "Pâte feuilletée (farine, beurre, eau, sel)",
        "Champignons",
        "Béchamel (lait, beurre, farine)",
        "Fromage à fondue",
      ],
      allergenes: "Contient **gluten**, **lait**.",
      cuisson: "Surgelé → four à 180 °C, 25 min, sans décongeler.",
      conservation: "À conserver surgelé jusqu'à la cuisson.",
      ddm: "À consommer dans les 3 mois (voir étiquette du sachet).",
    },
  },
  {
    id: "noix",
    name: "La Noix",
    emoji: "🐝",
    color: "#c9a67a",
    allergen: true,
    label: {
      description: "Chèvre, miel local et cerneaux de noix — le sucré-salé qui surprend.",
      ingredients: [
        "Pâte feuilletée (farine, beurre, eau, sel)",
        "Fromage de chèvre frais",
        "Miel local",
        "Cerneaux de noix",
      ],
      allergenes: "Contient **gluten**, **lait**, **fruits à coque (noix)**.",
      cuisson: "Surgelé → four à 180 °C, 25 min, sans décongeler.",
      conservation: "À conserver surgelé jusqu'à la cuisson.",
      ddm: "À consommer dans les 3 mois (voir étiquette du sachet).",
    },
  },
  {
    id: "goet",
    name: "La Goët",
    emoji: "🥬",
    color: "#7bc98a",
    allergen: false,
    label: {
      description: "Poireaux cueillis à la Goëttaz et fromage de chèvre frais.",
      ingredients: [
        "Pâte feuilletée (farine, beurre, eau, sel)",
        "Poireaux de la Goëttaz",
        "Fromage de chèvre frais",
      ],
      allergenes: "Contient **gluten**, **lait**.",
      cuisson: "Surgelé → four à 180 °C, 25 min, sans décongeler.",
      conservation: "À conserver surgelé jusqu'à la cuisson.",
      ddm: "À consommer dans les 3 mois (voir étiquette du sachet).",
    },
  },
];

export const ALL_PRODUCTS: Product[] = [...VIENNOISERIES, ...FEUILLETES];

/* ===================================================================
   HELPERS TARIFS & FORMAT
   =================================================================== */
export const eur = (n: number): string =>
  Number.isInteger(n) ? n + " €" : n.toFixed(2).replace(".", ",") + " €";

/** Prix des viennoiseries selon les paliers. Renvoie null si < minimum. */
export function viennoPrice(n: number): number | null {
  if (n < VIENNO_MIN) return null;
  let price = VIENNO_TIERS[0].price;
  for (const t of VIENNO_TIERS) {
    if (n >= t.qty) price = t.price;
  }
  const last = VIENNO_TIERS[VIENNO_TIERS.length - 1];
  if (n > last.qty) price = last.price + (n - last.qty) * VIENNO_EXTRA;
  return price;
}

export function friandPrice(n: number): number {
  return n * FRIAND_UNIT;
}

/** Prochain palier viennoiserie (pour la jauge). Renvoie null au-delà du dernier. */
export function nextTier(n: number): { from: number; qty: number; price: number } | null {
  if (n < VIENNO_TIERS[0].qty) return { from: 0, ...VIENNO_TIERS[0] };
  for (let i = 0; i < VIENNO_TIERS.length; i++) {
    if (n < VIENNO_TIERS[i].qty) return { from: VIENNO_TIERS[i - 1].qty, ...VIENNO_TIERS[i] };
  }
  return null;
}
