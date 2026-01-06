const AboutSection = () => {
  return (
    <section id="who-i-am" className="py-20 px-6 section-orange">
      <div className="container max-w-4xl">
        <span className="text-5xl mb-4 block text-center">👨‍🍳</span>
        <h2 className="section-title">Qui suis-je</h2>
        <div className="bg-card rounded-2xl p-8 shadow-soft">
          <p className="text-lg text-foreground leading-relaxed mb-6">
            Bonjour et bienvenue chez <span className="font-display font-semibold text-primary">De Djo</span> !
          </p>
          <p className="text-foreground/90 leading-relaxed mb-4">
            Je crois que la nourriture raconte une histoire – et je veux partager la mienne avec vous. Derrière chaque croissant, 
            chaque feuilleté et chaque pizza, il y a une passion transmise de génération en génération : l'amour du 
            métier, le respect des ingrédients et la joie de rassembler les gens autour d'une table.
          </p>
          <p className="text-foreground/90 leading-relaxed mb-4">
            Ma mission est simple : vous connecter à ce que vous mangez. Quand vous dégustez nos créations, vous 
            ne savourez pas simplement une viennoiserie – vous vivez l'expérience de techniques perfectionnées au fil des années, 
            d'ingrédients locaux soigneusement sélectionnés et du soin sincère que nous mettons dans chaque pièce.
          </p>
          <p className="text-foreground/90 leading-relaxed">
            De mes mains à votre maison, chaque produit porte un morceau de cette histoire. Que ce soit nos 
            croissants au beurre prêts à cuire, nos feuilletés salés parfaits à partager, ou nos 
            pizzas au feu de bois faites avec amour par notre famille – nous vous invitons à faire partie de 
            l'expérience De Djo.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
