import { useState } from "react";
import ProductDetailModal, { ProductDetail } from "./ProductDetailModal";

const SaltyPastriesSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const flavors: (ProductDetail & { color: string })[] = [
    {
      name: "La Montagne",
      description: "Lardons, Oignons et Reblochon – a taste of the Alps in every bite.",
      emoji: "🏔️",
      color: "bg-product-montagne",
      ingredients: ["Puff Pastry", "Smoked Lardons", "Caramelized Onions", "Reblochon AOP", "Cream", "Black Pepper"],
      madeBy: "Inspired by traditional Savoyard tartiflette recipes",
      whereToBuy: "Available at Ferme De La Goëttaz and local markets",
      additionalInfo: "Our Reblochon comes directly from a farm in the Aravis mountains.",
    },
    {
      name: "La Forêt",
      description: "Champignons, Béchamel et Fromage à Fondue – earthy, creamy, irresistible.",
      emoji: "🌲",
      color: "bg-product-foret",
      ingredients: ["Puff Pastry", "Wild Mushrooms", "Béchamel Sauce", "Fondue Cheese Blend", "Thyme", "Garlic"],
      madeBy: "Forest-inspired recipe using locally foraged mushrooms when in season",
      whereToBuy: "Available at Ferme De La Goëttaz",
      additionalInfo: "Contains a mix of chanterelles, porcini, and button mushrooms.",
    },
    {
      name: "La Goët",
      description: "Poireaux de la Goët et Chèvre – local leeks paired with tangy goat cheese.",
      emoji: "🥬",
      color: "bg-product-goet",
      ingredients: ["Puff Pastry", "Leeks from La Goëttaz", "Fresh Goat Cheese", "Cream", "Nutmeg", "White Wine"],
      madeBy: "Made with leeks grown on our own farm at La Goëttaz",
      whereToBuy: "Exclusive to Ferme De La Goëttaz",
      additionalInfo: "The leeks are harvested fresh each morning during the season.",
    },
    {
      name: "La Noix",
      description: "Chèvre, Miel et Noix – the perfect balance of sweet, savory, and crunchy.",
      emoji: "🌰",
      color: "bg-product-noix",
      ingredients: ["Puff Pastry", "Fresh Goat Cheese", "Local Honey", "Walnuts from Grenoble", "Fresh Thyme"],
      madeBy: "A perfect harmony of local Alpine ingredients",
      whereToBuy: "Available at Ferme De La Goëttaz and weekend markets",
      additionalInfo: "Features AOC walnuts from Grenoble and honey from local beekeepers.",
    },
  ];

  const sizes = [
    {
      name: "Apéritives",
      description: "Perfect for festivities and stand-up meals. Share the love with the people you cherish – bite-sized moments of happiness.",
      emoji: "🎉",
    },
    {
      name: "Le Friand",
      description: "One meal, one person. The perfect individual portion, ideal paired with a fresh salad for a complete meal.",
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
        <h2 className="section-title">My Salty Puff Pastries</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Golden, flaky, and filled with the finest ingredients. Our savory puff pastries 
          are perfect for any occasion.
        </p>

        {/* Flavors */}
        <div className="mb-12">
          <h3 className="font-display text-2xl font-semibold text-center mb-6">Four Delicious Flavors</h3>
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
                    <p className="text-sm text-primary mt-2 font-medium">Click for details →</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div>
          <h3 className="font-display text-2xl font-semibold text-center mb-6">Available Sizes</h3>
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
