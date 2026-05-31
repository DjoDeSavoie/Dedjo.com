import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductShowcaseSection from "@/components/ProductShowcaseSection";
import SweetProductsSection from "@/components/SweetProductsSection";
import SaltyPastriesSection from "@/components/SaltyPastriesSection";
import PizzasSection from "@/components/PizzasSection";
import NewsletterSection from "@/components/NewsletterSection";
import HistoireSection from "@/components/HistoireSection";
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
      <NewsletterSection />
      <HistoireSection />
      <Footer />
    </div>
  );
};

export default Index;
