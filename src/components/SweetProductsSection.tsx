import { useState } from "react";
import ProductDetailModal, { ProductDetail } from "./ProductDetailModal";

const SweetProductsSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const croissantFabrication = "Pétri puis façonné à la main par Dj'o, puis bloqué en congélation pour préserver toute la fraîcheur du beurre.";
  const whereToBuyAll = "Disponible sur le marché du vendredi de la Ferme de la Goettaz et en livraisons sur Chambéry, Aix-les-Bains, Le Bourget-du-Lac et alentours.";

  const products: (ProductDetail & { color: string; badge?: { icon: string; label: string; tooltip?: string } })[] = [
    {
      name: "La Lune",
      description: "La signature au beurre, un croissant rustique établie après des heures de confection et de perfectionnement, à étaler des kilos de pâtes au rouleau à pâtisserie.",
      emoji: "🥐",
      color: "bg-product-croissant",
      badge: { icon: "🌼", label: "Classique" },
      ingredients: ["Farine", "Beurre AOP", "Eau", "Lait", "Levure", "Sucre", "Sel"],
      madeBy: croissantFabrication,
      whereToBuy: whereToBuyAll,
      additionalInfo: "",
    },
    {
      name: "La Cabosse",
      description: "Deux bâtons de chocolat enveloppés dans une pâte feuilletée au beurre. Un classique incontournable. Façonnés de telle sorte à avoir du chocolat dans chaque bouchée.",
      emoji: "🍫",
      color: "bg-product-chocolat",
      ingredients: ["Base de pâte à croissant", "Bâtonnets de chocolat noir"],
      madeBy: croissantFabrication,
      whereToBuy: whereToBuyAll,
      additionalInfo: "",
    },
    {
      name: "La Grappe",
      description: "Un roulé aux raisins secs et une crème pâtissière chargée de vanille.",
      emoji: "🍇",
      color: "bg-product-raisin",
      ingredients: ["Base de pâte à croissant", "Crème pâtissière à la vanille", "Raisins secs"],
      madeBy: croissantFabrication + " Garni ensuite d'une crème pâtissière au lait entier infusé aux grains de vanille, et parsemé généreusement de raisins secs. Roulé puis détaillé en portions individuelles.",
      whereToBuy: whereToBuyAll,
      additionalInfo: "💡 Une suggestion d'Apolline (avec deux ailes) et de ses parents",
    },
    {
      name: "La Rose",
      description: "Un enrobage de praline rose et de crème vanille. À partager telle une belle fleur pour donner le sourire.",
      emoji: "🌹",
      color: "bg-product-rose",
      badge: { icon: "❤️", label: "Favorite du chef", tooltip: "Favorite du chef" },
      ingredients: ["Base de pâte à croissant", "Crème pâtissière à la vanille", "Praline rose croquante"],
      madeBy: croissantFabrication + " Garni ensuite d'une crème pâtissière au lait entier infusé aux grains de vanille, et parsemé généreusement de pralines roses. Roulé puis détaillé en portions individuelles.",
      whereToBuy: whereToBuyAll,
      additionalInfo: "La spécialité de la maison – Favorite du chef.",
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
        <h2 className="section-title"><span className="font-handmade text-2xl md:text-3xl tracking-wide text-handmade-dark">Viennoiseries</span></h2>
        <p className="text-center text-muted-foreground mb-4 max-w-2xl mx-auto">
          Des viennoiseries faites à la main, produites avec amour, que je te confie pour la cuisson, te permettant de déguster et de partager, un produit qui te ressemble, avant tout.
        </p>
        
        {/* Anecdote bubble */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-8 max-w-xl mx-auto text-center">
          <p className="text-foreground/90 italic text-sm">
            💬 "Une passion transmise depuis tout jeune par mes grands-parents. Chaque geste est un hommage à leur savoir-faire et à ces matins où l'odeur du beurre chaud remplissait la cuisine."
          </p>
        </div>

        <ProductDetailModal 
          product={selectedProduct}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />

        <div className="grid md:grid-cols-2 gap-6">
          {products.map((product, index) => (
            <button 
              key={product.name}
              onClick={() => handleProductClick(product)}
              className={`${product.color} rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in text-left relative`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {product.badge && (
                <div 
                  className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                  title={product.badge.tooltip}
                >
                  <span>{product.badge.icon}</span>
                  <span className="text-foreground">{product.badge.label}</span>
                </div>
              )}
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

        <br /> <br />

        {/* Recipe Card */}
        <div className="bg-card rounded-2xl p-8 mb-12 shadow-soft max-w-3xl mx-auto">
          <h3 className="font-display text-2xl font-semibold mb-6 text-center">☕️ <span className="font-handmade text-2xl md:text-3xl tracking-wide text-handmade-dark">Recette de Préparation</span></h3>
          
          <div className="space-y-4 text-foreground leading-relaxed">
            <div className="flex items-start gap-3">
              <span className="text-xl">1️⃣</span>
              <p><strong>Le Réveil des Levures :</strong> La veille au soir, chauffe ton four à 50 degrés.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl"></span>
              <p>Pose tes viennoiseries sur une plaque recouverte de papier cuisson et enfourne 5 minutes.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl"></span>
              <p>Éteins simplement ton four, les viennoiseries toujours à l'intérieur et ... laisse sa chaleur, le temps et les levures travailler ensemble, pendant la nuit.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">2️⃣</span>
              <p><strong>La cuisson :</strong> Le lendemain matin, les viennoiseries ont gonflé ! 
              Elles sont prêtes à passer en cuisson.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl"></span>
              <p>Retire-les du four. Préchauffe-le à 180 °C.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl"></span>
              <p>Enfourne 13 à 18 minutes selon le doré et le croustillant que tu aimes. <strong>Régale-toi !</strong></p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-muted text-center">
            <p className="font-handmade md:text-xl tracking-wide text-handmade-dark">
              Produit d'un savoir-faire hérité de mes grands-parents.<br />
              Manipulé avec respect et patience, tel un rituel gourmand,<br />
              il ouvre les portes d'un moment de partage avec les gens que l'on aime,<br />
              et ceux que l'on souhaite découvrir davantage.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SweetProductsSection;
