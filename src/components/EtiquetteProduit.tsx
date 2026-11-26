import { ReactNode, useEffect, useState } from "react";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import PhotoProduit from "@/components/PhotoProduit";
import TexteRiche from "@/components/TexteRiche";
import { Product, ProductLabel } from "@/lib/catalog";
import { photosDe } from "@/lib/photos";

/* Affichage de l'étiquette d'un produit, partagé par la pop-up « Voir les détails »
   (ProductLabelModal.tsx) et par les fiches produits (pages/FicheProduit.tsx). */

/** Où l'étiquette est affichée : dans la pop-up (texte compact) ou sur une page (texte courant). */
type Variante = "popup" | "page";

interface RubriqueProps {
  titre: string;
  variante?: Variante;
  children: ReactNode;
}

/** Une rubrique de l'étiquette : petit titre et son texte. Sur une page, le titre est un h3 (sous le h2 de la section). */
export const RubriqueEtiquette = ({ titre, variante = "popup", children }: RubriqueProps) => {
  const Titre = variante === "page" ? "h3" : "h4";
  return (
    <div>
      <Titre className="text-foreground mb-1 flex items-center gap-2">{titre}</Titre>
      <div className={`${variante === "page" ? "text-base" : "text-sm"} text-muted-foreground space-y-1`}>{children}</div>
    </div>
  );
};

/**
 * Mentions de l'étiquette : dénomination, ingrédients (allergènes en gras), traces, allergènes,
 * conservation, DDM et exploitant. La quantité n'est affichée que dans la pop-up : la fiche
 * l'indique déjà à côté du prix.
 */
export const MentionsEtiquette = ({ label, variante = "popup" }: { label: ProductLabel; variante?: Variante }) => (
  <>
    <RubriqueEtiquette titre="📋 Ingrédients" variante={variante}>
      {label.denomination && <p className="font-medium text-foreground/80">{label.denomination}</p>}
      <p>
        <TexteRiche texte={label.ingredients} />
      </p>
      {label.traces && <p className="italic">{label.traces}</p>}
    </RubriqueEtiquette>

    {label.allergenes && (
      <RubriqueEtiquette titre="⚠️ Allergènes" variante={variante}>
        <p>
          <TexteRiche texte={label.allergenes} />
        </p>
      </RubriqueEtiquette>
    )}

    {variante === "popup" && (
      <RubriqueEtiquette titre="📦 Quantité" variante={variante}>
        <p>{label.quantite}</p>
      </RubriqueEtiquette>
    )}

    <RubriqueEtiquette titre="🧊 Conservation" variante={variante}>
      <p>{label.conservation}</p>
    </RubriqueEtiquette>

    {label.ddm && (
      <RubriqueEtiquette titre="📅 DDM" variante={variante}>
        <p>{label.ddm}</p>
      </RubriqueEtiquette>
    )}

    <RubriqueEtiquette titre="🏷️ Fabriqué par" variante={variante}>
      <p>{label.exploitant}</p>
    </RubriqueEtiquette>
  </>
);

interface PhotosProduitProps {
  product: Product;
  /** Largeur affichée (attribut sizes), voir TAILLES_PHOTO. */
  sizes: string;
  className?: string;
  /** Vrai : la première photo est chargée tout de suite (photo principale d'une page). */
  prioritaire?: boolean;
}

/**
 * Photos d'un produit : une seule photo telle quelle, ou à partir de deux un carrousel à faire
 * glisser (sans défilement automatique), avec un point par photo. Rien si le produit n'a pas de photo.
 */
export const PhotosProduit = ({ product, sizes, className, prioritaire = false }: PhotosProduitProps) => {
  const photos = photosDe(product.id);
  const [api, setApi] = useState<CarouselApi>();
  const [actuelle, setActuelle] = useState(0);

  useEffect(() => {
    if (!api) return;
    const surSelection = () => setActuelle(api.selectedScrollSnap());
    surSelection();
    api.on("select", surSelection);
    api.on("reInit", surSelection);
    return () => {
      api.off("select", surSelection);
      api.off("reInit", surSelection);
    };
  }, [api]);

  if (!photos.length) return null;
  if (photos.length === 1) {
    return (
      <PhotoProduit
        photo={photos[0]}
        sizes={sizes}
        className={className}
        chargement={prioritaire ? "eager" : "lazy"}
      />
    );
  }

  return (
    <Carousel setApi={setApi} className={className} aria-label={`Photos de ${product.name}`}>
      <CarouselContent>
        {photos.map((photo, i) => (
          <CarouselItem key={photo.n} aria-label={`Photo ${i + 1} sur ${photos.length}`}>
            <PhotoProduit
              photo={photo}
                    sizes={sizes}
              chargement={prioritaire && i === 0 ? "eager" : "lazy"}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="flex justify-center pt-1">
        {photos.map((photo, i) => (
          <button
            key={photo.n}
            type="button"
            onClick={() => api?.scrollTo(i)}
            aria-label={`Voir la photo ${i + 1} sur ${photos.length}`}
            aria-current={i === actuelle ? "true" : undefined}
            className="group p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className={`block h-2 rounded-full transition-all ${
                i === actuelle ? "w-5 bg-primary" : "w-2 bg-foreground/25 group-hover:bg-foreground/40"
              }`}
            />
          </button>
        ))}
      </div>
    </Carousel>
  );
};
