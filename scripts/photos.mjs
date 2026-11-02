/* ===================================================================
   PHOTOS DES PRODUITS — npm run photos
   Prend les photos de photos-originales/ (hors du dépôt) et prépare les
   fichiers du site dans src/assets/produits/ :
     {id}-{n}.jpg|jpeg|png  →  {id}-{n}-600.webp et {id}-{n}-1200.webp
   n° 1 = photo de la carte, n° 2 et suivants = photos de la pop-up.

   Orientation corrigée, recadrage 4:3 centré, WebP qualité 78 (baissée
   si le fichier 1200 px dépasse 150 ko), et TOUTES les métadonnées
   supprimées : EXIF, dont la position GPS du téléphone.
   =================================================================== */
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { ALL_PRODUCTS } from "../src/lib/catalog.ts";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTREE = path.join(RACINE, "photos-originales");
const SORTIE = path.join(RACINE, "src/assets/produits");

const IDS = ALL_PRODUCTS.map((p) => p.id);
const LARGEURS = [600, 1200];
const QUALITE = 78;
const QUALITE_MINI = 60;
const POIDS_MAX_1200 = 150 * 1024;

const ko = (octets) => `${Math.round(octets / 1024)} ko`;

/** Vérifie le nom de chaque fichier ; renvoie les photos à traiter, ou les raisons du refus. */
function verifier(fichiers) {
  const photos = [];
  const refus = [];
  const vus = new Map();
  for (const fichier of fichiers) {
    const ext = path.extname(fichier).toLowerCase();
    if (ext === ".heic" || ext === ".heif") {
      refus.push(
        `${fichier} : format HEIC refusé. Exporte la photo en JPEG (Photos > Fichier > Exporter), ` +
          `ou sur iPhone : Réglages > Appareil photo > Formats > « Le plus compatible ».`,
      );
      continue;
    }
    const m = /^([a-z]+)-(\d+)\.(jpe?g|png)$/i.exec(fichier);
    if (!m) {
      refus.push(`${fichier} : nom attendu {id}-{n}.jpg, .jpeg ou .png (ex. lune-1.jpg).`);
      continue;
    }
    const id = m[1].toLowerCase();
    const n = Number(m[2]);
    if (!IDS.includes(id)) {
      refus.push(`${fichier} : produit « ${id} » inconnu. Produits possibles : ${IDS.join(", ")}.`);
      continue;
    }
    if (n < 1) {
      refus.push(`${fichier} : les numéros commencent à 1 (1 = photo de la carte).`);
      continue;
    }
    const cle = `${id}-${n}`;
    if (vus.has(cle)) {
      refus.push(`${fichier} : ${vus.get(cle)} porte déjà le numéro ${cle}.`);
      continue;
    }
    vus.set(cle, fichier);
    photos.push({ fichier, cle });
  }
  return { photos, refus };
}

/** Écrit une taille, en baissant la qualité si la version 1200 px est trop lourde. */
async function ecrire(source, largeur, destination) {
  const hauteur = (largeur * 3) / 4;
  let qualite = QUALITE;
  for (;;) {
    // rotate() sans argument redresse la photo selon son EXIF ; sharp n'écrit
    // ensuite aucune métadonnée (pas de withMetadata / keepMetadata).
    const info = await sharp(source)
      .rotate()
      .resize(largeur, hauteur, { fit: "cover", position: "centre" })
      .webp({ quality: qualite, effort: 6 })
      .toFile(destination);
    if (largeur < 1200 || info.size <= POIDS_MAX_1200 || qualite <= QUALITE_MINI) return { taille: info.size, qualite };
    qualite -= 6;
  }
}

/** Refuse un fichier de sortie qui garderait une métadonnée. */
async function verifierSansMetadonnees(fichier) {
  const meta = await sharp(fichier).metadata();
  const restes = ["exif", "xmp", "iptc", "icc"].filter((cle) => meta[cle]);
  if (restes.length) throw new Error(`${path.basename(fichier)} contient encore : ${restes.join(", ")}`);
}

async function main() {
  await mkdir(ENTREE, { recursive: true });
  const fichiers = (await readdir(ENTREE)).filter((f) => !f.startsWith(".")).sort();
  if (!fichiers.length) {
    console.log(`Aucune photo dans photos-originales/. Dépose-y tes photos (ex. lune-1.jpg), puis relance npm run photos.`);
    return;
  }

  const { photos, refus } = verifier(fichiers);
  if (refus.length) {
    console.error("Aucune photo préparée, corrige d'abord :");
    refus.forEach((r) => console.error(`  ✗ ${r}`));
    process.exitCode = 1;
    return;
  }

  await mkdir(SORTIE, { recursive: true });
  let tropLourdes = 0;
  for (const { fichier, cle } of photos) {
    const source = path.join(ENTREE, fichier);
    const { width = 0, height = 0, orientation = 1 } = await sharp(source).metadata();
    // Orientation 5 à 8 : la photo est tournée d'un quart de tour, largeur et hauteur s'échangent
    const [largeurReelle, hauteurReelle] = orientation >= 5 ? [height, width] : [width, height];
    const lignes = [];
    for (const largeur of LARGEURS) {
      const destination = path.join(SORTIE, `${cle}-${largeur}.webp`);
      const { taille, qualite } = await ecrire(source, largeur, destination);
      await verifierSansMetadonnees(destination);
      const alerte = largeur === 1200 && taille > POIDS_MAX_1200;
      if (alerte) tropLourdes++;
      lignes.push(
        `${path.basename(destination)} ${ko(taille)}${qualite !== QUALITE ? ` (qualité ${qualite})` : ""}${alerte ? " ⚠️ plus de 150 ko" : ""}`,
      );
    }
    const petite = largeurReelle < 1200 || hauteurReelle < 900 ? ` ⚠️ photo petite (${largeurReelle}×${hauteurReelle}), agrandie` : "";
    console.log(`✓ ${fichier}${petite}\n    ${lignes.join("\n    ")}`);
  }

  console.log(`\n${photos.length} photo(s) prête(s) dans src/assets/produits/, sans métadonnées.`);
  if (tropLourdes) console.log(`${tropLourdes} fichier(s) 1200 px au-dessus de 150 ko : essaie une photo moins chargée en détails.`);
}

main().catch((erreur) => {
  console.error(`✗ ${erreur.message}`);
  process.exitCode = 1;
});
