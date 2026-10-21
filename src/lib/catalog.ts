/* ===================================================================
   CATALOGUE DEDJO — source unique de vérité
   Utilisé à la fois par le site principal (boutons « + Panier »,
   pop-ups « Voir les détails ») et par la page de commande (/commande).

   ⚠️ Les prix, pièces par sachet, frais et seuil de livraison et les jours
   des secteurs sont recopiés dans apps-script/Code.gs (le script recalcule
   le total de chaque commande) : toute modification doit être faite aux
   deux endroits, puis le script redéployé.

   ███  CONFIG — À MODIFIER  ███
   =================================================================== */
export const CONFIG = {
  whatsapp: "33777282023", // ← TON numéro WhatsApp, format international SANS le « + » (lien de secours si l'envoi échoue)
  leadDays: 1, // nb de jours mini avant la date souhaitée
  livraisonOfferteDes: 3, // Marseille : livraison offerte à partir de ce nombre de sachets
  fraisLivraison: 5, // Marseille : frais de livraison (en €) en dessous de ce seuil
};

/* ███  DISPONIBILITÉ DE SECOURS — À MODIFIER  ███
   La disponibilité vient du stock de Marseille (/api/dispo, voir src/hooks/useDisponibilite.ts).
   Ce tableau ne sert que si le stock ne répond pas, ou tant que STOCK_ACTIF n'est pas à « oui »
   dans le script :
   true  → le produit est commandable
   false → affiché « Bientôt disponible », impossible à ajouter au panier */
export const DISPONIBILITE_SECOURS = {
  lune: true,
  cabosse: true,
  grappe: false,
  rose: false,
  montagne: true,
  foret: true,
  noix: false,
  goet: false,
};

export type ProductId = keyof typeof DISPONIBILITE_SECOURS;

/** Statut d'un produit sur le site : commandable, épuisé à Marseille, ou jamais encore en stock. */
export type StatutSite = "disponible" | "victime" | "bientot";

/** Statut tiré de DISPONIBILITE_SECOURS (stock injoignable ou pas encore actif). */
export const statutSecours = (id: string): StatutSite =>
  DISPONIBILITE_SECOURS[id as ProductId] === true ? "disponible" : "bientot";

/* ███  SECTEURS — retrait ou livraison  ███
   jour : jour de retrait / livraison (0 = dimanche … 5 = vendredi, 6 = samedi) */
export interface Secteur {
  id: string;
  nom: string;
  detail: string;
  jour: number;
  livraison: boolean;
}

export const JOURS_SEMAINE = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

export const SECTEURS: Secteur[] = [
  {
    id: "savoie",
    nom: "Savoie",
    detail: "Retrait au marché du vendredi, à la Ferme de la Goëttaz.",
    jour: 5,
    livraison: false,
  },
  {
    id: "marseille",
    nom: "Marseille et alentours",
    detail: "Livraison locale à domicile, tous les samedis.",
    jour: 6,
    livraison: true,
  },
];

/* --- Tarif : un prix unique par sachet (pas de dégressif pour le moment) --- */
export const PRIX_SACHET = 10;

/* --- Paiement : uniquement à la remise (retrait ou livraison), jamais en ligne ---
   Recopié dans apps-script/Code.gs (PAIEMENT, e-mail de récapitulatif). */
export const MOYENS_PAIEMENT = "en espèces ou par virement";

/* --- Cuisson : four préchauffé, produits directement sortis du congélateur, sans décongeler ---
   Même valeur partout : fiches produits, sections de l'accueil, et CUISSON dans
   apps-script/Code.gs (rappel de l'e-mail de récapitulatif), et étiquettes imprimées. */
export const CUISSON = {
  temperature: 180,
  minutes: { viennoiseries: 20, feuilletes: 30 },
};

/* --- Exploitant du secteur alimentaire, affiché sur toutes les fiches produits (INCO) --- */
export const EXPLOITANT = "Dedjo — Jonathan Degrange, 32 avenue de la Croix Rouge, 13013 Marseille";

/* Pas de tableau nutritionnel pour le moment : exemption des denrées artisanales fournies
   directement au consommateur final en faibles quantités (règlement INCO, annexe V, point 19). */

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
  /** Dénomination du produit (mention obligatoire, INCO). */
  denomination: string;
  /** Allergènes en gras entre **doubles astérisques**. */
  ingredients: string;
  /** Mention allergènes séparée (si non indiqués en gras dans les ingrédients). */
  allergenes?: string;
  traces?: string;
  /** Contenu du sachet avec son poids net (mention obligatoire, INCO). */
  quantite: string;
  ddm?: string;
  conservation: string;
  /** Nom et adresse de l'exploitant (mention obligatoire, INCO). */
  exploitant: string;
  /** Mention artisanale imprimée sur l'étiquette. */
  mention?: string;
}

