import { Link } from "react-router-dom";
import PhotoProduit from "./PhotoProduit";
import ProductTags, { StatutProduit, Tampons } from "./ProductTags";
import { Product, StatutSite, eur } from "@/lib/catalog";
import { ficheDe } from "@/lib/fiches";
import { TAILLES_PHOTO, photosDe } from "@/lib/photos";
import { trierParStatut } from "@/hooks/useDisponibilite";

interface CarteProduitProps {
  product: Product;
  statut: StatutSite;
  /** Classe de bordure de la carte (`border-product-…`). */
  bordure: string;
  /** Pastille propre au site (« Classique »…), affichée seulement si le produit n'a pas de tampon. */
  badge?: string;
  onAjouter: () => void;
  /** Ouvre la pop-up de détails : seule destination d'un produit sans fiche. */
  onDetails: () => void;
}

/**
 * Carte d'un produit : une destination (la fiche, sinon la pop-up de détails) et une action
 * (« + Panier », ou le statut si on ne peut pas commander). Toute la carte mène à la destination :
 * le lien du nom s'étend sur la carte, le bouton « + Panier » passe au-dessus.
 * Un produit « Bientôt disponible » a une carte plus compacte.
 */
const CarteProduit = ({ product, statut, bordure, badge, onAjouter, onDetails }: CarteProduitProps) => {
  const fiche = ficheDe(product.id);
  const photo = photosDe(product.id)[0];
  const compacte = statut === "bientot";
  // Une seule marque par carte : le tampon l'emporte sur la pastille
  const marque = product.labels?.length ? null : badge;
  const etendre = "after:absolute after:inset-0 after:rounded-2xl after:content-['']";

  return (
    <article
      className={`group relative bg-creme-carte border-2 ${bordure} rounded-2xl ${
        compacte ? "p-4" : "p-5"
      } flex flex-col text-left transition-transform duration-200 motion-safe:hover:-translate-y-0.5 has-[h3_:focus-visible]:ring-2 has-[h3_:focus-visible]:ring-ring has-[h3_:focus-visible]:ring-offset-2`}
    >
      <Tampons product={product} />
      {photo && !compacte && (
        // Photo contenue dans une hauteur fixe : la carte voisine sans photo ne reste pas vide
        <PhotoProduit
          photo={photo}
          sizes={TAILLES_PHOTO.carte}
          alt=""
          className="mb-4 h-48 md:h-52 aspect-auto object-contain"
        />
      )}

      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <h3 className={`font-display font-medium leading-snug text-foreground ${compacte ? "text-lg" : "text-xl"}`}>
          {fiche ? (
            <Link to={fiche.chemin} className={`focus-visible:outline-none ${etendre}`}>
              {product.name}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onDetails}
              aria-haspopup="dialog"
              className={`text-left focus-visible:outline-none ${etendre}`}
            >
              {product.name}
            </button>
          )}
        </h3>
        {marque && (
          <span className="bg-white px-2.5 py-0.5 rounded-full text-xs font-semibold text-foreground border border-border">
            {marque}
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-muted-foreground mt-0.5">{product.carte.type}</p>
      <p className={`text-foreground/80 leading-relaxed mt-2 ${compacte ? "text-sm" : ""}`}>{product.carte.phrase}</p>
      <ProductTags product={product} className="mt-3" />
      <p className="text-sm font-semibold text-foreground/70 mt-2">
        {product.pieces} {product.unit} · {eur(product.price)}
      </p>

      <div className="mt-auto pt-4 flex">
        {statut === "disponible" ? (
          <button
            type="button"
            onClick={onAjouter}
            aria-label={`Ajouter un sachet de ${product.name} au panier`}
            className="relative z-10 min-h-11 ml-auto bg-primary text-primary-foreground hover:bg-primary/90 px-5 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            + Panier
          </button>
        ) : (
          <StatutProduit statut={statut} className="relative z-10" />
        )}
      </div>
    </article>
  );
};

interface GrilleProduitsProps {
  produits: Product[];
  statut: (id: string) => StatutSite;
  /** Classe de bordure de chaque produit, par id. */
  bordures: Record<string, string>;
  badges?: Record<string, string>;
  onAjouter: (product: Product) => void;
  onDetails: (product: Product) => void;
}

/**
 * Les cartes d'une gamme, triées selon la disponibilité du moment : les produits en vente
 * (ou épuisés) d'abord, puis les « Bientôt disponible » en cartes compactes.
 */
export const GrilleProduits = ({ produits, statut, bordures, badges = {}, onAjouter, onDetails }: GrilleProduitsProps) => {
  const tries = trierParStatut(produits, statut);
  const enVente = tries.filter((p) => statut(p.id) !== "bientot");
  const bientot = tries.filter((p) => statut(p.id) === "bientot");
  const carte = (p: Product) => (
    <CarteProduit
      key={p.id}
      product={p}
      statut={statut(p.id)}
      bordure={bordures[p.id]}
      badge={badges[p.id]}
      onAjouter={() => onAjouter(p)}
      onDetails={() => onDetails(p)}
    />
  );
  return (
    <div className="space-y-6">
      {enVente.length > 0 && <div className="grid md:grid-cols-2 gap-6">{enVente.map(carte)}</div>}
      {bientot.length > 0 && <div className="grid sm:grid-cols-2 gap-4 md:gap-6">{bientot.map(carte)}</div>}
    </div>
  );
};

export default CarteProduit;
