import { Instagram } from "lucide-react";
import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="py-8 px-6 border-t border-border">
      <div className="container max-w-6xl flex flex-col items-center gap-4">
        <Logo className="w-8 h-8" />
        <a 
          href="https://instagram.com/Dedjo_" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
        >
          <Instagram className="w-5 h-5" />
          @Dedjo_
        </a>
        <p className="text-muted-foreground text-center">
          © 2026 De Djo. Fait avec amour. 🥖
        </p>
      </div>
    </footer>
  );
};

export default Footer;
