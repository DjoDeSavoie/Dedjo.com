import { ReactNode, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import PhotoProduit from "@/components/PhotoProduit";
import { Product } from "@/lib/catalog";
import { TAILLES_PHOTO, photosDe } from "@/lib/photos";

interface ProductLabelModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Transforme "**farine de blé**, eau" en fragments, les passages entre ** en gras. */
const renderBold = (text: string) =>
  text.split("**").map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <h4 className="text-foreground mb-1 flex items-center gap-2">{title}</h4>
    <div className="text-sm text-muted-foreground space-y-1">{children}</div>
  </div>
);

/**
 * Photos du produit en haut de la pop-up : une seule photo telle quelle, ou à partir de deux
 * un carrousel à faire glisser (sans défilement automatique), avec un point par photo.
 * Marge du haut : la croix de fermeture ne cache pas la photo.
 */
const PhotosPopup = ({ product }: { product: Product }) => {
  const photos = photosDe(product.id);
  const [api, setApi] = useState<CarouselApi>();
  const [actuelle, setActuelle] = useState(0);

  useEffect(() => {
    if (!api) return;
    const surSelection = () => setActuelle(api.selectedScrollSnap());
    surSelection();
    api.on("select", surSelection);
    api.on("reInit", surSelection);
    return () => {
      api.off("select", surSelection);
      api.off("reInit", surSelection);
    };
  }, [api]);

  if (!photos.length) return null;
  if (photos.length === 1) {
    return <PhotoProduit photo={photos[0]} couleur={product.color} sizes={TAILLES_PHOTO.popup} className="mt-6" />;
  }

  return (
    <Carousel setApi={setApi} className="mt-6" aria-label={`Photos de ${product.name}`}>
      <CarouselContent>
        {photos.map((photo, i) => (
          <CarouselItem key={photo.n} aria-label={`Photo ${i + 1} sur ${photos.length}`}>
            <PhotoProduit photo={photo} couleur={product.color} sizes={TAILLES_PHOTO.popup} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="flex justify-center pt-1">
        {photos.map((photo, i) => (
          <button
            key={photo.n}
            type="button"
            onClick={() => api?.scrollTo(i)}
            aria-label={`Voir la photo ${i + 1} sur ${photos.length}`}
            aria-current={i === actuelle ? "true" : undefined}
            className="group p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className={`block h-2 rounded-full transition-all ${
                i === actuelle ? "w-5 bg-primary" : "w-2 bg-foreground/25 group-hover:bg-foreground/40"
              }`}
            />
          </button>
        ))}
      </div>
    </Carousel>
  );
};

/** Pop-up infos produit (même format que les autres pop-ups du site), texte repris des étiquettes. */
const ProductLabelModal = ({ product, open, onOpenChange }: ProductLabelModalProps) => {
  if (!product) return null;
  const { label } = product;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto">
        {/* key : en changeant de produit, le carrousel repart de la première photo */}
        <PhotosPopup key={product.id} product={product} />
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
          <Section title="🔥 Préparation">
            <p>{renderBold(label.preparation)}</p>
          </Section>

          {label.tip && (
            <Section title={`💡 ${label.tip.title}`}>
              <p>{label.tip.text}</p>
            </Section>
          )}

          <Section title="📋 Ingrédients">
            {label.denomination && <p className="font-medium text-foreground/80">{label.denomination}</p>}
            <p>{renderBold(label.ingredients)}</p>
            {label.traces && <p className="italic">{label.traces}</p>}
          </Section>

          {label.allergenes && (
            <Section title="⚠️ Allergènes">
              <p>{renderBold(label.allergenes)}</p>
            </Section>
          )}

          <Section title="📦 Quantité">
            <p>{label.quantite}</p>
          </Section>

          <Section title="🧊 Conservation">
            <p>{label.conservation}</p>
          </Section>

          {label.ddm && (
            <Section title="📅 DDM">
              <p>{label.ddm}</p>
            </Section>
          )}

          <Section title="🏷️ Fabriqué par">
            <p>{label.exploitant}</p>
          </Section>

          {product.note && (
            <Section title="ℹ️ Bon à savoir">
              <p>{product.note}</p>
            </Section>
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
