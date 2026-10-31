import { useId } from "react";

/**
 * Illustration d'un friand feuilleté, au format d'un emoji : remplace 🥟 / 🥧 pour les
 * feuilletés salés. Dessus doré rayé en losanges, tranche aux couches de feuilletage
 * visibles. La taille se règle avec className (ex. « w-14 h-14 »).
 */
const FeuilleteIllustration = ({ className = "" }: { className?: string }) => {
  // Identifiants uniques : l'illustration peut apparaître plusieurs fois sur la page
  const uid = useId().replace(/:/g, "");
  const dessus = `feuillete-dessus-${uid}`;
  const tranche = `feuillete-tranche-${uid}`;
  const clipDessus = `feuillete-clip-dessus-${uid}`;
  const clipTranche = `feuillete-clip-tranche-${uid}`;

  // Dessus bombé, et tranche aux bords irréguliers (les feuilles de pâte qui dépassent)
  const formeDessus =
    "M5 25 C5 15.5 10.5 11 19 11 L45 11 C53.5 11 59 15.5 59 25 C59 32 53.5 35 45 35 L19 35 C10.5 35 5 32 5 25 Z";
  const formeTranche =
    "M7 27 L57 27 L57.8 31 L56.6 34.5 L58 38 L56.8 41.5 L57.4 43.5 C56.5 47.2 53 48.5 48 48.5 L16 48.5 C11 48.5 7.5 47.2 6.6 43.5 L7.2 41.5 L6 38 L7.4 34.5 L6.2 31 Z";

  // Rayures en losanges, tracées de part et d'autre du dessus
  const rayures: string[] = [];
  for (let x = -20; x <= 70; x += 8.5) {
    rayures.push(`M${x} 8 L${x + 14} 38`);
    rayures.push(`M${x + 14} 8 L${x} 38`);
  }

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Feuilleté salé"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={dessus} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F8C860" />
          <stop offset="0.5" stopColor="#ECA63C" />
          <stop offset="1" stopColor="#D08624" />
        </linearGradient>
        <linearGradient id={tranche} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DC9B3E" />
          <stop offset="1" stopColor="#B97522" />
        </linearGradient>
        <clipPath id={clipDessus}>
          <path d={formeDessus} />
        </clipPath>
        <clipPath id={clipTranche}>
          <path d={formeTranche} />
        </clipPath>
      </defs>

      {/* Ombre portée */}
      <ellipse cx="32" cy="54" rx="26" ry="3.4" fill="#000" opacity="0.12" />

      <g transform="rotate(-7 32 32) translate(0 2)">
        {/* Tranche : les couches du feuilletage */}
        <path d={formeTranche} fill={`url(#${tranche})`} />
        <g clipPath={`url(#${clipTranche})`} fill="none" strokeLinecap="round">
          <path d="M0 36.4 Q5 35 10 36.4 T20 36.4 T30 36.4 T40 36.4 T50 36.4 T60 36.4 T70 36.4" stroke="#FBE2A6" strokeWidth="1.6" />
          <path d="M-4 40.4 Q1 39 6 40.4 T16 40.4 T26 40.4 T36 40.4 T46 40.4 T56 40.4 T66 40.4" stroke="#F5D38A" strokeWidth="1.5" />
          <path d="M0 44.2 Q5 42.9 10 44.2 T20 44.2 T30 44.2 T40 44.2 T50 44.2 T60 44.2 T70 44.2" stroke="#ECC476" strokeWidth="1.3" opacity="0.85" />
        </g>

        {/* Dessus doré, rayé en losanges */}
        <path d={formeDessus} fill={`url(#${dessus})`} />
        <g clipPath={`url(#${clipDessus})`} fill="none" stroke="#B26B1A" strokeWidth="1.25" strokeLinecap="round" opacity="0.6">
          {rayures.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        {/* Bord du dessus, légèrement plus foncé */}
        <path d={formeDessus} fill="none" stroke="#C47C20" strokeWidth="0.8" opacity="0.5" />

        {/* Reflet de la dorure */}
        <ellipse cx="22" cy="16.5" rx="10" ry="2.4" fill="#FFF6DD" opacity="0.6" transform="rotate(-4 22 16.5)" />
        <ellipse cx="44.5" cy="15.6" rx="4" ry="1.2" fill="#FFF6DD" opacity="0.45" />
      </g>
    </svg>
  );
};

export default FeuilleteIllustration;
