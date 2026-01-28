const AboutSection = () => {
  return (
    <section id="who-i-am" className="py-20 px-6 section-orange">
      <div className="container max-w-4xl">
        <span className="text-5xl mb-4 block text-center">👨🏻‍🍳</span>
        <h2 className="section-title"><span className="font-handmade text-2xl md:text-3xl tracking-wide text-handmade-dark">Qui suis-je</span></h2>
        <div className="bg-card rounded-2xl p-8 shadow-soft">
          <p className="text-lg text-foreground leading-relaxed mb-6">
            Bonjour et bienvenue chez <span className="font-display font-semibold text-primary">Dedjo</span> !
          </p>
          <p className="text-foreground/90 leading-relaxed mb-4">
            Issu d’une famille d’agriculteurs et de marchands, 
            j’ai grandi avec l’idée que la nourriture n’est jamais anodine : elle nourrit autant les corps que les liens. 
            Très jeune, mes grands-parents m’ont transmis un savoir-faire artisanal qui s’est naturellement transformé en passion. 
          </p>
          <p className="text-foreground/90 leading-relaxed mb-4">
            Diplômé ingénieur en informatique à Marseille, j’ai choisi de mettre la rigueur, la réflexion et la précision au service d’un métier profondément humain. 
          </p>
          <p className="text-foreground/90 leading-relaxed">
            À travers Dedjo, je souhaite transmettre des valeurs essentielles : l’importance du partage autour d’un repas, la conscience derrière chaque geste artisanal, et le respect d’un métier comme celui de boulanger. 
            Aujourd’hui, mon objectif est simple : prolonger cette transmission, à mon tour, en créant des produits sincères qui rassemblent les gens que l’on aime autour de la table.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
