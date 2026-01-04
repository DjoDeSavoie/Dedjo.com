const PizzasSection = () => {
  const saltyPizzas = [
    {
      name: "La Classique",
      description: "Sauce Tomate, Jambon, Oignons, Fromage – timeless and always satisfying.",
      emoji: "🍕",
    },
    {
      name: "La Flam",
      description: "Crème Fraîche, Lardons, Oignons, Fromage – our Alsacian-inspired creation.",
      emoji: "🥓",
    },
    {
      name: "La Végé",
      description: "Sauce Tomate, Courgettes, Oignons, Champignons, Fromage – fresh and full of flavor.",
      emoji: "🥒",
    },
  ];

  const sweetPizzas = [
    {
      name: "La Praline Rose",
      description: "Praline rose et crème AOP – a Lyon classic, sweet and crunchy.",
      emoji: "🩷",
    },
    {
      name: "La Nut'",
      description: "Pâte à tartiner chocolat – pure chocolate indulgence on our handmade dough.",
      emoji: "🍫",
    },
  ];

  return (
    <section id="pizzas" className="py-20 px-6">
      <div className="container max-w-6xl">
        <span className="text-5xl mb-4 block text-center">🍕</span>
        <h2 className="section-title">Pizzas</h2>

        {/* Team Introduction */}
        <div className="bg-pink/20 rounded-2xl p-8 mb-12 text-center shadow-soft">
          <h3 className="font-display text-2xl font-semibold mb-4">Meet the Team</h3>
          <p className="text-foreground leading-relaxed mb-4">
            Cousins, brothers and sisters – we are a family united by our love of pizza. 
            From the dough-spreaders to the order-takers and cooks, every pizza is made with 
            good mood, smiles, and the joy of being reunited.
          </p>
          <p className="text-muted-foreground italic">
            Our dough? Handmade with love, stretched by hand, and baked to perfection.
          </p>
        </div>

        {/* Salty Pizzas */}
        <div className="mb-12">
          <h3 className="font-display text-2xl font-semibold text-center mb-6">Salty Pizzas</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {saltyPizzas.map((pizza, index) => (
              <div 
                key={pizza.name}
                className="bg-cream/40 rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-center">
                  <span className="text-4xl block mb-3">{pizza.emoji}</span>
                  <h4 className="font-display text-xl font-semibold mb-2">{pizza.name}</h4>
                  <p className="text-muted-foreground text-sm">{pizza.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sweet Pizzas */}
        <div>
          <h3 className="font-display text-2xl font-semibold text-center mb-6">Sweet Pizzas</h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {sweetPizzas.map((pizza, index) => (
              <div 
                key={pizza.name}
                className="bg-accent/20 rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-center">
                  <span className="text-4xl block mb-3">{pizza.emoji}</span>
                  <h4 className="font-display text-xl font-semibold mb-2">{pizza.name}</h4>
                  <p className="text-muted-foreground text-sm">{pizza.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PizzasSection;
