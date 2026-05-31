import Logo from "./Logo";

const Hero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="hero" className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-12 pt-24">
      <div className="flex items-center gap-4 mb-4 animate-fade-in">
        <Logo className="w-[6.6rem] h-[6.6rem]" />
        <h1
          className="font-pattaya text-5xl md:text-6xl text-foreground"
          style={{ letterSpacing: "2px" }}
        >
          Dedjo
        </h1>
      </div>
      <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-8 animate-fade-in">
  <span className="font-handmade text-2xl md:text-3xl tracking-wide text-handmade-dark">
  L'artisanat
</span>{" "}
  pour se connecter à ce que l'on mange,<br />
  et le partager avec fierté.
</p>
      <div className="flex gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <button 
          onClick={() => scrollToSection("products-overview")}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-hover"
        >
          Découvrir les produits
        </button>
        <button 
          onClick={() => scrollToSection("newsletter")}
          className="bg-secondary text-secondary-foreground px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-hover"
        >
          Grandir ensemble
        </button>
      </div>
    </section>
  );
};

export default Hero;
