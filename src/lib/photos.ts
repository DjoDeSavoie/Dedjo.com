/* ===================================================================
   PHOTOS DES PRODUITS
   Les fichiers sont préparés par « npm run photos » (voir le README) dans
   src/assets/produits/ : {id}-{n}-600.webp et {id}-{n}-1200.webp, au format 4:3.
   n° 1 = photo de la carte, n° 2 et suivants = photos de la pop-up.
   Un produit sans photo garde son emoji.

   Fichier à part de catalog.ts : l'Atelier et ses tests Node lisent le
   catalogue et ne savent pas charger une image.
   =================================================================== */
import { ALL_PRODUCTS } from "@/lib/catalog";

/* ███  TEXTES ALTERNATIFS — À MODIFIER  ███
   Par défaut : « {nom} — {type} ». Pour décrire une photo précise, ajoute
   sa clé {id}-{n}, ex. "lune-2": "La Lune coupée en deux, le feuilletage bien visible". */
const ALT: Record<string, string> = {};

export interface Photo {
  n: number;
  /** Version 600 px de large. */
  petite: string;
  /** Version 1200 px de large. */
  grande: string;
  alt: string;
}

/** Dimensions de la version 1200 px (format 4:3), pour réserver la place avant le chargement. */
export const LARGEUR_PHOTO = 1200;
export const HAUTEUR_PHOTO = 900;

/* Largeur affichée de la photo à chaque emplacement (attribut sizes), pour que le navigateur
   choisisse entre la version 600 et la version 1200 px. Calculée d'après les marges des sections. */
export const TAILLES_PHOTO = {
  /** Cartes de l'accueil : une colonne sur mobile, deux à partir de 768 px. */
  carte: "(min-width: 1184px) 484px, (min-width: 768px) calc(50vw - 108px), calc(100vw - 144px)",
  /** Pop-up « Voir les détails » (max-w-md). */
  popup: "(min-width: 448px) 400px, calc(100vw - 48px)",
  /** Pastille ronde de la page Commande. */
  pastille: "36px",
};

const FICHIERS = import.meta.glob<string>("/src/assets/produits/*.webp", { eager: true, import: "default" });

/** Les feuilletés n'ont pas de type dans le catalogue. */
const altParDefaut = (id: string) => {
  const p = ALL_PRODUCTS.find((produit) => produit.id === id);
  return p ? `${p.name} — ${p.type ?? "friand feuilleté salé"}` : "";
};

const PHOTOS: Record<string, Photo[]> = {};
{
  const tailles: Record<string, { id: string; n: number; 600?: string; 1200?: string }> = {};
  for (const [chemin, url] of Object.entries(FICHIERS)) {
    const m = /\/([a-z]+)-(\d+)-(600|1200)\.webp$/.exec(chemin);
    if (!m) continue;
    const cle = `${m[1]}-${m[2]}`;
    tailles[cle] ??= { id: m[1], n: Number(m[2]) };
    tailles[cle][m[3] === "600" ? 600 : 1200] = url;
  }
  for (const [cle, t] of Object.entries(tailles)) {
    if (!t[600] || !t[1200]) {
      if (import.meta.env.DEV) console.warn(`Photo ${cle} ignorée : il manque la version 600 ou 1200 px (relance npm run photos).`);
      continue;
    }
    (PHOTOS[t.id] ??= []).push({ n: t.n, petite: t[600], grande: t[1200], alt: ALT[cle] ?? altParDefaut(t.id) });
  }
  Object.values(PHOTOS).forEach((photos) => photos.sort((a, b) => a.n - b.n));
}

/** Photos d'un produit, triées par n° (la première est celle de la carte) ; tableau vide s'il n'en a pas. */
export const photosDe = (id: string): Photo[] => PHOTOS[id] ?? [];
