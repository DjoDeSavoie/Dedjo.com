import { Link } from "react-router-dom";
import { ChefHat, Clock, Flame, LucideIcon, MessageCircleQuestion } from "lucide-react";
import { CUISSON } from "@/lib/catalog";
import { CHEMIN_GUIDE, LIEN_GUIDE } from "@/lib/fiches";
import { SujetQuestion, poserQuestion } from "@/lib/question";

type Variante = SujetQuestion;

const CONCLUSIONS: Record<Variante, string> = {
  viennoiseries: "Laisse-les tiédir quelques minutes avant de déguster. Régale‑toi !",
  feuilletes: "Laisse-les tiédir un instant : la garniture est brûlante. Régale‑toi !",
};

/**
 * Encadré « Préparation » des étiquettes imprimées, en noir et blanc :
 * four chaud → enfourne → minutes de cuisson, puis la phrase de conclusion
 * et le lien vers le guide de cuisson.
 */
const PreparationCuisson = ({ variante }: { variante: Variante }) => {
  const etapes: { icone: LucideIcon; titre: string; texte: string }[] = [
    {
      icone: Flame,
      titre: "Four chaud",
      texte: `préchauffé à ${CUISSON.temperature} °C, chaleur tournante`,
    },
    {
      icone: ChefHat,
      titre: "Enfourne",
      texte: "direct du congélateur, sans décongeler",
    },
    {
      icone: Clock,
      titre: `${CUISSON.minutes[variante]} min`,
      texte: "jusqu'à une belle couleur dorée",
    },
  ];

  return (
    <div className="bg-white border border-foreground/15 rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10 max-w-3xl mx-auto text-foreground">
      <h3 className="text-xs uppercase tracking-[0.2em] text-foreground/60 text-center mb-8">Préparation</h3>

      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-10">
        {etapes.map(({ icone: Icone, titre, texte }, i) => (
          <li key={titre} className="relative flex flex-col items-center text-center">
            {i > 0 && (
              <>
                <span aria-hidden="true" className="sm:hidden text-xl text-foreground/60 mb-4">
                  ↓
                </span>
                <span
                  aria-hidden="true"
                  className="hidden sm:block absolute top-[2.6rem] left-[-1.25rem] -translate-x-1/2 text-xl leading-7 text-foreground/60"
                >
                  →
                </span>
              </>
            )}
            <Icone className="w-7 h-7 mb-3" strokeWidth={1.5} aria-hidden="true" />
            <p className="font-display font-bold text-2xl md:text-3xl leading-8 md:leading-9">{titre}</p>
            <p className="font-display text-sm text-foreground/60 mt-2 max-w-[13rem]">{texte}</p>
          </li>
        ))}
      </ol>

      <p className="font-display text-base text-center mt-8">{CONCLUSIONS[variante]}</p>
      <p className="text-center mt-3">
        <Link
          to={CHEMIN_GUIDE}
          className="font-display text-sm text-foreground/70 underline underline-offset-4 hover:text-foreground"
        >
          {LIEN_GUIDE}
        </Link>
      </p>
    </div>
  );
};

/** « J'ai une question » : emmène au formulaire de contact, réglé sur une question pour cette gamme. */
export const BoutonQuestion = ({ sujet }: { sujet: SujetQuestion }) => (
  <div className="flex justify-center mt-5">
    <button
      type="button"
      onClick={() => poserQuestion(sujet)}
      className="inline-flex items-center gap-2 rounded-full border border-foreground/30 bg-white px-5 py-2.5 font-display text-foreground hover:border-foreground/60 transition-colors"
    >
      <MessageCircleQuestion className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
      J'ai une question
    </button>
  </div>
);

export default PreparationCuisson;
