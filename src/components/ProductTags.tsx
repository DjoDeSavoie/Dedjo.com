import { Clock, Info } from "lucide-react";
import { Product } from "@/lib/catalog";

/** Remplace l'action « commander » d'un produit pas encore en vente (voir DISPONIBILITE). */
export const BientotDisponible = ({ className = "" }: { className?: string }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold bg-[#FFF6DB] text-[#7a5a00] border border-[#F5C842] px-3 py-1.5 rounded-full ${className}`}
  >
    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
    Bientôt disponible
  </span>
);

/** Pastilles d'un produit : labels qualité, puis mention douce des allergènes présents. */
const ProductTags = ({ product, className = "" }: { product: Product; className?: string }) => {
  const allergens = product.allergens ?? [];
  if (!product.labels?.length && !allergens.length) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {product.labels?.map((label) => (
        <span
          key={label}
          className="text-[0.7rem] font-semibold bg-white/85 border border-foreground/10 text-foreground/80 px-2 py-0.5 rounded-full"
        >
          {label}
        </span>
      ))}
      {allergens.length > 0 && (
        <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold bg-[#eaf3fb] border border-[#cfe3f6] text-[#16527f] px-2 py-0.5 rounded-full">
          <Info className="w-3 h-3" aria-hidden="true" />
          Contient : {allergens.map((a) => a.toLowerCase()).join(", ")}
        </span>
      )}
    </div>
  );
};

export default ProductTags;