export interface Product {
  /** Doit figurer dans DISPONIBILITE_SECOURS (vérifié par TypeScript). */
  id: ProductId;
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
const PREPARATION_VIENNOISERIE = `Préchauffe ton four à **${CUISSON.temperature} °C**. Enfourne tes viennoiseries **faites main** directement sorties du congélateur, sans décongeler : **${CUISSON.minutes.viennoiseries} minutes**. Régale-toi !`;
const MENTION_ARTISANALE =
  "Viennoiseries artisanales et locales, produites à la main, avec des ingrédients de qualité et le sourire d'un artisan passionné, titulaire du CAP Boulanger.";
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
      exploitant: EXPLOITANT,
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
      exploitant: EXPLOITANT,
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
      exploitant: EXPLOITANT,
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
      exploitant: EXPLOITANT,
      mention: MENTION_ARTISANALE,
    },
  },
];

/* ===================================================================
   FEUILLETÉS SALÉS — sachet de 2 friands de la même gamme
   Allergènes en gras dans les ingrédients. Un produit ne passe à true dans
   DISPONIBILITE_SECOURS, ou n'entre en stock, qu'avec son étiquette complète (dénomination, ingrédients,
   allergènes, poids net) — sécurité alimentaire.
   =================================================================== */
const PREPARATION_FEUILLETE = `Préchauffe ton four à **${CUISSON.temperature} °C**. Enfourne tes friands directement sortis du congélateur, sans décongeler : **${CUISSON.minutes.feuilletes} minutes**.`;

export const FEUILLETES: Product[] = [
  {
    id: "montagne",
    name: "La Montagne",
    emoji: "🏔️",
    color: "#ffaa8c",
    labels: ["Pour tenir l'hiver"],
    pieces: 2,
    unit: "friands",
    price: PRIX_SACHET,
    label: {
      description: "Lardons, oignons et reblochon — un clin d'œil à la tartiflette.",
      preparation: PREPARATION_FEUILLETE,
      denomination: "Friand feuilleté pur beurre aux lardons, oignons et reblochon, cru, congelé",
      ingredients:
        "pâte feuilletée 63 % (**farine de blé** T45, **beurre**, eau, sel), reblochon AOP 17 % (**lait** cru de vache, sel, présure, ferments), lardons fumés 10 %, oignons 10 %.",
      traces: "Peut contenir des traces de fruits à coque, œufs.",
      quantite: "2 friands - 600 g",
      ddm: DDM_SACHET,
      conservation: CONSERVATION_SURGELE,
      exploitant: EXPLOITANT,
    },
  },
  {
    id: "foret",
    name: "La Forêt",
    emoji: "🌲",
    color: "#ffb84d",
    allergens: ["Œufs"],
    labels: ["La cueillette en Savoie"],
    pieces: 2,
    unit: "friands",
    price: PRIX_SACHET,
    label: {
      description: "Champignons de Paris, béchamel douce et fromages à fondue savoyarde.",
      preparation: PREPARATION_FEUILLETE,
      denomination: "Friands feuilletés pur beurre, crus et congelés, garnis de béchamel, champignons et fromage à fondue",
      ingredients:
        "pâte feuilletée 50 % (**farine de blé**, eau, **beurre** 10 %, sel), champignons de Paris 23 %, béchamel 15 % (**lait**, **beurre**, **farine de blé**, sel, poivre), mélange de fromages pour fondue savoyarde 12 % (fromages au **lait** cru ou thermisé : Meule du Châtelard, Meule de Savoie, Abondance, Beaufort ; fécule de pomme de terre ; conservateur : lysozyme d’**œuf**).",
      traces: "Peut contenir des traces de fruits à coque.",
      quantite: "2 friands - 400 g",
      ddm: DDM_SACHET,
      conservation: CONSERVATION_SURGELE,
      exploitant: EXPLOITANT,
    },
  },
  {
    id: "noix",
    name: "La Noix",
    emoji: "🐝",
    color: "#c9a67a",
    allergens: ["Fruits à coque"],
    labels: ["Le sucré/salé réconfortant"],
    pieces: 2,
    unit: "friands",
    price: PRIX_SACHET,
    label: {
      description: "Chèvre, miel local et cerneaux de noix — le sucré-salé qui surprend.",
      preparation: PREPARATION_FEUILLETE,
      ingredients: "Pâte feuilletée (farine, beurre, eau, sel), fromage de chèvre frais, miel local, cerneaux de noix.",
      allergenes: "Contient **gluten**, **lait**, **fruits à coque (noix)**.",
      denomination: "",
      quantite: "2 friands",
      ddm: DDM_SACHET,
      conservation: CONSERVATION_SURGELE,
      exploitant: EXPLOITANT,
    },
  },
  {
    id: "goet",
    name: "La Goët",
    emoji: "🥬",
    color: "#7bc98a",
    labels: ["Aux légumes de saison"],
    pieces: 2,
    unit: "friands",
    price: PRIX_SACHET,
    label: {
      description: "Poireaux cueillis à la Goëttaz et fromage de chèvre frais.",
      preparation: PREPARATION_FEUILLETE,
      ingredients: "Pâte feuilletée (farine, beurre, eau, sel), poireaux de la Goëttaz, fromage de chèvre frais.",
      allergenes: "Contient **gluten**, **lait**.",
      denomination: "",
      quantite: "2 friands",
      ddm: DDM_SACHET,
      conservation: CONSERVATION_SURGELE,
      exploitant: EXPLOITANT,
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
