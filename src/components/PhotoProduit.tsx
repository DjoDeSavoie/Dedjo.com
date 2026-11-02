import { cn } from "@/lib/utils";
import { Product } from "@/lib/catalog";
import { HAUTEUR_PHOTO, LARGEUR_PHOTO, Photo, TAILLES_PHOTO, photosDe } from "@/lib/photos";

interface PhotoProduitProps {
  photo: Photo;
  /** Fond affiché pendant le chargement : la couleur du produit. */
  couleur: string;
  sizes: string;
  className?: string;
  /** Texte alternatif ; "" quand le nom du produit est déjà écrit à côté. */
  alt?: string;
}

/** Photo d'un produit, au format 4:3, en 600 ou 1200 px selon la place à l'écran. */
const PhotoProduit = ({ photo, couleur, sizes, className, alt = photo.alt }: PhotoProduitProps) => (
  <img
    src={photo.petite}
    srcSet={`${photo.petite} 600w, ${photo.grande} 1200w`}
    sizes={sizes}
    width={LARGEUR_PHOTO}
    height={HAUTEUR_PHOTO}
    alt={alt}
    loading="lazy"
    decoding="async"
    className={cn("block w-full h-auto aspect-[4/3] object-cover rounded-xl", className)}
    style={{ backgroundColor: couleur }}
  />
);

/**
 * Photo n° 1 en haut d'une carte produit : un clic ouvre la pop-up, comme « Voir les détails ».
 * Rien si le produit n'a pas de photo (la carte garde alors son emoji).
 */
export const PhotoCarte = ({ product, onClick }: { product: Product; onClick: () => void }) => {
  const photo = photosDe(product.id)[0];
  if (!photo) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full mb-4 rounded-xl cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <PhotoProduit photo={photo} couleur={product.color} sizes={TAILLES_PHOTO.carte} />
      <span className="sr-only">Voir les détails</span>
    </button>
  );
};

export default PhotoProduit;
