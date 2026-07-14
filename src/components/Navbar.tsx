import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingBasket } from "lucide-react";
import Logo from "./Logo";
import { useCart } from "@/context/CartContext";

const navLinks = [
  { id: "sweet-products", label: "Viennoiseries" },
  { id: "salty-pastries", label: "Feuilletés Salés" },
  { id: "pizzas", label: "Les Pizzas" },
  { id: "newsletter", label: "Grandir ensemble" },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Détecte la section visible au scroll (uniquement sur la home)
  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection("");
      return;
    }

    const sectionIds = navLinks.map((l) => l.id);
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { threshold: 0.4 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [location.pathname]);

  const goToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    if (location.pathname === "/") {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    } else {
      // Naviguer vers la home puis scroller après le rendu
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const goHome = () => {
    setIsMobileMenuOpen(false);
    if (location.pathname === "/") {
      const element = document.getElementById("hero");
      if (element) element.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  const isHistoire = location.pathname === "/histoire";
  const isCommande = location.pathname === "/commande";

  const linkClass = (active: boolean) =>
    `font-semibold transition-colors duration-200 text-sm ${
      active ? "text-primary" : "text-foreground hover:text-primary"
    }`;

  const mobileLinkClass = (active: boolean) =>
    `font-medium transition-colors duration-200 w-full text-left py-2 px-3 rounded-lg text-base ${
      active
        ? "text-primary bg-primary/10"
        : "text-foreground hover:text-primary hover:bg-primary/10"
    }`;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background/95 backdrop-blur-sm border-b border-border/60 ${
        isScrolled ? "shadow-soft" : ""
      }`}
    >
      <div className="container max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">

          {/* Logo + nom */}
          <button
            onClick={goHome}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Logo className="w-10 h-10" />
            <span
              className="font-pattaya text-2xl text-foreground"
              style={{ letterSpacing: "2px" }}
            >Dedjo</span>
          </button>

          {/* Navigation desktop */}
          <ul className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => goToSection(link.id)}
                  className={linkClass(activeSection === link.id)}
                >
                  {link.label}
                </button>
              </li>
            ))}
            <li>
              <Link
                to="/histoire"
                className={linkClass(isHistoire)}
              >
                Mon histoire
              </Link>
            </li>
            <li>
              <Link
                to="/commande"
                className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  isCommande
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                <ShoppingBasket className="w-4 h-4" />
                Commander
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-bold">
                    {totalItems}
                  </span>
                )}
              </Link>
            </li>
          </ul>

          {/* Bouton menu mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-foreground"
            aria-label="Ouvrir le menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border pt-4 bg-background rounded-lg shadow-soft">
            <ul className="flex flex-col gap-3 px-2">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => goToSection(link.id)}
                    className={mobileLinkClass(activeSection === link.id)}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <Link
                  to="/histoire"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`${mobileLinkClass(isHistoire)} block`}
                >
                  Mon histoire
                </Link>
              </li>
              <li>
                <Link
                  to="/commande"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-base font-semibold ${
                    isCommande
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <ShoppingBasket className="w-4 h-4" />
                  Commander
                  {totalItems > 0 && (
                    <span className="ml-auto min-w-[22px] h-5 px-1.5 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-bold">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
