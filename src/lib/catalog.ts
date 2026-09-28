/* ===================================================================
   CATALOGUE DEDJO — source unique de vérité
   Utilisé à la fois par le site principal (boutons « + Panier »,
   pop-ups « Voir les détails ») et par la page de commande (/commande).

   ███  CONFIG — À MODIFIER  ███
   =================================================================== */
export const CONFIG = {
  whatsapp: "33612345678", // ← TON numéro WhatsApp, format international SANS le « + »
  email: "bonjour@dedjo.fr", // ← TON email
  leadDays: 3, // nb de jours mini avant la date souhaitée
};

/* --- Tarif : un prix unique par sachet (pas de dégressif pour le moment) --- */
export const PRIX_SACHET = 10;

/* ===================================================================
   TYPES
   =================================================================== */
export interface ProductLabel {
  /** Pastille de l'étiquette, ex. « Le classique ». */
  badge?: string;
  description: string;
  /** Mots en gras entre **doubles astérisques**. */
  preparation: string;
  /** Encadré conseil, ex. « Pour bruncher. » */
  tip?: { title: string; text: string };
  /** Encadré phrase d'accroche. */
  tagline?: string;
  /** Dénomination du produit. */
  denomination?: string;
  /** Allergènes en gras entre **doubles astérisques**. */
  ingredients: string;
  /** Mention allergènes séparée (si non indiqués en gras dans les ingrédients). */
  allergenes?: string;
  traces?: string;
  quantite?: string;
  ddm?: string;
  conservation: string;
  /** Mention artisanale imprimée sur l'étiquette. */
  mention?: string;
}

export interface Product {
  id: string;
  name: string;
  emoji: string;
  /** Couleur pastel (pastille, bordure de carte). */
  color: string;
  type?: string;
  /** Allergènes présents, signalés par une pastille sur les cartes produit. */
  allergens?: string[];
  /** Labels qualité affichés sur les cartes produit. */
  labels?: string[];
  /** Nombre de pièces dans un sachet. */
  pieces: number;
  /** Unité affichée pour les pièces : « pièces », « friands »… */
  unit: string;
  /** Prix d'un sachet. */
  price: number;
  /** Petite note affichée dans la pop-up (« Bon à savoir »). */
  note?: string;
  label: ProductLabel;
}

/* ===================================================================
   MENTIONS COMMUNES AUX ÉTIQUETTES VIENNOISERIES
   =================================================================== */
const PREPARATION_VIENNOISERIE =
  "Dispose tes viennoiseries **faites main** dans ton four éteint. Allume à **180 °C** — laisse 25 minutes, et jusqu'à 10 minutes de plus, selon tes goûts. Régale-toi !";
const MENTION_ARTISANALE =
  "Viennoiseries artisanales et locales, produites à la main, avec des ingrédients de qualité et le sourire d'un boulanger passionné.";
const DDM_SACHET = "À consommer de préférence avant la date indiquée sur le sachet.";
const CONSERVATION_SURGELE = "À conserver à −18 °C. Ne jamais recongeler après décongélation.";

/* ===================================================================
   VIENNOISERIES — textes repris mot pour mot des étiquettes
   =================================================================== */
