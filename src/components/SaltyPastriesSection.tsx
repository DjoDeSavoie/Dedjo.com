const SaltyPastriesSection = () => {
  const flavors = [
    {
      name: "La Montagne",
      description: "Lardons, Oignons et Reblochon – a taste of the Alps in every bite.",
      emoji: "🏔️",
      color: "bg-product-montagne",
    },
    {
      name: "La Forêt",
      description: "Champignons, Béchamel et Fromage à Fondue – earthy, creamy, irresistible.",
      emoji: "🌲",
      color: "bg-product-foret",
    },
    {
      name: "La Goët",
      description: "Poireaux de la Goët et Chèvre – local leeks paired with tangy goat cheese.",
      emoji: "🥬",
      color: "bg-product-goet",
    },
    {
      name: "La Noix",
      description: "Chèvre, Miel et Noix – the perfect balance of sweet, savory, and crunchy.",
      emoji: "🌰",
      color: "bg-product-noix",
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

  return (
    <section id="salty-pastries" className="py-20 px-6 bg-sky/20">
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
              <div 
                key={flavor.name}
                className={`${flavor.color} rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{flavor.emoji}</span>
                  <div>
                    <h4 className="font-display text-xl font-semibold mb-2">{flavor.name}</h4>
                    <p className="text-foreground/80">{flavor.description}</p>
                  </div>
                </div>
              </div>
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
                className="bg-cream/40 rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 animate-fade-in"
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
    </section>
  );
};

export default SaltyPastriesSection;
