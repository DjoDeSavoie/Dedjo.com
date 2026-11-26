/* ===================================================================
   PIZZAS DES VENDREDIS — source unique
   Lues par la section « Les pizzas du vendredi » de l'accueil (PizzasSection.tsx,
   avec sa pop-up de détails) et par la carte de la page /savoie.
   Aucun prix de pizza n'est affiché sur le site.

   ███  TEXTES — À MODIFIER  ███
   =================================================================== */
export interface Pizza {
  name: string;
  description: string;
  /** Pas affiché sur le site public (gardé pour mémoire). */
  emoji: string;
  /** Couleur de la bordure de la carte (classe Tailwind, voir tailwind.config.ts). */
  color: string;
  /** Favorite du chef (plus affiché sur le site). */
  isFavorite?: boolean;
  favoriteTooltip?: string;
  ingredients: string[];
  madeBy: string;
  whereToBuy: string;
  additionalInfo?: string;
}

const pateIngredients = "Pâte (farine, eau, huile d'olive, levure et sel)";
const fabricationAll = "Pâte pétrie sur place, étalée au rouleau, garnie devant vos yeux et cuite au four à bois.";
const bonASavoirAll = "Un savoir-faire bien rodé et une union familiale pour vous servir le meilleur.";
const whereToBuyAll = "Disponible à la Ferme De La Goëttaz lors des soirées pizzas";

export const PIZZAS_SALEES: Pizza[] = [
  {
    name: "La Classique",
    description: "Sauce tomate, jambon, oignons, fromage.",
    emoji: "🍕",
    color: "border-pizza-classique",
    ingredients: [pateIngredients, "Sauce tomate", "Jambon", "Oignons de la ferme", "Fromage"],
    madeBy: fabricationAll,
    whereToBuy: whereToBuyAll,
    additionalInfo: bonASavoirAll,
  },
  {
    name: "La Flam",
    description: "Crème fraîche, lardons fumés et oignons, à la savoyarde.",
    emoji: "🥓",
    color: "border-pizza-flam",
    isFavorite: true,
    favoriteTooltip: "Favorite du chef",
    ingredients: [pateIngredients, "Crème fraîche", "Lardons fumés", "Oignons", "Fromage râpé"],
    madeBy: fabricationAll,
    whereToBuy: whereToBuyAll,
    additionalInfo: bonASavoirAll,
  },
  {
    name: "La Végé",
    description: "Courgettes et oignons du jardin, sauce tomate, fromage.",
    emoji: "🥒",
    color: "border-pizza-vege",
    ingredients: [pateIngredients, "Sauce tomate", "Courgettes du jardin", "Oignons du jardin", "Fromage"],
    madeBy: fabricationAll,
    whereToBuy: whereToBuyAll,
    additionalInfo: bonASavoirAll,
  },
];

export const PIZZAS_SUCREES: Pizza[] = [
  {
    name: "La Praline Rose",
    description: "Pralines roses de Lyon et crème AOP.",
    emoji: "🩷",
    color: "border-pizza-praline",
    isFavorite: true,
    favoriteTooltip: "Favorite du chef",
    ingredients: [pateIngredients, "Pralines roses", "Crème AOP"],
    madeBy: fabricationAll,
    whereToBuy: whereToBuyAll,
    additionalInfo: bonASavoirAll,
  },
  {
    name: "La Nut'",
    description: "Pâte à tartiner chocolat-noisette.",
    emoji: "🍫",
    color: "border-pizza-nut",
    ingredients: [pateIngredients, "Pâte à tartiner chocolat-noisettes"],
    madeBy: fabricationAll,
    whereToBuy: whereToBuyAll,
    additionalInfo: bonASavoirAll,
  },
];
