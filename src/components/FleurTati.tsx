import fleurTati from "@/assets/fleurTati.png";
import { cn } from "@/lib/utils";

/**
 * Ornement « fleur de Tati » : le dessin de Jonny, en bleu nuit. Le dessin sert de masque :
 * sa couleur vient du fond. Une fois par section au plus, à la place des émojis décoratifs.
 */
const FleurTati = ({ className }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={cn("block w-12 h-12 bg-brand-night", className)}
    style={{
      WebkitMaskImage: `url(${fleurTati})`,
      maskImage: `url(${fleurTati})`,
      WebkitMaskSize: "contain",
      maskSize: "contain",
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      maskPosition: "center",
    }}
  />
);

export default FleurTati;
