import { useEffect } from "react";
import { useLocation } from "react-router-dom";
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
  const { hash } = useLocation();

  // Arrivée avec une ancre (ex. /#histoire) : aller à la section une fois les polices
  // chargées, pour que la mise en page ne bouge plus après le saut
  useEffect(() => {
    if (!hash) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) document.getElementById(hash.slice(1))?.scrollIntoView();
    });
    return () => {
      cancelled = true;
    };
  }, [hash]);

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
