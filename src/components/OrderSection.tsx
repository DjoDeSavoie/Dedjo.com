import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Phone } from "lucide-react";

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
      toast.error("Please fill in all fields");
      return;
    }

    toast.success("Reservation submitted! We'll contact you shortly to confirm.");
    setFormData({ name: "", phone: "", numberOfPeople: "", orderType: "in-place" });
  };

  return (
    <section id="order" className="py-20 px-6 bg-pink/20">
      <div className="container max-w-4xl">
        <span className="text-5xl mb-4 block text-center">📞</span>
        <h2 className="section-title">Order & Reservations</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Ready to taste our delicious creations? Contact us or book your pizza experience!
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="bg-card rounded-2xl p-8 shadow-soft">
            <h3 className="font-display text-2xl font-semibold mb-6 flex items-center gap-3">
              <Phone className="w-6 h-6 text-primary" />
              Contact Us
            </h3>
            <p className="text-muted-foreground mb-4">
              For orders and inquiries, give us a call:
            </p>
            <a 
              href="tel:+33600000000" 
              className="text-2xl font-display font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              06 00 00 00 00
            </a>
            <p className="text-sm text-muted-foreground mt-4">
              We're available during opening hours to take your orders for sweet products and salty pastries.
            </p>
          </div>

          {/* Pizza Booking Form */}
          <div className="bg-card rounded-2xl p-8 shadow-soft">
            <h3 className="font-display text-2xl font-semibold mb-6">🍕 Book Your Pizzas</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Your Name</Label>
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
                <Label htmlFor="phone">Phone Number</Label>
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
                <Label htmlFor="numberOfPeople">Number of People</Label>
                <Input
                  id="numberOfPeople"
                  type="number"
                  min="1"
                  max="50"
                  placeholder="4"
                  value={formData.numberOfPeople}
                  onChange={(e) => setFormData({ ...formData, numberOfPeople: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="mb-3 block">Order Type</Label>
                <RadioGroup
                  value={formData.orderType}
                  onValueChange={(value) => setFormData({ ...formData, orderType: value })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="in-place" id="in-place" />
                    <Label htmlFor="in-place" className="cursor-pointer">In Place</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="carry-out" id="carry-out" />
                    <Label htmlFor="carry-out" className="cursor-pointer">Carry Out</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button type="submit" className="w-full mt-4">
                Submit Reservation
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderSection;
