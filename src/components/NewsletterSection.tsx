import NewsletterForm from "./NewsletterForm";
import ContactForm from "./ContactForm";

const GrowingPlant = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 120" 
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Pot */}
    <path d="M30 90 L35 110 L65 110 L70 90 Z" fill="hsl(var(--primary))" opacity="0.8" />
    <ellipse cx="50" cy="90" rx="22" ry="5" fill="hsl(var(--primary))" />
    
    {/* Soil */}
    <ellipse cx="50" cy="90" rx="18" ry="3" fill="hsl(25, 50%, 30%)" />
    
    {/* Stem */}
    <path d="M50 90 Q48 70 50 50 Q52 35 50 20" stroke="hsl(142, 50%, 40%)" strokeWidth="3" fill="none" strokeLinecap="round" />
    
    {/* Leaves */}
    <ellipse cx="42" cy="65" rx="12" ry="6" fill="hsl(142, 60%, 45%)" transform="rotate(-30 42 65)" />
    <ellipse cx="58" cy="55" rx="12" ry="6" fill="hsl(142, 60%, 50%)" transform="rotate(30 58 55)" />
    <ellipse cx="45" cy="40" rx="10" ry="5" fill="hsl(142, 60%, 55%)" transform="rotate(-20 45 40)" />
    <ellipse cx="55" cy="30" rx="8" ry="4" fill="hsl(142, 60%, 50%)" transform="rotate(25 55 30)" />
    
    {/* Small bud at top */}
    <circle cx="50" cy="18" r="4" fill="hsl(var(--secondary))" />
  </svg>
);

const NewsletterSection = () => {
  return (
    <section id="newsletter" className="py-20 px-6 section-sky">
      <div className="container max-w-4xl text-center relative">
        {/* Growing plant decoration */}
        <div className="flex justify-center mb-6">
          <GrowingPlant className="w-24 h-28" />
        </div>
        
        <h2 className="section-title">Grandir avec nous</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Rejoignez notre communauté et soyez les premiers informés des nouvelles créations, 
          événements spéciaux et actualités de la famille De Djo.
        </p>
        
        {/* Newsletter subscription */}
        <div className="mb-12">
          <h3 className="text-xl font-display font-semibold mb-4 text-foreground">📬 S'abonner à la newsletter</h3>
          <NewsletterForm />
        </div>

        {/* Separator */}
        <div className="flex items-center gap-4 max-w-md mx-auto mb-12">
          <div className="flex-1 h-px bg-primary/30"></div>
          <span className="text-2xl">🌿</span>
          <div className="flex-1 h-px bg-primary/30"></div>
        </div>

        {/* Contact form */}
        <div>
          <h3 className="text-xl font-display font-semibold mb-2 text-foreground">💬 Partagez vos idées</h3>
          <p className="text-muted-foreground mb-6 text-sm">
            Suggestions de recettes, idées de produits, questions ou simplement envie de discuter ? 
            On grandit ensemble !
          </p>
          <ContactForm />
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
