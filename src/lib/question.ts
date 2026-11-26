import { defilement } from "@/lib/utils";

/** Gamme d'où vient une question posée depuis le site. */
export type SujetQuestion = "viennoiseries" | "feuilletes";

export const QUESTION_EVENT = "dedjo:question";

export type QuestionEventDetail = { sujet: SujetQuestion };

/**
 * Prépare le formulaire de contact pour une question sur une gamme (catégorie, placeholder,
 * source), puis fait défiler la page jusqu'à lui.
 */
export const poserQuestion = (sujet: SujetQuestion) => {
  window.dispatchEvent(new CustomEvent<QuestionEventDetail>(QUESTION_EVENT, { detail: { sujet } }));
  document.getElementById("contact")?.scrollIntoView({ behavior: defilement(), block: "start" });
};
