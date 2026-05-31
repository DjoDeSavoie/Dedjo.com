const Logo = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-78 -83 156 158"
      className={className}
      role="img"
      aria-label="Logo Dedjo"
      draggable={false}
    >
      <title>Dedjo</title>

      {/* Pouce */}
      <path
        d="M-11,0 C-19,-7 -20,-27 -11,-38 C-6,-44 6,-44 11,-38 C20,-27 18,-7 11,0 Z"
        fill="#5AAEDC"
        transform="rotate(270)"
        opacity="0.95"
      />

      {/* Index */}
      <path
        d="M-8,0 C-15,-12 -16,-43 -7,-56 C-4,-62 4,-62 8,-56 C16,-43 14,-12 8,0 Z"
        fill="#7DC3E8"
        transform="rotate(344)"
        opacity="0.93"
      />

      {/* Majeur */}
      <path
        d="M-9,0 C-17,-13 -18,-45 -8,-57 C-4,-64 4,-64 9,-57 C17,-45 16,-13 9,0 Z"
        fill="#4FA2D4"
        transform="rotate(54)"
        opacity="0.96"
      />

      {/* Annulaire */}
      <path
        d="M-8,0 C-14,-11 -15,-41 -7,-53 C-4,-59 4,-59 7,-53 C14,-41 13,-11 8,0 Z"
        fill="#6BBCE2"
        transform="rotate(127)"
        opacity="0.92"
      />

      {/* Auriculaire */}
      <path
        d="M-7,0 C-12,-8 -13,-33 -6,-43 C-3,-48 3,-48 7,-43 C12,-33 11,-8 7,0 Z"
        fill="#7DC3E8"
        transform="rotate(198)"
        opacity="0.90"
      />

      {/* Centre jaune */}
      <circle cx="0" cy="0" r="17" fill="#F5C842" />
    </svg>
  );
};

export default Logo;
