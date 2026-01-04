import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="py-8 px-6 border-t border-border">
      <div className="container max-w-6xl flex flex-col items-center gap-4">
        <Logo className="w-8 h-8" />
        <p className="text-muted-foreground text-center">
          © 2026 De Djo. Made with 🥖 and love.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
