import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X, User, Heart, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useLogout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const NAV_LINKS = [
  { label: "Skincare", href: "/products?category=Skincare" },
  { label: "Hair Care", href: "/products?category=Hair+Care" },
  { label: "Body Care", href: "/products?category=Body+Care" },
  { label: "Sets", href: "/products?category=Sets+%26+Bundles" },
  { label: "Skin Quiz", href: "/quiz" },
];

export default function Navbar() {
  const [, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, clearAuth, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const logoutMutation = useLogout();
  const { toast } = useToast();

  const itemCount = cart?.itemCount ?? 0;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {}
    clearAuth();
    toast({ title: "Signed out", description: "See you soon." });
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="font-serif text-2xl font-light tracking-[0.2em] text-primary hover:opacity-80 transition-opacity">
            LUMIÈRE
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="hidden lg:flex items-center gap-4">
                <Link href="/account" className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
                  {user?.firstName}
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin" className="text-xs tracking-widest uppercase text-primary hover:opacity-80 transition-opacity">
                    Admin
                  </Link>
                )}
                <button onClick={handleLogout} className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/auth" className="hidden lg:block">
                <User size={18} className="text-muted-foreground hover:text-foreground transition-colors" />
              </Link>
            )}

            <Link href="/account#wishlist" className="hidden lg:block">
              <Heart size={18} className="text-muted-foreground hover:text-foreground transition-colors" />
            </Link>

            <Link href="/cart" className="relative">
              <ShoppingBag size={18} className="text-foreground hover:text-primary transition-colors" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-sans">
                  {itemCount}
                </span>
              )}
            </Link>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border bg-background overflow-hidden"
          >
            <nav className="px-6 py-6 flex flex-col gap-5">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-border pt-4 flex flex-col gap-4">
                {isAuthenticated ? (
                  <>
                    <Link href="/account" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase">Account</Link>
                    {user?.role === "admin" && <Link href="/admin" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase text-primary">Admin</Link>}
                    <button onClick={handleLogout} className="text-sm tracking-widest uppercase text-left text-muted-foreground">Sign Out</button>
                  </>
                ) : (
                  <Link href="/auth" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase">Sign In</Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
