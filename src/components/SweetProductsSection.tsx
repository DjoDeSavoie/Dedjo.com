import { useState } from "react";
import { ChevronDown, Croissant, LucideIcon, Snowflake, Truck } from "lucide-react";
import { toast } from "sonner";
import ProductLabelModal from "./ProductLabelModal";
import PreparationCuisson, { BoutonQuestion } from "./PreparationCuisson";
import { GrilleProduits } from "./CarteProduit";
import { useCart } from "@/context/CartContext";
import { CUISSON, PRIX_SACHET, Product, VIENNOISERIES, eur } from "@/lib/catalog";
import { useDisponibilite } from "@/hooks/useDisponibilite";
import { BORDURE_PRODUIT } from "@/lib/bordures";

/** Pastille du site, montrée seulement sur une carte sans tampon. */
const BADGES: Record<string, string> = { lune: "Classique", rose: "Favorite du chef" };

/** Bandeau d'arguments : trois faits, sans carte ni émoji. Durée et prix lus dans le catalogue. */
const ARGUMENTS: { icone: LucideIcon; titre: string; texte: string }[] = [
  { icone: Croissant, titre: "Pur beurre", texte: "Façonnées à la main, à Marseille." },
  { icone: Snowflake, titre: "Sans décongeler", texte: `Du congélateur au four, ${CUISSON.minutes.viennoiseries} minutes.` },
  { icone: Truck, titre: `${PRIX_SACHET} € le sachet`, texte: "Livré le samedi matin à Marseille." },
];

const SweetProductsSection = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fabricationOpen, setFabricationOpen] = useState(false);
  const { addVienno } = useCart();
  const { statut } = useDisponibilite();

  const handleAdd = (p: Product) => {
    addVienno(p.id, 1);
    toast.success(`1 sachet de ${p.name} ajouté au panier`, {
      description: `${p.pieces} ${p.unit} · ${eur(p.price)}`,
    });
  };

  const handleDetails = (p: Product) => {
    setSelectedProduct(p);
    setModalOpen(true);
  };

  return (
    <section id="sweet-products" className="py-12 px-4 section-cream">
      <div className="container max-w-6xl">
        <h2 className="section-title">Viennoiseries</h2>
        <p className="text-center text-muted-foreground mb-6 max-w-2xl mx-auto">
          Une viennoiserie à enfourner chez soi facilement, pour embaumer la maison d'une douce odeur de boulangerie.
        </p>

        <ul className="grid md:grid-cols-3 max-w-4xl mx-auto mb-10 divide-y md:divide-y-0 md:divide-x divide-border">
          {ARGUMENTS.map(({ icone: Icone, titre, texte }) => (
            <li key={titre} className="flex items-start gap-3 py-4 md:py-1 md:px-6 first:md:pl-0 last:md:pr-0">
              <Icone className="w-5 h-5 mt-1 flex-shrink-0 text-brand-night" strokeWidth={1.5} aria-hidden="true" />
              <div className="text-left">
                <p className="font-display text-xl leading-snug text-brand-night">{titre}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{texte}</p>
              </div>
            </li>
          ))}
        </ul>

        <ProductLabelModal
          product={selectedProduct}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />

        <GrilleProduits
          produits={VIENNOISERIES}
          statut={statut}
          bordures={BORDURE_PRODUIT}
          badges={BADGES}
          onAjouter={handleAdd}
          onDetails={handleDetails}
        />

        {/* Préparation, comme sur l'étiquette */}
        <div className="mt-12 mb-8">
          <PreparationCuisson variante="viennoiseries" />
          <p className="text-center mt-4 text-sm text-muted-foreground italic">À partager et à offrir, comme une fleur, pour donner le sourire.</p>
          <BoutonQuestion sujet="viennoiseries" />
        </div>

        {/* Fabrication accordion */}
        <div className="max-w-3xl mx-auto mb-8">
          <button
            type="button"
            onClick={() => setFabricationOpen(!fabricationOpen)}
            aria-expanded={fabricationOpen}
            className="w-full bg-card rounded-2xl p-5 shadow-soft flex items-center justify-between gap-4 text-left transition-shadow duration-200 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="font-display text-xl text-foreground">Comment naissent tes viennoiseries ?</span>
            <ChevronDown
              className={`w-6 h-6 flex-shrink-0 text-primary transition-transform duration-300 motion-reduce:transition-none ${fabricationOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>

          {fabricationOpen && (
            <div className="bg-white/70 rounded-2xl px-6 py-6 mt-2 shadow-soft space-y-5 text-foreground leading-relaxed text-sm">
              <div>
                <p className="font-bold mb-1">1. La détrempe (pétrissage)</p>
                <p>Farine, eau, lait, levure, sel, sucre et du beurre. On pétrit jusqu'à obtenir une pâte souple et homogène. C'est la base, ce que les boulangers appellent la détrempe.</p>
              </div>
              <div>
                <p className="font-bold mb-1">2. Le pointage</p>
                <p>La pâte repose au frais. Les levures s'activent doucement, la pâte commence à vivre. Cette étape développe les arômes : c'est là que le caractère se construit.</p>
              </div>
              <div>
                <p className="font-bold mb-1">3. L'enchâssage du beurre</p>
                <p>Un bloc de beurre de tourage, le meilleur que je trouve, est enfermé dans la détrempe. Tout commence ici : c'est ce beurre qui va créer le feuilletage.</p>
              </div>
              <div>
                <p className="font-bold mb-1">4. Le tourage (lamination)</p>
                <p>On étale, on plie, on tourne. Plusieurs fois. Chaque pli crée des couches de pâte et de beurre alternées. C'est ce qui donne ce feuilletage qu'on voit éclater à la cuisson.</p>
              </div>
              <div>
                <p className="font-bold mb-1">5. Le façonnage</p>
                <p>Chaque pièce est découpée et roulée à la main. Un croissant, un pain au chocolat, une rose : chacun a sa forme, ses gestes, sa technique.</p>
              </div>
              <div>
                <p className="font-bold mb-1">6. La pré-pousse, puis la congélation</p>
                <p>Les viennoiseries entament une première pousse, puis sont bloquées au congélateur. Le froid préserve toute la fraîcheur du beurre, garde les arômes et arrête la fermentation au bon moment. Chez toi, elles passent direct du congélateur au four, où elles libèrent leurs arômes parfumés de beurre et de ferments dans toutes les pièces de la maison. Le résultat est le même qu'à la sortie de mon labo, mais chez toi, à l'heure qui te convient.</p>
              </div>
              <div className="pt-4 border-t border-muted text-center">
                <p className="italic text-muted-foreground">
                  Tu vois, rien de sorcier. Le plus dur, je l'ai déjà fait pour toi : il te reste juste à mettre le four
                  en route, et partager tout ça.
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
