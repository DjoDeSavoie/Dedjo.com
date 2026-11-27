import { cn } from "@/lib/utils";
import { HAUTEUR_PHOTO, LARGEUR_PHOTO, Photo } from "@/lib/photos";

interface PhotoProduitProps {
  photo: Photo;
  sizes: string;
  /**
   * Classes de la zone photo (taille, marges, forme). La zone coupe l'ombre à son bord, comme un
   * cadre ; « overflow-visible » quand elle a la couleur de la carte autour (cartes, galerie) :
   * la coupe se verrait alors comme un trait.
   */
  className?: string;
  /** Texte alternatif ; "" quand le nom du produit est déjà écrit à côté. */
  alt?: string;
  /** « eager » pour la photo principale d'une page (fiche produit) ; sinon chargée à l'approche de l'écran. */
  chargement?: "lazy" | "eager";
  /**
   * Vrai : le produit entier, avec une ombre qui suit son contour pour le détacher de la crème.
   * Faux : une vignette recadrée (pastille), où l'ombre suivrait la découpe et non le produit.
   */
  relief?: boolean;
}

/**
 * Photo détourée d'un produit, au format 4:3, en 600 ou 1200 px selon la place à l'écran.
 * Posée sur la crème des cartes, jamais sur la couleur du produit. La crème est portée par la zone
 * et l'ombre par l'image seule : une ombre sur un élément qui a un fond suivrait son rectangle.
 */
const PhotoProduit = ({
  photo,
  sizes,
  className,
  alt = photo.alt,
  chargement = "lazy",
  relief = true,
}: PhotoProduitProps) => (
  <div className={cn("aspect-[4/3] overflow-hidden rounded-xl bg-creme-carte", className)}>
    <img
      src={photo.petite}
      srcSet={`${photo.petite} 600w, ${photo.grande} 1200w`}
      sizes={sizes}
      width={LARGEUR_PHOTO}
      height={HAUTEUR_PHOTO}
      alt={alt}
      loading={chargement}
      decoding="async"
      className={cn("block w-full h-full", relief ? "object-contain relief-produit" : "object-cover")}
    />
  </div>
);

export default PhotoProduit;
