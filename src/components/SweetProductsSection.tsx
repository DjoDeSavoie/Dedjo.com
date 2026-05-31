import { useState } from "react";
import ProductDetailModal, { ProductDetail } from "./ProductDetailModal";

const SweetProductsSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const croissantFabrication = "La pâte est étalée, tourée, façonnée à la main dans ma cuisine. Puis bloquée au froid — pour que le beurre AOP garde toute sa fraîcheur jusqu'à ton four.";
  const whereToBuyAll = "Disponible sur le marché du vendredi de la Ferme de la Goettaz et en livraisons sur Chambéry, Aix-les-Bains, Le Bourget-du-Lac et alentours.";

  const products: (ProductDetail & { color: string; photo?: string; badge?: { icon: string; label: string; tooltip?: string } })[] = [
    {
      name: "La Lune",
      description: "Ma signature au beurre AOP. Un croissant rustique, né de longues heures à étaler la pâte, à plier, à recommencer. C'est avec lui que tout a commencé.",
      emoji: "🥐",
      color: "bg-product-croissant",
      // photo: "/images/viennoiseries/la-lune.jpg",
      badge: { icon: "🌼", label: "Classique" },
      ingredients: ["Farine", "Beurre AOP", "Eau", "Lait", "Levure", "Sucre", "Sel"],
      madeBy: croissantFabrication,
      whereToBuy: whereToBuyAll,
      additionalInfo: "",
    },
    {
      name: "La Cabosse",
      description: "Deux bâtons de chocolat dans chaque bouchée de feuilletage au beurre. Un classique que j'ai façonné pour que le chocolat ne te manque jamais.",
      emoji: "🍫",
      color: "bg-product-chocolat",
      // photo: "/images/viennoiseries/la-cabosse.jpg",
      ingredients: ["Base de pâte à croissant", "Bâtonnets de chocolat noir"],
      madeBy: croissantFabrication,
      whereToBuy: whereToBuyAll,
      additionalInfo: "",
    },
    {
      name: "La Grappe",
      description: "Une crème pâtissière chargée de vanille, des raisins secs généreux, roulés dans la pâte à croissant. La douceur du dimanche matin.",
      emoji: "🍇",
      color: "bg-product-raisin",
      // photo: "/images/viennoiseries/la-grappe.jpg",
      ingredients: ["Base de pâte à croissant", "Crème pâtissière à la vanille", "Raisins secs"],
      madeBy: croissantFabrication + " Garni ensuite d'une crème pâtissière au lait entier infusé aux grains de vanille, et parsemé généreusement de raisins secs. Roulé puis détaillé en portions individuelles.",
      whereToBuy: whereToBuyAll,
      additionalInfo: "💡 Une suggestion d'Apolline (avec deux ailes) et de ses parents",
    },
    {
      name: "La Rose",
      description: "Une spirale de praline rose croquante et de crème vanille. Ma préférée — à partager comme on offre une fleur.",
      emoji: "🌹",
      color: "bg-product-rose",
      // photo: "/images/viennoiseries/la-rose.jpg",
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
    <section id="sweet-products" className="py-12 px-4 section-cream">
      <div className="container max-w-6xl">
        <span className="text-5xl mb-4 block text-center">🥐</span>
        <h2 className="section-title"><span className="font-pattaya text-3xl md:text-4xl text-foreground">Viennoiseries</span></h2>
        <p className="text-center text-muted-foreground mb-6 max-w-2xl mx-auto">
          Façonnée dans ma cuisine, bloquée en congélation pour garder toute la fraîcheur du beurre AOP.<br />
          Tu sors la plaque quand tu veux — le dimanche qui flâne, le brunch improvisé, le matin où tu as le temps.<br />
          <span className="italic">Les levures font leur travail. Ton four signe la dernière étape. Un rituel sans pression.</span>
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-3xl mx-auto">
          {[
            { icon: "🧈", title: "Beurre AOP", desc: "Façonnées à la main" },
            { icon: "🏠", title: "Cuites chez toi", desc: "Dans ton propre four" },
            { icon: "☀️", title: "Prêtes en 20 min", desc: "Le matin au réveil" },
            { icon: "🥂", title: "Brunch fait maison", desc: "Par toi, pour eux" },
          ].map((arg) => (
            <div key={arg.title} className="bg-card rounded-2xl p-4 text-center shadow-soft">
              <span className="text-3xl block mb-2">{arg.icon}</span>
              <p className="font-semibold text-foreground text-sm">{arg.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{arg.desc}</p>
            </div>
          ))}
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
                  className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-soft"
                  title={product.badge.tooltip}
                >
                  <span>{product.badge.icon}</span>
                  <span className="text-foreground">{product.badge.label}</span>
                </div>
              )}
              <div className="flex items-start gap-4">
                <span className="text-4xl">{product.emoji}</span>
                <div>
                  <h3 className="font-display text-xl font-semibold mb-2 text-foreground">{product.name}</h3>
                  <p className="text-foreground/80 text-sm leading-relaxed">{product.description}</p>
                  <span className="inline-block mt-3 text-sm font-medium bg-white/50 px-3 py-1 rounded-full">
                    Voir les détails →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <br /> <br />

        {/* Recipe Card */}
        <div className="bg-card rounded-2xl p-6 mb-8 shadow-soft max-w-3xl mx-auto">
          <h3 className="text-2xl mb-2 text-center">☀️ <span className="font-pattaya text-2xl md:text-3xl text-foreground">L'Atelier du matin</span></h3>
          
          <p className="text-center text-muted-foreground italic mb-6">
            Ici, tu fais équipe avec les levures.<br />
            Un petit rituel d'une matinée, pour des viennoiseries qui ont gonflé sous tes yeux.
          </p>

          <div className="space-y-5 text-foreground leading-relaxed">
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">1️⃣</span>
              <div>
                <p className="font-semibold mb-1">Le réveil des levures</p>
                <p>Au réveil, sors tes viennoiseries du congélateur et pose-les sur une plaque recouverte de papier cuisson, en les espaçant bien.</p>
                <p className="mt-2">Crée-leur un petit nid tiède : allume simplement la lumière de ton four (sans le chauffer), porte fermée. Sa douce chaleur suffit à réveiller les levures.</p>
                <p className="mt-2 text-sm text-muted-foreground italic">Pas de lumière dans ton four ? Chauffe-le 5 minutes à 30 °C, éteins-le, puis glisse la plaque à l'intérieur, porte fermée.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">2️⃣</span>
              <div>
                <p className="font-semibold mb-1">La patience</p>
                <p>Laisse le temps et les levures travailler ensemble pendant <strong>1 h 30 à 2 h</strong>. La pâte se détend, gonfle, s'arrondit. Quand tes viennoiseries ont visiblement grossi et qu'elles tremblotent un peu quand tu bouges la plaque, elles sont prêtes.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">3️⃣</span>
              <div>
                <p className="font-semibold mb-1">La cuisson</p>
                <p>Sors la plaque et préchauffe ton four à <strong>180 °C</strong>. Enfourne <strong>13 à 18 minutes</strong>, selon le doré et le croustillant que tu aimes. Laisse tiédir quelques minutes… et régale-toi. 🥐</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-muted text-center">
            <p className="font-handmade md:text-xl tracking-wide text-handmade-dark italic">
              Hérité de mes grands-parents. Façonné dans ma cuisine. Partagé chez toi.<br /><br />
              Un rituel à trois temps, pour les dimanches qui s'étirent<br />
              et les tables où l'on aime se retrouver.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SweetProductsSection;
