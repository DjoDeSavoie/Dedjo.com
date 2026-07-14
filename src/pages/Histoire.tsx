import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";
import { Instagram } from "lucide-react";

const Histoire = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 px-6 section-cream">
        <div className="container max-w-3xl text-center">
          <span className="text-5xl mb-6 block">🌼</span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Mon histoire
          </h1>
          <p className="text-lg text-muted-foreground italic">
            D'une ferme savoyarde à ton four du dimanche matin.
          </p>
        </div>
      </section>

      {/* Contenu */}
      <section className="py-10 px-4 bg-background">
        <div className="container max-w-2xl">
          <div className="space-y-6 text-foreground leading-relaxed text-lg">

            <p>
              J'ai grandi dans une famille de paysans, dans une ferme savoyarde : nous cultivons la terre, ainsi que les valeurs humaines qu'elle suggère. Je suis un passionné de boulangerie, pâtisserie et de cuisine plus généralement. Cette flamme a été transmise par mes grands-parents. Je faisais les gâteaux avec ma grand-mère dès lors que j'ai su me tenir debout. Et mon grand-père, m'a enseigné, à sa manière, l'amour du pain et les valeurs qu'il incarne : « Le pain c'est sacré », comme il me l'a souvent répété.
            </p>

            <div className="text-center text-2xl py-2">🌼</div>

            <p>
              Peut être que cet amour pour l'artisanat culinaire est né de la grande technique et des connaissances qu'il est nécessaire de maîtriser pour mener à bon une recette et stimuler les sens. Peut-être incarne-t-il, par essence, toutes les valeurs qui m'ont été transmises par mes anciens. Peut-être me permet-t-il de sourire en partageant avec fierté, un croissant qui m'a demandé temps et travail pour parvenir à le maîtriser ?
            </p>

            <p>
              Peut-être finalement, et le plus simplement, qu'un tel savoir-faire se doit d'être proposé, car c'est aussi lui qui permet les plus belles rencontres, rendons-nous compte. C'est moins ce qu'il y a dans les assiettes que les personnes autour de la table qui rendent un moment mémorable ... Mais si on peut choisir de bien manger, pourquoi s'en priver ?
            </p>

            <div className="text-center text-2xl py-2">🌼</div>

            <p className="font-handmade text-xl text-handmade-dark italic text-center pt-4 pb-2">
              Désormais, vous me connaissez un peu mieux,<br />
              À très bientôt,<br />
              Djo
            </p>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-border">
        <div className="container max-w-6xl flex flex-col items-center gap-3">
          <Logo className="w-8 h-8" />
          <a
            href="https://instagram.com/Dedjo_"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium text-sm"
          >
            <Instagram className="w-4 h-4" />
            @Dedjo_
          </a>
          <p className="text-muted-foreground text-center text-sm">
            © 2026 Dedjo. Fait avec amour. 🥖
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Histoire;
