import NewsletterForm from "./NewsletterForm";

const NewsletterSection = () => {
  return (
    <section id="newsletter" className="py-20 px-6 section-sky">
      <div className="container max-w-4xl text-center">
        <span className="text-4xl mb-4 block">🌱</span>
        <h2 className="section-title">Grandir avec nous</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Rejoignez notre communauté et soyez les premiers informés des nouvelles créations, 
          événements spéciaux et actualités de la famille De Djo.
        </p>
        <NewsletterForm />
      </div>
    </section>
  );
};

export default NewsletterSection;
