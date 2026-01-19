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
            {/* Deux mains ouvertes joyeuses */}
            {/* Main gauche */}
            <path d="M8 38C8 38 6 32 8 28C10 24 14 22 16 24L18 28L20 22C20 22 22 18 26 20C28 21 28 24 28 26L26 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 24L14 18C14 18 14 14 18 14C22 14 22 18 22 18L20 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 14L20 10C20 10 22 6 26 8C28 9 28 12 28 14L26 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M26 34L28 42C28 42 26 48 20 48C14 48 10 44 10 40L8 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            {/* Main droite */}
            <path d="M56 38C56 38 58 32 56 28C54 24 50 22 48 24L46 28L44 22C44 22 42 18 38 20C36 21 36 24 36 26L38 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M48 24L50 18C50 18 50 14 46 14C42 14 42 18 42 18L44 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M46 14L44 10C44 10 42 6 38 8C36 9 36 12 36 14L38 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M38 34L36 42C36 42 38 48 44 48C50 48 54 44 54 40L56 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            {/* Étoiles de joie */}
            <path d="M32 16L33 18L35 18L33.5 19.5L34 22L32 20.5L30 22L30.5 19.5L29 18L31 18L32 16Z" fill="currentColor"/>
            <circle cx="12" cy="8" r="1.5" fill="currentColor" opacity="0.7"/>
            <circle cx="52" cy="8" r="1.5" fill="currentColor" opacity="0.7"/>
            <circle cx="32" cy="54" r="2" fill="currentColor" opacity="0.5"/>
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