export const VIENNOISERIES: Product[] = [
  {
    id: "lune",
    name: "La Lune",
    type: "Croissant pur beurre",
    emoji: "🥐",
    color: "#F5C842",
    pieces: 6,
    unit: "pièces",
    price: PRIX_SACHET,
    label: {
      badge: "Le classique",
      description:
        "Un croissant parfumé au goût prononcé de beurre, un feuilletage croustillant, au cœur riche et moelleux. Redécouvre le croissant artisanal de la meilleure des façons.",
      preparation: PREPARATION_VIENNOISERIE,
      tip: {
        title: "Pour bruncher",
        text: "Coupe-le en deux, encore tiède, et garnis-le à ton goût — jambon, fromage, crudités, etc. Puis repasse-le 5 minutes au four !",
      },
      denomination: "Pâte levée feuilletée pur beurre crue, congelée",
      ingredients: "**farine de blé**, **beurre**, eau, **lait**, sucre, levure, sel.",
      traces: "Peut contenir des traces de fruits à coque, œufs.",
      quantite: "6 pièces - 480 g",
      ddm: DDM_SACHET,
      conservation: CONSERVATION_SURGELE,
      mention: MENTION_ARTISANALE,
    },
  },
  {
    id: "cabosse",
    name: "La Cabosse",
    type: "Pain au chocolat",
    emoji: "🍫",
    color: "#C9905A",
    pieces: 6,
    unit: "pièces",
    price: PRIX_SACHET,
    label: {
      badge: "La controverse",
      description:
        "Une pâte feuilletée parfumée, au coeur chaud, coulant et chocolaté qui se dévoile bouchée après bouchée. Plus de problème pour la nommer, la cabosse est la même pour tous les accents.",
      preparation: PREPARATION_VIENNOISERIE,
      tagline: "Le plaisir non coupable, à tout moment de la journée, et de la nuit",
      denomination: "Pâte levée feuilletée pur beurre crue, congelée, chocolat 44%",
      ingredients:
        "**farine de blé**, **beurre**, eau, **lait**, sucre, chocolat 44% (sucre, pâte de cacao, beurre de cacao, émulsifiant : **lécithine de soja**), levure, sel.",
      traces: "Peut contenir des traces de fruits à coque, œufs.",
      quantite: "6 pièces - 480 g",
      ddm: DDM_SACHET,
      conservation: CONSERVATION_SURGELE,
      mention: MENTION_ARTISANALE,
    },
  },
  {
    id: "grappe",
    name: "La Grappe",
    type: "Pain aux raisins",
    emoji: "🍇",
    color: "#B8A4D4",
    allergens: ["Œufs"],
    labels: ["Crème aux grains de vanille"],
    pieces: 4,
    unit: "pièces",
    price: PRIX_SACHET,
    note: "💡 Une suggestion d'Apolline (avec deux ailes) et de ses parents",
    label: {
      badge: "L'intemporel",
      description:
        "Une crème pâtissière chargée de vanille, des raisins secs, roulés dans une pâte feuilletée au beurre. La douceur d'antan remise au goût du jour.",
      preparation: PREPARATION_VIENNOISERIE,
      tagline: "Les anciens l'adorent, les plus jeunes un peu moins",
      denomination: "Pâte levée feuilletée pur beurre crue, congelée, crème pâtissière vanille et raisins secs",
      ingredients:
        "**farine de blé**, **beurre**, eau, **lait**, sucre, raisins secs, **œufs**, levure, sel, vanille, amidon de maïs.",
      traces: "Peut contenir des traces de fruits à coque.",
      quantite: "4 pièces - 440 g",
      ddm: DDM_SACHET,
      conservation: CONSERVATION_SURGELE,
      mention: MENTION_ARTISANALE,
    },
  },
  {
    id: "rose",
    name: "La Rose",
    type: "Praline rose",
    emoji: "🌹",
    color: "#E8A0BC",
    allergens: ["Fruits à coque", "Œufs"],
    labels: ["Crème aux grains de vanille"],
    pieces: 4,
    unit: "pièces",
    price: PRIX_SACHET,
    label: {
      badge: "La création originale",
      description:
        "Une pâte feuilletée parfumée, garnie de crème pâtissière aux grains de vanille et de pralines roses fondantes",
      preparation: PREPARATION_VIENNOISERIE,
      tagline: "Un vrai dessert des Alpes, sorti tout droit de ton four",
      denomination: "Pâte levée feuilletée pur beurre crue, congelée, crème pâtissière vanille et pralines roses",
      ingredients:
        "**farine de blé**, **beurre**, **lait**, eau, sucre, pralines (**amandes**, sucre, colorant), **œufs**, levure, sel, vanille, amidon de maïs.",
      quantite: "4 pièces - 440 g",
      ddm: DDM_SACHET,
      conservation: CONSERVATION_SURGELE,
      mention: MENTION_ARTISANALE,
    },
  },
];

