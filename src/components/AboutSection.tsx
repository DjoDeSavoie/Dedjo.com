const AboutSection = () => {
  return (
    <section id="who-i-am" className="py-20 px-6 section-orange">
      <div className="container max-w-4xl">
        <span className="text-5xl mb-4 block text-center">👨‍🍳</span>
        <h2 className="section-title">Who I Am</h2>
        <div className="bg-card rounded-2xl p-8 shadow-soft">
          <p className="text-lg text-foreground leading-relaxed mb-6">
            Hello, and welcome to <span className="font-display font-semibold text-primary">De Djo</span>!
          </p>
          <p className="text-foreground/90 leading-relaxed mb-4">
            I believe that food tells a story – and I want to share mine with you. Behind every croissant, 
            every puff pastry, and every pizza is a passion passed down through generations: the love of 
            craft, the respect for ingredients, and the joy of bringing people together around a table.
          </p>
          <p className="text-foreground/90 leading-relaxed mb-4">
            My mission is simple: to connect you to what you eat. When you taste our creations, you're 
            not just enjoying a pastry – you're experiencing the techniques refined over years, the 
            carefully sourced local ingredients, and the genuine care we put into every single piece.
          </p>
          <p className="text-foreground/90 leading-relaxed">
            From my hands to your home, each product carries a piece of this story. Whether it's our 
            buttery croissants ready to bake, our savory puff pastries perfect for sharing, or our 
            wood-fired pizzas made with love by our family – we invite you to become part of the 
            De Djo experience.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
