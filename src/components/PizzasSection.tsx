import { useState } from "react";
import ProductDetailModal, { ProductDetail } from "./ProductDetailModal";
import { PIZZAS_SALEES, PIZZAS_SUCREES, Pizza } from "@/lib/pizzas";

/** Les pizzas (noms, descriptions, ingrédients) viennent de src/lib/pizzas.ts, partagé avec la page /savoie. */
const PizzasSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleProductClick = (product: ProductDetail) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  // Toute la carte ouvre la pop-up de composition ; pas de prix
  const cartePizza = (pizza: Pizza) => (
    <button
      key={pizza.name}
      type="button"
      onClick={() => handleProductClick(pizza)}
      aria-haspopup="dialog"
      className={`group bg-creme-carte border-2 ${pizza.color} rounded-2xl p-5 text-left flex flex-col transition-transform duration-200 motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
    >
      <h4 className="font-display text-xl leading-snug mb-1.5 text-foreground">{pizza.name}</h4>
      <p className="text-foreground/80 flex-grow">{pizza.description}</p>
      <span className="mt-4 text-sm font-bold text-foreground/70 underline underline-offset-4 decoration-foreground/30 group-hover:text-foreground group-hover:decoration-foreground">
        Voir la composition
      </span>
    </button>
  );

  return (
    <section id="pizzas" className="py-12 px-4 section-yellow">
      <div className="container max-w-6xl">
        <h2 className="section-title">Les pizzas du vendredi</h2>

        {/* Pizzas salées */}
        <div className="mb-10">
          <h3 className="font-display text-xl text-foreground mb-4">Salées</h3>
          <div className="grid md:grid-cols-3 gap-6">{PIZZAS_SALEES.map(cartePizza)}</div>
        </div>

        {/* Pizzas sucrées */}
        <div className="mb-12">
          <h3 className="font-display text-xl text-foreground mb-4">Sucrées</h3>
          <div className="grid md:grid-cols-3 gap-6">{PIZZAS_SUCREES.map(cartePizza)}</div>
        </div>

        {/* L'équipe */}
        <div className="bg-card rounded-2xl p-6 md:p-8 mb-6 shadow-soft max-w-3xl mx-auto">
          <h3 className="font-display text-xl text-foreground mb-3">L'équipe</h3>
          <div className="space-y-4 text-foreground leading-relaxed">
            <p>
              Cousins, frères et sœurs : on se retrouve certains vendredis à la Goëttaz. On prend ta commande, on étale la
              pâte, on garnit, on enfourne. Chaque pizza sort du four avec les mains de tout le monde, et le sourire avec.
            </p>
            <p>On utilise le plus possible ce qui pousse ici, à la ferme, pour nos garnitures.</p>
            <p className="text-muted-foreground italic">
              La pâte, c'est la nôtre. Étalée à la main, cuite au feu de bois. On te propose une pizza qu'on est fiers de
              manger nous-mêmes.
            </p>
          </div>

          {/* Encart farine de la ferme */}
          <div className="mt-6 border-l-4 border-primary bg-primary/8 rounded-2xl px-5 py-4">
            <p className="text-sm font-bold text-primary uppercase tracking-widest mb-2">De la terre à l'assiette</p>
            <p className="text-foreground leading-relaxed text-sm">
              Notre pâte est faite avec la farine de la Ferme de la Goëttaz : complète, riche en fibres, nourrissante et
              digeste. Un blé semé, moissonné et moulu par nos soins. De la terre à ton assiette, on maîtrise chaque étape
              à 100 %. Nos pizzas sont préparées comme si c'était nous qui les mangions : généreuses et faites pour être
              partagées.
            </p>
          </div>

          <p className="mt-6 font-bold text-primary">
            Retrouve-nous à la Ferme de la Goëttaz, certains vendredis à partir de 18 h.
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
