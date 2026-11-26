import PageContenu from "@/components/PageContenu";
import {
  BandeauPratique,
  BlocLieu,
  CarteCompacte,
  CarteProduitsCompacte,
  ElementCarte,
  EnTeteLieu,
  FaitPratique,
  FinCommander,
  GaleriePhotos,
  Horizon,
  QuestionLieu,
  QuestionsRepliees,
  QuiFaitToutCa,
  SectionTitree,
} from "@/components/PageLieu";
import { JOURS_SEMAINE, PRIX_SACHET, SECTEURS, eur } from "@/lib/catalog";
import { CHEMIN_GUIDE, CHEMIN_MARSEILLE, LIEN_GUIDE } from "@/lib/fiches";
import { PIZZAS_SALEES, PIZZAS_SUCREES } from "@/lib/pizzas";
import { useMetaPage } from "@/lib/seo";

/* Valeurs lues dans le catalogue (src/lib/catalog.ts) : ne pas les recopier dans les textes. */
/** « samedi » : jour de livraison à Marseille. */
const JOUR_LIVRAISON_MARSEILLE = JOURS_SEMAINE[SECTEURS.find((s) => s.id === "marseille")!.jour];

/* ███  TEXTES — À MODIFIER  ███
   Dans un texte : [mots](/adresse) crée un lien, **mots** met en gras.
   Pas d'adresse postale de la ferme sur cette page, ni de prix de pizza.
   Les pizzas de la carte (noms et descriptions) se modifient dans src/lib/pizzas.ts. */
const TITRE_ONGLET = "Pizzas au feu de bois et viennoiseries à cuire en Savoie · Dedjo";
const DESCRIPTION =
  "Pizzas au feu de bois certains vendredis à la Ferme de la Goëttaz, viennoiseries et feuilletés à cuire au magasin toute la semaine. Autour du Bourget-du-Lac, d'Aix-les-Bains et de Chambéry.";

const LIEU = "Le Bourget-du-Lac · Aix-les-Bains · Chambéry";
const TITRE = "Dedjo en Savoie, à la Ferme de la Goëttaz";
const INTRO =
  "C'est en Savoie que Dedjo a commencé, en famille, autour du four à bois de la Ferme de la Goëttaz. Mes viennoiseries et mes feuilletés t'y attendent toute la semaine, à cuire chez toi.";

const PRATIQUE: FaitPratique[] = [
  { titre: "Toute la semaine", texte: "Au congélateur Dedjo du magasin de la ferme" },
  { titre: `${eur(PRIX_SACHET)} le sachet`, texte: "Paiement à la caisse de la ferme" },
];

const GALERIE = "La carte en images";

const CARTE = {
  titre: "À la carte",
  note: "Le choix varie selon les arrivages.",
};

const PIZZAS = {
  titre: "Les vendredis pizza au feu de bois",
  texte:
    "Certains vendredis, à partir de 18 h, on allume le four à bois. La pâte est faite avec la farine de la ferme et étalée à la main. Sur place ou à emporter, sans réservation.",
  dates:
    "Les dates sont annoncées dans la newsletter de la Ferme de la Goëttaz. Prochain rendez-vous : décembre 2026.",
};

/** La carte des pizzas : nom et description, sans prix. */
const CARTE_PIZZAS: ElementCarte[] = [...PIZZAS_SALEES, ...PIZZAS_SUCREES].map((pizza) => ({
  cle: pizza.name,
  nom: pizza.name,
  type: pizza.description,
}));

const QUI = {
  titre: "Qui fait tout ça",
  texte:
    "Ingénieur de métier, boulanger de passion, d'origine savoyarde. Je fais tout moi-même, du feuilletage à la livraison.",
};

const QUESTIONS: { titre: string; liste: QuestionLieu[] } = {
  titre: "Questions fréquentes",
  liste: [
    {
      question: "Faut-il réserver pour les pizzas ?",
      reponse: "Non. Tu viens, tu commandes au stand, on enfourne.",
    },
    {
      question: "Peut-on emporter ?",
      reponse: "Oui, sur place ou à emporter.",
    },
    {
      question: "Comment cuire les viennoiseries et les feuilletés ?",
      reponse: `Four préchauffé, direct du congélateur. [${LIEN_GUIDE}](${CHEMIN_GUIDE})`,
    },
    {
      question: "Et à Marseille ?",
      reponse: `[Je livre le ${JOUR_LIVRAISON_MARSEILLE} matin](${CHEMIN_MARSEILLE}).`,
    },
  ],
};

const Savoie = () => {
  useMetaPage({ titre: TITRE_ONGLET, description: DESCRIPTION });

  return (
    <PageContenu>
      <EnTeteLieu lieu={LIEU} titre={TITRE} intro={INTRO} secteur="savoie" />
      <Horizon lieu="savoie" />
      <BandeauPratique faits={PRATIQUE} />

      {/* Rien tant que moins de deux produits ont leur photo */}
      <GaleriePhotos titre={GALERIE} />

      {/* Sans disponibilité : le stock affiché sur le site est celui de Marseille */}
      <BlocLieu>
        <CarteProduitsCompacte titre={CARTE.titre} note={CARTE.note} />
      </BlocLieu>

      <BlocLieu fond="creme">
        <SectionTitree titre={PIZZAS.titre}>
          <div className="max-w-[40rem] space-y-3 leading-relaxed text-foreground/90 mb-5">
            <p>{PIZZAS.texte}</p>
            <p className="font-bold text-foreground">{PIZZAS.dates}</p>
          </div>
          <CarteCompacte elements={CARTE_PIZZAS} />
        </SectionTitree>
      </BlocLieu>

      <BlocLieu>
        <div className="grid gap-12 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <QuiFaitToutCa titre={QUI.titre} texte={QUI.texte} />
          <QuestionsRepliees titre={QUESTIONS.titre} questions={QUESTIONS.liste} />
        </div>
      </BlocLieu>

      <FinCommander secteur="savoie" />
    </PageContenu>
  );
};

export default Savoie;
