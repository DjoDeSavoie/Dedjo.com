import type { MouseEvent } from "react";
import FleurTati from "@/components/FleurTati";
import { CUISSON } from "@/lib/catalog";

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
      `Croissants et pains au chocolat pur beurre, façonnés à la main et surgelés crus. ${CUISSON.minutes.viennoiseries} minutes au four, sans décongeler.`,
    lien: "Voir les viennoiseries",
    sectionId: "sweet-products",
    bordure: "border-[hsl(45,100%,60%)]",
  },
  {
    titre: "Feuilletés salés",
    description:
      `Quatre garnitures savoyardes dans une pâte feuilletée maison, en friands. ${CUISSON.minutes.feuilletes} minutes au four, sans décongeler.`,
    lien: "Voir les feuilletés",
    sectionId: "salty-pastries",
    bordure: "border-[hsl(140,50%,50%)]",
  },
  {
    titre: "Pizzas du vendredi",
    description:
      "Au feu de bois, à la Ferme de la Goëttaz, certains vendredis soir. Pâte pétrie sur place, légumes de la ferme.",
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
        <FleurTati className="mx-auto mb-6" />
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
