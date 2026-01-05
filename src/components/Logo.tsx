const Logo = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      aria-label="De Djo logo - flower with 5 petals"
    >
      {/* Yellow movement lines - outer */}
      <g opacity="0.7">
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <path
            key={`outer-${i}`}
            d="M50 8 Q55 3 60 6"
            stroke="hsl(45 90% 55%)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
        {[36, 108, 180, 252, 324].map((angle, i) => (
          <path
            key={`outer2-${i}`}
            d="M50 10 Q43 4 38 8"
            stroke="hsl(45 90% 55%)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
      </g>
      
      {/* 5 sky blue petals */}
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <ellipse 
          key={i}
          cx="50" cy="24" rx="13" ry="20" 
          fill="hsl(200 70% 65%)"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      
      {/* Yellow movement lines - inner (swirling toward center) */}
      <g opacity="0.8">
        {[20, 92, 164, 236, 308].map((angle, i) => (
          <path
            key={`inner-${i}`}
            d="M50 38 Q54 35 56 38"
            stroke="hsl(45 95% 55%)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
      </g>
      
      {/* Orange center */}
      <circle cx="50" cy="50" r="14" fill="hsl(30 90% 55%)" />
      <circle cx="50" cy="50" r="9" fill="hsl(35 95% 60%)" />
      <circle cx="50" cy="50" r="5" fill="hsl(40 100% 65%)" />
    </svg>
  );
};

export default Logo;
