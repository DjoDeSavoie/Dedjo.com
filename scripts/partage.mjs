/* ===================================================================
   IMAGE DE PARTAGE — npm run partage
   Image montrée par les réseaux sociaux et les messageries quand on
   partage un lien vers dedjo.com (og:image et twitter:image d'index.html).
   Part de la photo n° 1 de La Lune (celle de sa carte), la recadre au
   centre en 1200 × 630, et l'écrit en JPEG qualité 82, SANS métadonnées,
   dans public/partage-dedjo.jpg. À relancer si cette photo change.
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
const POIDS_MAX = 200 * 1024;

// sharp n'écrit aucune métadonnée (EXIF, GPS…) tant qu'on n'appelle pas withMetadata()
await sharp(ENTREE)
  .resize(LARGEUR, HAUTEUR, { fit: "cover", position: "centre" })
  .jpeg({ quality: QUALITE })
  .toFile(SORTIE);

const { size } = await stat(SORTIE);
const poids = `${Math.round(size / 1024)} ko`;
console.log(`${path.relative(RACINE, SORTIE)} : ${LARGEUR} × ${HAUTEUR}, ${poids}`);
if (size > POIDS_MAX) {
  console.warn(`Attention : plus de ${POIDS_MAX / 1024} ko, baisse QUALITE dans scripts/partage.mjs.`);
  process.exitCode = 1;
}
