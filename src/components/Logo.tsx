const Logo = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      aria-label="De Djo logo - fleur à 5 pétales"
    >
      {/* 5 sky blue petals */}
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <ellipse 
          key={i}
          cx="50" cy="24" rx="13" ry="20" 
          fill="hsl(200 70% 65%)"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      
      {/* Orange center with gradient effect */}
      <circle cx="50" cy="50" r="16" fill="hsl(30 90% 55%)" />
      <circle cx="50" cy="50" r="11" fill="hsl(35 95% 60%)" />
      <circle cx="50" cy="50" r="6" fill="hsl(40 100% 65%)" />
    </svg>
  );
};

export default Logo;
