import { ReactNode, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import FleurTati from "./FleurTati";
import PhotoProduit from "./PhotoProduit";
import TexteRiche from "./TexteRiche";
import { StatutProduit } from "./ProductTags";
import { trierParStatut, useDisponibilite } from "@/hooks/useDisponibilite";
import { ALL_PRODUCTS, ProductId, StatutSite } from "@/lib/catalog";
import { ficheDe, typeDe } from "@/lib/fiches";
import { HAUTEUR_PHOTO, LARGEUR_PHOTO, TAILLES_PHOTO, photosDe } from "@/lib/photos";
import { cn, defilement } from "@/lib/utils";

/* Briques des pages de lieu (/marseille, /savoie), d'après DESIGN.md : haut de page avec la photo
   de La Lune, horizon dessiné, bandeau pratique, galerie photos, étapes, carte compacte, signature
   et questions repliées. Pensées d'abord pour un téléphone (390 px). Les fiches produits et le guide
   de cuisson gardent les briques de PageContenu.tsx. */

/** Largeur et marges du contenu : 16 px sur téléphone, 32 px au-delà, 64 rem au plus. */
const LARGEUR = "max-w-5xl mx-auto";
const MARGES = "px-4 md:px-8";

/** Titre de section (h2) : Young Serif bleu nuit, aligné à gauche. */
const CLASSE_TITRE = "font-display text-[1.75rem] md:text-[2.125rem] leading-[1.15] text-brand-night text-balance";

/** Bordure de 2 px de la couleur de chaque produit (classes `product-*` de tailwind.config.ts). */
const BORDURE_PRODUIT: Record<ProductId, string> = {
  lune: "border-product-croissant",
  cabosse: "border-product-chocolat",
  grappe: "border-product-raisin",
  rose: "border-product-rose",
  montagne: "border-product-montagne",
  foret: "border-product-foret",
  goet: "border-product-goet",
  noix: "border-product-noix",
};

/* ===================================================================
   Mise en page
   =================================================================== */

const FONDS = {
  clair: "",
  creme: "section-cream",
};

/** Une bande de la page : marges, largeur et espacement vertical réguliers. */
export const BlocLieu = ({
  fond = "clair",
  className,
  children,
}: {
  fond?: keyof typeof FONDS;
  className?: string;
  children: ReactNode;
}) => (
  <div className={cn(MARGES, "py-8 md:py-12", FONDS[fond], className)}>
    <div className={LARGEUR}>{children}</div>
  </div>
);

/** Une section titrée (h2), reliée à son titre pour les lecteurs d'écran. */
const SectionTitree = ({ titre, action, children }: { titre: string; action?: ReactNode; children: ReactNode }) => {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <div className="flex items-end justify-between gap-4 mb-5">
        <h2 id={id} className={CLASSE_TITRE}>
          {titre}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
};

/** Bouton « Commander » (bleu ciel) : ouvre la page de commande avec le secteur déjà choisi. */
export const LienCommander = ({ secteur, className }: { secteur: "marseille" | "savoie"; className?: string }) => (
  <Link
    to={`/commande?secteur=${secteur}`}
    className={cn(
      "inline-flex items-center justify-center min-h-12 bg-primary text-primary-foreground px-8 rounded-full text-base font-bold transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
  >
    Commander
  </Link>
);

/** Bouton « Commander » de fin de page, centré. */
export const FinCommander = ({ secteur }: { secteur: "marseille" | "savoie" }) => (
  <div className={cn(MARGES, "pt-2 pb-12 md:pb-16 text-center")}>
    <LienCommander secteur={secteur} />
  </div>
);

/* ===================================================================
   Haut de page
   =================================================================== */

/** Photo de La Lune, détourée, posée sur le fond (comme sur l'accueil). */
const photoLune = photosDe("lune")[0];

interface EnTeteLieuProps {
  /** Ligne de lieu, au-dessus du titre. */
  lieu: string;
  /** Le seul h1 de la page. */
  titre: string;
  intro: string;
  secteur: "marseille" | "savoie";
}

/** Haut d'une page de lieu : lieu, h1, intro, bouton, et la photo de La Lune (à droite sur ordinateur). */
export const EnTeteLieu = ({ lieu, titre, intro, secteur }: EnTeteLieuProps) => (
  <header className={cn(MARGES, "pt-24 md:pt-32 pb-4 md:pb-6")}>
    <div className={cn(LARGEUR, "grid gap-6 md:grid-cols-[1.15fr_1fr] md:items-center md:gap-12")}>
      <div>
        <p className="text-sm text-muted-foreground">{lieu}</p>
        <h1 className="font-display text-[2rem] md:text-[2.75rem] leading-[1.1] text-brand-night text-balance mt-2">
          {titre}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90 max-w-[36rem]">{intro}</p>
        <LienCommander secteur={secteur} className="mt-6" />
      </div>
      {photoLune && (
        <img
          src={photoLune.petite}
          srcSet={`${photoLune.petite} 600w, ${photoLune.grande} 1200w`}
          sizes="(min-width: 1088px) 410px, (min-width: 768px) calc(43vw - 48px), 288px"
          width={LARGEUR_PHOTO}
          height={HAUTEUR_PHOTO}
          alt={photoLune.alt}
          loading="eager"
          // React 18 ne connaît que l'attribut HTML en minuscules
          {...{ fetchpriority: "high" }}
          decoding="async"
          className="block w-full h-auto max-w-72 mx-auto md:max-w-none"
        />
      )}
    </div>
  </header>
);

/* ===================================================================
   Horizon dessiné
   =================================================================== */

/* Dessins au trait de Jonny : src/assets/dessins/horizon-{lieu}.png (fond transparent) ou .svg.
   Sans fichier, rien ne s'affiche. */
const DESSINS = import.meta.glob<string>("/src/assets/dessins/horizon-*.{png,svg}", {
  eager: true,
  import: "default",
});
const dessinDe = (lieu: string): string | undefined =>
  DESSINS[`/src/assets/dessins/horizon-${lieu}.svg`] ?? DESSINS[`/src/assets/dessins/horizon-${lieu}.png`];

/** Horizon dessiné, sur toute la largeur du contenu, coloré en bleu nuit par un masque (comme la fleur de Tati). */
export const Horizon = ({ lieu }: { lieu: "marseille" | "savoie" }) => {
  const dessin = dessinDe(lieu);
  if (!dessin) return null;
  return (
    <div aria-hidden="true" className={cn(MARGES, "pt-2")}>
      <span
        className={cn(LARGEUR, "block aspect-[5/1] bg-brand-night")}
        style={{
          WebkitMaskImage: `url(${dessin})`,
          maskImage: `url(${dessin})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center bottom",
          maskPosition: "center bottom",
        }}
      />
    </div>
  );
};

/* ===================================================================
   Bandeau pratique
   =================================================================== */

export interface FaitPratique {
  titre: string;
  texte: string;
}

const COLONNES: Record<number, string> = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" };

/** 2 à 4 faits pratiques, séparés par des filets fins, sans carte ni icône ; 2 colonnes sur téléphone. */
export const BandeauPratique = ({ faits }: { faits: FaitPratique[] }) => (
  <div className={cn(MARGES, "pt-6 md:pt-8")}>
    {/* Les filets sont le fond de la grille, visible dans l'espace de 1 px entre les cases */}
    <ul className={cn(LARGEUR, "grid grid-cols-2 gap-px bg-border border-y border-border", COLONNES[faits.length])}>
      {faits.map(({ titre, texte }, i) => (
        <li
          key={titre}
          className={cn(
            "bg-background py-4 pr-3 md:py-5 md:pr-6",
            // Première colonne collée au bord, les autres décalées du filet
            i % 2 === 1 ? "pl-4" : "pl-0",
            i > 0 && "md:pl-6",
            i === 0 && "md:pl-0",
            faits.length % 2 === 1 && i === faits.length - 1 && "col-span-2 md:col-span-1",
          )}
        >
          <p className="font-display text-lg md:text-xl leading-snug text-brand-night">{titre}</p>
          <p className="text-sm leading-snug text-muted-foreground mt-1">{texte}</p>
        </li>
      ))}
    </ul>
  </div>
);

/* ===================================================================
   Galerie photos
   =================================================================== */

/** Les photos de carte des produits qui en ont, les produits disponibles d'abord, en bande horizontale. */
export const GaleriePhotos = ({ titre }: { titre: string }) => {
  const { statut } = useDisponibilite();
  const produits = trierParStatut(
    ALL_PRODUCTS.filter((p) => photosDe(p.id).length > 0),
    statut,
  );

  const bande = useRef<HTMLUListElement>(null);
  const [position, setPosition] = useState({ deborde: false, debut: true, fin: true });

  useEffect(() => {
    const el = bande.current;
    if (!el) return;
    const mesurer = () =>
      setPosition({
        deborde: el.scrollWidth > el.clientWidth + 1,
        debut: el.scrollLeft <= 1,
        fin: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
      });
    mesurer();
    el.addEventListener("scroll", mesurer, { passive: true });
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(el);
    return () => {
      el.removeEventListener("scroll", mesurer);
      observateur.disconnect();
    };
  }, [produits.length]);

  if (produits.length === 0) return null;

  /** Fait défiler la bande d'environ une largeur visible ; sans animation si « Réduire les animations ». */
  const defiler = (sens: 1 | -1) => {
    const el = bande.current;
    if (el) el.scrollBy({ left: sens * el.clientWidth * 0.9, behavior: defilement() });
  };

  const classeFleche =
    "inline-flex items-center justify-center w-11 h-11 rounded-full border border-foreground/50 bg-card text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-40 disabled:hover:bg-card";

  // Flèches sur ordinateur, seulement quand tout ne tient pas
  const fleches = position.deborde ? (
    <div className="hidden md:flex gap-2 flex-shrink-0">
      <button
        type="button"
        onClick={() => defiler(-1)}
        disabled={position.debut}
        aria-label="Photos précédentes"
        className={classeFleche}
      >
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => defiler(1)}
        disabled={position.fin}
        aria-label="Photos suivantes"
        className={classeFleche}
      >
        <ChevronRight className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  ) : null;

  return (
    <SectionTitree titre={titre} action={fleches}>
      {/* Sur téléphone, la bande va jusqu'au bord de l'écran : la carte suivante dépasse à moitié */}
      <ul
        ref={bande}
        className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scroll-pl-4 md:scroll-pl-0 -mx-4 px-4 md:mx-0 md:px-0 pb-2 [scrollbar-width:thin]"
      >
        {produits.map((p) => {
          const photo = photosDe(p.id)[0];
          const fiche = ficheDe(p.id);
          const contenu = (
            <>
              <PhotoProduit photo={photo} sizes={TAILLES_PHOTO.galerie} />
              <p className="font-display text-xl leading-snug text-foreground mt-3">{p.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{typeDe(p)}</p>
            </>
          );
          const carte = cn("block h-full bg-creme-carte border-2 rounded-2xl p-3", BORDURE_PRODUIT[p.id]);
          return (
            <li key={p.id} className="snap-start flex-shrink-0 w-[64%] sm:w-[40%] md:w-[calc((100%-2rem)/3)]">
              {fiche ? (
                <Link
                  to={fiche.chemin}
                  className={cn(
                    carte,
                    "transition-shadow hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  )}
                >
                  {contenu}
                </Link>
              ) : (
                <div className={carte}>{contenu}</div>
              )}
            </li>
          );
        })}
      </ul>
    </SectionTitree>
  );
};

/* ===================================================================
   Étapes en ligne
   =================================================================== */

/**
 * Trois étapes côte à côte (en colonne sur téléphone), grand chiffre en Young Serif.
 * Dans un texte : [mots](/adresse) crée un lien.
 */
export const EtapesEnLigne = ({ titre, etapes }: { titre: string; etapes: string[] }) => (
  <SectionTitree titre={titre}>
    <ol className="grid gap-5 md:grid-cols-3 md:gap-8">
      {etapes.map((etape, i) => (
        <li key={i} className="flex items-start gap-4 md:block">
          <span aria-hidden="true" className="font-display text-5xl leading-none text-brand-night w-8 flex-shrink-0">
            {i + 1}
          </span>
          <p className="leading-relaxed text-foreground/90 pt-1 md:pt-0 md:mt-3">
            <TexteRiche texte={etape} />
          </p>
        </li>
      ))}
    </ol>
  </SectionTitree>
);

/* ===================================================================
   Carte compacte
   =================================================================== */

export interface ElementCarte {
  cle: string;
  nom: string;
  /** Adresse de la fiche, si elle existe : le nom devient un lien. */
  chemin?: string;
  /** Ligne sous le nom, en encre douce. */
  type: string;
  /** Contenu du sachet, à droite. */
  contenu?: string;
  /** Disponibilité, à droite, sous le contenu. */
  statut?: StatutSite;
}


/** « Disponible » : seul statut que StatutProduit n'affiche pas. */
const Disponible = () => (
  <span className="inline-flex items-center gap-1.5 text-xs font-bold leading-snug bg-[#e9f6ec] text-[#1f6b35] border border-[#9fd3ad] px-3 py-1.5 rounded-2xl">
    <Check className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
    Disponible
  </span>
);

/** Liste sur deux colonnes (une sur téléphone) séparée par des filets : nom, type, contenu et statut. */
export const CarteCompacte = ({
  titre,
  elements,
  note,
}: {
  /** Sans titre : la liste seule, placée dans une section déjà titrée. */
  titre?: string;
  elements: ElementCarte[];
  /** Phrase sous la liste. */
  note?: string;
}) => {
  const liste = (
    <>
      <ul className="grid md:grid-cols-2 md:gap-x-10 border-t border-border md:border-t-0">
        {elements.map((e) => {
          const nom = <span className="block font-display text-lg leading-snug">{e.nom}</span>;
          const type = <span className="block text-sm leading-snug text-muted-foreground mt-0.5">{e.type}</span>;
          return (
            <li
              key={e.cle}
              className="flex items-start justify-between gap-4 py-3 border-b border-border md:[&:nth-child(-n+2)]:border-t"
            >
              {e.chemin ? (
                <Link
                  to={e.chemin}
                  className="group block min-h-11 min-w-0 text-foreground rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <span className="block font-display text-lg leading-snug text-brand-night underline decoration-brand-night/30 underline-offset-4 group-hover:decoration-brand-night">
                    {e.nom}
                  </span>
                  {type}
                </Link>
              ) : (
                <div className="min-w-0 text-foreground">
                  {nom}
                  {type}
                </div>
              )}
              {(e.contenu || e.statut) && (
                <div className="flex flex-col items-end gap-1.5 text-right flex-shrink-0 max-w-[45%]">
                  {e.contenu && <span className="text-sm text-foreground/80 pt-0.5">{e.contenu}</span>}
                  {e.statut === "disponible" ? <Disponible /> : e.statut && <StatutProduit statut={e.statut} />}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {note && <p className="text-sm text-muted-foreground mt-3">{note}</p>}
    </>
  );

  return titre ? <SectionTitree titre={titre}>{liste}</SectionTitree> : liste;
};

/* ===================================================================
   Qui fait tout ça
   =================================================================== */

/** Présentation de Djo : titre, texte, signature en Young Serif. */
export const QuiFaitToutCa = ({ titre, texte }: { titre: string; texte: string }) => (
  <SectionTitree titre={titre}>
    <p className="leading-relaxed text-foreground/90 max-w-[36rem]">{texte}</p>
    <p className="mt-4 flex items-center gap-2 font-display text-2xl leading-none text-brand-night">
      <FleurTati className="w-7 h-7" />
      Djo
    </p>
  </SectionTitree>
);

/* ===================================================================
   Questions repliées
   =================================================================== */

export interface QuestionLieu {
  question: string;
  /** Peut contenir un lien : [mots](/adresse). */
  reponse: string;
}

/** Questions fréquentes repliées (details / summary) ; les réponses restent dans la page pour Google. */
export const QuestionsRepliees = ({ titre, questions }: { titre: string; questions: QuestionLieu[] }) => (
  <SectionTitree titre={titre}>
    <div className="border-t border-border">
      {questions.map(({ question, reponse }) => (
        <details key={question} className="group border-b border-border">
          <summary className="flex items-center justify-between gap-4 min-h-12 py-3 cursor-pointer list-none rounded-sm [&::-webkit-details-marker]:hidden">
            <h3 className="font-display text-lg leading-snug text-foreground">{question}</h3>
            <span
              aria-hidden="true"
              className="font-display text-3xl leading-none text-brand-night flex-shrink-0 transition-transform duration-200 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="pb-4 -mt-1 leading-relaxed text-foreground/90">
            <TexteRiche texte={reponse} />
          </p>
        </details>
      ))}
    </div>
  </SectionTitree>
);

/**
 * Les produits du catalogue en carte compacte : nom (lien vers la fiche), type, contenu du sachet.
 * Avec `avecStatut`, la disponibilité lue dans le stock de Marseille (useDisponibilite).
 */
export const CarteProduitsCompacte = ({
  titre,
  note,
  avecStatut = false,
}: {
  titre: string;
  note?: string;
  avecStatut?: boolean;
}) => {
  const { statut } = useDisponibilite();
  const elements: ElementCarte[] = ALL_PRODUCTS.map((p) => ({
    cle: p.id,
    nom: p.name,
    chemin: ficheDe(p.id)?.chemin,
    type: typeDe(p),
    contenu: `Sachet de ${p.pieces} ${p.unit}`,
    statut: avecStatut ? statut(p.id) : undefined,
  }));
  return <CarteCompacte titre={titre} elements={elements} note={note} />;
};
