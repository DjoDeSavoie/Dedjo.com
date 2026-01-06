import { useState } from "react";
import ProductDetailModal, { ProductDetail } from "./ProductDetailModal";

const PizzasSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const saltyPizzas: (ProductDetail & { color: string })[] = [
    {
      name: "La Classique",
      description: "Sauce Tomate, Jambon, Oignons, Fromage – intemporelle et toujours satisfaisante.",
      emoji: "🍕",
      color: "bg-pizza-classique",
      ingredients: ["Pâte maison", "Sauce tomate", "Jambon", "Oignons", "Mozzarella", "Origan"],
      madeBy: "Notre recette familiale, perfectionnée au fil des années de soirées pizza",
      whereToBuy: "Disponible à la Ferme De La Goëttaz lors des soirées pizza",
      additionalInfo: "Notre sauce tomate est faite à partir de tomates San Marzano.",
    },
    {
      name: "La Flam",
      description: "Crème Fraîche, Lardons, Oignons, Fromage – notre création d'inspiration alsacienne.",
      emoji: "🥓",
      color: "bg-pizza-flam",
      ingredients: ["Pâte maison", "Crème fraîche", "Lardons fumés", "Oignons", "Gruyère", "Muscade"],
      madeBy: "Inspirée de la traditionnelle Flammekueche d'Alsace",
      whereToBuy: "Disponible à la Ferme De La Goëttaz lors des soirées pizza",
      additionalInfo: "Une alternative plus légère et crémeuse aux pizzas à base de tomate.",
    },
    {
      name: "La Végé",
      description: "Sauce Tomate, Courgettes, Oignons, Champignons, Fromage – fraîche et pleine de saveur.",
      emoji: "🥒",
      color: "bg-pizza-vege",
      ingredients: ["Pâte maison", "Sauce tomate", "Courgettes", "Oignons", "Champignons", "Mozzarella", "Basilic frais"],
      madeBy: "Légumes frais du jardin de producteurs locaux",
      whereToBuy: "Disponible à la Ferme De La Goëttaz lors des soirées pizza",
      additionalInfo: "Parfaite pour les végétariens – garnie de légumes de saison.",
    },
  ];

  const sweetPizzas: (ProductDetail & { color: string })[] = [
    {
      name: "La Praline Rose",
      description: "Praline rose et crème AOP – un classique lyonnais, sucré et croquant.",
      emoji: "🩷",
      color: "bg-pizza-praline",
      ingredients: ["Pâte sucrée maison", "Pralines roses", "Crème AOP", "Beurre", "Sucre"],
      madeBy: "Un hommage à la célèbre tarte aux pralines roses de Lyon",
      whereToBuy: "Disponible à la Ferme De La Goëttaz lors des soirées pizza",
      additionalInfo: "Les pralines roses sont caramélisées fraîches avant chaque service.",
    },
    {
      name: "La Nut'",
      description: "Pâte à tartiner chocolat – pure gourmandise chocolatée sur notre pâte maison.",
      emoji: "🍫",
      color: "bg-pizza-nut",
      ingredients: ["Pâte sucrée maison", "Pâte à tartiner chocolat-noisettes", "Noisettes", "Sucre glace"],
      madeBy: "Un favori des enfants que les adultes adorent aussi",
      whereToBuy: "Disponible à la Ferme De La Goëttaz lors des soirées pizza",
      additionalInfo: "Garnie de noisettes concassées pour plus de croquant.",
    },
  ];

  const handleProductClick = (product: ProductDetail) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  return (
    <section id="pizzas" className="py-20 px-6 section-yellow">
      <div className="container max-w-6xl">
        <span className="text-5xl mb-4 block text-center">🍕</span>
        <h2 className="section-title">Les Pizzas</h2>

        {/* Team Introduction */}
        <div className="bg-card rounded-2xl p-8 mb-12 text-center shadow-soft">
          <h3 className="font-display text-2xl font-semibold mb-4">L'Équipe</h3>
          <p className="text-foreground leading-relaxed mb-4">
            Cousins, frères et sœurs – nous sommes une famille unie par notre amour de la pizza. 
            Des étaleurs de pâte aux preneurs de commandes et cuisiniers, chaque pizza est faite avec 
            bonne humeur, sourires et la joie d'être réunis.
          </p>
          <p className="text-muted-foreground italic mb-4">
            Notre pâte ? Faite maison avec amour, étalée à la main et cuite à la perfection dans notre four à bois.
          </p>
          <p className="text-primary font-semibold">
            📍 Retrouvez-nous à la Ferme De La Goëttaz
          </p>
        </div>

        {/* Salty Pizzas */}
        <div className="mb-12">
          <h3 className="font-display text-2xl font-semibold text-center mb-6">Pizzas Salées</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {saltyPizzas.map((pizza, index) => (
              <button 
                key={pizza.name}
                onClick={() => handleProductClick(pizza)}
                className={`${pizza.color} rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in text-left`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-center">
                  <span className="text-4xl block mb-3">{pizza.emoji}</span>
                  <h4 className="font-display text-xl font-semibold mb-2 text-foreground">{pizza.name}</h4>
                  <p className="text-foreground/80 text-sm">{pizza.description}</p>
                  <p className="text-sm text-white mt-3 font-medium bg-foreground/40 inline-block px-3 py-1 rounded-full">Cliquez pour les détails →</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sweet Pizzas */}
        <div>
          <h3 className="font-display text-2xl font-semibold text-center mb-6">Pizzas Sucrées</h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {sweetPizzas.map((pizza, index) => (
              <button 
                key={pizza.name}
                onClick={() => handleProductClick(pizza)}
                className={`${pizza.color} rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in text-left`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-center">
                  <span className="text-4xl block mb-3">{pizza.emoji}</span>
                  <h4 className="font-display text-xl font-semibold mb-2 text-white">{pizza.name}</h4>
                  <p className="text-white/90 text-sm">{pizza.description}</p>
                  <p className="text-sm text-white mt-3 font-medium bg-white/30 inline-block px-3 py-1 rounded-full">Cliquez pour les détails →</p>
                </div>
              </button>
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

export default PizzasSection;
