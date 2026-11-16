import { ReactNode } from "react";
import { Link } from "react-router-dom";

/** Couleur des liens dans un texte (la même que sur la page Commande). */
export const CLASSE_LIEN = "font-semibold text-[#185FA5] underline underline-offset-2 hover:text-[#2A7FD0]";

const MOTIF = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;

/**
 * Texte avec gras et liens, écrits directement dans la phrase :
 * **mots** → en gras (comme les allergènes des étiquettes du catalogue) ;
 * [mots](/adresse) → lien vers une page du site (un vrai <a href>, que Google peut suivre).
 */
const TexteRiche = ({ texte }: { texte: string }) => {
  const morceaux: ReactNode[] = [];
  let fin = 0;
  for (const m of texte.matchAll(MOTIF)) {
    const debut = m.index ?? 0;
    if (debut > fin) morceaux.push(texte.slice(fin, debut));
    if (m[3] !== undefined) {
      morceaux.push(
        <strong key={debut} className="font-semibold text-foreground">
          {m[3]}
        </strong>,
      );
    } else if (m[2].startsWith("/")) {
      morceaux.push(
        <Link key={debut} to={m[2]} className={CLASSE_LIEN}>
          {m[1]}
        </Link>,
      );
    } else {
      morceaux.push(
        <a key={debut} href={m[2]} className={CLASSE_LIEN}>
          {m[1]}
        </a>,
      );
    }
    fin = debut + m[0].length;
  }
  if (fin < texte.length) morceaux.push(texte.slice(fin));
  return <>{morceaux}</>;
};

export default TexteRiche;
