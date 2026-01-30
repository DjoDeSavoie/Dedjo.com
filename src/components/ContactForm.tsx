import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const categories = [
    { value: "idea", label: "💡 Idée générale" },
    { value: "recipe", label: "🥐 Suggestion de recette" },
    { value: "product", label: "🛒 Gamme de produits" },
    { value: "question", label: "❓ Question" },
    { value: "feedback", label: "💬 Retour d'expérience" },
    { value: "other", label: "✨ Autre" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!formData.name.trim() || formData.name.length > 100) {
    toast({
      title: "Nom invalide",
      description: "Veuillez entrer un nom valide (max 100 caractères).",
      variant: "destructive",
    });
    return;
  }

  if (!formData.email || !formData.email.includes("@") || formData.email.length > 255) {
    toast({
      title: "Email invalide",
      description: "Veuillez entrer une adresse email valide.",
      variant: "destructive",
    });
    return;
  }

  if (!formData.category) {
    toast({
      title: "Catégorie requise",
      description: "Veuillez sélectionner une catégorie.",
      variant: "destructive",
    });
    return;
  }

  if (!formData.message.trim() || formData.message.length > 1000) {
    toast({
      title: "Message invalide",
      description: "Veuillez entrer un message (max 1000 caractères).",
      variant: "destructive",
    });
    return;
  }

  setIsLoading(true);

  try {
    const res = await fetch("/.netlify/functions/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name.trim(),
        email: formData.email.trim(),
        category: formData.category,
        message: formData.message.trim(),
        source: "site dedjo.com",
      }),
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      // si la fonction renvoie du texte non JSON
    }

    if (!res.ok) {
      const details = data?.details || data?.error || text || "Erreur inconnue";
      throw new Error(details);
    }

    toast({
      title: "Message envoyé ! 🌱",
      description: "Merci pour ta contribution.",
    });

    setFormData({ name: "", email: "", category: "", message: "" });
  } catch (err: any) {
    toast({
      title: "Erreur d'envoi",
      description: err?.message || "Impossible d'envoyer le message pour le moment.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-foreground mb-1">
            Votre nom
          </label>
          <input
            id="contact-name"
            type="text"
            placeholder="Jean Dupont"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 rounded-full border-2 border-primary/20 bg-background focus:border-primary focus:outline-none transition-colors"
            disabled={isLoading}
            maxLength={100}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-foreground mb-1">
            Votre email
          </label>
          <input
            id="contact-email"
            type="email"
            placeholder="jean@exemple.fr"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 rounded-full border-2 border-primary/20 bg-background focus:border-primary focus:outline-none transition-colors"
            disabled={isLoading}
            maxLength={255}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-category" className="block text-sm font-medium text-foreground mb-1">
          Type de message
        </label>
        <select
          id="contact-category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-4 py-3 rounded-full border-2 border-primary/20 bg-background focus:border-primary focus:outline-none transition-colors appearance-none cursor-pointer"
          disabled={isLoading}
        >
          <option value="">Choisissez une catégorie...</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-foreground mb-1">
          Votre message
        </label>
        <textarea
          id="contact-message"
          placeholder="Partagez vos idées, suggestions, questions..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 rounded-2xl border-2 border-primary/20 bg-background focus:border-primary focus:outline-none transition-colors resize-none"
          disabled={isLoading}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {formData.message.length}/1000 caractères
        </p>
      </div>

      <button
        type="submit"
        className="w-full btn-newsletter disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading ? "Envoi en cours..." : "Envoyer mon message 🌱"}
      </button>
    </form>
  );
};

export default ContactForm;
