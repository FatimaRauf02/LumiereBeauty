import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BANNER_KEY = "lumiere_welcome_banner_seen";

export default function WelcomeCouponBanner() {
  const [visible, setVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const seen = localStorage.getItem(BANNER_KEY);
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(BANNER_KEY, "1");
  };

  const copyCode = () => {
    navigator.clipboard.writeText("WELCOME10").catch(() => {});
    toast({ title: "Copied!", description: "WELCOME10 has been copied to your clipboard." });
    dismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-28 left-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-border overflow-hidden"
        >
          {/* Gradient top strip */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />

          <div className="p-5">
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X size={15} />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Gift size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-serif text-base text-foreground">Welcome to Lumière!</p>
                <p className="text-muted-foreground text-xs font-sans mt-0.5 leading-relaxed">
                  Get 10% off your first order as our gift to you.
                </p>
              </div>
            </div>

            <div className="bg-primary/6 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-primary" />
                <span className="font-sans font-bold tracking-[0.2em] text-primary text-sm">WELCOME10</span>
              </div>
              <button
                onClick={copyCode}
                className="text-[10px] tracking-widest uppercase text-primary font-sans hover:opacity-70 transition-opacity font-medium"
              >
                Copy
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyCode}
                className="flex-1 bg-primary text-primary-foreground py-3 text-xs tracking-widest uppercase font-sans rounded-xl hover:opacity-90 transition-opacity shadow"
              >
                Claim 10% Off
              </button>
              <button
                onClick={dismiss}
                className="px-4 py-3 border border-border text-muted-foreground text-xs tracking-widest uppercase font-sans rounded-xl hover:bg-muted transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
