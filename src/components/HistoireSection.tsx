import FleurTati from "./FleurTati";

const HistoireSection = () => {
  return (
    <section id="histoire" className="py-14 px-4 section-cream border-t border-border">
      <div className="container max-w-2xl">

        <div className="text-center mb-10">
          <FleurTati className="mx-auto mb-4" />
          <h2 className="section-title mb-3">
            Mon histoire
          </h2>
          <p className="text-lg text-muted-foreground italic">
            D'une ferme savoyarde à ton four du dimanche matin.
          </p>
        </div>

        <div className="space-y-6 text-foreground leading-relaxed text-lg">

          <p>
            J'ai grandi dans une famille de paysans, dans une ferme savoyarde : nous cultivons la terre, ainsi que les valeurs humaines qu'elle suggère. Je suis un passionné de boulangerie, de pâtisserie et de cuisine plus généralement. Cette flamme, ce sont mes grands-parents qui me l'ont transmise : je faisais les gâteaux avec ma grand-mère dès lors que j'ai su me tenir debout ; et mon grand-père m'a enseigné, à sa manière, l'amour du pain et les valeurs qu'il incarne : « Le pain c'est sacré », comme il me l'a souvent répété.
          </p>

          <p>
            Peut-être que cet amour pour l'artisanat culinaire est né de la grande technique et des connaissances qu'il est nécessaire de maîtriser pour mener à bien une recette et stimuler les sens, tout en gardant la simplicité d'une bonne bouffe. Peut-être incarne-t-il, par essence, toutes les valeurs qui m'ont été transmises par mes anciens. Peut-être me permet-il de sourire en partageant avec fierté un produit qui m'a demandé temps et travail pour parvenir à le maîtriser ?
          </p>

          <p>
            Peut-être finalement, et le plus simplement, qu'un tel savoir-faire se doit d'être proposé, car c'est aussi lui qui permet les plus belles rencontres, rendons-nous compte. C'est moins ce qu'il y a dans les assiettes que les personnes autour de la table qui rendent un moment mémorable ... Mais si on peut choisir de bien manger, pourquoi s'en priver ?
          </p>

          <p className="font-display italic text-xl text-handmade-dark text-center pt-4 pb-2">
            <span className="block">Désormais, tu me connais un peu mieux,</span>
            <span className="block">à très bientôt,</span>
            <span className="block">Djo</span>
          </p>

        </div>
      </div>
    </section>
  );
};

export default HistoireSection;
