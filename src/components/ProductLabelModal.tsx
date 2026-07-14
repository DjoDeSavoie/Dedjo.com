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

/** Transforme "Contient **gluten**, **lait**." en fragments avec les mots en gras. */
const renderBold = (text: string) =>
  text.split("**").map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="text-destructive">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );

const ProductLabelModal = ({ product, open, onOpenChange }: ProductLabelModalProps) => {
  if (!product) return null;
  const { label } = product;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[88vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-display text-2xl">
            <span className="text-3xl">{product.emoji}</span>
            {product.name}
          </DialogTitle>
          <DialogDescription className="text-left pt-2">{label.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              📋 Ingrédients
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {label.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
              ⚠️ Allergènes
            </h4>
            <p className="text-sm text-muted-foreground">{renderBold(label.allergenes)}</p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
              🔥 Cuisson
            </h4>
            <p className="text-sm text-muted-foreground">{label.cuisson}</p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
              🧊 Conservation
            </h4>
            <p className="text-sm text-muted-foreground">{label.conservation}</p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
              📅 DDM
            </h4>
            <p className="text-sm text-muted-foreground">{label.ddm}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductLabelModal;
