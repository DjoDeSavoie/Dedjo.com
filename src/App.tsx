import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import Index from "./pages/Index";
import Discover from "./pages/Discover";
import Commande from "./pages/Commande";
import MentionsLegales from "./pages/MentionsLegales";
import Cgv from "./pages/Cgv";
import Confidentialite from "./pages/Confidentialite";
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
            <Route path="/discover" element={<Discover />} />
            {/* L'histoire est désormais une section en bas de la page d'accueil */}
            <Route path="/histoire" element={<Navigate to="/#histoire" replace />} />
            <Route path="/commande" element={<Commande />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/cgv" element={<Cgv />} />
            <Route path="/confidentialite" element={<Confidentialite />} />
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
