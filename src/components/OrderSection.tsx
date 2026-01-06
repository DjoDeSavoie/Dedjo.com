import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Phone, MapPin } from "lucide-react";

const OrderSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    numberOfPeople: "",
    orderType: "in-place",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim() || !formData.numberOfPeople.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    toast.success("Inscription envoyée ! Nous vous contacterons bientôt pour confirmer.");
    setFormData({ name: "", phone: "", numberOfPeople: "", orderType: "in-place" });
  };

  return (
    <section id="order" className="py-20 px-6 section-orange">
      <div className="container max-w-4xl">
        <span className="text-5xl mb-4 block text-center">📞</span>
        <h2 className="section-title">Commander</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Prêt à goûter nos délicieuses créations ? Contactez-nous ou inscrivez-vous pour nos soirées pizza !
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="bg-card rounded-2xl p-8 shadow-soft">
            <h3 className="font-display text-2xl font-semibold mb-6 flex items-center gap-3">
              <Phone className="w-6 h-6 text-primary" />
              Nous contacter
            </h3>
            <p className="text-muted-foreground mb-4">
              Pour les commandes et renseignements, appelez-nous :
            </p>
            <a 
              href="tel:+33600000000" 
              className="text-2xl font-display font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              06 00 00 00 00
            </a>
            <p className="text-sm text-muted-foreground mt-4">
              Nous sommes disponibles pendant les heures d'ouverture pour prendre vos commandes de viennoiseries et feuilletés salés.
            </p>

            {/* Location */}
            <div className="mt-8 pt-6 border-t border-border">
              <h4 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Notre Pizzeria
              </h4>
              <p className="text-foreground font-medium">Ferme De La Goëttaz</p>
              <p className="text-sm text-muted-foreground mt-1">
                Venez nous rendre visite à notre four à bois et dégustez des pizzas fraîches dans une ambiance familiale chaleureuse.
              </p>
            </div>
          </div>

          {/* Pizza Registration Form */}
          <div className="bg-card rounded-2xl p-8 shadow-soft">
            <h3 className="font-display text-2xl font-semibold mb-2">🍕 Inscription Soirée Pizza</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Je serai là et nous adorerions manger des pizzas !
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Votre nom</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jean Dupont"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1"
                  maxLength={20}
                />
              </div>

              <div>
                <Label htmlFor="numberOfPeople">Je serai là avec</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="numberOfPeople"
                    type="number"
                    min="1"
                    max="50"
                    placeholder="4"
                    value={formData.numberOfPeople}
                    onChange={(e) => setFormData({ ...formData, numberOfPeople: e.target.value })}
                    className="w-20"
                  />
                  <span className="text-muted-foreground">personnes</span>
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Nous aimerions manger</Label>
                <RadioGroup
                  value={formData.orderType}
                  onValueChange={(value) => setFormData({ ...formData, orderType: value })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="in-place" id="in-place" />
                    <Label htmlFor="in-place" className="cursor-pointer">Sur place</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="carry-out" id="carry-out" />
                    <Label htmlFor="carry-out" className="cursor-pointer">À emporter</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button type="submit" className="w-full mt-4">
                S'inscrire pour la soirée pizza
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderSection;
