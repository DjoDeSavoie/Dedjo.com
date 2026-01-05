import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ProductDetail {
  name: string;
  emoji: string;
  description: string;
  ingredients: string[];
  madeBy: string;
  whereToBuy: string;
  additionalInfo?: string;
}

interface ProductDetailModalProps {
  product: ProductDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductDetailModal = ({ product, open, onOpenChange }: ProductDetailModalProps) => {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-display text-2xl">
            <span className="text-3xl">{product.emoji}</span>
            {product.name}
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            {product.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {/* Ingredients */}
          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              📋 Ingredients
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {product.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          {/* Made By */}
          <div>
            <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
              👨‍🍳 Made By
            </h4>
            <p className="text-sm text-muted-foreground">{product.madeBy}</p>
          </div>

          {/* Where to Buy */}
          <div>
            <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
              📍 Where to Buy
            </h4>
            <p className="text-sm text-muted-foreground">{product.whereToBuy}</p>
          </div>

          {/* Additional Info */}
          {product.additionalInfo && (
            <div>
              <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                ℹ️ Good to Know
              </h4>
              <p className="text-sm text-muted-foreground">{product.additionalInfo}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
