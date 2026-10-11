import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
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
  );
};

export default NewsletterForm;
