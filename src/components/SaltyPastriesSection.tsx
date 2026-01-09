import { useState } from "react";
import ProductDetailModal, { ProductDetail } from "./ProductDetailModal";

const SaltyPastriesSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const flavors: (ProductDetail & { color: string })[] = [
    {
      name: "La Montagne",
      description: "Lardons, Oignons et Reblochon – un goût des Alpes dans chaque bouchée.",
      emoji: "🏔️",
      color: "bg-product-montagne",
      ingredients: ["Pâte feuilletée", "Lardons fumés", "Oignons caramélisés", "Reblochon AOP", "Crème", "Poivre noir"],
      madeBy: "Inspiré des recettes traditionnelles de tartiflette savoyarde",
      whereToBuy: "Disponible à la Ferme De La Goëttaz et sur les marchés locaux",
      additionalInfo: "Notre Reblochon vient directement d'une ferme des Aravis.",
    },
    {
      name: "La Forêt",
      description: "Champignons, Béchamel et Fromage à Fondue – terreux, crémeux, irrésistible.",
      emoji: "🌲",
      color: "bg-product-foret",
      ingredients: ["Pâte feuilletée", "Champignons des bois", "Sauce béchamel", "Mélange de fromage à fondue", "Thym", "Ail"],
      madeBy: "Recette inspirée de la forêt utilisant des champignons cueillis localement en saison",
      whereToBuy: "Disponible à la Ferme De La Goëttaz",
      additionalInfo: "Contient un mélange de girolles, cèpes et champignons de Paris.",
    },
    {
      name: "La Goët",
      description: "Poireaux de la Goët et Chèvre – poireaux locaux associés au fromage de chèvre acidulé.",
      emoji: "🥬",
      color: "bg-product-goet",
      ingredients: ["Pâte feuilletée", "Poireaux de La Goëttaz", "Fromage de chèvre frais", "Crème", "Muscade", "Vin blanc"],
      madeBy: "Fait avec des poireaux cultivés dans notre propre ferme à La Goëttaz",
      whereToBuy: "Exclusivité à la Ferme De La Goëttaz",
      additionalInfo: "Les poireaux sont récoltés frais chaque matin pendant la saison.",
    },
    {
      name: "La Noix",
      description: "Chèvre, Miel et Noix – l'équilibre parfait entre sucré, salé et croquant.",
      emoji: "🌰",
      color: "bg-product-noix",
      ingredients: ["Pâte feuilletée", "Fromage de chèvre frais", "Miel local", "Noix de Grenoble", "Thym frais"],
      madeBy: "Une harmonie parfaite d'ingrédients alpins locaux",
      whereToBuy: "Disponible à la Ferme De La Goëttaz et sur les marchés du week-end",
      additionalInfo: "Avec des noix AOC de Grenoble et du miel d'apiculteurs locaux.",
    },
  ];

  const sizes = [
    {
      name: "Apéritives",
      description: "Parfaites pour les fêtes et les repas debout. Partagez l'amour avec les gens que vous chérissez – des petites bouchées de bonheur.",
      emoji: "🎉",
    },
    {
      name: "Le Friand",
      description: "Un repas, une personne. La portion individuelle parfaite, idéale accompagnée d'une salade fraîche pour un repas complet.",
      emoji: "🥗",
    },
  ];

  const handleProductClick = (product: ProductDetail) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  return (
    <section id="salty-pastries" className="py-20 px-6 section-sky">
      <div className="container max-w-6xl">
        <span className="text-5xl mb-4 block text-center">🥧</span>
        <h2 className="section-title">Feuilletés Salés</h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Une pâte feuilletée artisanale enveloppant une garniture gourmande. <br /> Préparés avec la main et le coeur, sous forme de bouchées apéritives ou de friands individuels. <br /> Pour une soirée conviviale ou un repas de la flemme du lundi soir.
        </p>


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
        <div className="bg-card rounded-2xl p-8 mb-12 shadow-soft max-w-2xl mx-auto">
          <h3 className="font-display text-2xl font-semibold mb-4 text-center">🍽️ Recette de Préparation</h3>
          <p className="text-foreground text-center leading-relaxed">
            À cuire à <strong>180 degrés pendant 25 minutes</strong>, directement sorti du congélateur.
          </p>
          <p className="text-muted-foreground text-center mt-2 italic">
            Peut-être plus longtemps selon ton four, selon tes goûts...
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
