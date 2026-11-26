/* ===================================================================
   IMAGE DE PARTAGE — npm run partage
   Image montrée par les réseaux sociaux et les messageries quand on
   partage un lien vers dedjo.com (og:image et twitter:image d'index.html).
   Part de la photo n° 1 de La Lune (celle de sa carte), détourée sur fond
   transparent : rogne les bords transparents, réduit les croissants pour
   qu'ils tiennent entiers à environ 86 % de la hauteur, les centre sur un
   fond crème 1200 × 630 (en JPEG, la transparence deviendrait noire), et
   écrit le tout en JPEG qualité 82, SANS métadonnées, dans
   public/partage-dedjo.jpg. À relancer si cette photo change.
   =================================================================== */
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTREE = path.join(RACINE, "src/assets/produits/lune-1-1200.webp");
const SORTIE = path.join(RACINE, "public/partage-dedjo.jpg");

const LARGEUR = 1200;
const HAUTEUR = 630;
const QUALITE = 82;
const CREME = "#F5F0E5";
const PART_HAUTEUR = 0.86; // hauteur max des croissants, en part de l'image
const PART_LARGEUR = 0.9; // largeur max, pour garder une marge sur les côtés
const POIDS_MAX = 200 * 1024;

// sharp n'écrit aucune métadonnée (EXIF, GPS…) tant qu'on n'appelle pas withMetadata()
// 1. Rogne les bords transparents (trim compare au pixel du coin, transparent ici)
const { data: rogne, info } = await sharp(ENTREE)
  .ensureAlpha()
  .trim({ threshold: 1 })
  .png()
  .toBuffer({ resolveWithObject: true });

// 2. Réduit pour tenir entier dans la zone utile, sans jamais agrandir
const echelle = Math.min(
  (HAUTEUR * PART_HAUTEUR) / info.height,
  (LARGEUR * PART_LARGEUR) / info.width,
  1,
);
const l = Math.round(info.width * echelle);
const h = Math.round(info.height * echelle);
const croissants = await sharp(rogne).resize(l, h).png().toBuffer();

// 3. Centre sur le fond crème, aplatit la transparence sur ce même crème
const gauche = Math.floor((LARGEUR - l) / 2);
const haut = Math.floor((HAUTEUR - h) / 2);
await sharp(croissants)
  .extend({
    top: haut,
    bottom: HAUTEUR - h - haut,
    left: gauche,
    right: LARGEUR - l - gauche,
    background: CREME,
  })
  .flatten({ background: CREME })
  .jpeg({ quality: QUALITE })
  .toFile(SORTIE);

const { size } = await stat(SORTIE);
const poids = `${Math.round(size / 1024)} ko`;
console.log(`${path.relative(RACINE, SORTIE)} : ${LARGEUR} × ${HAUTEUR}, ${poids}`);
if (size > POIDS_MAX) {
  console.warn(`Attention : plus de ${POIDS_MAX / 1024} ko, baisse QUALITE dans scripts/partage.mjs.`);
  process.exitCode = 1;
}
