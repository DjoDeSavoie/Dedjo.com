import { useState } from "react";
import ProductDetailModal, { ProductDetail } from "./ProductDetailModal";

const SweetProductsSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fabricationOpen, setFabricationOpen] = useState(false);

  const croissantFabrication = "La pâte est étalée, tourée, façonnée à la main dans ma cuisine. Puis bloquée au froid — pour que le beurre AOP garde toute sa fraîcheur jusqu'à ton four.";
  const whereToBuyAll = "Disponible sur le marché du vendredi de la Ferme de la Goettaz et en livraisons sur Chambéry, Aix-les-Bains, Le Bourget-du-Lac et alentours.";

  const products: (ProductDetail & { color: string; photo?: string; badge?: { icon: string; label: string; tooltip?: string } })[] = [
    {
      name: "La Lune",
      description: "Le classique. Un croissant rustique, né de longues heures à étaler la pâte, à plier, à recommencer en corrigeant la recette jusqu'à aboutir au résultat qu me plaît. C'est avec lui que tout a commencé.",
      emoji: "🥐",
      color: "bg-product-croissant",
      // photo: "/images/viennoiseries/la-lune.jpg",
      badge: { icon: "🌼", label: "Classique" },
      ingredients: ["Farine", "Beurre", "Eau", "Lait", "Levure", "Sucre", "Sel"],
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
      description: "Ma signature. Une spirale de praline rose croquante et de crème patissière vanille. Ma préférée — à partager comme on offre une fleur.",
      emoji: "🌹",
      color: "bg-product-rose",
      // photo: "/images/viennoiseries/la-rose.jpg",
      badge: { icon: "❤️", label: "Favorite du chef", tooltip: "Favorite du chef" },
      ingredients: ["Base de pâte à croissant", "Crème pâtissière à la vanille (contient des oeufs)", "Praline rose croquante"],
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
        <p className="text-center italic text-muted-foreground text-base mb-2">
          Fabriqué avec la main et le cœur, pour le plaisir de soi, et des autres.
        </p>
        <p className="text-center text-muted-foreground mb-6 max-w-2xl mx-auto">
          Tu sors ta viennoiseries préférée — le dimanche qui flâne, le brunch improvisé, un matin pour prendre le temps.<br />
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-3xl mx-auto">
          {[
            { icon: "🧈", title: "Beurre de qualité", desc: "Façonnées à la main" },
            { icon: "🏠", title: "Cuites chez toi", desc: "Dans ton propre four" },
            { icon: "☀️", title: "Prêtes en 25 min", desc: "Le matin au réveil" },
            { icon: "🥂", title: "Petit dej' et brunch", desc: "Par toi, pour eux" },
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
        <div className="bg-card rounded-2xl p-6 mb-6 shadow-soft max-w-3xl mx-auto">
          <h3 className="text-2xl mb-4 text-center">🔥 <span className="font-pattaya text-2xl md:text-3xl text-foreground">Recette de Préparation</span></h3>
          <div className="space-y-5 text-foreground leading-relaxed">
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">1️⃣</span>
              <p>Sors tes viennoiseries du congélateur, dispose-les sur une plaque ou une grille recouverte de papier cuisson. Mets-les dans ton four éteint.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">2️⃣</span>
              <p>Allume ton four à <strong>180 °C</strong>, laisse <strong>25 minutes</strong> — plus ou moins, selon tes goûts.</p>
            </div>
          </div>
          <p className="text-center mt-6 text-lg">Régale-toi. 🥐</p>
          <p className="text-center mt-2 text-muted-foreground italic">À partager et à offrir, comme une fleur, pour donner le sourire. 🌼</p>
        </div>

        {/* Fabrication accordion */}
        <div className="max-w-3xl mx-auto mb-8">
          <button
            onClick={() => setFabricationOpen(!fabricationOpen)}
            className="w-full bg-card rounded-2xl p-5 shadow-soft flex items-center justify-between text-left hover:shadow-hover transition-all duration-200"
          >
            <span className="font-pattaya text-xl text-foreground">Comment naissent tes viennoiseries ?</span>
            <span className="text-2xl text-primary transition-transform duration-300" style={{ transform: fabricationOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
          </button>

          {fabricationOpen && (
            <div className="bg-white/70 rounded-2xl px-6 py-6 mt-2 shadow-soft space-y-5 text-foreground leading-relaxed text-sm">
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">🌾</span>
                <div>
                  <p className="font-semibold mb-1">1 — La détrempe (pétrissage)</p>
                  <p>Farine, eau, lait, levure, sel, sucre et une noix de beurre. On pétrit jusqu'à obtenir une pâte souple et homogène. C'est la base — ce que les boulangers appellent la détrempe.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">⏳</span>
                <div>
                  <p className="font-semibold mb-1">2 — Le pointage</p>
                  <p>La pâte repose au frais. Les levures s'activent doucement, la pâte commence à vivre. Cette étape développe les arômes — c'est là que le caractère se construit.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">🧈</span>
                <div>
                  <p className="font-semibold mb-1">3 — L'enchâssage du beurre AOP</p>
                  <p>Un bloc de beurre AOP — le meilleur que je trouve — est enfermé dans la détrempe. Tout commence ici : c'est ce beurre qui va créer le feuilletage.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">📐</span>
                <div>
                  <p className="font-semibold mb-1">4 — Le tourage (lamination)</p>
                  <p>On étale, on plie, on tourne. Plusieurs fois. Chaque pli crée des couches de pâte et de beurre alternées. C'est ce qui donne ce feuilletage qu'on voit éclater à la cuisson.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">✋</span>
                <div>
                  <p className="font-semibold mb-1">5 — Le façonnage</p>
                  <p>Chaque pièce est découpée et roulée à la main. Un croissant, un pain au chocolat, une rose — chacun a sa forme, ses gestes, sa technique.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">❄️</span>
                <div>
                  <p className="font-semibold mb-1">6 — La pré-pousse, puis la congélation</p>
                  <p>Les viennoiseries entament une première pousse, puis sont bloquées au congélateur. La congélation préserve toute la fraîcheur du beurre AOP, conserve les arômes de fermentation et stoppe la fermentation au bon moment. Quand tu les sors chez toi, elles reprennent leur pousse dans la chaleur du four. Le résultat est le même qu'à la sortie de mon labo — mais chez toi, à l'heure qui te convient.</p>
                </div>
              </div>
              <div className="pt-4 border-t border-muted text-center">
                <p className="italic text-muted-foreground">
                  Tu vois, rien de sorcier. Le plus dur, je l'ai déjà fait pour toi —<br />
                  il te reste juste à mettre le four en route, et partager tout ça. 🥐
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SweetProductsSection;
