import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LayoutDashboard, Heart, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useLogout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const NAV_LINKS = [
  { label: "Skincare", category: "Skincare" },
  { label: "Hair Care", category: "Hair+Care" },
  { label: "Body Care", category: "Body+Care" },
  { label: "Sets", category: "Sets+%26+Bundles" },
  { label: "Build a Bundle", href: "/bundle" },
  { label: "Skin Quiz", href: "/quiz" },
];

export default function Navbar() {
  const [, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, clearAuth, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const logoutMutation = useLogout();
  const { toast } = useToast();

  const cartCount = cart?.itemCount ?? 0;

  const handleLogout = async () => {
    try { await logoutMutation.mutateAsync(); } catch {}
    clearAuth();
    toast({ title: "Signed out", description: "See you soon." });
    navigate("/");
  };

  const handleNavClick = (link: typeof NAV_LINKS[0]) => {
    setMobileOpen(false);
    if (link.href) {
      navigate(link.href);
    } else {
      navigate(`/products?category=${link.category}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-serif text-2xl font-light tracking-[0.2em] text-primary hover:opacity-80 transition-opacity">
            LUMIÈRE
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link)}
                className="text-xs tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors font-sans cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="hidden lg:flex items-center gap-3">
                {/* Wishlist */}
                <Link href="/wishlist" title="Wishlist" className="p-1.5 text-muted-foreground hover:text-primary transition-colors relative">
                  <Heart size={18} />
                </Link>

                {/* Cart */}
                <Link href="/cart" title="Shopping Bag" className="p-1.5 text-muted-foreground hover:text-primary transition-colors relative">
                  <ShoppingBag size={18} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-sans font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </Link>

                <div className="w-px h-4 bg-border" />

                <Link href="/account" className="text-xs tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors font-sans">
                  {user?.firstName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors font-sans"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <Link href="/cart" title="Shopping Bag" className="p-1.5 text-muted-foreground hover:text-primary transition-colors relative">
                  <ShoppingBag size={18} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-sans font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </Link>
                <Link href="/auth">
                  <User size={18} className="text-muted-foreground hover:text-primary transition-colors" />
                </Link>
              </div>
            )}

            {user?.role === "admin" && (
              <Link href="/admin" className="hidden lg:block" title="Admin Dashboard">
                <LayoutDashboard size={18} className="text-primary hover:opacity-70 transition-opacity" />
              </Link>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-1">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border bg-background overflow-hidden"
          >
            <nav className="px-6 py-6 flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link)}
                  className="text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors font-sans text-left"
                >
                  {link.label}
                </button>
              ))}
              <div className="border-t border-border pt-4 flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <Link href="/account" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase text-foreground">Account</Link>
                    <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase text-muted-foreground">Wishlist</Link>
                    <Link href="/cart" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase text-muted-foreground">
                      Bag {cartCount > 0 && `(${cartCount})`}
                    </Link>
                    {user?.role === "admin" && (
                      <Link href="/admin" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase text-primary">Admin Dashboard</Link>
                    )}
                    <button onClick={handleLogout} className="text-sm tracking-widest uppercase text-left text-muted-foreground">Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link href="/cart" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase text-muted-foreground">
                      Bag {cartCount > 0 && `(${cartCount})`}
                    </Link>
                    <Link href="/auth" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase text-foreground">Sign In</Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
