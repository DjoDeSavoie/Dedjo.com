import { useState } from "react";
import ProductDetailModal, { ProductDetail } from "./ProductDetailModal";

const SweetProductsSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const products: (ProductDetail & { color: string })[] = [
    {
      name: "Le Croissant",
      description: "Notre croissant signature au beurre, avec des couches dorées et feuilletées de pur bonheur. Fait frais chaque matin.",
      emoji: "🥐",
      color: "bg-product-croissant",
      ingredients: ["Beurre AOP", "Farine", "Levure", "Sucre", "Sel", "Lait"],
      madeBy: "Façonné à la main par notre maître boulanger avec plus de 20 ans d'expérience",
      whereToBuy: "Disponible à la Ferme De La Goëttaz et sur les marchés locaux",
      additionalInfo: "Meilleur dégusté tiède, dans les 2 heures après cuisson. Peut être congelé et réchauffé.",
    },
    {
      name: "Pain au Chocolat",
      description: "De riches bâtons de chocolat enveloppés dans une pâte feuilletée au beurre. Un classique français incontournable.",
      emoji: "🍫",
      color: "bg-product-chocolat",
      ingredients: ["Beurre AOP", "Chocolat noir 70%", "Farine", "Levure", "Sucre", "Sel"],
      madeBy: "Élaboré avec du chocolat belge et du beurre français",
      whereToBuy: "Disponible à la Ferme De La Goëttaz et sur les marchés locaux",
      additionalInfo: "Contient deux généreux bâtons de chocolat dans chaque viennoiserie.",
    },
    {
      name: "La Rose de Djo",
      description: "Notre spécialité maison – une viennoiserie en forme de rose avec des couches délicates et une surprise sucrée à l'intérieur.",
      emoji: "🌹",
      color: "bg-product-rose",
      ingredients: ["Beurre", "Farine", "Eau de rose", "Confiture de framboise", "Sucre glace", "Vanille"],
      madeBy: "Notre création signature, une recette de famille De Djo",
      whereToBuy: "Exclusivité à la Ferme De La Goëttaz – disponibilité limitée chaque jour",
      additionalInfo: "Nommée d'après la grand-mère du fondateur. Chaque rose est façonnée à la main.",
    },
    {
      name: "Pain aux Raisins",
      description: "Viennoiserie moelleuse et spiralée garnie de crème pâtissière et de raisins juteux. Parfait avec votre café du matin.",
      emoji: "🍇",
      color: "bg-product-raisin",
      ingredients: ["Beurre", "Farine", "Crème pâtissière", "Raisins secs", "Vanille", "Extrait de rhum"],
      madeBy: "Recette traditionnelle française transmise de génération en génération",
      whereToBuy: "Disponible à la Ferme De La Goëttaz et sur les marchés du week-end",
      additionalInfo: "Nos raisins sont macérés dans le rhum pendant 24 heures avant cuisson.",
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
        <h2 className="section-title">Viennoiseries</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Des viennoiseries à cuire vous-même, faites avec amour. Chaque produit arrive prêt à être 
          cuit frais chez vous – rien ne vaut l'arôme des viennoiseries fraîchement sorties du four.
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
                  <p className="text-sm text-white mt-2 font-medium bg-foreground/40 inline-block px-3 py-1 rounded-full">Cliquez pour les détails →</p>
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
