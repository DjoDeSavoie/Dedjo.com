import { useState } from "react";
import ProductDetailModal, { ProductDetail } from "./ProductDetailModal";

const PizzasSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const pateIngredients = "Pâte (farine, eau, huile d'olive, levure et sel)";
  const fabricationAll = "Pâte pétrie sur place, étalée au rouleau, garnie devant vos yeux et cuite au four à bois.";
  const bonASavoirAll = "Un savoir-faire bien rodé et une union familiale pour vous servir le meilleur.";

  const saltyPizzas: (ProductDetail & { color: string; isFavorite?: boolean; favoriteTooltip?: string })[] = [
    {
      name: "La Classique",
      description: "Sauce Tomate, Jambon, Oignons, Fromage – intemporelle et toujours satisfaisante.",
      emoji: "🍕",
      color: "bg-pizza-classique",
      ingredients: [pateIngredients, "Sauce tomate", "Jambon", "Oignons de la ferme", "Fromage"],
      madeBy: fabricationAll,
      whereToBuy: "Disponible à la Ferme De La Goëttaz lors des soirées pizza",
      additionalInfo: bonASavoirAll,
    },
    {
      name: "La Flam",
      description: "Crème Fraîche, Lardons, Oignons, Fromage – notre création d'inspiration alsacienne.",
      emoji: "🥓",
      color: "bg-pizza-flam",
      isFavorite: true,
      favoriteTooltip: "Favorite du chef",
      ingredients: [pateIngredients, "Crème fraîche", "Lardons fumés", "Oignons", "Fromage râpé"],
      madeBy: fabricationAll,
      whereToBuy: "Disponible à la Ferme De La Goëttaz lors des soirées pizza",
      additionalInfo: bonASavoirAll,
    },
    {
      name: "La Végé",
      description: "Sauce Tomate, Courgettes du jardin, Oignons du jardin, Fromage – fraîche et pleine de saveur.",
      emoji: "🥒",
      color: "bg-pizza-vege",
      ingredients: [pateIngredients, "Sauce tomate", "Courgettes du jardin", "Oignons du jardin", "Fromage"],
      madeBy: fabricationAll,
      whereToBuy: "Disponible à la Ferme De La Goëttaz lors des soirées pizza",
      additionalInfo: bonASavoirAll,
    },
  ];

  const sweetPizzas: (ProductDetail & { color: string; isFavorite?: boolean; favoriteTooltip?: string })[] = [
    {
      name: "La Praline Rose",
      description: "Praline rose et crème AOP – un classique lyonnais, sucré et croquant. Favorite du chef.",
      emoji: "🩷",
      color: "bg-pizza-praline",
      isFavorite: true,
      favoriteTooltip: "Favorite du chef",
      ingredients: ["Pâte sucrée maison", "Pralines roses", "Crème AOP", "Beurre", "Sucre"],
      madeBy: fabricationAll,
      whereToBuy: "Disponible à la Ferme De La Goëttaz lors des soirées pizza",
      additionalInfo: bonASavoirAll,
    },
    {
      name: "La Nut'",
      description: "Pâte à tartiner chocolat – pure gourmandise chocolatée sur notre pâte maison.",
      emoji: "🍫",
      color: "bg-pizza-nut",
      ingredients: ["Pâte sucrée maison", "Pâte à tartiner chocolat-noisettes", "Noisettes", "Sucre glace"],
      madeBy: fabricationAll,
      whereToBuy: "Disponible à la Ferme De La Goëttaz lors des soirées pizza",
      additionalInfo: bonASavoirAll,
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
        <h2 className="section-title"><span className="font-handmade text-2xl md:text-3xl tracking-wide text-handmade-dark">Les Pizzas</span></h2>

        {/* Team Introduction */}
        <div className="bg-card rounded-2xl p-8 mb-8 text-center shadow-soft">
          <h3 className="font-display text-2xl font-semibold mb-4">L'Équipe</h3>
          <p className="text-foreground leading-relaxed mb-4">
            Cousins, frères et sœurs, nous nous réunissons chaque vendredi pour un moment en famille. 
            Des étaleurs de pâte aux preneurs de commandes et cuisiniers, chaque pizza est faite avec 
            bonne humeur, sourires et la joie d'être réunis.
          </p>
          <p className="text-foreground leading-relaxed mb-4">
            Nous utilisons au maximum des ingrédients locaux et de saison, en privilégiant le plus possible les légumes de la Goët. 
          </p>
          <p className="text-muted-foreground italic mb-4">
            Notre pâte ? Faite maison avec amour, étalée à la main et cuite à la perfection dans notre four à bois.
            Nous vous proposons finalement avec plaisir, une pizza que nous sommes fiers de manger nous-mêmes.
          </p>
          <p className="text-primary font-semibold mb-2">
            📍 Retrouvez-nous à la Ferme De La Goëttaz
          </p>
          <p className="text-primary font-semibold">
            🗓️ Les vendredis à partir de 18h
          </p>
        </div>

        {/* Comic cloud bubble anecdotes - scattered positions */}
        <div className="relative mb-12">
          {/* First cloud bubble - top left */}
          <div className="relative max-w-xs ml-4 mb-8">
            <div className="relative">
              <div className="relative bg-white p-5 shadow-lg" style={{
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}>
                <p className="text-foreground/90 italic text-sm text-center leading-relaxed">
                  🔥 "Construit en 2000, ce four à bois est un vecteur social et de partage d'instants de bonheur."
                </p>
              </div>
              <div className="absolute -bottom-3 left-8 w-5 h-5 bg-white rounded-full shadow-md"></div>
              <div className="absolute -bottom-6 left-4 w-3 h-3 bg-white rounded-full shadow-md"></div>
            </div>
          </div>
          
          {/* Second cloud bubble - center right */}
          <div className="relative max-w-xs ml-auto mr-4 mb-8">
            <div className="relative">
              <div className="relative bg-white p-5 shadow-lg" style={{
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}>
                <p className="text-foreground/90 italic text-sm text-center leading-relaxed">
                  🍞 "Il travaille tous les vendredis pour cuire le pain de mon grand-père et les pizzas de Djo."
                </p>
              </div>
              <div className="absolute -bottom-3 right-8 w-5 h-5 bg-white rounded-full shadow-md"></div>
              <div className="absolute -bottom-6 right-4 w-3 h-3 bg-white rounded-full shadow-md"></div>
            </div>
          </div>
          
          {/* Third cloud bubble - bottom center */}
          <div className="relative max-w-xs mx-auto">
            <div className="relative">
              <div className="relative bg-white p-5 shadow-lg" style={{
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}>
                <p className="text-foreground/90 italic text-sm text-center leading-relaxed">
                  👨‍👩‍👧‍👦 "Fait en famille et servi avec le sourire."
                </p>
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow-md"></div>
              <div className="absolute -bottom-6 left-1/2 translate-x-1 w-3 h-3 bg-white rounded-full shadow-md"></div>
            </div>
          </div>
        </div>

        {/* Salty Pizzas */}
        <div className="mb-12">
          <h3 className="font-display text-2xl font-semibold text-center mb-6"><span className="font-handmade text-2xl md:text-2xl tracking-wide text-handmade-dark">Pizzas Salées</span></h3>
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
                    ❤️
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
          <h3 className="font-display text-2xl font-semibold text-center mb-6"><span className="font-handmade text-2xl md:text-2xl tracking-wide text-handmade-dark">Pizzas Sucrées</span></h3>
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
                    ❤️
                  </div>
                )}
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
