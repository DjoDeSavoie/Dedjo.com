import NewsletterForm from "./NewsletterForm";

const NewsletterSection = () => {
  return (
    <section id="newsletter" className="py-20 px-6 bg-pink/20">
      <div className="container max-w-4xl text-center">
        <span className="text-4xl mb-4 block">💌</span>
        <h2 className="section-title">Stay in the Loop</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Subscribe to our newsletter and be the first to know about new creations, 
          special offers, and baking tips from our chef.
        </p>
        <NewsletterForm />
      </div>
    </section>
  );
};

export default NewsletterSection;
