import { Clock, Flower2, Heart, Info, LucideIcon, Mountain, Snowflake, Sprout, Stamp } from "lucide-react";
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

/** Icône et couleur d'encre de chaque label ; un label absent de la liste prend le tampon par défaut. */
const TAMPONS: Record<string, { icone: LucideIcon; encre: string }> = {
  "Crème aux grains de vanille": { icone: Flower2, encre: "#9a6b1f" },
  "Pour tenir l'hiver": { icone: Snowflake, encre: "#2f6f9f" },
  "La cueillette en Savoie": { icone: Mountain, encre: "#3d7a4e" },
  "Le sucré/salé réconfortant": { icone: Heart, encre: "#b0503a" },
  "Aux légumes de saison": { icone: Sprout, encre: "#5c8a2c" },
};
const TAMPON_PAR_DEFAUT = { icone: Stamp, encre: "#185FA5" };

/**
 * Labels d'un produit, façon tampon, posés à cheval sur le bord haut de la carte, à droite.
 * La carte parente doit être en `relative`.
 */
export const Tampons = ({ product }: { product: Product }) => {
  if (!product.labels?.length) return null;
  return (
    <div className="absolute -top-3.5 right-3 flex flex-col items-end gap-1">
      {product.labels.map((label, i) => {
        const { icone: Icone, encre } = TAMPONS[label] ?? TAMPON_PAR_DEFAUT;
        return (
          <span
            key={label}
            data-tampon
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border-[1.5px] border-solid bg-white px-2.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.05em] leading-none shadow-sm ${
              i % 2 ? "rotate-1" : "-rotate-2"
            }`}
            style={{ color: encre, borderColor: `${encre}99` }}
          >
            <Icone className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2.25} aria-hidden="true" />
            {label}
          </span>
        );
      })}
    </div>
  );
};

/** Mention douce des allergènes présents, dans le texte de la carte. */
const ProductTags = ({ product, className = "" }: { product: Product; className?: string }) => {
  const allergens = product.allergens ?? [];
  if (!allergens.length) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold bg-[#eaf3fb] border border-[#cfe3f6] text-[#16527f] px-2 py-0.5 rounded-full">
        <Info className="w-3 h-3" aria-hidden="true" />
        Contient : {allergens.map((a) => a.toLowerCase()).join(", ")}
      </span>
    </div>
  );
};

export default ProductTags;
