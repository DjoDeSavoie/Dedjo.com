import PageContenu, {
  EnTetePage,
  Etapes,
  Faq,
  LiensPages,
  Points,
  QuestionFrequente,
  SectionPage,
} from "@/components/PageContenu";
import { CUISSON } from "@/lib/catalog";
import { CHEMIN_MARSEILLE, CHEMIN_SAVOIE, liensFiches } from "@/lib/fiches";
import { useMetaPage } from "@/lib/seo";

/* Température et temps de cuisson : lus dans le catalogue (src/lib/catalog.ts, CUISSON). */
const T = CUISSON.temperature;
const MIN_VIENNOISERIES = CUISSON.minutes.viennoiseries;
const MIN_FEUILLETES = CUISSON.minutes.feuilletes;
/** Température la plus haute conseillée « selon ton four » : propre à ce guide, absente du catalogue. */
const T_HAUTE = 190;

/* ███  TEXTES — À MODIFIER  ███
   Dans un texte : [mots](/adresse) crée un lien, **mots** met en gras. */
const TITRE_ONGLET = "Cuire des viennoiseries surgelées : four et airfryer · Dedjo";
const DESCRIPTION =
  "Comment cuire croissants, pains au chocolat et feuilletés surgelés sans les décongeler : température, temps de cuisson au four et à l'airfryer, erreurs à éviter.";

const TITRE = "Comment cuire des viennoiseries surgelées";
const INTRO =
  "Mes viennoiseries et mes feuilletés arrivent chez toi crus et surgelés. Ils ont déjà poussé : tu n'as rien à préparer la veille. Voici comment les réussir à tous les coups, au four ou à l'airfryer.";

const FOUR = {
  titre: "Au four",
  etapes: [
    `Préchauffe ton four en chaleur tournante à ${T} °C, jusqu'à ${T_HAUTE} °C selon ton four.`,
    "Pose les pièces sur une plaque recouverte de papier cuisson, bien espacées : elles gonflent.",
    "Facultatif : dore-les au pinceau avec un œuf battu, pour plus de brillant.",
    "Enfourne-les directement sorties du congélateur, sans décongeler.",
    `Laisse cuire ${MIN_VIENNOISERIES} minutes pour les viennoiseries, ${MIN_FEUILLETES} minutes pour les feuilletés, jusqu'à ce qu'ils soient bien dorés.`,
    "Laisse tiédir 5 minutes : la garniture des feuilletés est brûlante à la sortie du four.",
  ],
};

const AIRFRYER = {
  titre: "À l'airfryer",
  texte: `Ça marche très bien, avec les mêmes réglages qu'au four : entre ${T} et ${T_HAUTE} °C, ${MIN_VIENNOISERIES} minutes pour les viennoiseries, ${MIN_FEUILLETES} minutes pour les feuilletés. Là aussi, les pièces passent directement du congélateur à l'airfryer, sans décongeler. Ne remplis pas le panier : laisse de la place autour de chaque pièce pour qu'elle gonfle.`,
};

const RESUME = {
  titre: "En résumé",
  colonnes: ["Produit", "Température", "Temps"],
  lignes: [
    ["Viennoiseries (La Lune, La Cabosse…)", `${T} à ${T_HAUTE} °C`, `${MIN_VIENNOISERIES} minutes`],
    ["Feuilletés (La Montagne, La Forêt…)", `${T} à ${T_HAUTE} °C`, `${MIN_FEUILLETES} minutes`],
  ],
  note: "Mêmes réglages au four (chaleur tournante) et à l'airfryer.",
};

const ERREURS = {
  titre: "Les erreurs à éviter",
  liste: [
    "**Décongeler avant de cuire.** Les pièces doivent passer directement du congélateur au four : c'est ce qui garde leur forme et leur feuilletage.",
    "**Enfourner dans un four froid.** Sans préchauffage, la cuisson change d'un four à l'autre.",
    "**Recongeler un produit décongelé.** Ne le fais jamais.",
  ],
};

const QUESTIONS: { titre: string; liste: QuestionFrequente[] } = {
  titre: "Questions fréquentes",
  liste: [
    {
      question: "Faut-il les laisser pousser ?",
      reponse: "Non. Elles ont poussé avant d'être surgelées.",
    },
    {
      question: "Puis-je n'en cuire que quelques-unes ?",
      reponse:
        "Oui, avec le même temps de cuisson. Referme bien le sachet et remets-le tout de suite au congélateur.",
    },
    {
      question: "Comment savoir si c'est cuit ?",
      reponse: "Elles sont bien dorées, dessus comme dessous.",
    },
  ],
};

/** Liens du bas de page : les fiches produits, puis Marseille et la Savoie (mêmes mots que dans le menu). */
const LIENS = [
  ...liensFiches(),
  { to: CHEMIN_MARSEILLE, label: "Marseille", emoji: "📍" },
  { to: CHEMIN_SAVOIE, label: "Savoie", emoji: "📍" },
];

const GuideCuisson = () => {
  useMetaPage({ titre: TITRE_ONGLET, description: DESCRIPTION });

  return (
    <PageContenu>
      <EnTetePage titre={TITRE}>
        <p>{INTRO}</p>
      </EnTetePage>

      <SectionPage titre={FOUR.titre} emoji="🔥">
        <Etapes etapes={FOUR.etapes} />
      </SectionPage>

      <SectionPage titre={AIRFRYER.titre} emoji="💨" fond="ciel">
        <p>{AIRFRYER.texte}</p>
      </SectionPage>

      <SectionPage titre={RESUME.titre} emoji="⏱️">
        {/* Le tableau tient dans 390 px : textes courts, première colonne qui passe à la ligne */}
        <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
          <table className="w-full text-left text-sm sm:text-base">
            <thead>
              <tr className="bg-brand-night text-white">
                {RESUME.colonnes.map((colonne) => (
                  <th key={colonne} scope="col" className="px-3 py-3 sm:px-5 font-semibold">
                    {colonne}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RESUME.lignes.map(([produit, temperature, temps]) => (
                <tr key={produit} className="border-t border-border align-top">
                  <th scope="row" className="px-3 py-3 sm:px-5 font-semibold text-foreground">
                    {produit}
                  </th>
                  <td className="px-3 py-3 sm:px-5 whitespace-nowrap">{temperature}</td>
                  <td className="px-3 py-3 sm:px-5 whitespace-nowrap">{temps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-center text-base text-muted-foreground">{RESUME.note}</p>
      </SectionPage>

      <SectionPage titre={ERREURS.titre} emoji="⚠️" fond="jaune">
        <Points points={ERREURS.liste} puce="✗" />
      </SectionPage>

      <SectionPage titre={QUESTIONS.titre} emoji="💬" fond="creme">
        <Faq questions={QUESTIONS.liste} />
      </SectionPage>

      <LiensPages titre="À voir aussi" liens={LIENS} />
    </PageContenu>
  );
};

export default GuideCuisson;
