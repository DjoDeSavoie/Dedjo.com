import { useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import ProductLabelModal from "./ProductLabelModal";
import PreparationCuisson, { BoutonQuestion } from "./PreparationCuisson";
import FeuilleteIllustration from "./FeuilleteIllustration";
import { GrilleProduits } from "./CarteProduit";
import { useCart } from "@/context/CartContext";
import { FEUILLETES, Product, eur } from "@/lib/catalog";
import { useDisponibilite } from "@/hooks/useDisponibilite";

/** Bordure de chaque carte (couleurs propres au site) ; le reste vient du catalogue. */
const BORDURES: Record<string, string> = {
  montagne: "border-product-montagne",
  foret: "border-product-foret",
  goet: "border-product-goet",
  noix: "border-product-noix",
};

const SaltyPastriesSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { addFriand } = useCart();
  const { statut } = useDisponibilite();

  const handleAdd = (p: Product) => {
    addFriand(p.id, 1);
    toast.success(`1 sachet de ${p.name} ajouté au panier 🥧`, { description: `${p.pieces} ${p.unit} · ${eur(p.price)}` });
  };

  const sizes = [
    {
      name: "Bouchées Apéritives",
      description: "Vingt petites bouchées à partager debout, au coin du buffet, entre ceux qu'on aime. Parfaites pour que tout le monde s'y mette. Format : sachet de 20 bouchées.",
      emoji: "🎉",
      bientot: true,
    },
    {
      name: "Le Friand",
      description: "Pour le repas du soir avec une salade fraîche, ou le déjeuner tranquille. La portion pour souffler un peu. Format : sachet de 2 grands friands.",
      emoji: "🥗",
    },
  ];

  const handleDetails = (p: Product) => {
    setSelectedProduct(p);
    setModalOpen(true);
  };

  return (
    <section id="salty-pastries" className="py-12 px-4 section-sky">
      <div className="container max-w-6xl">
        <FeuilleteIllustration className="w-16 h-16 mb-2 mx-auto block" />
        <h2 className="section-title"><span className="font-display font-bold text-3xl md:text-4xl text-foreground">Feuilletés Salés</span></h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Une pâte feuilletée maison. Des garnitures du paysage savoyard.<br />
          En bouchées pour partager et en friands.<br />
          Direct du congélateur au four, sans perdre en qualité.
        </p>

        {/* Encart terroir */}
        <div className="max-w-2xl mx-auto mb-10 border-l-4 border-primary bg-white/60 rounded-2xl px-6 py-5 shadow-soft">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">🏔️ Origine savoyarde</p>
          <p className="text-foreground leading-relaxed text-sm">
            Reblochon, fromage à fondue Savoyarde, poireaux cueillis à la ferme de la Goëttaz — < br/> chaque garniture raconte incarne à sa façon le paysage Savoyard < br/> <i>(Sauf pour le chevre miel et noix, là j'avais juste envie de me faire un bon mélange sucré / salé)</i>< br/>
          </p>
        </div>

        {/* Flavors */}
        <div className="mb-12">
          <h3 className="font-display text-2xl text-center mb-6">Quatre Préparations</h3>
          <GrilleProduits
            produits={FEUILLETES}
            statut={statut}
            bordures={BORDURES}
            onAjouter={handleAdd}
            onDetails={handleDetails}
          />
        </div>

        {/* Préparation, comme sur l'étiquette */}
        <div className="mb-10">
          <PreparationCuisson variante="feuilletes" />
          <BoutonQuestion sujet="feuilletes" />
        </div>

        {/* Sizes */}
        <div>
          <h3 className="font-display text-2xl text-center mb-6">Formats</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {sizes.map((size, index) => (
              <div 
                key={size.name}
                className="relative bg-section-cream rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {size.bientot && (
                  <span className="absolute -top-3.5 right-3 inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border-[1.5px] border-solid border-[#185FA5]/60 bg-white px-2.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.05em] leading-none text-[#185FA5] shadow-sm -rotate-2">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2.25} aria-hidden="true" />
                    Arrivent bientôt
                  </span>
                )}
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{size.emoji}</span>
                  <div>
                    <h4 className="font-display text-xl mb-2">{size.name}</h4>
                    <p className="text-muted-foreground">{size.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProductLabelModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </section>
  );
};

export default SaltyPastriesSection;
