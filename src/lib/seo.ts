/* ===================================================================
   RÉFÉRENCEMENT — titre et balises du <head> propres à chaque page
   index.html porte ceux de l'accueil (lus par les robots qui n'exécutent
   pas le JavaScript) ; à l'affichage d'une page, useMetaPage les remplace
   par les siens. Chaque balise est créée si elle manque, jamais en double.
   L'Atelier gère seul son titre et son noindex (src/pages/Atelier.tsx).
   =================================================================== */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Adresse publique du site, sans barre finale. */
const ORIGINE_SITE = "https://dedjo.com";

type MetaPage = {
  /** Titre de l'onglet et des résultats de recherche. */
  titre: string;
  /** Résumé affiché sous le titre dans les résultats ; sans lui, la balise est retirée. */
  description?: string;
  /** Faux : la page demande à ne pas être indexée (noindex). */
  indexer?: boolean;
};

/** La balise du <head> qui répond au sélecteur ; créée si elle manque. */
function baliseHead<T extends HTMLElement>(selecteur: string, creer: () => T): T {
  const existante = document.head.querySelector<T>(selecteur);
  if (existante) return existante;
  const balise = creer();
  document.head.appendChild(balise);
  return balise;
}

function metaNommee(nom: string): HTMLMetaElement {
  return baliseHead(`meta[name="${nom}"]`, () => {
    const meta = document.createElement("meta");
    meta.name = nom;
    return meta;
  });
}

/** Adresse canonique : le chemin seul (sans ancre ni paramètres), sans barre finale hors accueil. */
function adresseCanonique(chemin: string): string {
  const propre = chemin.length > 1 ? chemin.replace(/\/+$/, "") : chemin;
  return ORIGINE_SITE + (propre || "/");
}

/** Pose le titre, la description, l'adresse canonique et, au besoin, le noindex de la page affichée. */
export function useMetaPage({ titre, description, indexer = true }: MetaPage) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = titre;

    if (description) metaNommee("description").content = description;
    else document.head.querySelector('meta[name="description"]')?.remove();

    baliseHead<HTMLLinkElement>('link[rel="canonical"]', () => {
      const lien = document.createElement("link");
      lien.rel = "canonical";
      return lien;
    }).href = adresseCanonique(pathname);

    if (indexer) document.head.querySelector('meta[name="robots"]')?.remove();
    else metaNommee("robots").content = "noindex";
  }, [titre, description, indexer, pathname]);
}
