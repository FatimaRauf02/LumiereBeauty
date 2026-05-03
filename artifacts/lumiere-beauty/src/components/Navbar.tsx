import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X, User, Heart, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useLogout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const NAV_LINKS = [
  { label: "Skincare", category: "Skincare" },
  { label: "Hair Care", category: "Hair+Care" },
  { label: "Body Care", category: "Body+Care" },
  { label: "Sets", category: "Sets+%26+Bundles" },
  { label: "Skin Quiz", href: "/quiz" },
];

export default function Navbar() {
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, clearAuth, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const logoutMutation = useLogout();
  const { toast } = useToast();

  const itemCount = cart?.itemCount ?? 0;

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

  const isScrolled = false;

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

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="hidden lg:flex items-center gap-4">
                <Link href="/account" className="text-xs tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors font-sans">
                  {user?.firstName}
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin" className="text-xs tracking-widest uppercase text-primary hover:opacity-80 transition-opacity font-sans">
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors font-sans"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/auth" className="hidden lg:block">
                <User size={18} className="text-muted-foreground hover:text-primary transition-colors" />
              </Link>
            )}

            <Link href="/wishlist" className="hidden lg:block" title="My Wishlist">
              <Heart size={18} className="text-muted-foreground hover:text-primary transition-colors" />
            </Link>

            {user?.role === "admin" && (
              <Link href="/admin" className="hidden lg:block" title="Admin Dashboard">
                <LayoutDashboard size={18} className="text-primary hover:opacity-70 transition-opacity" />
              </Link>
            )}

            <Link href="/cart" className="relative">
              <ShoppingBag size={18} className="text-foreground hover:text-primary transition-colors" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-sans">
                  {itemCount}
                </span>
              )}
            </Link>

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
                    {user?.role === "admin" && (
                      <Link href="/admin" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase text-primary">Admin</Link>
                    )}
                    <button onClick={handleLogout} className="text-sm tracking-widest uppercase text-left text-muted-foreground">Sign Out</button>
                  </>
                ) : (
                  <Link href="/auth" onClick={() => setMobileOpen(false)} className="text-sm tracking-widest uppercase text-foreground">Sign In</Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
