import { useState } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!email.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "Subscribed!", description: data.message ?? "You are now subscribed to Lumière Beauty." });
      setEmail("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Could not subscribe. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-white border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1">
            <h2 className="font-serif text-2xl font-light tracking-[0.2em] text-primary mb-4">LUMIÈRE</h2>
            <p className="text-muted-foreground text-sm leading-relaxed font-sans">
              Premium skincare and beauty crafted for every complexion. Science-backed formulas, luxurious results.
            </p>
          </div>

          <div>
            <h3 className="text-xs tracking-widest uppercase text-foreground mb-5 font-sans">Shop</h3>
            <ul className="space-y-3 text-sm text-muted-foreground font-sans">
              <li><Link href="/products?category=Skincare" className="hover:text-primary transition-colors">Skincare</Link></li>
              <li><Link href="/products?category=Hair+Care" className="hover:text-primary transition-colors">Hair Care</Link></li>
              <li><Link href="/products?category=Body+Care" className="hover:text-primary transition-colors">Body Care</Link></li>
              <li><Link href="/products?category=Sets+%26+Bundles" className="hover:text-primary transition-colors">Sets & Bundles</Link></li>
              <li><Link href="/products?sort=newArrivals" className="hover:text-primary transition-colors">New Arrivals</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs tracking-widest uppercase text-foreground mb-5 font-sans">Discover</h3>
            <ul className="space-y-3 text-sm text-muted-foreground font-sans">
              <li><Link href="/quiz" className="hover:text-primary transition-colors">Skin Quiz</Link></li>
              <li><Link href="/account" className="hover:text-primary transition-colors">My Account</Link></li>
              <li><Link href="/cart" className="hover:text-primary transition-colors">Cart</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs tracking-widest uppercase text-foreground mb-5 font-sans">Stay Connected</h3>
            <p className="text-sm text-muted-foreground mb-4 font-sans leading-relaxed">
              Get early access to new launches and exclusive offers straight to your inbox.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                placeholder="Your email address"
                className="flex-1 bg-background border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans rounded-lg"
              />
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="bg-primary text-primary-foreground px-4 py-2.5 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity font-sans rounded-lg disabled:opacity-50"
              >
                {loading ? "..." : "Join"}
              </button>
            </div>
            <p className="text-muted-foreground text-xs font-sans mt-3">
              Use code <span className="text-primary font-medium">WELCOME10</span> for 10% off your first order.
            </p>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs tracking-wide font-sans">
            &copy; {new Date().getFullYear()} Lumière Beauty. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs font-sans">Luxury skincare for every complexion.</p>
        </div>
      </div>
    </footer>
  );
}
