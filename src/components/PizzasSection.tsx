import { useState } from "react";
import ProductDetailModal, { ProductDetail } from "./ProductDetailModal";
import { PIZZAS_SALEES, PIZZAS_SUCREES } from "@/lib/pizzas";

/** Les pizzas (noms, descriptions, ingrédients) viennent de src/lib/pizzas.ts, partagé avec la page /savoie. */
const PizzasSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleProductClick = (product: ProductDetail) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  return (
    <section id="pizzas" className="py-12 px-4 section-yellow">
      <div className="container max-w-6xl">
        <span className="text-5xl mb-4 block text-center">🍕</span>
        <h2 className="section-title"><span className="font-display font-bold text-3xl md:text-4xl text-foreground">Les Pizzas</span></h2>


        {/* Salty Pizzas */}
        <div className="mb-12">
          <h3 className="text-2xl text-center mb-6"><span className="font-display font-bold text-2xl md:text-3xl text-foreground">Pizzas Salées</span></h3>
          <div className="grid md:grid-cols-3 gap-6">
            {PIZZAS_SALEES.map((pizza, index) => (
              <button 
                key={pizza.name}
                onClick={() => handleProductClick(pizza)}
                className={`bg-creme-carte border-2 ${pizza.color} rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in text-left relative`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {pizza.isFavorite && (
                  <div 
                    className="absolute top-3 right-3 text-2xl cursor-help" 
                    title={pizza.favoriteTooltip}
                  >
                    🔥
                  </div>
                )}
                <div className="text-center">
                  <span className="text-4xl block mb-3">{pizza.emoji}</span>
                  <h4 className="font-display text-xl mb-2 text-foreground">{pizza.name}</h4>
                  <p className="text-foreground/80 text-sm">{pizza.description}</p>
                  <p className="text-sm text-white mt-3 font-medium bg-foreground/40 inline-block px-3 py-1 rounded-full">Cliquez pour les détails →</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sweet Pizzas */}
        <div>
          <h3 className="text-2xl text-center mb-6"><span className="font-display font-bold text-2xl md:text-3xl text-foreground">Pizzas Sucrées</span></h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {PIZZAS_SUCREES.map((pizza, index) => (
              <button 
                key={pizza.name}
                onClick={() => handleProductClick(pizza)}
                className={`bg-creme-carte border-2 ${pizza.color} rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in text-left relative`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {pizza.isFavorite && (
                  <div 
                    className="absolute top-3 right-3 text-2xl cursor-help" 
                    title={pizza.favoriteTooltip}
                  >
                    🌹
                  </div>
                )}
                <div className="text-center">
                  <span className="text-4xl block mb-3">{pizza.emoji}</span>
                  <h4 className="font-display text-xl mb-2 text-foreground">{pizza.name}</h4>
                  <p className="text-foreground/80 text-sm">{pizza.description}</p>
                  <p className="text-sm text-white mt-3 font-medium bg-foreground/40 inline-block px-3 py-1 rounded-full">Cliquez pour les détails →</p>
                </div>
              </button>
            ))}
          </div>

          <br /><br /><br />
        </div>

         {/* Team Introduction */}
        <div className="bg-card rounded-2xl p-6 mb-6 text-center shadow-soft">
          <h3 className="font-display text-2xl mb-4">L'Équipe</h3>
          <p className="text-foreground leading-relaxed mb-4">
            Cousins, frères et sœurs — on se retrouve le vendredi à la Goëttaz. On prend ta commande, on étale la pâte, on garnit, on enfourne. < br/> Chaque pizza sort du four avec les mains de tout le monde, et le sourire avec.
          </p>
          <p className="text-foreground leading-relaxed mb-4">
            On utilise le plus possible ce qui pousse ici a la ferme pour nos garnitures.
          </p>
          <p className="text-muted-foreground italic mb-4">
            La pâte, c'est la nôtre. Étalée à la main, cuite au feu de bois. On te propose une pizza qu'on est fiers de manger nous-mêmes.
          </p>

          {/* Encart farine de la ferme */}
          <div className="mt-2 mb-4 border-l-4 border-primary bg-primary/8 rounded-2xl px-5 py-4 text-left shadow-soft max-w-xl mx-auto">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">🌾 De la terre à l'assiette</p>
            <p className="text-foreground leading-relaxed text-sm">
              Notre pâte est faite avec la farine de la ferme de la Goëttaz — complète, riche en fibres, nourrissante et digeste.
              Un blé semé, moissonné et moulu par nos soins. De la terre à ton assiette, on maîtrise chaque étape à 100 %.
              Nos pizzas sont préparées comme si c'était nous qui les mangions — généreuses et faites pour être partagées.
            </p>
          </div>
          <p className="text-primary font-semibold mb-2">
            📍 Retrouvez-nous à la Ferme De La Goëttaz
          </p>
          <p className="text-primary font-semibold">
            🗓️ Les vendredis à partir de 18h
          </p>
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

export default PizzasSection;
