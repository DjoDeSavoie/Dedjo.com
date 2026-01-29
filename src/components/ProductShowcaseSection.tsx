import { Button } from "@/components/ui/button";
import fleurTati from "@/assets/fleurTati.svg";

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
          <img src={fleurTati} alt="Fleur fait main" className="w-20 h-20" />
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
