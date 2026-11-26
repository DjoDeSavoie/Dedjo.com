import { cn } from "@/lib/utils";
import { HAUTEUR_PHOTO, LARGEUR_PHOTO, Photo } from "@/lib/photos";

interface PhotoProduitProps {
  photo: Photo;
  sizes: string;
  className?: string;
  /** Texte alternatif ; "" quand le nom du produit est déjà écrit à côté. */
  alt?: string;
  /** « eager » pour la photo principale d'une page (fiche produit) ; sinon chargée à l'approche de l'écran. */
  chargement?: "lazy" | "eager";
}

/**
 * Photo détourée d'un produit, au format 4:3, en 600 ou 1200 px selon la place à l'écran.
 * Posée sur la crème des cartes, jamais sur la couleur du produit.
 */
const PhotoProduit = ({ photo, sizes, className, alt = photo.alt, chargement = "lazy" }: PhotoProduitProps) => (
  <img
    src={photo.petite}
    srcSet={`${photo.petite} 600w, ${photo.grande} 1200w`}
    sizes={sizes}
    width={LARGEUR_PHOTO}
    height={HAUTEUR_PHOTO}
    alt={alt}
    loading={chargement}
    decoding="async"
    className={cn("block w-full h-auto aspect-[4/3] object-cover rounded-xl bg-creme-carte", className)}
  />
);

export default PhotoProduit;
