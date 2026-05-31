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
            L'histoire de Dedjo
          </h1>
          <p className="text-lg text-muted-foreground italic">
            D'une ferme savoyarde à ton four du dimanche matin.
          </p>
        </div>
      </section>

      {/* Contenu */}
      <section className="py-10 px-4 bg-background">
        <div className="container max-w-2xl">
          <div className="space-y-8 text-foreground leading-relaxed text-lg">

            <p>
              <strong>Dedjo.</strong> Ça vient de là : Jonathan, dit Jo, dit « de Djo ». Un glissement naturel, presque involontaire. La marque porte mon prénom comme une signature maladroite et sincère.
            </p>

            <div className="text-center text-2xl py-2">🌼</div>

            <p>
              J'ai grandi en Savoie, à deux pas de la ferme de la Goëttaz. Là où les légumes ont encore un goût de terre, où le four à bois sent la résine et le blé brûlé, où mes grands-parents m'ont appris à ne pas aller vite. Ils m'ont transmis des gestes — étaler, tourer, façonner, recommencer — sans jamais les appeler « recettes ». Pour eux, c'était juste comme ça qu'on faisait les choses.
            </p>

            <p>
              Aujourd'hui je vis à Marseille, ingénieur de formation, et c'est depuis cette distance que j'ai compris ce que ces gestes portaient. Le dimanche matin qui s'étire. L'odeur du beurre chaud dans la cuisine. La table où on se retrouve sans raison particulière, juste parce qu'on est bien ensemble.
            </p>

            <div className="text-center text-2xl py-2">🌼</div>

            <p>
              Dedjo est né de ça. Pas d'une stratégie ni d'un marché. D'une envie simple : te confier quelque chose que j'ai façonné à la main, pour que tu en fasses un moment à toi. Je façonne chaque viennoiserie à la main, je la toure, je la bloque au froid. Et c'est toi qui fais le dernier geste — la pousse, la cuisson, la bonne odeur qui envahit ta maison.
            </p>

            <p>
              Ce n'est pas une commodité. C'est un rituel à deux.
            </p>

            <div className="text-center text-2xl py-2">🌼</div>

            <p>
              Les viennoiseries, les feuilletés salés, les pizzas du vendredi à la Goëttaz — tout ce que fait Dedjo tient dans une seule idée : prendre le temps. Le temps de bien faire, le temps de laisser lever la pâte, le temps de partager le résultat avec ceux qu'on aime.
            </p>

            <p className="font-handmade text-xl text-handmade-dark italic text-center pt-4 pb-2">
              Hérité de mes grands-parents. Façonné dans ma cuisine. Partagé chez toi.
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
