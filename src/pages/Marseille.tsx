import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import PageContenu, {
  BoutonCommander,
  EnTetePage,
  Etapes,
  Faq,
  Points,
  QuestionFrequente,
  SectionPage,
} from "@/components/PageContenu";
import { CLASSE_LIEN } from "@/components/TexteRiche";
import { StatutProduit } from "@/components/ProductTags";
import { useDisponibilite } from "@/hooks/useDisponibilite";
import {
  ALL_PRODUCTS,
  CONFIG,
  CUISSON,
  JOURS_SEMAINE,
  MOYENS_PAIEMENT,
  PRIX_SACHET,
  SECTEURS,
  eur,
  pluralize,
} from "@/lib/catalog";
import { CHEMIN_GUIDE, CHEMIN_SAVOIE, LIEN_GUIDE, ficheDe, typeDe } from "@/lib/fiches";
import { useMetaPage } from "@/lib/seo";

/* Valeurs lues dans le catalogue (src/lib/catalog.ts) : ne pas les recopier dans les textes. */
const SECTEUR = SECTEURS.find((s) => s.id === "marseille")!;
/** « samedi » */
const JOUR_LIVRAISON = JOURS_SEMAINE[SECTEUR.jour];
/** « vendredi » : dernier jour pour commander (CONFIG.leadDays jours avant la livraison). */
const DERNIER_JOUR_COMMANDE = JOURS_SEMAINE[(SECTEUR.jour - CONFIG.leadDays + 7) % 7];

/* ███  TEXTES — À MODIFIER  ███
   Dans un texte : [mots](/adresse) crée un lien, **mots** met en gras.
   La durée écrite en lettres dans l'intro (« vingt minutes ») est à corriger ici si CUISSON change. */
const TITRE_ONGLET = "Viennoiseries et feuilletés à cuire, livrés à Marseille · Dedjo";
const DESCRIPTION = `Croissants, pains au chocolat et feuilletés savoyards faits main, à cuire direct du congélateur. Livrés le ${JOUR_LIVRAISON} matin à Marseille, Allauch et Plan-de-Cuques.`;

const TITRE = "Viennoiseries et feuilletés artisanaux, livrés à Marseille";
const INTRO =
  "Je façonne mes viennoiseries et mes feuilletés à la main, à Marseille, en petites séries. Tu les reçois crus et surgelés, prêts à cuire. Tu les sors du congélateur quand tu en as envie, et vingt minutes plus tard, la maison sent le beurre chaud.";

const POURQUOI = {
  titre: "Pourquoi les cuire soi-même",
  texte:
    "Une viennoiserie n'est jamais aussi bonne qu'à la sortie du four. En la cuisant chez toi, tu la manges à ce moment-là : le feuilletage croustille, le cœur est encore chaud, le reblochon fond. Et comme elle t'attend au congélateur, c'est toi qui choisis le moment : un dimanche matin, un apéro improvisé, un soir sans envie de cuisiner.",
};

const COMMENT = {
  titre: "Comment ça marche",
  etapes: [
    `Tu commandes sur dedjo.com, au plus tard le ${DERNIER_JOUR_COMMANDE}.`,
    `Je te livre le ${JOUR_LIVRAISON} matin, chez toi.`,
    "Tu ranges les sachets au congélateur.",
    `Le jour venu, préchauffe ton four à ${CUISSON.temperature} °C et enfourne directement, sans décongeler : ${CUISSON.minutes.viennoiseries} minutes pour les viennoiseries, ${CUISSON.minutes.feuilletes} minutes pour les feuilletés. [${LIEN_GUIDE}](${CHEMIN_GUIDE})`,
  ],
};

const OU = {
  titre: "Où je livre",
  texte: "Dans tout Marseille, à Allauch et à Plan-de-Cuques.",
};

const TARIFS = {
  titre: "Les tarifs",
  lignes: [
    `${eur(PRIX_SACHET)} le sachet, quel que soit le produit.`,
    `Livraison : ${eur(CONFIG.fraisLivraison)}, offerte dès ${pluralize(CONFIG.livraisonOfferteDes, "sachet", "sachets")}.`,
    `Paiement à la livraison, ${MOYENS_PAIEMENT}.`,
  ],
};

const CARTE = {
  titre: "À la carte",
  disponible: "Disponible",
};

const QUI = {
  titre: "Qui fait tout ça",
  texte:
    "Boulanger diplômé, d'origine savoyarde, je fais tout moi-même, du feuilletage à la livraison. Les feuilletés reprennent les saveurs de mon enfance en Savoie. Les viennoiseries suivent la tradition, pur beurre.",
};

const QUESTIONS: { titre: string; liste: QuestionFrequente[] } = {
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
  const { statut } = useDisponibilite();

  return (
    <PageContenu>
      <EnTetePage titre={TITRE}>
        <p>{INTRO}</p>
      </EnTetePage>

      <SectionPage titre={POURQUOI.titre}>
        <p>{POURQUOI.texte}</p>
      </SectionPage>

      <SectionPage titre={COMMENT.titre} fond="ciel">
        <Etapes etapes={COMMENT.etapes} />
      </SectionPage>

      <SectionPage titre={OU.titre}>
        <p className="text-center">{OU.texte}</p>
      </SectionPage>

      <SectionPage titre={TARIFS.titre} fond="jaune">
        <Points points={TARIFS.lignes} puce="✓" />
      </SectionPage>

      {/* Carte : nom, type, pièces par sachet et disponibilité (stock de Marseille, comme sur l'accueil) */}
      <SectionPage titre={CARTE.titre}>
        <ul className="grid gap-3 md:grid-cols-2">
          {ALL_PRODUCTS.map((p) => {
            const fiche = ficheDe(p.id);
            return (
              <li
                key={p.id}
                className="bg-card rounded-2xl shadow-soft p-4 border-t-4 flex flex-col gap-3 text-base"
                style={{ borderTopColor: p.color }}
              >
                <div className="flex items-start gap-3">
                  <div>
                    <h3 className="font-display font-semibold text-lg leading-snug text-foreground">
                      {fiche ? (
                        <Link to={fiche.chemin} className={CLASSE_LIEN}>
                          {p.name}
                        </Link>
                      ) : (
                        p.name
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">{typeDe(p)}</p>
                    <p className="text-sm font-semibold text-foreground/80 mt-0.5">
                      Sachet de {p.pieces} {p.unit}
                    </p>
                  </div>
                </div>
                <div className="mt-auto">
                  {statut(p.id) === "disponible" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold leading-snug bg-[#e9f6ec] text-[#1f6b35] border border-[#9fd3ad] px-3 py-1.5 rounded-2xl">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                      {CARTE.disponible}
                    </span>
                  ) : (
                    <StatutProduit statut={statut(p.id)} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </SectionPage>

      <SectionPage titre={QUI.titre} fond="creme">
        <p>{QUI.texte}</p>
      </SectionPage>

      <SectionPage titre={QUESTIONS.titre} fond="ciel">
        <Faq questions={QUESTIONS.liste} />
      </SectionPage>

      <BoutonCommander secteur="marseille" />
    </PageContenu>
  );
};

export default Marseille;
