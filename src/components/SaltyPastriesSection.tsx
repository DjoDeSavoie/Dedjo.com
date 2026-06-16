import { useState } from "react";
import ProductDetailModal, { ProductDetail } from "./ProductDetailModal";

const SaltyPastriesSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fabricationAll = "Façonné à la main dans ma cuisine. Comme si je les avais faits pour moi — parce que c'est le cas.";
  const whereToBuyAll = "Disponible sur le marché du vendredi de la Ferme de la Goettaz et en livraisons sur Chambéry, Aix-les-Bains, Le Bourget-du-Lac et alentours.";
  const bonASavoirAll = "Nos oignons proviennent directement de la ferme de la Goettaz, produits par des maraîchers respectueux de la terre et du vivant.";

  const flavors: (ProductDetail & { color: string })[] = [
    {
      name: "La Montagne",
      description: "Lardons, oignons et reblochon. Un hommage discret à la tartiflette, en une bouchée.",
      emoji: "🏔️",
      color: "bg-product-montagne",
      ingredients: ["Pâte feuilletée (farine, eau, beurre, sel)", "Lardons", "Oignons", "Reblochon"],
      madeBy: fabricationAll,
      whereToBuy: whereToBuyAll,
      additionalInfo: bonASavoirAll,
    },
    {
      name: "La Forêt",
      description: "Champignons des bois, béchamel douce, fromage à fondue. Le goût de la forêt savoyarde, en format feuilleté.",
      emoji: "🌲",
      color: "bg-product-foret",
      ingredients: ["Pâte feuilletée (farine, eau, beurre, sel)", "Champignons", "Sauce béchamel", "Mélange de fromage à fondue"],
      madeBy: fabricationAll,
      whereToBuy: whereToBuyAll,
      additionalInfo: bonASavoirAll,
    },
    {
      name: "La Goët",
      description: "Poireaux cueillis à la Goëttaz, fromage de chèvre frais. Ce qui pousse ici finit dans ta pâte.",
      emoji: "🥬",
      color: "bg-product-goet",
      ingredients: ["Pâte feuilletée (farine, eau, beurre, sel)", "Poireaux de La Ferme de La Goëttaz", "Fromage de chèvre frais"],
      madeBy: fabricationAll,
      whereToBuy: whereToBuyAll,
      additionalInfo: bonASavoirAll,
    },
    {
      name: "La Noix",
      description: "Chèvre, miel local, cerneaux de noix. Le sucré-salé qui surprend — et qui revient.",
      emoji: "🐝",
      color: "bg-product-noix",
      ingredients: ["Pâte feuilletée (farine, eau, beurre, sel)", "Fromage de chèvre frais", "Miel local", "Cerneau de Noix hâchés"],
      madeBy: fabricationAll,
      whereToBuy: whereToBuyAll,
      additionalInfo: bonASavoirAll,
    },
  ];

  const sizes = [
    {
      name: "Bouchées Apéritives",
      description: "Vingt petites bouchées à partager debout, au coin du buffet, entre ceux qu'on aime. Parfaites pour que tout le monde s'y mette. Format : sachet de 20 bouchées.",
      emoji: "🎉",
    },
    {
      name: "Le Friand",
      description: "Pour le repas du soir avec une salade fraîche, ou le déjeuner tranquille. La portion pour souffler un peu. Format : sachet de 2 grands friands.",
      emoji: "🥗",
    },
  ];

  const handleProductClick = (product: ProductDetail) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  return (
    <section id="salty-pastries" className="py-12 px-4 section-sky">
      <div className="container max-w-6xl">
        <span className="text-5xl mb-4 block text-center">🥧</span>
        <h2 className="section-title"><span className="font-pattaya text-3xl md:text-4xl text-foreground">Feuilletés Salés</span></h2>
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
          <h3 className="font-display text-2xl font-semibold text-center mb-6">Quatre Préparations</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {flavors.map((flavor, index) => (
              <button 
                key={flavor.name}
                onClick={() => handleProductClick(flavor)}
                className={`${flavor.color} rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in text-left`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{flavor.emoji}</span>
                  <div>
                    <h4 className="font-display text-xl font-semibold mb-2">{flavor.name}</h4>
                    <p className="text-foreground/80">{flavor.description}</p>
                    <p className="text-sm text-white mt-2 font-medium bg-foreground/40 inline-block px-3 py-1 rounded-full">Cliquez pour les détails →</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recipe Card */}
        <div className="bg-card rounded-2xl p-6 mb-8 shadow-soft max-w-2xl mx-auto text-center">
          <h3 className="text-2xl mb-2">🍽️ <span className="font-pattaya text-2xl md:text-3xl text-foreground">La cuisson</span></h3>
          <p className="text-muted-foreground italic mb-5">Simple. Direct. Bon.</p>
          <p className="text-foreground leading-relaxed">
            Direct du congélateur au four à <strong>180 °C</strong>.<br />
            Laisse cuire <strong>25 minutes</strong> — un peu plus si tu les aimes bien dorés.
          </p>
          <p className="font-handmade text-lg tracking-wide text-handmade-dark italic mt-4">
            Laisse ton four faire le reste, et régale-toi.
          </p>
        </div>

        {/* Sizes */}
        <div>
          <h3 className="font-display text-2xl font-semibold text-center mb-6">Formats Disponibles</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {sizes.map((size, index) => (
              <div 
                key={size.name}
                className="bg-section-cream rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{size.emoji}</span>
                  <div>
                    <h4 className="font-display text-xl font-semibold mb-2">{size.name}</h4>
                    <p className="text-muted-foreground">{size.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProductDetailModal 
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </section>
  );
};

export default SaltyPastriesSection;
