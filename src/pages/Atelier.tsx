/* Page privée /atelier : chargée en différé (React.lazy dans App.tsx), pour que son code ne soit pas
   dans le paquet du site. Absente du menu, du pied de page, du plan du site et de robots.txt. */

import { useEffect } from "react";
import AtelierApp from "@/atelier/AtelierApp";

const Atelier = () => {
  // Jamais indexée : balise robots dans la page (netlify.toml ajoute l'en-tête X-Robots-Tag)
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    const titre = document.title;
    document.title = "Atelier · Dedjo";
    return () => {
      meta.remove();
      document.title = titre;
    };
  }, []);

  return <AtelierApp />;
};

export default Atelier;
