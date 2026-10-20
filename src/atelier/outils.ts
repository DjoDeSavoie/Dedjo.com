/* Outils de l'Atelier : formats, dates, ordre de sortie, alertes, exports CSV.
   Les règles qui font foi (n° de lot, stock, annulations) sont dans le script : ici, seulement
   ce qu'il faut pour proposer des valeurs par défaut et afficher. */

import { ALL_PRODUCTS } from "@/lib/catalog";
import type { Article, Categorie, Etat, Lot } from "./types";

export const EPS = 1e-9;
export const arrondi = (n: number) => Math.round(n * 1e6) / 1e6;

export const CATEGORIES: { id: Categorie; nom: string; court: string }[] = [
  { id: "produit", nom: "Produits finis", court: "Produits" },
  { id: "matiere", nom: "Matières premières", court: "Matières" },
  { id: "emballage", nom: "Emballages", court: "Emballages" },
];

export const UNITES: [string, string][] = [
  ["sachet", "sachet"],
  ["kg", "kg"],
  ["g", "g"],
  ["L", "litre (L)"],
  ["pièce", "pièce"],
  ["unité", "unité"],
];

export const MOTIFS_SORTIE = ["Vente", "Dégustation / offert", "Utilisé en production", "Perte", "Autre"];

/** Genres d'opération du journal (apps-script/Stock.gs, genreOperation). */
export const GENRES: Record<string, string> = {
  production: "Production",
  reception: "Réception",
  sortie: "Sortie",
  envoi: "Envoi",
  transfert: "Transfert",
  inventaire: "Inventaire",
  reprise: "Reprise",
  passage: "Passage",
  commande: "Commande",
};

/* ---------- Nombres et unités ---------- */

const NF = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 });
export const nombre = (n: number) => NF.format(arrondi(n || 0));
export const signe = (n: number) => `${n > 0 ? "+" : "−"}${nombre(Math.abs(n))}`;

const UNITES_ENTIERES = ["sachet", "pièce", "unité"];
export const uniteEntiere = (a?: Article) => !!a && UNITES_ENTIERES.includes(a.unite);

/** « sachet », « sachets », « kg »… */
export function unite(a: Article | undefined, n: number): string {
  const u = (a && a.unite) || "unité";
  return Math.abs(n) >= 2 && UNITES_ENTIERES.includes(u) ? `${u}s` : u;
}

export const quantite = (a: Article | undefined, n: number) => `${nombre(n)} ${unite(a, n)}`;

/** Saisie « 1,5 » ou « 1.5 » → 1.5 (NaN si vide ou invalide). */
export function lireNombre(texte: string): number {
  const v = String(texte || "").replace(/\s/g, "").replace(",", ".");
  return v === "" ? NaN : Number(v);
}

/* ---------- Dates ---------- */

const deux = (n: number) => String(n).padStart(2, "0");

/** Date du jour (heure de l'appareil), au format AAAA-MM-JJ. */
export function aujourdhui(): string {
  const d = new Date();
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
}

/** Ajoute des mois, en ramenant au dernier jour du mois si besoin : 31/10 + 4 mois = 28/02. */
export function ajouterMois(iso: string, mois: number): string {
  const [a, m, j] = iso.split("-").map(Number);
  const debut = new Date(Date.UTC(a, m - 1 + mois, 1));
  const dernier = new Date(Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth() + 1, 0)).getUTCDate();
  return `${debut.getUTCFullYear()}-${deux(debut.getUTCMonth() + 1)}-${deux(Math.min(j, dernier))}`;
}

export const ddmProposee = (fabrication: string, mois: number | null) =>
  fabrication && mois && mois > 0 ? ajouterMois(fabrication, mois) : "";

/** N° de lot d'un produit fini : code lot + fabrication JJMMAA + DDM MMAA. */
export function numeroLotProduit(code: string, fabrication: string, ddm: string): string {
  if (!code || !fabrication) return "";
  const [a, m, j] = fabrication.split("-");
  let numero = String(code).trim() + j + m + a.slice(2);
  if (ddm) {
    const [aa, mm] = ddm.split("-");
    numero += mm + aa.slice(2);
  }
  return numero;
}

/** Jours entre aujourd'hui et une date AAAA-MM-JJ (négatif si passée). */
export function joursAvant(iso: string): number {
  const [a, m, j] = iso.split("-").map(Number);
  const t = new Date();
  return Math.round((Date.UTC(a, m - 1, j) - Date.UTC(t.getFullYear(), t.getMonth(), t.getDate())) / 86400000);
}

export type Alerte = "bad" | "warn";

/** DDM dépassée (bad) ou à moins de 30 jours (warn). */
export function etatDdm(lot: Lot): { k: Alerte; texte: string } | null {
  if (!lot.ddm) return null;
  const jours = joursAvant(lot.ddm);
  const quoi = lot.categorie === "produit" ? "DDM" : "Date limite";
  if (jours < 0) return { k: "bad", texte: `${quoi} dépassée` };
  if (jours <= 30) return { k: "warn", texte: jours === 0 ? `${quoi} aujourd'hui` : `${quoi} dans ${jours} j` };
  return null;
}

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const HEURE = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
const JOUR = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
const JOUR_ISO = new Intl.DateTimeFormat("fr-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Paris" });

