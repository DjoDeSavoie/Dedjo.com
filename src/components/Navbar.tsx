import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";

interface NavLink {
  id: string;
  label: string;
  isLink?: boolean;
  href?: string;
}

const Navbar = () => {
  const location = useLocation();
  const isDiscoverPage = location.pathname === "/discover";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { id: "products-overview", label: "Nos Créations" },
    { id: "sweet-products", label: "Viennoiseries" },
    { id: "salty-pastries", label: "Feuilletés Salés" },
    { id: "pizzas", label: "Les Pizzas" },
    { id: "newsletter", label: "Grandir ensemble" },
    { id: "discover", label: "L'univers Dedjo", isLink: true, href: "/discover" },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        isScrolled
          ? "bg-sky-blue/95 backdrop-blur-sm shadow-soft"
          : "bg-[hsl(50,100%,75%)] shadow-soft"
      }`}
    >
      <div className="container max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <button 
            onClick={() => scrollToSection("hero")}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Logo className="w-10 h-10" />
            <span className="font-display text-2xl font-bold text-foreground">De Djo</span>
          </button>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-6">
            {navLinks.map((link: NavLink) => (
              <li key={link.id}>
                {link.isLink ? (
                  <Link
                    to={link.href!}
                    className="text-foreground/80 hover:text-primary font-medium transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                ) : isDiscoverPage ? (
                  <Link
                    to={`/#${link.id}`}
                    className="text-foreground/80 hover:text-primary font-medium transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className="text-foreground/80 hover:text-primary font-medium transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-foreground"
            aria-label="Ouvrir le menu"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border pt-4 bg-background rounded-lg shadow-soft">
            <ul className="flex flex-col gap-3 px-2">
              {navLinks.map((link: NavLink) => (
                <li key={link.id}>
                  {link.isLink ? (
                    <Link
                      to={link.href!}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-foreground hover:text-primary hover:bg-primary/10 font-medium transition-colors duration-200 w-full text-left py-2 px-3 rounded-lg text-base block"
                    >
                      {link.label}
                    </Link>
                  ) : isDiscoverPage ? (
                    <Link
                      to={`/#${link.id}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-foreground hover:text-primary hover:bg-primary/10 font-medium transition-colors duration-200 w-full text-left py-2 px-3 rounded-lg text-base block"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <button
                      onClick={() => scrollToSection(link.id)}
                      className="text-foreground hover:text-primary hover:bg-primary/10 font-medium transition-colors duration-200 w-full text-left py-2 px-3 rounded-lg text-base"
                    >
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
