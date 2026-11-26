import { Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { LIENS_LEGAUX } from "@/lib/legal";
import { CHEMIN_GUIDE, CHEMIN_MARSEILLE, CHEMIN_SAVOIE } from "@/lib/fiches";
import { BORDURE_PRODUIT } from "@/lib/bordures";

const lienPied = "inline-block py-3 text-muted-foreground underline underline-offset-2 hover:text-foreground";

/* Aperçus vers Instagram : cartes crème bordées de la couleur du produit, comme sur l'accueil */
const instagramPreviews = [
  { label: "La Lune", desc: "Croissant pur beurre", bordure: BORDURE_PRODUIT.lune },
  { label: "La Cabosse", desc: "Pain au chocolat", bordure: BORDURE_PRODUIT.cabosse },
  { label: "La Rose", desc: "Praline rose & vanille", bordure: BORDURE_PRODUIT.rose },
  { label: "La Grappe", desc: "Roulé aux raisins", bordure: BORDURE_PRODUIT.grappe },
];

const Footer = () => {
  return (
    <>
      {/* Instagram Section */}
      <section className="py-10 px-4 section-cream border-t border-border">
        <div className="container max-w-4xl text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Instagram className="w-7 h-7 text-primary" />
            <h2 className="font-display text-3xl text-foreground">@Dedjo_</h2>
          </div>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Suis nos créations au quotidien : croissants tout chauds, enfournements du matin et moments en famille.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {instagramPreviews.map((item) => (
              <a
                key={item.label}
                href="https://instagram.com/Dedjo_"
                target="_blank"
                rel="noopener noreferrer"
                className={`bg-creme-carte border-2 ${item.bordure} rounded-2xl aspect-square flex flex-col items-center justify-center gap-1 p-3 text-center transition-transform duration-200 motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
              >
                <span className="font-display text-lg text-foreground">{item.label}</span>
                <span className="text-xs text-foreground/70">{item.desc}</span>
              </a>
            ))}
          </div>

          <a
            href="https://instagram.com/Dedjo_"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Instagram className="w-5 h-5" />
            Suivre @Dedjo_ sur Instagram
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-border">
        <div className="container max-w-6xl flex flex-col items-center gap-2">
          <Logo className="w-8 h-8" />
          {/* Zones desservies, en texte (lu par les moteurs de recherche) ; pas d'adresse postale.
              Chaque ligne mène à sa page ; le guide de cuisson est cité en dessous. */}
          <div className="text-sm text-muted-foreground text-center text-balance">
            <p>
              <Link to={CHEMIN_MARSEILLE} className={lienPied}>
                Livraison à Marseille et alentours
              </Link>
            </p>
            <p>
              {/* Noms composés jamais coupés au trait d'union */}
              <Link to={CHEMIN_SAVOIE} className={lienPied}>
                En Savoie : Ferme de la Goëttaz, autour du <span className="whitespace-nowrap">Bourget-du-Lac</span>, d'
                <span className="whitespace-nowrap">Aix-les-Bains</span> et de Chambéry
              </Link>
            </p>
            <p>
              <Link to={CHEMIN_GUIDE} className={lienPied}>
                Conseils de cuisson
              </Link>
            </p>
          </div>
          <p className="text-muted-foreground text-center text-sm">
            © 2026 Dedjo. Fait avec amour.
          </p>
          <nav aria-label="Informations légales" className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
            {LIENS_LEGAUX.map((lien) => (
              <Link key={lien.to} to={lien.to} className={lienPied}>
                {lien.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
};

export default Footer;
