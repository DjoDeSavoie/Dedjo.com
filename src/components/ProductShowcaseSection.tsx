import type { MouseEvent } from "react";
import FleurTati from "@/components/FleurTati";
import { PRIX_SACHET } from "@/lib/catalog";

/* Cartes de gamme : fond crème carte et bordure de 2 px de la couleur de la gamme, comme les
   cartes produits. Toute la carte est un lien vers la section de la gamme. */
const GAMMES: {
  titre: string;
  description: string;
  lien: string;
  sectionId: string;
  bordure: string;
}[] = [
  {
    titre: "Viennoiseries",
    description:
      "Une pâte pétrie, un feuilletage de beurre régulier. Façonnées puis bloquées au congélateur pour garder leur fraîcheur. Enfourne-les direct du congélateur, quand tu veux : un rituel sans pression.",
    lien: "Voir les viennoiseries",
    sectionId: "sweet-products",
    bordure: "border-[hsl(45,100%,60%)]",
  },
  {
    titre: "Feuilletés salés",
    description:
      "Quatre garnitures savoyardes enveloppées dans une pâte feuilletée maison. En formats friands et bouchées apéritives. Sors-le du congélateur et glisse le au four. À partager sans façons.",
    lien: "Voir les feuilletés",
    sectionId: "salty-pastries",
    bordure: "border-[hsl(140,50%,50%)]",
  },
  {
    titre: "Pizzas du vendredi",
    description:
      "La pâte pétrie sur place. Les légumes de la Goëttaz. Le four à bois. Chaque vendredi soir, on se retrouve — et on te propose une pizza qu'on est fiers de manger nous-mêmes.",
    lien: "Voir les pizzas",
    sectionId: "pizzas",
    bordure: "border-[hsl(25,100%,60%)]",
  },
];

const ProductShowcaseSection = () => {
  // Défilement doux vers la section ; l'adresse (#…) reste un vrai lien
  const allerA = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    e.preventDefault();
    element.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="products-overview" className="pt-8 pb-12 px-4 bg-background">
      <div className="container max-w-5xl">
        <FleurTati className="mx-auto mb-2" />
        {/* Phrase longue : taille réduite, posée sur le h2 lui-même pour un interligne juste */}
        <h2 className="font-display font-bold text-lg md:text-2xl leading-snug text-brand-night text-center text-balance max-w-2xl mx-auto mb-2">
          Viennoiseries artisanales et feuilletés aux influences savoyardes, à cuire direct du congélateur. Livrés à
          Marseille.
        </h2>
        <p className="text-center text-sm md:text-base font-semibold text-foreground mb-6">
          Prix unique de {PRIX_SACHET} euros par sachet
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {GAMMES.map((gamme) => (
            <a
              key={gamme.titre}
              href={`#${gamme.sectionId}`}
              onClick={(e) => allerA(e, gamme.sectionId)}
              className={`group bg-creme-carte border-2 ${gamme.bordure} rounded-2xl p-6 flex flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
            >
              <h3 className="font-display text-xl text-foreground mb-3">{gamme.titre}</h3>
              <p className="text-foreground/80 text-sm leading-relaxed mb-5 flex-grow">{gamme.description}</p>
              <span className="font-semibold text-foreground underline underline-offset-4 decoration-foreground/40 group-hover:decoration-foreground">
                {gamme.lien} <span aria-hidden="true">→</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcaseSection;
