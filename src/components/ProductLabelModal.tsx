import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MentionsEtiquette, PhotosProduit, RubriqueEtiquette } from "@/components/EtiquetteProduit";
import TexteRiche from "@/components/TexteRiche";
import { Product } from "@/lib/catalog";
import { TAILLES_PHOTO } from "@/lib/photos";

interface ProductLabelModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Pop-up infos produit (même format que les autres pop-ups du site), texte repris des étiquettes.
 * Les photos et les mentions de l'étiquette sont partagées avec les fiches produits (EtiquetteProduit.tsx).
 */
const ProductLabelModal = ({ product, open, onOpenChange }: ProductLabelModalProps) => {
  if (!product) return null;
  const { label } = product;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto">
        {/* key : en changeant de produit, le carrousel repart de la première photo.
            Marge du haut : la croix de fermeture ne cache pas la photo. */}
        <PhotosProduit key={product.id} product={product} sizes={TAILLES_PHOTO.popup} className="mt-6" />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-display text-2xl">
            <span className="text-3xl">{product.emoji}</span>
            {product.name}
          </DialogTitle>
          {label.badge && (
            <p className="text-xs font-semibold uppercase tracking-widest text-primary text-left">
              {label.badge}
            </p>
          )}
          <DialogDescription className="text-left pt-2">{label.description}</DialogDescription>
          {label.tagline && <p className="text-left text-sm italic text-foreground/80">{label.tagline}</p>}
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <RubriqueEtiquette titre="🔥 Préparation">
            <p>
              <TexteRiche texte={label.preparation} />
            </p>
          </RubriqueEtiquette>

          {label.tip && (
            <RubriqueEtiquette titre={`💡 ${label.tip.title}`}>
              <p>{label.tip.text}</p>
            </RubriqueEtiquette>
          )}

          <MentionsEtiquette label={label} />

          {product.note && (
            <RubriqueEtiquette titre="ℹ️ Bon à savoir">
              <p>{product.note}</p>
            </RubriqueEtiquette>
          )}

          {label.mention && (
            <p className="text-sm italic text-muted-foreground text-center pt-3 border-t border-border">
              {label.mention}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductLabelModal;
