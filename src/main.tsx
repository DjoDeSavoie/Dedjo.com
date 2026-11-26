import { createRoot } from "react-dom/client";
// Polices auto-hébergées (aucun appel à Google Fonts)
import "@fontsource/young-serif/400.css"; // nom « Dedjo », titres et noms de produits (une seule graisse)
import "@fontsource/lato/400.css"; // texte courant
import "@fontsource/lato/400-italic.css"; // texte courant en italique
import "@fontsource/lato/700.css"; // boutons, liens, mentions
import "@fontsource-variable/fraunces/opsz-italic.css"; // accroche « L'artisanat chez soi » (italique seulement)
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
