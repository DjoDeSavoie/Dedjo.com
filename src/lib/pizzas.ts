/* ===================================================================
   PIZZAS DES VENDREDIS — source unique
   Lues par la section « Les Pizzas » de l'accueil (PizzasSection.tsx,
   avec sa pop-up de détails) et par la carte de la page /savoie.
   Aucun prix de pizza n'est affiché sur le site.

   ███  TEXTES — À MODIFIER  ███
   =================================================================== */
export interface Pizza {
  name: string;
  description: string;
  emoji: string;
  /** Couleur de la carte (classe Tailwind, voir tailwind.config.ts). */
  color: string;
  /** Favorite du chef : un petit emoji dans le coin de la carte de l'accueil. */
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
    description: "Sauce tomate, jambon, oignons, fromage. Ce qu'on revient toujours chercher, parce que c'est juste bon.",
    emoji: "🍕",
    color: "bg-pizza-classique",
    ingredients: [pateIngredients, "Sauce tomate", "Jambon", "Oignons de la ferme", "Fromage"],
    madeBy: fabricationAll,
    whereToBuy: whereToBuyAll,
    additionalInfo: bonASavoirAll,
  },
  {
    name: "La Flam",
    description: "Crème fraîche, lardons fumés, oignons — une flambée à la savoyarde. Notre création, notre préférée.",
    emoji: "🥓",
    color: "bg-pizza-flam",
    isFavorite: true,
    favoriteTooltip: "Favorite du chef",
    ingredients: [pateIngredients, "Crème fraîche", "Lardons fumés", "Oignons", "Fromage râpé"],
    madeBy: fabricationAll,
    whereToBuy: whereToBuyAll,
    additionalInfo: bonASavoirAll,
  },
  {
    name: "La Végé",
    description: "Courgettes et oignons du jardin, sauce tomate, fromage. Ce que la ferme offre, simplement.",
    emoji: "🥒",
    color: "bg-pizza-vege",
    ingredients: [pateIngredients, "Sauce tomate", "Courgettes du jardin", "Oignons du jardin", "Fromage"],
    madeBy: fabricationAll,
    whereToBuy: whereToBuyAll,
    additionalInfo: bonASavoirAll,
  },
];

export const PIZZAS_SUCREES: Pizza[] = [
  {
    name: "La Praline Rose",
    description: "Praline rose de Lyon, crème AOP. Un classique sucré-croquant — en pizza.",
    emoji: "🩷",
    color: "bg-pizza-praline",
    isFavorite: true,
    favoriteTooltip: "Favorite du chef",
    ingredients: [pateIngredients, "Pralines roses", "Crème AOP"],
    madeBy: fabricationAll,
    whereToBuy: whereToBuyAll,
    additionalInfo: bonASavoirAll,
  },
  {
    name: "La Nut'",
    description: "Pâte à tartiner chocolat-noisette. Pour finir sur une note douce.",
    emoji: "🍫",
    color: "bg-pizza-nut",
    ingredients: [pateIngredients, "Pâte à tartiner chocolat-noisettes"],
    madeBy: fabricationAll,
    whereToBuy: whereToBuyAll,
    additionalInfo: bonASavoirAll,
  },
];
