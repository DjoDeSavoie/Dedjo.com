import { toast } from "sonner";
import PageContenu, { LiensPages, Points, SectionPage } from "@/components/PageContenu";
import { MentionsEtiquette, PhotosProduit } from "@/components/EtiquetteProduit";
import ProductTags, { StatutProduit } from "@/components/ProductTags";
import TexteRiche from "@/components/TexteRiche";
import { useCart } from "@/context/CartContext";
import { useDisponibilite } from "@/hooks/useDisponibilite";
import { ALL_PRODUCTS, JOURS_SEMAINE, ProductId, SECTEURS, VIENNOISERIES, eur } from "@/lib/catalog";
import { CHEMIN_GUIDE, CHEMIN_MARSEILLE, CHEMIN_SAVOIE, LIEN_GUIDE, ficheDe, liensFiches, titreFiche } from "@/lib/fiches";
import { TAILLES_PHOTO, photosDe } from "@/lib/photos";
import { ORIGINE_SITE, useDonneesStructurees, useMetaPage } from "@/lib/seo";

/* Valeur lue dans le catalogue (src/lib/catalog.ts). « samedi » : jour de livraison à Marseille. */
const JOUR_LIVRAISON = JOURS_SEMAINE[SECTEURS.find((s) => s.id === "marseille")!.jour];

/* ███  TEXTES — À MODIFIER  ███
   Textes communs aux quatre fiches. Ceux de chaque produit (titre et description pour Google,
   texte d'intro) sont dans src/lib/fiches.ts ; l'étiquette, le prix et la cuisson dans src/lib/catalog.ts.
   Dans un texte : [mots](/adresse) crée un lien, **mots** met en gras. */
const CUISSON_TITRE = "Cuisson";
const INGREDIENTS_TITRE = "Ingrédients et allergènes";
const OU_LE_TROUVER = {
  titre: "Où le trouver",
  lignes: [
    `[À Marseille, Allauch et Plan-de-Cuques](${CHEMIN_MARSEILLE}) : livraison le ${JOUR_LIVRAISON} matin.`,
    `[En Savoie](${CHEMIN_SAVOIE}) : au magasin de la Ferme de la Goëttaz, selon les arrivages.`,
  ],
};
const AJOUTER = "+ Panier";

/**
 * Fiche d'un produit : la même page pour les quatre routes (/la-lune, /la-cabosse, /la-montagne,
 * /la-foret), `id` disant lequel afficher.
 */
const FicheProduit = ({ id }: { id: ProductId }) => {
  const fiche = ficheDe(id)!;
  const product = ALL_PRODUCTS.find((p) => p.id === id)!;
  const { label } = product;
  const photos = photosDe(id);
  const estViennoiserie = VIENNOISERIES.some((p) => p.id === id);

  const { statut } = useDisponibilite();
  const { addVienno, addFriand } = useCart();
  const disponible = statut(id) === "disponible";

  useMetaPage({ titre: fiche.titre, description: fiche.description });

  // Données structurées « Product » lues par Google : posées à l'affichage, retirées en quittant la fiche
  useDonneesStructurees({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: label.description,
    ...(photos.length ? { image: ORIGINE_SITE + photos[0].grande } : {}),
    brand: { "@type": "Brand", name: "Dedjo" },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "EUR",
      availability: disponible ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: ORIGINE_SITE + fiche.chemin,
    },
  });

  // Même comportement que le bouton « + Panier » de l'accueil
  const ajouterAuPanier = () => {
    (estViennoiserie ? addVienno : addFriand)(id, 1);
    toast.success(`1 sachet de ${product.name} ajouté au panier`, {
      description: `${product.pieces} ${product.unit} · ${eur(product.price)}`,
    });
  };

  return (
    <PageContenu>
      <header className="pt-24 md:pt-28 pb-10 px-5 section-cream border-b border-border">
        <div
          className={`mx-auto grid gap-6 md:gap-9 md:items-start ${photos.length ? "max-w-5xl md:grid-cols-2" : "max-w-3xl"}`}
        >
          {/* 1. Photos (carrousel s'il y en a plusieurs), sur la crème des cartes ; sans photo, pas de zone image */}
          {photos.length > 0 && <PhotosProduit product={product} sizes={TAILLES_PHOTO.fiche} prioritaire />}

          <div>
            {/* 2. Titre */}
            <h1 className="font-display text-3xl md:text-4xl leading-tight text-brand-night text-balance">
              {titreFiche(product)}
            </h1>

            {/* 3. Intro, puis description de l'étiquette */}
            <p className="mt-4 text-lg leading-relaxed text-foreground/90">{fiche.intro}</p>
            <p className="mt-3 leading-relaxed text-foreground/80 italic">{label.description}</p>

            {/* 4. Prix, contenu du sachet, disponibilité et ajout au panier */}
            <div className="mt-6 bg-card rounded-2xl shadow-soft p-5 flex flex-wrap items-center gap-x-5 gap-y-4">
              <div>
                <p className="font-display text-3xl leading-none text-brand-night">{eur(product.price)}</p>
                <p className="mt-1.5 text-sm font-bold text-foreground/70">Sachet de {label.quantite}</p>
                <ProductTags product={product} className="mt-2" />
              </div>
              {disponible ? (
                <button
                  type="button"
                  onClick={ajouterAuPanier}
                  className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-full font-bold transition-colors"
                >
                  {AJOUTER}
                </button>
              ) : (
                <StatutProduit statut={statut(id)} className="ml-auto" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 5. Cuisson : la préparation de l'étiquette, et le lien vers le guide */}
      <SectionPage titre={CUISSON_TITRE}>
        <p>
          <TexteRiche texte={label.preparation} />
        </p>
        <p>
          <TexteRiche texte={`[${LIEN_GUIDE}](${CHEMIN_GUIDE})`} />
        </p>
      </SectionPage>

      {/* 6. Étiquette : même affichage que la pop-up « Voir les détails » de l'accueil */}
      <SectionPage titre={INGREDIENTS_TITRE} fond="ciel">
        <div className="bg-card rounded-2xl shadow-soft p-5 space-y-4">
          <MentionsEtiquette label={label} variante="page" />
        </div>
      </SectionPage>

      {/* 7. Où le trouver */}
      <SectionPage titre={OU_LE_TROUVER.titre}>
        <Points points={OU_LE_TROUVER.lignes} puce="→" />
      </SectionPage>

      {/* 8. Les trois autres fiches */}
      <LiensPages titre="Les autres produits" liens={liensFiches(id)} />
    </PageContenu>
  );
};

export default FicheProduit;
