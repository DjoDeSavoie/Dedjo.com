/* Données de l'Atelier, telles que les renvoie le script (apps-script/Stock.gs). */

export type Categorie = "produit" | "matiere" | "emballage";

export interface Article {
  id: string;
  nom: string;
  categorie: Categorie;
  unite: string;
  piecesParSachet: number | null;
  codeLot: string;
  conservationMois: number | null;
  seuilMarseille: number | null;
  seuilFerme: number | null;
  reserveHorsSite: number | null;
  actif: boolean;
  ordre: number | null;
  codeConfirme: boolean;
}

export interface Emplacement {
  id: string;
  nom: string;
  court: string;
  precision: string;
  site: boolean;
}

export interface Lot {
  id: string;
  article: string;
  numero: string;
  categorie: Categorie;
  fabrication: string;
  ddm: string;
  fournisseur: string;
  creeLe: number | null;
  /** { emplacement: quantité }, sans les zéros. */
  quantites: Record<string, number>;
}

export interface LigneOperation {
  id: string;
  type: string;
  motif: string;
  article: string;
  lot: string;
  numero: string;
  emplacement: string;
  quantite: number;
  annule: boolean;
}

export interface Operation {
  operation: string;
  horodatage: number;
  genre: string;
  motif: string;
  note: string;
  reference: string;
  annule: boolean;
  lignes: LigneOperation[];
}

export interface Reservation {
  commande: string;
  horodatage: number;
  prenom: string;
  secteur: string;
  creneau: string;
  produits: { article: string; sachets: number }[];
}

export interface Etat {
  ok: true;
  actif: boolean;
  maj: string;
  articles: Article[];
  emplacements: Emplacement[];
  lots: Lot[];
  /** { article: { emplacement: quantité } } */
  stock: Record<string, Record<string, number>>;
  reservations: Reservation[];
  operations: Operation[];
  disponibles: Record<string, number>;
  statuts: Record<string, string>;
}

export interface FicheLot {
  ok: true;
  lot: Lot & { nom: string };
  historique: {
    operation: string;
    horodatage: number;
    type: string;
    motif: string;
    emplacement: string;
    quantite: number;
    note: string;
    reference: string;
    annule: boolean;
  }[];
  intrants: { lot: string; numero: string; article: string; nom: string; quantite: number }[];
  utiliseDans: { lot: string; numero: string; article: string; nom: string; quantite: number }[];
}

export interface PageJournal {
  ok: true;
  operations: Operation[];
  page: number;
  pages: number;
  total: number;
}

/** Réponse d'une écriture : message bref, et `deja` si la saisie avait déjà été enregistrée. */
export interface ResultatEcriture {
  ok: true;
  message: string;
  deja?: boolean;
  [cle: string]: unknown;
}

/** Feuilles qui montent par-dessus la vue : fiches et formulaires. */
export type Feuille =
  | { type: "article"; id: string }
  | { type: "lot"; id: string }
  | { type: "production"; article?: string }
  | { type: "reception"; article?: string }
  | { type: "sortie" }
  | { type: "envoi" }
  | { type: "transfert" }
  | { type: "inventaire" }
  | { type: "lotAction"; id: string; mode: "sortie" | "transfert" }
  | { type: "articleEdition"; id?: string }
  | { type: "emplacementEdition"; id?: string };
