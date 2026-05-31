import { Instagram } from "lucide-react";
import Logo from "./Logo";

const instagramPreviews = [
  { emoji: "🥐", label: "La Lune", desc: "Croissant au beurre AOP", bg: "bg-product-croissant" },
  { emoji: "🍫", label: "La Cabosse", desc: "Pain au chocolat", bg: "bg-[#d4a87a]" },
  { emoji: "🌹", label: "La Rose", desc: "Praline rose & vanille", bg: "bg-product-rose" },
  { emoji: "🍇", label: "La Grappe", desc: "Roulé aux raisins", bg: "bg-product-raisin" },
];

const Footer = () => {
  return (
    <>
      {/* Instagram Section */}
      <section className="py-10 px-4 section-cream border-t border-border">
        <div className="container max-w-4xl text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Instagram className="w-7 h-7 text-primary" />
            <h2 className="font-display text-3xl font-bold text-foreground">@Dedjo_</h2>
          </div>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Suivez nos créations au quotidien — croissants tout chauds, enfournements du matin et moments en famille.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {instagramPreviews.map((item) => (
              <a
                key={item.label}
                href="https://instagram.com/Dedjo_"
                target="_blank"
                rel="noopener noreferrer"
                className={`${item.bg} rounded-2xl aspect-square flex flex-col items-center justify-center gap-2 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1`}
              >
                <span className="text-4xl">{item.emoji}</span>
                <span className="text-sm font-semibold text-foreground">{item.label}</span>
                <span className="text-xs text-foreground/70">{item.desc}</span>
              </a>
            ))}
          </div>

          <a
            href="https://instagram.com/Dedjo_"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-hover"
          >
            <Instagram className="w-5 h-5" />
            Suivre @Dedjo_ sur Instagram
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-border">
        <div className="container max-w-6xl flex flex-col items-center gap-2">
          <Logo className="w-8 h-8" />
          <p className="text-muted-foreground text-center text-sm">
            © 2026 Dedjo. Fait avec amour. 🥖
          </p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
