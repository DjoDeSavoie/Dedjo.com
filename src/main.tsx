import { createRoot } from "react-dom/client";
// Polices auto-hébergées (aucun appel à Google Fonts)
import "@fontsource/young-serif/400.css"; // marque « Dedjo »
import "@fontsource-variable/fraunces/opsz.css"; // titres et accroches (400–700, taille optique)
import "@fontsource-variable/fraunces/opsz-italic.css"; // accroches en italique
import "@fontsource-variable/nunito/wght.css"; // texte courant
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
