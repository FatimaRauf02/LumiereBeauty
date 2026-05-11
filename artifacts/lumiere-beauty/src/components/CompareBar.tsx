import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, BarChart2 } from "lucide-react";
import { Link } from "wouter";
import { useCompare } from "@/hooks/use-compare";
import type { Product } from "@workspace/api-client-react";

const SUBCATEGORY_IMAGES: Record<string, string> = {
  "Moisturizers": "photo-1556228720-195a672e8a03",
  "Serums": "photo-1620916566398-39f1143ab7be",
  "Face Masks": "photo-1570172619644-dfd03ed5d881",
  "Cleansers": "photo-1576426863848-c21f53c60b19",
  "Toners": "photo-1601049676869-702ea24cfd58",
  "Eye Cream": "photo-1571781926291-c477ebfd024b",
  "SPF": "photo-1598440947619-2c35fc9aa908",
  "Shampoo": "photo-1527799820374-dcf8d9d4a388",
  "Body Lotions": "photo-1571781926291-c477ebfd024b",
  "Sets & Bundles": "photo-1540555700478-4be289fbecef",
};

function getThumb(product: Product): string {
  const existing = (product.images as string[])?.[0];
  if (existing && !existing.includes("picsum.photos")) return existing;
  const key = Object.keys(SUBCATEGORY_IMAGES).find(k => k === product.subcategory) ?? "";
  const id = SUBCATEGORY_IMAGES[key] ?? "photo-1540555700478-4be289fbecef";
  return `https://images.unsplash.com/${id}?w=120&q=80&fit=crop&auto=format`;
}

function EmptySlot({ index }: { index: number }) {
  return (
    <div className="flex flex-col items-center justify-center w-16 h-16 rounded border-2 border-dashed border-white/30 text-white/40 text-[10px] font-sans tracking-wide select-none">
      <span className="text-lg leading-none mb-0.5">+</span>
      <span>Slot {index}</span>
    </div>
  );
}

export default function CompareBar() {
  const { items, removeFromCompare, clearCompare } = useCompare();

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed bottom-0 inset-x-0 z-40 pointer-events-none"
        >
          <div className="max-w-4xl mx-auto px-4 pb-4 pointer-events-auto">
            <div className="bg-foreground text-primary-foreground rounded-xl shadow-2xl px-5 py-3.5 flex items-center gap-4">

              {/* Icon + label */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <BarChart2 size={16} className="text-primary-foreground/70" />
                <span className="text-xs tracking-widest uppercase font-sans text-primary-foreground/70">
                  Compare
                </span>
              </div>

              <div className="h-8 w-px bg-white/20 hidden sm:block shrink-0" />

              {/* Product slots */}
              <div className="flex items-center gap-3 flex-1">
                {Array.from({ length: 3 }).map((_, i) => {
                  const p = items[i];
                  if (!p) return <EmptySlot key={i} index={i + 1} />;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="relative group"
                    >
                      <img
                        src={getThumb(p)}
                        alt={p.name}
                        className="w-16 h-16 rounded object-cover border-2 border-white/20"
                      />
                      <button
                        onClick={() => removeFromCompare(p.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      >
                        <X size={10} />
                      </button>
                      <p className="text-[9px] text-white/60 font-sans mt-1 text-center leading-tight line-clamp-1 w-16">
                        {p.name}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={clearCompare}
                  className="text-[10px] tracking-widest uppercase font-sans text-white/50 hover:text-white transition-colors px-2 py-1"
                >
                  Clear
                </button>
                {items.length >= 2 ? (
                  <Link href="/compare">
                    <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-[10px] tracking-widest uppercase font-sans px-4 py-2.5 rounded hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap">
                      Compare {items.length} <ArrowRight size={11} />
                    </span>
                  </Link>
                ) : (
                  <span className="text-[10px] tracking-widest uppercase font-sans text-white/40 px-4 py-2.5">
                    Add {2 - items.length} more
                  </span>
                )}
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}