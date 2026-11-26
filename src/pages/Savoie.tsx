import PageContenu, {
  BoutonCommander,
  EnTetePage,
  Faq,
  QuestionFrequente,
  SectionPage,
} from "@/components/PageContenu";
import TexteRiche from "@/components/TexteRiche";
import { JOURS_SEMAINE, PRIX_SACHET, SECTEURS, eur } from "@/lib/catalog";
import { CHEMIN_GUIDE, CHEMIN_MARSEILLE, LIEN_GUIDE, ficheDe } from "@/lib/fiches";
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

const TITRE = "Dedjo en Savoie, à la Ferme de la Goëttaz";
const INTRO =
  "C'est en Savoie que Dedjo a commencé, en famille, autour du four à bois de la Ferme de la Goëttaz. On s'y retrouve pour les vendredis pizza, et mes viennoiseries et feuilletés à cuire t'attendent toute la semaine au magasin de la ferme. Pour les habitants du Bourget-du-Lac, d'Aix-les-Bains, de Chambéry et des alentours.";

const PIZZAS = {
  titre: "Les vendredis pizza",
  texte:
    "Certains vendredis, à partir de 18 h, on allume le four à bois. La pâte est faite avec la farine de la ferme, étalée à la main et cuite au feu de bois. Sur place ou à emporter, sans réservation : tu commandes au stand.",
  dates: {
    titre: "Prochaines dates",
    texte:
      "Les dates sont annoncées dans la newsletter de la Ferme de la Goëttaz. Prochain rendez-vous : décembre 2026.",
  },
};

const MAGASIN = {
  titre: "Toute la semaine, au magasin de la ferme",
  texte: `Mes viennoiseries et mes feuilletés sont dans le congélateur Dedjo du magasin, aux horaires d'ouverture de la ferme. ${eur(PRIX_SACHET)} le sachet, paiement à la caisse de la ferme. Le choix varie selon les arrivages.`,
};

const A_L_AVANCE = {
  titre: "Commander à l'avance",
  texte:
    "Tu peux aussi commander sur dedjo.com et retirer ta commande à la ferme, lors d'un vendredi pizza. Retrait sans frais, paiement sur place.",
};

const SAVEURS = {
  titre: "Des feuilletés aux saveurs d'ici",
  texte: `[La Montagne](${ficheDe("montagne")!.chemin}), au reblochon AOP, lardons et oignons. [La Forêt](${ficheDe("foret")!.chemin}), aux champignons et fromages à fondue savoyarde.`,
};

const QUESTIONS: { titre: string; liste: QuestionFrequente[] } = {
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
      <EnTetePage titre={TITRE}>
        <p>{INTRO}</p>
      </EnTetePage>

      <SectionPage titre={PIZZAS.titre} fond="jaune">
        <p>{PIZZAS.texte}</p>

        {/* La carte : nom et description de chaque pizza, sans prix */}
        <ul className="grid gap-3 sm:grid-cols-2 !mt-6 text-base">
          {[...PIZZAS_SALEES, ...PIZZAS_SUCREES].map((pizza) => (
            <li key={pizza.name} className={`bg-creme-carte border-2 ${pizza.color} rounded-2xl p-5`}>
              <h3 className="font-display text-xl leading-snug text-foreground mb-1">{pizza.name}</h3>
              <p className="text-sm leading-relaxed text-foreground/80">{pizza.description}</p>
            </li>
          ))}
        </ul>

        <div className="!mt-6 border-l-4 border-primary bg-white/70 rounded-2xl px-5 py-4 shadow-soft text-base">
          <h3 className="text-sm font-bold font-body text-primary uppercase tracking-widest mb-1.5">
            {PIZZAS.dates.titre}
          </h3>
          <p>{PIZZAS.dates.texte}</p>
        </div>
      </SectionPage>

      <SectionPage titre={MAGASIN.titre}>
        <p>{MAGASIN.texte}</p>
      </SectionPage>

      <SectionPage titre={A_L_AVANCE.titre} fond="ciel">
        <p>{A_L_AVANCE.texte}</p>
      </SectionPage>

      <SectionPage titre={SAVEURS.titre}>
        <p>
          <TexteRiche texte={SAVEURS.texte} />
        </p>
      </SectionPage>

      <SectionPage titre={QUESTIONS.titre} fond="creme">
        <Faq questions={QUESTIONS.liste} />
      </SectionPage>

      <BoutonCommander secteur="savoie" />
    </PageContenu>
  );
};

export default Savoie;