/* ===================================================================
   FEUILLETÉS SALÉS — sachet de 2 friands de la même gamme
   (⚠️ Étiquettes encore provisoires : ingrédients et allergènes à valider
    avec les vraies recettes avant mise en ligne — sécurité alimentaire.)
   =================================================================== */
const PREPARATION_FEUILLETE = "Direct du congélateur au four à **180 °C**, 25 minutes, sans décongeler.";

export const FEUILLETES: Product[] = [
  {
    id: "montagne",
    name: "La Montagne",
    emoji: "🏔️",
    color: "#ffaa8c",
    pieces: 2,
    unit: "friands",
    price: PRIX_SACHET,
    label: {
      description: "Lardons, oignons et reblochon — un clin d'œil à la tartiflette.",
      preparation: PREPARATION_FEUILLETE,
      ingredients: "Pâte feuilletée (farine, beurre, eau, sel), lardons, oignons, reblochon.",
      allergenes: "Contient **gluten**, **lait**.",
      quantite: "2 friands",
      ddm: DDM_SACHET,
      conservation: CONSERVATION_SURGELE,
    },
  },
  {
    id: "foret",
    name: "La Forêt",
    emoji: "🌲",
    color: "#ffb84d",
    pieces: 2,
    unit: "friands",
    price: PRIX_SACHET,
    label: {
      description: "Champignons des bois, béchamel douce et fromage à fondue.",
      preparation: PREPARATION_FEUILLETE,
      ingredients:
        "Pâte feuilletée (farine, beurre, eau, sel), champignons, béchamel (lait, beurre, farine), fromage à fondue.",
      allergenes: "Contient **gluten**, **lait**.",
      quantite: "2 friands",
      ddm: DDM_SACHET,
      conservation: CONSERVATION_SURGELE,
    },
  },
  {
    id: "noix",
    name: "La Noix",
    emoji: "🐝",
    color: "#c9a67a",
    allergens: ["Fruits à coque"],
    pieces: 2,
    unit: "friands",
    price: PRIX_SACHET,
    label: {
      description: "Chèvre, miel local et cerneaux de noix — le sucré-salé qui surprend.",
      preparation: PREPARATION_FEUILLETE,
      ingredients: "Pâte feuilletée (farine, beurre, eau, sel), fromage de chèvre frais, miel local, cerneaux de noix.",
      allergenes: "Contient **gluten**, **lait**, **fruits à coque (noix)**.",
      quantite: "2 friands",
      ddm: DDM_SACHET,
      conservation: CONSERVATION_SURGELE,
    },
  },
  {
    id: "goet",
    name: "La Goët",
    emoji: "🥬",
    color: "#7bc98a",
    pieces: 2,
    unit: "friands",
    price: PRIX_SACHET,
    label: {
      description: "Poireaux cueillis à la Goëttaz et fromage de chèvre frais.",
      preparation: PREPARATION_FEUILLETE,
      ingredients: "Pâte feuilletée (farine, beurre, eau, sel), poireaux de la Goëttaz, fromage de chèvre frais.",
      allergenes: "Contient **gluten**, **lait**.",
      quantite: "2 friands",
      ddm: DDM_SACHET,
      conservation: CONSERVATION_SURGELE,
    },
  },
];

export const ALL_PRODUCTS: Product[] = [...VIENNOISERIES, ...FEUILLETES];

/* ===================================================================
   HELPERS TARIFS & FORMAT
   =================================================================== */
export const eur = (n: number): string =>
  Number.isInteger(n) ? n + " €" : n.toFixed(2).replace(".", ",") + " €";

export const pluralize = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** Nombre total de sachets pour une gamme. */
export const countSachets = (counts: Record<string, number>): number =>
  Object.values(counts).reduce((a, b) => a + b, 0);

/** Montant total d'une gamme : somme des sachets × prix du sachet. */
export const sachetsTotal = (products: Product[], counts: Record<string, number>): number =>
  products.reduce((sum, p) => sum + (counts[p.id] || 0) * p.price, 0);
