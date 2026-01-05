import NewsletterForm from "./NewsletterForm";

const NewsletterSection = () => {
  return (
    <section id="newsletter" className="py-20 px-6 section-sky">
      <div className="container max-w-4xl text-center">
        <span className="text-4xl mb-4 block">🌱</span>
        <h2 className="section-title">Grow With Us</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Join our community and be the first to know about new creations, 
          special events, and updates from the De Djo family.
        </p>
        <NewsletterForm />
      </div>
    </section>
  );
};

export default NewsletterSection;
