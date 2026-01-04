const AboutSection = () => {
  return (
    <section id="who-i-am" className="py-20 px-6 bg-secondary/30">
      <div className="container max-w-4xl text-center">
        <span className="text-5xl mb-6 block">👨‍🍳</span>
        <h2 className="section-title">Who I Am</h2>
        <div className="bg-card rounded-2xl p-8 shadow-soft">
          <p className="text-lg text-foreground leading-relaxed mb-6">
            Welcome to De Djo! I believe that the best food comes from sharing passion and 
            authentic techniques. My mission is to connect you, the consumer, to the products 
            you enjoy – through the love of artisan baking and the stories behind every creation.
          </p>
          <p className="text-muted-foreground">
            Every pastry, every pizza, every bite carries a piece of tradition and innovation. 
            I want you to taste not just the ingredients, but the care and dedication that goes 
            into crafting each item. When you enjoy our products, you become part of our story.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
