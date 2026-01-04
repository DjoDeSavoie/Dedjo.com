const SweetProductsSection = () => {
  const products = [
    {
      name: "Croissants",
      description: "Our signature butter croissant, with flaky golden layers of pure bliss. Made fresh every morning.",
      emoji: "🥐",
      color: "bg-product-croissant",
    },
    {
      name: "Pain au Chocolat",
      description: "Rich chocolate batons wrapped in buttery, laminated dough. A classic French favorite.",
      emoji: "🍫",
      color: "bg-product-chocolat",
    },
    {
      name: "La Rose de Djo",
      description: "Our house specialty – a beautiful rose-shaped pastry with delicate layers and a sweet surprise inside.",
      emoji: "🌹",
      color: "bg-product-rose",
    },
    {
      name: "Les Pains au Raisin",
      description: "Soft, swirled pastry filled with custard cream and juicy raisins. Perfect with your morning coffee.",
      emoji: "🍇",
      color: "bg-product-raisin",
    },
  ];

  return (
    <section id="sweet-products" className="py-20 px-6">
      <div className="container max-w-6xl">
        <span className="text-5xl mb-4 block text-center">🥐</span>
        <h2 className="section-title">My Sweet Products</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Bake-it-yourself pastries, crafted with love. Each product comes ready for you to 
          bake fresh at home – nothing beats the aroma of freshly baked viennoiseries.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {products.map((product, index) => (
            <div 
              key={product.name}
              className={`${product.color} rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{product.emoji}</span>
                <div>
                  <h3 className="font-display text-xl font-semibold mb-2">{product.name}</h3>
                  <p className="text-foreground/80">{product.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SweetProductsSection;