export const dateCourte = (iso: string) => (iso ? DATE.format(new Date(`${iso}T00:00:00Z`)) : "—");
export const heure = (ms: number) => HEURE.format(new Date(ms));
export const jourIso = (ms: number) => JOUR_ISO.format(new Date(ms));
export function jourLong(ms: number): string {
  const s = JOUR.format(new Date(ms));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------- Stock ---------- */

export type Filtre = "tout" | string;

/** Quantité d'un lot à un emplacement (ou partout). */
export function qteLot(lot: Lot, emplacement: Filtre): number {
  if (emplacement !== "tout") return lot.quantites[emplacement] || 0;
  return arrondi(Object.values(lot.quantites).reduce((s, q) => s + (q > 0 ? q : 0), 0));
}

/** Stock d'un article à un emplacement (ou partout). */
export function stockArticle(etat: Etat, article: string, emplacement: Filtre): number {
  const parEmplacement = etat.stock[article] || {};
  if (emplacement !== "tout") return parEmplacement[emplacement] || 0;
  return arrondi(Object.values(parEmplacement).reduce((s, q) => s + (q > 0 ? q : 0), 0));
}

/** Ordre de sortie : DDM la plus proche d'abord, puis fabrication la plus ancienne. */
export function ordreSortie(a: Lot, b: Lot): number {
  const c = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0);
  return c(a.ddm || "9999-12-31", b.ddm || "9999-12-31") || c(a.fabrication || "", b.fabrication || "") || (a.creeLe || 0) - (b.creeLe || 0);
}

export const lotsDe = (etat: Etat, article: string, emplacement: Filtre) =>
  etat.lots.filter((l) => l.article === article && qteLot(l, emplacement) > EPS).sort(ordreSortie);

/** Seuil d'alerte d'un article à un emplacement (Marseille et ferme seulement). */
export function seuil(a: Article, emplacement: string): number {
  if (emplacement === "marseille") return a.seuilMarseille || 0;
  if (emplacement === "ferme") return a.seuilFerme || 0;
  return 0;
}

/** Alertes de la vue Stock : articles sous le seuil, et lots à DDM proche ou dépassée. */
export function alertes(etat: Etat, filtre: Filtre) {
  const lieux = filtre === "tout" ? ["marseille", "ferme"] : [filtre];
  const sousSeuil = new Set<string>();
  etat.articles.forEach((a) => {
    if (!a.actif) return;
    lieux.forEach((l) => {
      const s = seuil(a, l);
      if (s > 0 && stockArticle(etat, a.id, l) < s) sousSeuil.add(a.id);
    });
  });
  const ddm = new Map<string, Alerte>();
  let depassees = 0;
  let proches = 0;
  etat.lots.forEach((l) => {
    if (qteLot(l, filtre) <= EPS) return;
    const e = etatDdm(l);
    if (!e) return;
    if (e.k === "bad") depassees++;
    else proches++;
    if (ddm.get(l.article) !== "bad") ddm.set(l.article, e.k);
  });
  return { sousSeuil, ddm, depassees, proches };
}

export const articlesDe = (etat: Etat, categorie: Categorie, avecMasques = false) =>
  etat.articles
    .filter((a) => a.categorie === categorie && (avecMasques || a.actif))
    .sort((x, y) => (x.ordre ?? 999) - (y.ordre ?? 999) || x.nom.localeCompare(y.nom, "fr"));

/** Couleur d'un produit fini, reprise du catalogue du site (pastille). */
export function couleur(a: Article | undefined): string | undefined {
  if (!a || a.categorie !== "produit") return undefined;
  const produit = ALL_PRODUCTS.find((p) => p.id === a.id);
  return produit ? produit.color : undefined;
}

export const nomCourt = (etat: Etat, id: string) => {
  const e = etat.emplacements.find((x) => x.id === id);
  return e ? e.court || e.nom : id;
};

/* ---------- Divers ---------- */

/** « Farine de blé » → « farine-de-ble » */
export function slug(texte: string): string {
  return (
    texte
      .replace(/œ/gi, "oe")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 34) || "article"
  );
}

/** CSV pour Excel : séparateur « ; », décimales à virgule, BOM pour les accents. */
export function csv(lignes: (string | number)[][]): string {
  return (
    "﻿" +
    lignes
      .map((l) =>
        l
          .map((v) => {
            const s = typeof v === "number" ? String(arrondi(v)).replace(".", ",") : String(v ?? "");
            return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(";")
      )
      .join("\r\n")
  );
}

export function telecharger(nom: string, contenu: string): void {
  const url = URL.createObjectURL(new Blob([contenu], { type: "text/csv;charset=utf-8" }));
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
