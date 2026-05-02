import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1">
            <h2 className="font-serif text-2xl font-light tracking-[0.2em] text-primary mb-4">LUMIÈRE</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Premium skincare and beauty crafted for every complexion. Science-backed formulas, luxurious results.
            </p>
          </div>

          <div>
            <h3 className="text-xs tracking-widest uppercase text-foreground mb-5">Shop</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/products?category=Skincare" className="hover:text-foreground transition-colors">Skincare</Link></li>
              <li><Link href="/products?category=Hair+Care" className="hover:text-foreground transition-colors">Hair Care</Link></li>
              <li><Link href="/products?category=Body+Care" className="hover:text-foreground transition-colors">Body Care</Link></li>
              <li><Link href="/products?category=Sets+%26+Bundles" className="hover:text-foreground transition-colors">Sets & Bundles</Link></li>
              <li><Link href="/products?sort=newArrivals" className="hover:text-foreground transition-colors">New Arrivals</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs tracking-widest uppercase text-foreground mb-5">Discover</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/quiz" className="hover:text-foreground transition-colors">Skin Quiz</Link></li>
              <li><Link href="/account" className="hover:text-foreground transition-colors">My Account</Link></li>
              <li><Link href="/cart" className="hover:text-foreground transition-colors">Cart</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs tracking-widest uppercase text-foreground mb-5">Stay Connected</h3>
            <p className="text-sm text-muted-foreground mb-4">Get early access to new launches and exclusive offers.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button className="bg-primary text-primary-foreground px-4 py-2 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs tracking-wide">
            &copy; {new Date().getFullYear()} Lumière Beauty. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs">Luxury skincare for every complexion.</p>
        </div>
      </div>
    </footer>
  );
}
