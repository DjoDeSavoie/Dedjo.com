import { Phone, MapPin } from "lucide-react";

const OrderSection = () => {
  return (
    <section id="order" className="py-20 px-6 section-orange">
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
          {/* Présentation de Djo */}
          <div className="bg-card rounded-2xl p-8 shadow-soft">
            <h3 className="font-display text-2xl font-semibold mb-4 flex items-center gap-3">
              <span className="text-3xl">👨🏻‍🍳</span>
              Qui est Djo ?
            </h3>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Issu d'une famille d'agriculteurs et de marchands, j'ai grandi avec l'idée que la nourriture n'est jamais anodine : elle nourrit autant les corps que les liens.
            </p>
            <p className="text-foreground/90 leading-relaxed mb-4">
              Très jeune, mes grands-parents m'ont transmis un savoir-faire artisanal qui s'est naturellement transformé en passion.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              À travers <span className="font-display font-semibold text-primary">De Djo</span>, je souhaite transmettre des valeurs essentielles : le partage, la conscience derrière chaque geste artisanal, et le respect du métier de boulanger.
            </p>
          </div>

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

            {/* Location */}
            <div className="mt-8 pt-6 border-t border-border">
              <h4 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Notre Pizzeria
              </h4>
              <p className="text-foreground font-medium">Ferme De La Goëttaz</p>
              <p className="text-sm text-muted-foreground mt-1">
                Venez nous rendre visite à notre four à bois et dégustez des pizzas fraîches dans une ambiance familiale chaleureuse.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderSection;
