import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import fleurTati from "@/assets/fleurTati.png";
import FeuilleteIllustration from "@/components/FeuilleteIllustration";
import { PRIX_SACHET } from "@/lib/catalog";

const ProductShowcaseSection = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const products: {
    emoji: string;
    /** Illustration affichée à la place de l'emoji. */
    illustration?: ReactNode;
    title: string;
    description: string;
    sectionId: string;
    bgColor: string;
    borderColor: string;
    hoverBg: string;
  }[] = [
    {
      emoji: "🥐",
      title: "Viennoiseries",
      description:
        "Une pate pétrie, un feuilletage de beurre régulier. Façonnée puis bloquée en congélation pour conserver sa fraîcheur. Prépare ta viennoiseries quand tu le veux — un rituel sans pression.",
      sectionId: "sweet-products",
      bgColor: "bg-[hsl(50,100%,85%)]",
      borderColor: "border-[hsl(45,100%,60%)]",
      hoverBg: "hover:bg-[hsl(50,100%,80%)]",
    },
    {
      emoji: "🥟",
      illustration: <FeuilleteIllustration className="w-14 h-14 mb-2" />,
      title: "Feuilletés salés",
      description:
        "Quatre garnitures savoyardes enveloppées dans une pâte feuilletée maison. En formats friands et bouchées apéritives. Sors-le du congélateur et glisse le au four. À partager sans façons.",
      sectionId: "salty-pastries",
      bgColor: "bg-[hsl(140,60%,85%)]",
      borderColor: "border-[hsl(140,50%,50%)]",
      hoverBg: "hover:bg-[hsl(140,60%,80%)]",
    },
    {
      emoji: "🍕",
      title: "Pizzas du vendredi",
      description:
        "La pâte pétrie sur place. Les légumes de la Goëttaz. Le four à bois. Chaque vendredi soir, on se retrouve — et on te propose une pizza qu'on est fiers de manger nous-mêmes.",
      sectionId: "pizzas",
      bgColor: "bg-[hsl(25,100%,88%)]",
      borderColor: "border-[hsl(25,100%,60%)]",
      hoverBg: "hover:bg-[hsl(25,100%,83%)]",
    },
  ];

  return (
    <section id="products-overview" className="pt-8 pb-12 px-4 bg-background">
      <div className="container max-w-5xl">
        <div className="flex justify-center mb-2">
          {/* Le dessin sert de masque : sa couleur vient du fond (bleu de Dedjo) */}
          <span
            role="img"
            aria-label="Dessin de fleur de Tati"
            className="w-12 h-12 bg-brand-night"
            style={{
              WebkitMaskImage: `url(${fleurTati})`,
              maskImage: `url(${fleurTati})`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
        </div>
        <h2 className="section-title !mb-2">
          <span className="font-display font-bold text-2xl md:text-3xl text-brand-night">
            Des Créations Artisanales
          </span>
        </h2>
        <p className="text-center text-sm md:text-base font-semibold text-foreground mb-6">
          Prix unique de {PRIX_SACHET} euros par sachet
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.title}
              className={`${product.bgColor} ${product.hoverBg} border-2 ${product.borderColor} rounded-2xl p-6 flex flex-col items-center text-center shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}
            >
              {product.illustration ?? <span className="text-5xl mb-4">{product.emoji}</span>}
              <h3 className="font-display text-xl text-foreground mb-3">
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
