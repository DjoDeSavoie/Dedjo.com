/* ===================================================================
   INFORMATIONS LÉGALES — source unique des pages /mentions-legales, /cgv
   et /confidentialite, des mentions sous les formulaires, et de la
   version des CGV contrôlée par la fonction Netlify et par le script.
   Un champ vide ("") n'est jamais affiché : la phrase qui l'entoure
   s'adapte, ou la ligne disparaît.
   =================================================================== */
import { CONFIG } from "./catalog";

/**
 * Date de version des CGV (AAAA-MM-JJ) : affichée en tête de /cgv, envoyée avec chaque commande
 * et enregistrée dans le Sheet (colonne « Version CGV »).
 * ⚠️ À chaque modification des CGV : nouvelle date ici, ET ajout de cette date à CGV_VERSIONS
 *    dans apps-script/Code.gs. Publier d'abord le script (nouvelle version), puis le site.
 */
export const CGV_VERSION = "2026-10-12";

/** « 2026-10-12 » → « 12 octobre 2026 » */
export const dateLongue = (iso: string): string =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** « 33777282023 » → « 07 77 28 20 23 » */
const telephoneFrancais = (international: string): string =>
  `0${international.slice(2)}`.replace(/(\d{2})(?=\d)/g, "$1 ");

export const EDITEUR = {
  nom: "Jonathan Degrange",
  statut: "entrepreneur individuel (micro-entreprise)",
  nomCommercial: "Dedjo",
  // SIREN et immatriculation : mentions obligatoires, à renseigner dès leur obtention
  siren: "",
  immatriculation: "",
  siege: "32 avenue de la Croix Rouge, 13013 Marseille",
  telephone: telephoneFrancais(CONFIG.whatsapp),
  email: "",
  tva: "TVA non applicable, art. 293 B du CGI",
};

export const HEBERGEUR = {
  nom: "Netlify, Inc.",
  coordonnees: "", // adresse et téléphone de l'hébergeur
};

export const MARQUE = {
  nom: "DEDJO",
  numero: "5304720",
  dateDepot: "3 octobre 2026",
  classes: "30, 35 et 43",
};

/** Crédits photos et graphisme (rubrique des mentions légales). */
export const CREDITS = "";

/** Précisions des CGV, chacune affichée à son article. */
export const CGV_DETAILS = {
  chaineDuFroid: "", // article 7 : moyen de transport, glacière ou caisson, température
  encadreGarantie: "", // article 9 : encadré d'information sur la garantie légale de conformité
  reclamations: "", // article 10 : délai, photo à joindre, contact
  mediateur: "", // article 11 : nom, adresse et site du médiateur de la consommation
};

/** Garanties encadrant les transferts de données hors de l'Union européenne (confidentialité). */
export const GARANTIES_TRANSFERTS = "";

/** Liens vers les pages légales : pied de page et page Commande. */
export const LIENS_LEGAUX = [
  { to: "/mentions-legales", label: "Mentions légales" },
  { to: "/cgv", label: "CGV" },
  { to: "/confidentialite", label: "Politique de confidentialité" },
];

/** Durée de conservation indiquée dans les mentions courtes sous les formulaires. */
export const DUREE_CONSERVATION_MENTIONS = "";

/** Fréquence de la newsletter, ex. « une fois » → « environ une fois par mois ». */
export const FREQUENCE_NEWSLETTER = "";
