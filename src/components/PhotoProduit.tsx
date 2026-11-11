import { Camera } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
 * Petit bouton appareil photo sur une carte produit : un clic ouvre la photo n° 1 en grand.
 * Rien si le produit n'a pas de photo. La photo n'est pas affichée sur la carte, pour la garder compacte.
 */
export const BoutonPhoto = ({ product, className }: { product: Product; className?: string }) => {
  const photo = photosDe(product.id)[0];
  if (!photo) return null;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Voir la photo : ${product.name}`}
          title="Voir la photo"
          className={cn(
            "inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/60 hover:bg-white/90 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <Camera className="w-4 h-4" aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-4">
        <DialogTitle className="font-display text-xl">{product.name}</DialogTitle>
        <DialogDescription className="sr-only">{photo.alt}</DialogDescription>
        <PhotoProduit photo={photo} couleur={product.color} sizes={TAILLES_PHOTO.popup} />
      </DialogContent>
    </Dialog>
  );
};

export default PhotoProduit;
