import { useState } from "react";
import ProductDetailModal, { ProductDetail } from "./ProductDetailModal";

const SweetProductsSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const products: (ProductDetail & { color: string })[] = [
    {
      name: "Croissants",
      description: "Our signature butter croissant, with flaky golden layers of pure bliss. Made fresh every morning.",
      emoji: "🥐",
      color: "bg-product-croissant",
      ingredients: ["Butter (AOP)", "Flour", "Yeast", "Sugar", "Salt", "Milk"],
      madeBy: "Handcrafted by our master baker with 20+ years of experience",
      whereToBuy: "Available at Ferme De La Goëttaz and local markets",
      additionalInfo: "Best enjoyed warm, within 2 hours of baking. Can be frozen and reheated.",
    },
    {
      name: "Pain au Chocolat",
      description: "Rich chocolate batons wrapped in buttery, laminated dough. A classic French favorite.",
      emoji: "🍫",
      color: "bg-product-chocolat",
      ingredients: ["Butter (AOP)", "Dark Chocolate (70%)", "Flour", "Yeast", "Sugar", "Salt"],
      madeBy: "Crafted with Belgian chocolate and French butter",
      whereToBuy: "Available at Ferme De La Goëttaz and local markets",
      additionalInfo: "Contains two generous chocolate batons inside each pastry.",
    },
    {
      name: "La Rose de Djo",
      description: "Our house specialty – a beautiful rose-shaped pastry with delicate layers and a sweet surprise inside.",
      emoji: "🌹",
      color: "bg-product-rose",
      ingredients: ["Butter", "Flour", "Rose Water", "Raspberry Jam", "Powdered Sugar", "Vanilla"],
      madeBy: "Our signature creation, a De Djo family recipe",
      whereToBuy: "Exclusive to Ferme De La Goëttaz – limited daily availability",
      additionalInfo: "Named after the founder's grandmother. Each rose is hand-shaped.",
    },
    {
      name: "Les Pains au Raisin",
      description: "Soft, swirled pastry filled with custard cream and juicy raisins. Perfect with your morning coffee.",
      emoji: "🍇",
      color: "bg-product-raisin",
      ingredients: ["Butter", "Flour", "Custard Cream", "Raisins", "Vanilla", "Rum Extract"],
      madeBy: "Traditional French recipe passed down through generations",
      whereToBuy: "Available at Ferme De La Goëttaz and weekend markets",
      additionalInfo: "Our raisins are soaked in rum for 24 hours before baking.",
    },
  ];

  const handleProductClick = (product: ProductDetail) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  return (
    <section id="sweet-products" className="py-20 px-6 section-cream">
      <div className="container max-w-6xl">
        <span className="text-5xl mb-4 block text-center">🥐</span>
        <h2 className="section-title">My Sweet Products</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Bake-it-yourself pastries, crafted with love. Each product comes ready for you to 
          bake fresh at home – nothing beats the aroma of freshly baked viennoiseries.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {products.map((product, index) => (
            <button 
              key={product.name}
              onClick={() => handleProductClick(product)}
              className={`${product.color} rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in text-left`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{product.emoji}</span>
                <div>
                  <h3 className="font-display text-xl font-semibold mb-2">{product.name}</h3>
                  <p className="text-foreground/80">{product.description}</p>
                  <p className="text-sm text-primary mt-2 font-medium">Click for details →</p>
                </div>
              </div>
            </button>
          ))}
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

export default SweetProductsSection;
