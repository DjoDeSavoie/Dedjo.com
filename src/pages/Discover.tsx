import { Link } from "react-router-dom";
import { Phone, MapPin, ArrowLeft, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const Discover = () => {
  const photos = [
    {
      title: "L'art du croissant",
      description: "Chaque croissant est façonné à la main, avec patience et précision",
      emoji: "🥐",
      bgColor: "bg-[hsl(45,100%,85%)]",
    },
    {
      title: "La Ferme De La Goëttaz",
      description: "Notre cadre de vie, source d'inspiration et d'ingrédients frais",
      emoji: "🏡",
      bgColor: "bg-[hsl(140,60%,85%)]",
    },
    {
      title: "L'univers Pizza",
      description: "Notre four à bois, le cœur de nos vendredis soirs en famille",
      emoji: "🔥",
      bgColor: "bg-[hsl(25,100%,88%)]",
    },
    {
      title: "L'esprit familial",
      description: "Cousins, frères et sœurs réunis autour d'une même passion",
      emoji: "👨‍👩‍👧‍👦",
      bgColor: "bg-[hsl(280,60%,88%)]",
    },
    {
      title: "Le feuilletage",
      description: "Des heures de travail pour une pâte parfaitement feuilletée",
      emoji: "🧈",
      bgColor: "bg-[hsl(50,100%,85%)]",
    },
    {
      title: "Les légumes de la ferme",
      description: "Cultivés avec soin pour garnir nos créations",
      emoji: "🥬",
      bgColor: "bg-[hsl(120,50%,85%)]",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[hsl(50,100%,75%)] py-6 px-6 sticky top-0 z-50 shadow-soft">
        <div className="container max-w-6xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Logo className="w-10 h-10" />
            <span className="font-display text-2xl font-bold text-foreground">De Djo</span>
          </Link>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6 bg-sky-blue">
        <div className="container max-w-4xl text-center">
          <span className="text-6xl mb-6 block">✨</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            Découvrir l'univers{" "}
            <span className="text-primary">De Djo</span>
          </h1>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Une aventure artisanale née de la passion, du partage et de l'amour du fait main.
          </p>
        </div>
      </section>

      {/* Qui suis-je */}
      <section className="py-20 px-6 section-orange">
        <div className="container max-w-4xl">
          <span className="text-5xl mb-4 block text-center">👨🏻‍🍳</span>
          <h2 className="section-title">
            <span className="font-handmade text-2xl md:text-3xl tracking-wide text-handmade-dark">
              Qui suis-je
            </span>
          </h2>
          <div className="bg-card rounded-2xl p-8 shadow-soft">
            <p className="text-lg text-foreground leading-relaxed mb-6">
              Bonjour et bienvenue chez <span className="font-display font-semibold text-primary">De Djo</span> !
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Issu d'une famille d'agriculteurs et de marchands, 
              j'ai grandi avec l'idée que la nourriture n'est jamais anodine : elle nourrit autant les corps que les liens. 
              Très jeune, mes grands-parents m'ont transmis un savoir-faire artisanal qui s'est naturellement transformé en passion. 
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Diplômé ingénieur en informatique à Marseille, j'ai choisi de mettre la rigueur, la réflexion et la précision au service d'un métier profondément humain. 
            </p>
            <p className="text-foreground/90 leading-relaxed">
              À travers De Djo, je souhaite transmettre des valeurs essentielles : l'importance du partage autour d'un repas, la conscience derrière chaque geste artisanal, et le respect d'un métier comme celui de boulanger. 
              Aujourd'hui, mon objectif est simple : prolonger cette transmission, à mon tour, en créant des produits sincères qui rassemblent les gens que l'on aime autour de la table.
            </p>
          </div>
        </div>
      </section>

      {/* Galerie Photos */}
      <section className="py-20 px-6 bg-background">
        <div className="container max-w-6xl">
          <span className="text-5xl mb-4 block text-center">📸</span>
          <h2 className="section-title">
            <span className="font-handmade text-2xl md:text-3xl tracking-wide text-handmade-dark">
              Notre univers en images
            </span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Découvrez les coulisses de notre aventure artisanale
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo, index) => (
              <div
                key={photo.title}
                className={`${photo.bgColor} rounded-2xl p-8 shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="text-5xl block mb-4 text-center">{photo.emoji}</span>
                <h3 className="font-display text-xl font-semibold text-center mb-2 text-foreground">
                  {photo.title}
                </h3>
                <p className="text-center text-foreground/80 text-sm">
                  {photo.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commander */}
      <section className="py-20 px-6 section-yellow">
        <div className="container max-w-5xl">
          <span className="text-5xl mb-4 block text-center">📞</span>
          <h2 className="section-title">
            <span className="font-handmade text-2xl md:text-3xl tracking-wide text-handmade-dark">
              Commander
            </span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Prêt à goûter nos délicieuses créations ? Contactez-nous !
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="bg-card rounded-2xl p-8 shadow-soft">
              <h3 className="font-display text-2xl font-semibold mb-6 flex items-center gap-3">
                <Phone className="w-6 h-6 text-primary" />
                Nous contacter
              </h3>
              <p className="text-muted-foreground mb-4">
                Pour les commandes et renseignements, appelez-nous :
              </p>
              <a 
                href="tel:+33777282023" 
                className="text-2xl font-display font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                07 77 28 20 23
              </a>
              <p className="text-sm text-muted-foreground mt-4">
                Nous sommes disponibles pendant les heures d'ouverture pour prendre vos commandes de viennoiseries et feuilletés salés.
              </p>
            </div>

            {/* Location */}
            <div className="bg-card rounded-2xl p-8 shadow-soft">
              <h3 className="font-display text-2xl font-semibold mb-6 flex items-center gap-3">
                <MapPin className="w-6 h-6 text-primary" />
                Notre Pizzeria
              </h3>
              <p className="text-foreground font-medium text-lg mb-2">Ferme De La Goëttaz</p>
              <p className="text-muted-foreground mb-4">
                Venez nous rendre visite à notre four à bois et dégustez des pizzas fraîches dans une ambiance familiale chaleureuse.
              </p>
              <div className="bg-primary/10 rounded-lg p-4">
                <p className="text-primary font-semibold">
                  🗓️ Les vendredis à partir de 18h
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border bg-background">
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
    </div>
  );
};

export default Discover;
