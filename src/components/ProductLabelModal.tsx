import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Product } from "@/lib/catalog";

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
    <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">{title}</h4>
    <div className="text-sm text-muted-foreground space-y-1">{children}</div>
  </div>
);

/** Pop-up infos produit (même format que les autres pop-ups du site), texte repris des étiquettes. */
const ProductLabelModal = ({ product, open, onOpenChange }: ProductLabelModalProps) => {
  if (!product) return null;
  const { label } = product;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto">
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

          {label.quantite && (
            <Section title="📦 Quantité">
              <p>{label.quantite}</p>
            </Section>
          )}

          <Section title="🧊 Conservation">
            <p>{label.conservation}</p>
          </Section>

          {label.ddm && (
            <Section title="📅 DDM">
              <p>{label.ddm}</p>
            </Section>
          )}

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
