import { useState } from "react";
import ProductDetailModal, { ProductDetail } from "./ProductDetailModal";

const PizzasSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const saltyPizzas: (ProductDetail & { color: string })[] = [
    {
      name: "La Classique",
      description: "Sauce Tomate, Jambon, Oignons, Fromage – timeless and always satisfying.",
      emoji: "🍕",
      color: "bg-pizza-classique",
      ingredients: ["Handmade Dough", "Tomato Sauce", "Ham", "Onions", "Mozzarella", "Oregano"],
      madeBy: "Our family recipe, perfected over years of pizza nights",
      whereToBuy: "Available at Ferme De La Goëttaz during pizza evenings",
      additionalInfo: "Our tomato sauce is made from San Marzano tomatoes.",
    },
    {
      name: "La Flam",
      description: "Crème Fraîche, Lardons, Oignons, Fromage – our Alsacian-inspired creation.",
      emoji: "🥓",
      color: "bg-pizza-flam",
      ingredients: ["Handmade Dough", "Crème Fraîche", "Smoked Lardons", "Onions", "Gruyère", "Nutmeg"],
      madeBy: "Inspired by the traditional Flammekueche of Alsace",
      whereToBuy: "Available at Ferme De La Goëttaz during pizza evenings",
      additionalInfo: "A lighter, creamier alternative to tomato-based pizzas.",
    },
    {
      name: "La Végé",
      description: "Sauce Tomate, Courgettes, Oignons, Champignons, Fromage – fresh and full of flavor.",
      emoji: "🥒",
      color: "bg-pizza-vege",
      ingredients: ["Handmade Dough", "Tomato Sauce", "Zucchini", "Onions", "Mushrooms", "Mozzarella", "Fresh Basil"],
      madeBy: "Garden-fresh vegetables from local producers",
      whereToBuy: "Available at Ferme De La Goëttaz during pizza evenings",
      additionalInfo: "Perfect for vegetarians – packed with seasonal vegetables.",
    },
  ];

  const sweetPizzas: (ProductDetail & { color: string })[] = [
    {
      name: "La Praline Rose",
      description: "Praline rose et crème AOP – a Lyon classic, sweet and crunchy.",
      emoji: "🩷",
      color: "bg-pizza-praline",
      ingredients: ["Handmade Sweet Dough", "Pink Pralines", "AOP Cream", "Butter", "Sugar"],
      madeBy: "A tribute to Lyon's famous pink praline tart",
      whereToBuy: "Available at Ferme De La Goëttaz during pizza evenings",
      additionalInfo: "The pink pralines are caramelized fresh before each service.",
    },
    {
      name: "La Nut'",
      description: "Pâte à tartiner chocolat – pure chocolate indulgence on our handmade dough.",
      emoji: "🍫",
      color: "bg-pizza-nut",
      ingredients: ["Handmade Sweet Dough", "Chocolate Hazelnut Spread", "Hazelnuts", "Powdered Sugar"],
      madeBy: "A kid-friendly favorite that adults love too",
      whereToBuy: "Available at Ferme De La Goëttaz during pizza evenings",
      additionalInfo: "Topped with crushed hazelnuts for extra crunch.",
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
        <h2 className="section-title">Pizzas</h2>

        {/* Team Introduction */}
        <div className="bg-card rounded-2xl p-8 mb-12 text-center shadow-soft">
          <h3 className="font-display text-2xl font-semibold mb-4">Meet the Team</h3>
          <p className="text-foreground leading-relaxed mb-4">
            Cousins, brothers and sisters – we are a family united by our love of pizza. 
            From the dough-spreaders to the order-takers and cooks, every pizza is made with 
            good mood, smiles, and the joy of being reunited.
          </p>
          <p className="text-muted-foreground italic mb-4">
            Our dough? Handmade with love, stretched by hand, and baked to perfection in our wood-fired oven.
          </p>
          <p className="text-primary font-semibold">
            📍 Find us at Ferme De La Goëttaz
          </p>
        </div>

        {/* Salty Pizzas */}
        <div className="mb-12">
          <h3 className="font-display text-2xl font-semibold text-center mb-6">Salty Pizzas</h3>
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
                  <p className="text-sm text-primary mt-3 font-medium">Click for details →</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sweet Pizzas */}
        <div>
          <h3 className="font-display text-2xl font-semibold text-center mb-6">Sweet Pizzas</h3>
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
                  <p className="text-sm text-white/80 mt-3 font-medium">Click for details →</p>
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
