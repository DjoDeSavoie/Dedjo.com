import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import Index from "./pages/Index";
import Commande from "./pages/Commande";
import MentionsLegales from "./pages/MentionsLegales";
import Cgv from "./pages/Cgv";
import Confidentialite from "./pages/Confidentialite";
import Marseille from "./pages/Marseille";
import Savoie from "./pages/Savoie";
import FicheProduit from "./pages/FicheProduit";
import GuideCuisson from "./pages/GuideCuisson";
import NotFound from "./pages/NotFound";

// Atelier (stock privé) : chargé à part, son code n'est pas dans le paquet du site
const Atelier = lazy(() => import("./pages/Atelier"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/commande" element={<Commande />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/cgv" element={<Cgv />} />
            <Route path="/confidentialite" element={<Confidentialite />} />
            {/* Pages de référencement. Toute nouvelle page a aussi sa règle dans netlify.toml
                et son adresse dans public/sitemap.xml. */}
            <Route path="/marseille" element={<Marseille />} />
            <Route path="/savoie" element={<Savoie />} />
            {/* Fiches produits : un seul composant ; les adresses sont celles de src/lib/fiches.ts.
                key : en passant d'une fiche à l'autre, la page repart de zéro (carrousel de photos). */}
            <Route path="/la-lune" element={<FicheProduit key="lune" id="lune" />} />
            <Route path="/la-cabosse" element={<FicheProduit key="cabosse" id="cabosse" />} />
            <Route path="/la-montagne" element={<FicheProduit key="montagne" id="montagne" />} />
            <Route path="/la-foret" element={<FicheProduit key="foret" id="foret" />} />
            <Route path="/cuisson-viennoiseries-surgelees" element={<GuideCuisson />} />
            <Route
              path="/atelier"
              element={
                <Suspense fallback={<div className="min-h-screen bg-[#FBF5E9]" />}>
                  <Atelier />
                </Suspense>
              }
            />
            {/* Nouvelles routes au-dessus de la route « * » (page introuvable) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
