import { Button } from "@/components/ui/button";

const ProductShowcaseSection = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const products = [
    {
      emoji: "🥐",
      title: "Viennoiseries",
      description:
        "Un feuilletage 100% fait main. Pâte travaillée et façonnée sur place, puis bloquée en surgélation pour te garantir une cuisson parfaite chez toi, quand tu veux.",
      sectionId: "sweet-products",
      bgColor: "bg-[hsl(50,100%,85%)]",
      borderColor: "border-[hsl(45,100%,60%)]",
      hoverBg: "hover:bg-[hsl(50,100%,80%)]",
    },
    {
      emoji: "🥟",
      title: "Feuilletés salés",
      description:
        "Bouchées d'apéro ou friands du lundi soir. Une pâte feuilletée maison, 4 recettes gourmandes, à enfourner directement sortie du congélateur.",
      sectionId: "salty-pastries",
      bgColor: "bg-[hsl(140,60%,85%)]",
      borderColor: "border-[hsl(140,50%,50%)]",
      hoverBg: "hover:bg-[hsl(140,60%,80%)]",
    },
    {
      emoji: "🍕",
      title: "Pizzas du vendredi",
      description:
        "Pâte pétrie sur place, légumes de la ferme, cuisson au feu de bois. Des pizzas simples et généreuses, servies avec le sourire, qu'on aime manger nous-mêmes.",
      sectionId: "pizzas",
      bgColor: "bg-[hsl(25,100%,88%)]",
      borderColor: "border-[hsl(25,100%,60%)]",
      hoverBg: "hover:bg-[hsl(25,100%,83%)]",
    },
  ];

  return (
    <section id="products-overview" className="py-20 px-6 bg-background">
      <div className="container max-w-5xl">
        <div className="flex justify-center mb-4">
          <svg className="w-16 h-16 text-primary" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 8C28 8 24 12 22 18C20 12 16 8 12 8C8 8 4 14 4 22C4 32 14 40 22 48L32 56L42 48C50 40 60 32 60 22C60 14 56 8 52 8C48 8 44 12 42 18C40 12 36 8 32 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 28C20 28 24 32 32 32C40 32 44 28 44 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M26 20L28 24M38 20L36 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="32" cy="40" r="3" fill="currentColor"/>
            <path d="M12 34C8 30 6 26 6 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
            <path d="M52 34C56 30 58 26 58 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
          </svg>
        </div>
        <h2 className="section-title">
          <span className="font-handmade text-2xl md:text-3xl tracking-wide text-handmade-dark">
            Nos Créations – Fait Main
          </span>
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Découvrez notre gamme de produits artisanaux, tous préparés avec passion et savoir-faire.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.title}
              className={`${product.bgColor} ${product.hoverBg} border-2 ${product.borderColor} rounded-2xl p-6 flex flex-col items-center text-center shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}
            >
              <span className="text-5xl mb-4">{product.emoji}</span>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                {product.title}
              </h3>
              <p className="text-foreground/80 text-sm leading-relaxed mb-6 flex-grow">
                {product.description}
              </p>
              <Button
                onClick={() => scrollToSection(product.sectionId)}
                variant="outline"
                className="border-foreground/50 hover:bg-foreground/10 font-medium"
              >
                Découvrir
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcaseSection;
