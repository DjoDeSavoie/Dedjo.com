import { CSSProperties, useEffect, useRef, useState } from "react";
import { CONFIG, eur, pluralize } from "@/lib/catalog";

const COULEURS = ["#7DC3E8", "#F9E830", "#4FA2D4", "#163F6B"];

// Gerbe de confettis pré-calculée : éventail vers le haut (de -165° à -15°), distances et
// délais variés. Calculée une fois pour toutes, sans hasard, pour un rendu stable.
const PARTICULES = Array.from({ length: 18 }, (_, i) => {
  const angle = ((-165 + (150 * i) / 17) * Math.PI) / 180;
  const distance = 34 + ((i * 37) % 5) * 10;
  return {
    dx: Math.round(Math.cos(angle) * distance * 1.6), // plus large que haut : la barre est étirée
    dy: Math.round(Math.sin(angle) * distance),
    couleur: COULEURS[i % COULEURS.length],
    taille: 5 + (i % 3),
    carre: i % 3 === 0,
    delai: (i % 4) * 30,
  };
});

/** Jauge « livraison offerte » : décompte des sachets restants, célébration au passage du seuil. */
const LivraisonJauge = ({ sachets, className = "" }: { sachets: number; className?: string }) => {
  const seuil = CONFIG.livraisonOfferteDes;
  const atteint = sachets >= seuil;
  const restant = Math.max(0, seuil - sachets);

  // Incrémenté à chaque fois que le seuil est franchi en montant : sert de clé pour rejouer
  // l'animation. Pas de célébration si la page s'ouvre avec un panier déjà suffisant.
  const [fete, setFete] = useState(0);
  const precedent = useRef(sachets);
  useEffect(() => {
    if (precedent.current < seuil && sachets >= seuil) setFete((f) => f + 1);
    precedent.current = sachets;
  }, [sachets, seuil]);
  const celebrer = atteint && fete > 0;

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
        <span aria-live="polite" className="leading-tight">
          {atteint ? (
            <span
              key={fete}
              className={`inline-block font-bold text-brand-night ${celebrer ? "motion-safe:animate-jauge-pop" : ""}`}
            >
              🎉 Livraison offerte ! <s className="font-normal text-muted-foreground">{eur(CONFIG.fraisLivraison)}</s>
            </span>
          ) : (
            <span className="text-muted-foreground">
              🚚 Plus que <strong className="text-foreground">{pluralize(restant, "sachet", "sachets")}</strong> pour
              économiser <strong className="text-[#8a5a09]">{eur(CONFIG.fraisLivraison)}</strong> de livraison à Marseille
            </span>
          )}
        </span>
        <span className="tabular-nums text-muted-foreground flex-shrink-0">
          {Math.min(sachets, seuil)}/{seuil}
        </span>
      </div>

      <div className="relative">
        <div
          key={`barre-${fete}`}
          className={`relative h-2.5 rounded-full bg-[#e3edf7] overflow-hidden ${celebrer ? "motion-safe:animate-jauge-bump" : ""}`}
          role="progressbar"
          aria-label="Sachets pour la livraison offerte"
          aria-valuemin={0}
          aria-valuemax={seuil}
          aria-valuenow={Math.min(sachets, seuil)}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out motion-reduce:transition-none"
            style={{
              width: `${Math.min(100, (sachets / seuil) * 100)}%`,
              backgroundImage: atteint
                ? "linear-gradient(90deg, #F9E830, #7DC3E8)"
                : "linear-gradient(90deg, #2A7FD0, #2A7FD0)",
            }}
          />
          {celebrer && (
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent motion-safe:animate-jauge-reflet motion-reduce:hidden"
            />
          )}
        </div>

        {celebrer && (
          <div key={`confettis-${fete}`} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 motion-reduce:hidden">
            {PARTICULES.map((p, i) => (
              <span
                key={i}
                className={`absolute left-1/2 top-0 motion-safe:animate-confetti ${p.carre ? "rounded-[2px]" : "rounded-full"}`}
                style={
                  {
                    width: p.taille,
                    height: p.taille,
                    backgroundColor: p.couleur,
                    animationDelay: `${p.delai}ms`,
                    "--dx": `${p.dx}px`,
                    "--dy": `${p.dy}px`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LivraisonJauge;
