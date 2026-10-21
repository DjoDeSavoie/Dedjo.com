/* Données de l'Atelier, telles que les renvoie le script (apps-script/Stock.gs). */

export type Categorie = "produit" | "preparation" | "matiere" | "emballage";

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
  /** Préparations : date limite = fabrication + ce nombre de jours. */
  conservationJours: number | null;
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
  /** Recettes en vigueur, par article (produit ou préparation). */
  recettes: Record<string, Recette>;
  /** Id des lots bloqués. */
  bloques: string[];
}

export interface Recette {
  rendement: number;
  modifieeLe: number | null;
  composants: { article: string; quantite: number }[];
}

/** Lot dans la chaîne de traçabilité (amont ou aval). */
export interface LotLie {
  lot: string;
  numero: string;
  article: string;
  nom: string;
  categorie: Categorie | "";
  unite: string;
  fournisseur: string;
  fabrication: string;
  ddm: string;
  bloque: boolean;
}

/** Nœud de l'arbre amont : lot consommé, et pour une préparation, ses propres intrants. */
export interface NoeudAmont extends LotLie {
  quantite: number;
  niveau: number;
  enfants: NoeudAmont[];
}

/** Lot en aval, direct ou via des préparations. */
export interface LotAval extends LotLie {
  niveau: number;
  via: LotLie[];
  /** Quantité du lot `depuis` (le lot juste en amont) entrée dans ce lot. */
  quantiteUtilisee: number;
  depuis: string;
  quantites: Record<string, number>;
}

export interface Rappel {
  ok: true;
  lot: LotLie;
  resume: {
    concernes: number;
    enStock: number;
    bloques: number;
    remis: number;
    clients: number;
    ferme: number;
    ventes: number;
    offertsPerdus: number;
    texte: string;
  };
  amont: NoeudAmont[];
  /** Le lot lui-même (niveau 0), puis tout son aval. */
  aval: (LotAval & { entree: number; sorties: Record<string, number> })[];
  clients: { commande: string; remiseLe: number; sachets: number; lots: string[]; prenom: string; nom: string; telephone: string; email: string }[];
  ferme: { passage: string; depuis: number | null; jusque: number; libelle: string; sachets: number; lots: { numero: string; sachets: number }[] }[];
}

export interface Registre {
  ok: true;
  du: string;
  au: string;
  lignes: {
    fabrication: string;
    article: string;
    numero: string;
    quantite: number;
    unite: string;
    consomme: string;
    numeroConsomme: string;
    fournisseur: string;
    reception: string;
    ddm: string;
    quantiteUtilisee: number | null;
    uniteUtilisee: string;
    via: string;
  }[];
}

export interface FicheLot {
  ok: true;
  lot: Lot & {
    nom: string;
    quantiteEntree: number;
    bloque: boolean;
    blocage: { motif: string; note: string; horodatage: number; reference: string } | null;
    /** Fabriqué sans aucune matière enregistrée : pas traçable. */
    sansMatieres: boolean;
  };
  amont: NoeudAmont[];
  aval: LotAval[];
  /** Lots en aval qui ont encore du stock : proposés au blocage par propagation. */
  aBloquer: string[];
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
  | { type: "production"; article?: string; quantite?: number; retour?: boolean }
  | { type: "reception"; article?: string; quantite?: number; emplacement?: string; retour?: boolean }
  | { type: "sortie" }
  | { type: "envoi" }
  | { type: "transfert" }
  | { type: "inventaire" }
  | { type: "lotAction"; id: string; mode: "sortie" | "transfert" }
  | { type: "articleEdition"; id?: string }
  | { type: "emplacementEdition"; id?: string }
  | { type: "blocage"; lot: string; decision: "bloque" | "leve"; tous?: string[] }
  | { type: "rappel"; lot: string };
