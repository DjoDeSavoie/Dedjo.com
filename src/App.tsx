import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
// Pages d'arrivée (accueil, pages de lieu, fiches) : dans le paquet principal, pour s'afficher sans attendre
import Index from "./pages/Index";
import Marseille from "./pages/Marseille";
import Savoie from "./pages/Savoie";
import FicheProduit from "./pages/FicheProduit";

/* Pages chargées à part : leur code n'est téléchargé que quand on les ouvre. Le routeur garde la
   page actuelle à l'écran le temps du chargement (v7_startTransition), sans écran vide. */
const chargerCommande = () => import("./pages/Commande");
const Commande = lazy(chargerCommande);
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const Cgv = lazy(() => import("./pages/Cgv"));
const Confidentialite = lazy(() => import("./pages/Confidentialite"));
const GuideCuisson = lazy(() => import("./pages/GuideCuisson"));
const NotFound = lazy(() => import("./pages/NotFound"));
// Atelier (stock privé) : chargé à part, son code n'est pas dans le paquet du site
const Atelier = lazy(() => import("./pages/Atelier"));

/** Une fois la première page affichée, télécharge en tâche de fond la page Commande, étape suivante la plus probable. */
const PrechargementCommande = () => {
  useEffect(() => {
    const precharger = () => void chargerCommande();
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(precharger, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(precharger, 2000);
    return () => clearTimeout(id);
  }, []);
  return null;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <CartProvider>
      <BrowserRouter future={{ v7_startTransition: true }}>
        <PrechargementCommande />
        {/* Premier affichage direct d'une page chargée à part : fond du site le temps du téléchargement */}
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* L'histoire est désormais une section en bas de la page d'accueil */}
            <Route path="/histoire" element={<Navigate to="/#histoire" replace />} />
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
        </Suspense>
      </BrowserRouter>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
