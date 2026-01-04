const Logo = ({ className = "w-12 h-12" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      aria-label="De Djo logo - flower with 5 petals"
    >
      {/* Center circle */}
      <circle cx="50" cy="50" r="12" fill="hsl(35 85% 55%)" />
      
      {/* 5 petals - Blue, Orange, Yellow colors */}
      {/* Top petal - Blue */}
      <ellipse 
        cx="50" cy="22" rx="14" ry="22" 
        fill="hsl(210 70% 55%)"
        transform="rotate(0 50 50)"
      />
      
      {/* Top right petal - Orange */}
      <ellipse 
        cx="50" cy="22" rx="14" ry="22" 
        fill="hsl(30 90% 55%)"
        transform="rotate(72 50 50)"
      />
      
      {/* Bottom right petal - Yellow */}
      <ellipse 
        cx="50" cy="22" rx="14" ry="22" 
        fill="hsl(45 95% 55%)"
        transform="rotate(144 50 50)"
      />
      
      {/* Bottom left petal - Blue */}
      <ellipse 
        cx="50" cy="22" rx="14" ry="22" 
        fill="hsl(210 70% 55%)"
        transform="rotate(216 50 50)"
      />
      
      {/* Top left petal - Orange */}
      <ellipse 
        cx="50" cy="22" rx="14" ry="22" 
        fill="hsl(30 90% 55%)"
        transform="rotate(288 50 50)"
      />
      
      {/* Inner center highlight */}
      <circle cx="50" cy="50" r="8" fill="hsl(45 95% 65%)" />
    </svg>
  );
};

export default Logo;
