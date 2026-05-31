import { useState } from "react";
import ProductDetailModal, { ProductDetail } from "./ProductDetailModal";

const PizzasSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const pateIngredients = "Pâte (farine, eau, huile d'olive, levure et sel)";
  const fabricationAll = "Pâte pétrie sur place, étalée au rouleau, garnie devant vos yeux et cuite au four à bois.";
  const bonASavoirAll = "Un savoir-faire bien rodé et une union familiale pour vous servir le meilleur.";
  const whereToBuyAll = "Disponible à la Ferme De La Goëttaz lors des soirées pizzas";

  const saltyPizzas: (ProductDetail & { color: string; isFavorite?: boolean; favoriteTooltip?: string })[] = [
    {
      name: "La Classique",
      description: "Sauce tomate, jambon, oignons, fromage. Ce qu'on revient toujours chercher, parce que c'est juste bon.",
      emoji: "🍕",
      color: "bg-pizza-classique",
      ingredients: [pateIngredients, "Sauce tomate", "Jambon", "Oignons de la ferme", "Fromage"],
      madeBy: fabricationAll,
      whereToBuy: whereToBuyAll,
      additionalInfo: bonASavoirAll,
    },
    {
      name: "La Flam",
      description: "Crème fraîche, lardons fumés, oignons — une flambée à la savoyarde. Notre création, notre préférée.",
      emoji: "🥓",
      color: "bg-pizza-flam",
      isFavorite: true,
      favoriteTooltip: "Favorite du chef",
      ingredients: [pateIngredients, "Crème fraîche", "Lardons fumés", "Oignons", "Fromage râpé"],
      madeBy: fabricationAll,
      whereToBuy: whereToBuyAll,
      additionalInfo: bonASavoirAll,
    },
    {
      name: "La Végé",
      description: "Courgettes et oignons du jardin, sauce tomate, fromage. Ce que la ferme offre, simplement.",
      emoji: "🥒",
      color: "bg-pizza-vege",
      ingredients: [pateIngredients, "Sauce tomate", "Courgettes du jardin", "Oignons du jardin", "Fromage"],
      madeBy: fabricationAll,
      whereToBuy: whereToBuyAll,
      additionalInfo: bonASavoirAll,
    },
  ];

  const sweetPizzas: (ProductDetail & { color: string; isFavorite?: boolean; favoriteTooltip?: string })[] = [
    {
      name: "La Praline Rose",
      description: "Praline rose de Lyon, crème AOP. Un classique sucré-croquant — en pizza.",
      emoji: "🩷",
      color: "bg-pizza-praline",
      isFavorite: true,
      favoriteTooltip: "Favorite du chef",
      ingredients: [pateIngredients, "Pralines roses", "Crème AOP"],
      madeBy: fabricationAll,
      whereToBuy: whereToBuyAll,
      additionalInfo: bonASavoirAll,
    },
    {
      name: "La Nut'",
      description: "Pâte à tartiner chocolat-noisette. Pour finir sur une note douce.",
      emoji: "🍫",
      color: "bg-pizza-nut",
      ingredients: [pateIngredients, "Pâte à tartiner chocolat-noisettes"],
      madeBy: fabricationAll,
      whereToBuy: whereToBuyAll,
      additionalInfo: bonASavoirAll,
    },
  ];

  const handleProductClick = (product: ProductDetail) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  return (
    <section id="pizzas" className="py-12 px-4 section-yellow">
      <div className="container max-w-6xl">
        <span className="text-5xl mb-4 block text-center">🍕</span>
        <h2 className="section-title"><span className="font-pattaya text-3xl md:text-4xl text-foreground">Les Pizzas</span></h2>

        {/* Team Introduction */}
        <div className="bg-card rounded-2xl p-6 mb-6 text-center shadow-soft">
          <h3 className="font-display text-2xl font-semibold mb-4">L'Équipe</h3>
          <p className="text-foreground leading-relaxed mb-4">
            Cousins, frères et sœurs — on se retrouve chaque vendredi à la Goëttaz. On étale la pâte, on prend ta commande, on garnit, on enfourne. Chaque pizza sort du four avec les mains de tout le monde, et le sourire avec.
          </p>
          <p className="text-foreground leading-relaxed mb-4">
            On utilise ce qui pousse ici, de saison, depuis la ferme. Pas plus compliqué que ça.
          </p>
          <p className="text-muted-foreground italic mb-4">
            La pâte, c'est la nôtre. Étalée à la main, cuite au feu de bois. On te propose une pizza qu'on est fiers de manger nous-mêmes.
          </p>
          <p className="text-primary font-semibold mb-2">
            📍 Retrouvez-nous à la Ferme De La Goëttaz
          </p>
          <p className="text-primary font-semibold">
            🗓️ Les vendredis à partir de 18h
          </p>
        </div>

        {/* Salty Pizzas */}
        <div className="mb-12">
          <h3 className="text-2xl text-center mb-6"><span className="font-pattaya text-2xl md:text-3xl text-foreground">Pizzas Salées</span></h3>
          <div className="grid md:grid-cols-3 gap-6">
            {saltyPizzas.map((pizza, index) => (
              <button 
                key={pizza.name}
                onClick={() => handleProductClick(pizza)}
                className={`${pizza.color} rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in text-left relative`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {pizza.isFavorite && (
                  <div 
                    className="absolute top-3 right-3 text-2xl cursor-help" 
                    title={pizza.favoriteTooltip}
                  >
                    🔥
                  </div>
                )}
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
          <h3 className="text-2xl text-center mb-6"><span className="font-pattaya text-2xl md:text-3xl text-foreground">Pizzas Sucrées</span></h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {sweetPizzas.map((pizza, index) => (
              <button 
                key={pizza.name}
                onClick={() => handleProductClick(pizza)}
                className={`${pizza.color} rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in text-left relative`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {pizza.isFavorite && (
                  <div 
                    className="absolute top-3 right-3 text-2xl cursor-help" 
                    title={pizza.favoriteTooltip}
                  >
                    🌹
                  </div>
                )}
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
