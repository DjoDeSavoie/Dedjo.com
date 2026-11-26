import PageContenu from "@/components/PageContenu";
import {
  BandeauPratique,
  BlocLieu,
  CarteProduitsCompacte,
  EnTeteLieu,
  EtapesEnLigne,
  FaitPratique,
  FinCommander,
  GaleriePhotos,
  Horizon,
  QuestionLieu,
  QuestionsRepliees,
  QuiFaitToutCa,
} from "@/components/PageLieu";
import {
  CONFIG,
  CUISSON,
  JOURS_SEMAINE,
  MOYENS_PAIEMENT,
  PRIX_SACHET,
  SECTEURS,
  eur,
  pluralize,
} from "@/lib/catalog";
import { CHEMIN_GUIDE, CHEMIN_SAVOIE, LIEN_GUIDE } from "@/lib/fiches";
import { useMetaPage } from "@/lib/seo";

/* Valeurs lues dans le catalogue (src/lib/catalog.ts) : ne pas les recopier dans les textes. */
const SECTEUR = SECTEURS.find((s) => s.id === "marseille")!;
/** « samedi » */
const JOUR_LIVRAISON = JOURS_SEMAINE[SECTEUR.jour];
/** « vendredi » : dernier jour pour commander (CONFIG.leadDays jours avant la livraison). */
const DERNIER_JOUR_COMMANDE = JOURS_SEMAINE[(SECTEUR.jour - CONFIG.leadDays + 7) % 7];
const MINUTES = CUISSON.minutes;

/* ███  TEXTES — À MODIFIER  ███
   Dans un texte : [mots](/adresse) crée un lien, **mots** met en gras.
   Les jours, prix, frais, durées et température viennent du catalogue. */
const TITRE_ONGLET = "Viennoiseries et feuilletés à cuire, livrés à Marseille · Dedjo";
const DESCRIPTION = `Croissants, pains au chocolat et feuilletés savoyards faits main, à cuire direct du congélateur. Livrés le ${JOUR_LIVRAISON} matin à Marseille, Allauch et Plan-de-Cuques.`;

const LIEU = "Marseille · Allauch · Plan-de-Cuques";
const TITRE = "Viennoiseries et feuilletés artisanaux, livrés à Marseille";
const INTRO = `Façonnés à la main à Marseille, surgelés crus, livrés le ${JOUR_LIVRAISON} matin. Tu les cuis quand tu veux : ${MINUTES.viennoiseries} minutes plus tard, la maison sent comme à la boulangerie.`;

const PRATIQUE: FaitPratique[] = [
  { titre: `Le ${JOUR_LIVRAISON} matin`, texte: "Partout à Marseille, Allauch et Plan-de-Cuques" },
  {
    titre: `${eur(PRIX_SACHET)} le sachet`,
    texte: `Livraison ${eur(CONFIG.fraisLivraison)}, offerte dès ${pluralize(CONFIG.livraisonOfferteDes, "sachet", "sachets")}`,
  },
  { titre: `Jusqu'au ${DERNIER_JOUR_COMMANDE}`, texte: "Commande sur dedjo.com" },
  { titre: "À la livraison", texte: `Paiement ${MOYENS_PAIEMENT}` },
];

const GALERIE = "La carte en images";

const COMMENT = {
  titre: "Comment ça marche",
  etapes: [
    `Tu commandes sur dedjo.com, au plus tard le ${DERNIER_JOUR_COMMANDE}.`,
    `Je te livre le ${JOUR_LIVRAISON} matin, chez toi.`,
    `Direct du congélateur au four préchauffé à ${CUISSON.temperature} °C : ${MINUTES.viennoiseries} minutes pour les viennoiseries, ${MINUTES.feuilletes} pour les feuilletés. [${LIEN_GUIDE}](${CHEMIN_GUIDE})`,
  ],
};

const CARTE = "À la carte";

const QUI = {
  titre: "Qui fait tout ça",
  texte: "Ingénieur de métier, boulanger de passion. Je fais tout moi-même, du feuilletage à la livraison.",
};

const QUESTIONS: { titre: string; liste: QuestionLieu[] } = {
  titre: "Questions fréquentes",
  liste: [
    {
      question: "Faut-il décongeler ?",
      reponse:
        "Non. Ils passent directement du congélateur au four préchauffé. C'est justement ce qui leur donne leur feuilletage.",
    },
    {
      question: "Combien de temps se gardent-ils ?",
      reponse: "Jusqu'à la date indiquée sur le sachet, au congélateur à −18 °C.",
    },
    {
      question: "Et en Savoie ?",
      reponse: `On se retrouve à la [Ferme de la Goëttaz](${CHEMIN_SAVOIE}).`,
    },
  ],
};

const Marseille = () => {
  useMetaPage({ titre: TITRE_ONGLET, description: DESCRIPTION });

  return (
    <PageContenu>
      <EnTeteLieu lieu={LIEU} titre={TITRE} intro={INTRO} secteur="marseille" />
      <Horizon lieu="marseille" />
      <BandeauPratique faits={PRATIQUE} />

      <BlocLieu>
        <GaleriePhotos titre={GALERIE} />
      </BlocLieu>

      <BlocLieu fond="creme">
        <EtapesEnLigne titre={COMMENT.titre} etapes={COMMENT.etapes} />
      </BlocLieu>

      {/* Carte : nom, type, contenu du sachet et disponibilité (stock de Marseille, comme sur l'accueil) */}
      <BlocLieu>
        <CarteProduitsCompacte titre={CARTE} avecStatut />
      </BlocLieu>

      <BlocLieu>
        <div className="grid gap-12 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <QuiFaitToutCa titre={QUI.titre} texte={QUI.texte} />
          <QuestionsRepliees titre={QUESTIONS.titre} questions={QUESTIONS.liste} />
        </div>
      </BlocLieu>

      <FinCommander secteur="marseille" />
    </PageContenu>
  );
};

export default Marseille;
