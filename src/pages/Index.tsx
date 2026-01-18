import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductShowcaseSection from "@/components/ProductShowcaseSection";
import SweetProductsSection from "@/components/SweetProductsSection";
import SaltyPastriesSection from "@/components/SaltyPastriesSection";
import PizzasSection from "@/components/PizzasSection";
import OrderSection from "@/components/OrderSection";
import NewsletterSection from "@/components/NewsletterSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <ProductShowcaseSection />
      <SweetProductsSection />
      <SaltyPastriesSection />
      <PizzasSection />
      <OrderSection />
      <NewsletterSection />
      <Footer />
    </div>
  );
};

export default Index;
