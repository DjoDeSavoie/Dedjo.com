import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { PRIX_SACHET } from "@/lib/catalog";
import { HAUTEUR_PHOTO, LARGEUR_PHOTO, photosDe } from "@/lib/photos";
import { defilement } from "@/lib/utils";

/* Photo de La Lune, détourée, posée directement sur le fond du site */
const photoLune = photosDe("lune")[0];

const Hero = () => {
  // Défilement doux vers les produits ; l'adresse (#…) reste un vrai lien
  const allerAuxProduits = (e: MouseEvent<HTMLAnchorElement>) => {
    const element = document.getElementById("products-overview");
    if (!element) return;
    e.preventDefault();
    element.scrollIntoView({ behavior: defilement() });
  };

  return (
    <section id="hero" className="px-4 pt-28 pb-8 md:pb-12">
      <div className="container max-w-5xl grid gap-8 md:grid-cols-2 md:items-center">
        <div className="text-left motion-safe:animate-fade-in">
          <h1 className="font-brand text-5xl md:text-6xl leading-none text-brand-night">Dedjo</h1>
          <p className="font-accroche italic text-xl md:text-3xl text-brand-night mt-2">L'artisanat chez soi</p>
          {/* Texte du lot SEO 1 : il reste un h2, mot pour mot */}
          <h2 className="font-display text-xl md:text-2xl leading-snug text-brand-night text-balance mt-6 max-w-xl">
            Viennoiseries artisanales et feuilletés aux influences savoyardes, à cuire direct du congélateur. Livrés à
            Marseille.
          </h2>
          <p className="font-bold text-foreground mt-3">Prix unique de {PRIX_SACHET} euros par sachet</p>

          <div className="flex flex-wrap gap-3 mt-7">
            <Link
              to="/commande?secteur=marseille"
              className="inline-flex items-center min-h-12 bg-primary text-primary-foreground px-8 rounded-full font-bold transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Commander
            </Link>
            <a
              href="#products-overview"
              onClick={allerAuxProduits}
              className="inline-flex items-center min-h-12 bg-card border border-foreground/50 text-foreground px-7 rounded-full font-bold transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Voir les produits
            </a>
          </div>
        </div>

        {photoLune && (
          <img
            src={photoLune.petite}
            srcSet={`${photoLune.petite} 600w, ${photoLune.grande} 1200w`}
            sizes="(min-width: 1024px) 456px, (min-width: 768px) calc(50vw - 64px), calc(100vw - 32px)"
            width={LARGEUR_PHOTO}
            height={HAUTEUR_PHOTO}
            alt={photoLune.alt}
            loading="eager"
            // React 18 ne connaît que l'attribut HTML en minuscules
            {...{ fetchpriority: "high" }}
            decoding="async"
            className="block w-full h-auto max-w-md mx-auto md:max-w-none"
          />
        )}
      </div>
    </section>
  );
};

export default Hero;
