import { Clock, Flower2, Heart, Info, LucideIcon, Mountain, Snowflake, Sparkles, Sprout, Stamp } from "lucide-react";
import { Product, StatutSite } from "@/lib/catalog";

const LIBELLES: Record<Exclude<StatutSite, "disponible">, { texte: string; icone: LucideIcon }> = {
  victime: { texte: "Victime de son succès ! Reviens bientôt…", icone: Sparkles },
  bientot: { texte: "Bientôt disponible", icone: Clock },
};

/**
 * Remplace l'action « commander » d'un produit qu'on ne peut pas commander : épuisé à Marseille
 * (victime) ou pas encore en vente (bientot). Le libellé peut passer à la ligne sur petit écran.
 */
export const StatutProduit = ({ statut, className = "" }: { statut: StatutSite; className?: string }) => {
  if (statut === "disponible") return null;
  const { texte, icone: Icone } = LIBELLES[statut];
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 text-left text-xs font-semibold leading-snug bg-[#FFF6DB] text-[#7a5a00] border border-[#F5C842] px-3 py-1.5 rounded-2xl ${className}`}
    >
      <Icone className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
      {texte}
    </span>
  );
};

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
