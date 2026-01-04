import Logo from "./Logo";

const Hero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="hero" className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-20 pt-28">
      <Logo className="w-24 h-24 mb-6 animate-float" />
      <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 text-foreground animate-fade-in">
        De Djo
      </h1>
      <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        Artisan pastries, handcrafted with passion. Discover our delicious croissants, 
        savory puff pastries, and authentic homemade pizzas.
      </p>
      <div className="flex gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <button 
          onClick={() => scrollToSection("sweet-products")}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-hover"
        >
          Explore Menu
        </button>
        <button 
          onClick={() => scrollToSection("who-i-am")}
          className="bg-secondary text-secondary-foreground px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-hover"
        >
          About Me
        </button>
      </div>
    </section>
  );
};

export default Hero;
