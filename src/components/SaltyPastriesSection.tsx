import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import ProductLabelModal from "./ProductLabelModal";
import PreparationCuisson, { BoutonQuestion } from "./PreparationCuisson";
import FeuilleteIllustration from "./FeuilleteIllustration";
import { BoutonPhoto } from "./PhotoProduit";
import ProductTags, { StatutProduit, Tampons } from "./ProductTags";
import { useCart } from "@/context/CartContext";
import { FEUILLETES, Product, eur } from "@/lib/catalog";
import { useDisponibilite } from "@/hooks/useDisponibilite";
import { ficheDe } from "@/lib/fiches";

/** Étiquette, sachet et prix viennent du catalogue. */
const catalogProduct = (id: string) => FEUILLETES.find((f) => f.id === id)!;

const sachetInfo = (id: string) => {
  const p = catalogProduct(id);
  return `${p.pieces} ${p.unit} · ${eur(p.price)}`;
};

const SaltyPastriesSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { addFriand } = useCart();
  const { statut } = useDisponibilite();

  const handleAdd = (id: string, name: string) => {
    addFriand(id, 1);
    toast.success(`1 sachet de ${name} ajouté au panier 🥧`, { description: sachetInfo(id) });
  };

  // Textes de présentation propres à l'accueil ; « Voir les détails » ouvre l'étiquette du
  // catalogue (même pop-up que la page Commande).
  const flavors: { id: string; name: string; description: string; emoji: string; color: string }[] = [
    {
      id: "montagne",
      name: "La Montagne",
      description: "Lardons, oignons et reblochon. Un hommage discret à la tartiflette, en une bouchée.",
      emoji: "🏔️",
      color: "border-product-montagne",
    },
    {
      id: "foret",
      name: "La Forêt",
      description: "Champignons de Paris, béchamel douce, fromages à fondue savoyarde. Le goût de la Savoie, en format feuilleté.",
      emoji: "🌲",
      color: "border-product-foret",
    },
    {
      id: "goet",
      name: "La Goët",
      description: "Poireaux cueillis à la Goëttaz, fromage de chèvre frais. Ce qui pousse ici finit dans ta pâte.",
      emoji: "🥬",
      color: "border-product-goet",
    },
    {
      id: "noix",
      name: "La Noix",
      description: "Chèvre, miel local, cerneaux de noix. Le sucré-salé qui surprend — et qui revient.",
      emoji: "🐝",
      color: "border-product-noix",
    },
  ];

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

  const handleProductClick = (id: string) => {
    setSelectedProduct(catalogProduct(id));
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
          <div className="grid md:grid-cols-2 gap-6">
            {flavors.map((flavor, index) => (
              <div
                key={flavor.name}
                className={`bg-creme-carte border-2 ${flavor.color} relative rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in text-left flex flex-col`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Tampons product={catalogProduct(flavor.id)} />
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{flavor.emoji}</span>
                  <div>
                    <h4 className="font-display text-xl mb-2">{flavor.name}</h4>
                    <p className="text-foreground/80">{flavor.description}</p>
                    <ProductTags product={catalogProduct(flavor.id)} className="mt-2.5" />
                    <p className="text-xs font-semibold text-foreground/70 mt-2">Sachet de {sachetInfo(flavor.id)}</p>
                    {/* Lien discret vers la fiche du produit (un vrai lien, suivi par Google) ; la pop-up reste */}
                    {ficheDe(flavor.id) && (
                      <Link to={ficheDe(flavor.id)!.chemin} className="inline-block mt-1.5 py-0.5 text-xs font-semibold text-foreground/70 underline underline-offset-2 hover:text-foreground">
                        Voir la fiche
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <button
                    onClick={() => handleProductClick(flavor.id)}
                    className="text-sm text-white font-medium bg-foreground/40 hover:bg-foreground/60 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Voir les détails →
                  </button>
                  <BoutonPhoto product={catalogProduct(flavor.id)} />
                  {statut(flavor.id) === "disponible" ? (
                    <button
                      onClick={() => handleAdd(flavor.id, flavor.name)}
                      className="text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-full transition-colors ml-auto"
                    >
                      + Panier
                    </button>
                  ) : (
                    <StatutProduit statut={statut(flavor.id)} className="ml-auto" />
                  )}
                </div>
              </div>
            ))}
          </div>
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
