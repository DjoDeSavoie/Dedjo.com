import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBasket } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import TexteRiche from "./TexteRiche";

/* Briques des pages de contenu (Marseille, Savoie, fiches produits, guide de cuisson) :
   même en-tête et même pied de page que le reste du site, sections et cartes dans le
   style de l'accueil. Pensées d'abord pour un téléphone (390 px). */

/** Habillage d'une page : menu, contenu, pied de page. On arrive toujours en haut de la page. */
const PageContenu = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

/** En-tête d'une page : son seul h1, puis le texte d'intro. */
export const EnTetePage = ({ titre, children }: { titre: string; children?: ReactNode }) => (
  <header className="pt-28 pb-10 px-5 section-cream border-b border-border">
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl md:text-4xl leading-tight text-brand-night text-center text-balance">
        {titre}
      </h1>
      {children && <div className="mt-5 space-y-4 text-lg leading-relaxed text-foreground/90">{children}</div>}
    </div>
  </header>
);

const FONDS = {
  clair: "bg-background",
  creme: "section-cream",
  ciel: "section-sky",
  jaune: "section-yellow",
};

interface SectionPageProps {
  /** Titre de la section (h2). */
  titre: string;
  fond?: keyof typeof FONDS;
  children: ReactNode;
}

/** Une section d'une page : fond de couleur, titre centré, contenu en colonne étroite. */
export const SectionPage = ({ titre, fond = "clair", children }: SectionPageProps) => (
  <section className={`py-10 md:py-12 px-5 ${FONDS[fond]}`}>
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-2xl md:text-3xl leading-tight text-foreground text-center text-balance mb-5">
        {titre}
      </h2>
      <div className="space-y-4 leading-relaxed text-foreground/90 md:text-lg">{children}</div>
    </div>
  </section>
);

/** Liste numérotée, une carte par étape. */
export const Etapes = ({ etapes }: { etapes: string[] }) => (
  <ol className="space-y-3">
    {etapes.map((etape, i) => (
      <li key={i} className="bg-card rounded-2xl shadow-soft p-4 flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-night text-white font-display flex items-center justify-center"
        >
          {i + 1}
        </span>
        <p className="pt-0.5">
          <TexteRiche texte={etape} />
        </p>
      </li>
    ))}
  </ol>
);

/** Liste à puces, une carte par ligne. */
export const Points = ({ points, puce = "•" }: { points: string[]; puce?: string }) => (
  <ul className="space-y-3">
    {points.map((point, i) => (
      <li key={i} className="bg-card rounded-2xl shadow-soft p-4 flex items-start gap-3">
        <span aria-hidden="true" className="flex-shrink-0 w-6 text-center">
          {puce}
        </span>
        <p>
          <TexteRiche texte={point} />
        </p>
      </li>
    ))}
  </ul>
);

export interface QuestionFrequente {
  question: string;
  /** Peut contenir un lien : [mots](/adresse). */
  reponse: string;
}

/** Questions fréquentes : une carte par question, la réponse toujours visible. */
export const Faq = ({ questions }: { questions: QuestionFrequente[] }) => (
  <div className="space-y-3">
    {questions.map(({ question, reponse }) => (
      <div key={question} className="bg-card rounded-2xl shadow-soft p-5">
        <h3 className="font-display text-lg leading-snug text-foreground mb-1.5">{question}</h3>
        <p>
          <TexteRiche texte={reponse} />
        </p>
      </div>
    ))}
  </div>
);

/** Bouton « Commander » : ouvre la page de commande avec le secteur déjà choisi. */
export const BoutonCommander = ({ secteur }: { secteur: "marseille" | "savoie" }) => (
  <div className="py-10 px-5 text-center bg-background">
    <Link
      to={`/commande?secteur=${secteur}`}
      className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-9 py-3.5 rounded-full text-lg font-bold transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <ShoppingBasket className="w-5 h-5" aria-hidden="true" />
      Commander
    </Link>
  </div>
);

export interface LienPage {
  to: string;
  label: string;
}

/** Liens vers d'autres pages, en bas de page. `titre` n'est lu que par les lecteurs d'écran. */
export const LiensPages = ({ titre, liens }: { titre: string; liens: LienPage[] }) => (
  <nav aria-label={titre} className="py-8 px-5 bg-background border-t border-border">
    <ul className="max-w-3xl mx-auto grid gap-2.5 sm:grid-cols-2">
      {liens.map((lien) => (
        <li key={lien.to}>
          <Link
            to={lien.to}
            className="h-full flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 text-sm font-bold leading-snug text-foreground shadow-soft transition-all duration-200 hover:shadow-hover hover:border-primary"
          >
            {lien.label}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);

export default PageContenu;
