import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface PageLegaleProps {
  titre: string;
  /** Ligne sous le titre, ex. la date de version des CGV. */
  sousTitre?: ReactNode;
  children: ReactNode;
}

/** Mise en page des pages légales : même en-tête et même pied de page que le reste du site. */
const PageLegale = ({ titre, sousTitre, children }: PageLegaleProps) => {
  // Arrivée depuis un lien en bas de page : on commence en haut
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <header className="pt-28 pb-8 px-4 section-cream border-b border-border">
        <div className="container max-w-3xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm font-medium mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au site
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{titre}</h1>
          {sousTitre && <p className="mt-2 text-muted-foreground">{sousTitre}</p>}
        </div>
      </header>
      <main className="container max-w-3xl mx-auto px-4 py-10 space-y-9 text-foreground/90 leading-relaxed">
        {children}
      </main>
      <Footer />
    </div>
  );
};

/** Une section numérotée ou titrée d'une page légale. */
export const Article = ({ titre, children }: { titre: string; children: ReactNode }) => (
  <section className="space-y-3">
    <h2 className="font-display text-2xl font-semibold text-foreground">{titre}</h2>
    {children}
  </section>
);

export const Liste = ({ children }: { children: ReactNode }) => <ul className="list-disc pl-6 space-y-1.5">{children}</ul>;

export const LienInterne = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="text-primary underline underline-offset-2 hover:text-primary/80">
    {children}
  </Link>
);

export default PageLegale;
