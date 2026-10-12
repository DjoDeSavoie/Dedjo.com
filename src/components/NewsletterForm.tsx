import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DUREE_CONSERVATION_MENTIONS, EDITEUR, FREQUENCE_NEWSLETTER } from "@/lib/legal";

const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Email invalide",
        description: "Veuillez entrer une adresse email valide.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch("/.netlify/functions/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        // Message lisible renvoyé par la fonction, jamais de détail technique
        let message = "";
        try {
          const data = await res.json();
          if (typeof data?.error === "string") message = data.error;
        } catch {
          // réponse non JSON
        }
        throw new Error(message);
      }

      toast({
        title: "Bienvenue dans la tribu Dedjo !",
        description:
          "Tu fais désormais partie de la newsletter. Ravi de continuer cette aventure avec toi 🌿 (désinscription à tout moment via le lien dans nos emails)",
      });

      setEmail("");
    } catch (err: any) {
      toast({
        title: "Oups…",
        description: err?.message || "Impossible d’inscrire cet email. Réessaie.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <input
          type="email"
          placeholder="Entrez votre email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-newsletter flex-1"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="btn-newsletter disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? "Inscription..." : "S'inscrire"}
        </button>
      </form>
      <p className="mt-3 text-xs text-muted-foreground text-center">
        En t'inscrivant, tu acceptes de recevoir la newsletter Dedjo
        {FREQUENCE_NEWSLETTER && ` (environ ${FREQUENCE_NEWSLETTER} par mois)`}. Désinscription en un clic dans chaque
        e-mail.
        {DUREE_CONSERVATION_MENTIONS && ` Ton adresse est conservée ${DUREE_CONSERVATION_MENTIONS}.`}
        {EDITEUR.email && ` Tes droits : ${EDITEUR.email}.`} En savoir plus :{" "}
        <Link to="/confidentialite" className="underline underline-offset-2 hover:text-foreground">
          politique de confidentialité
        </Link>
        .
      </p>
    </div>
  );
};

export default NewsletterForm;
