import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Check, Tag, ArrowRight, Layers } from "lucide-react";
import { Link } from "wouter";
import { useGetProducts, useGetCategories } from "@workspace/api-client-react";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@workspace/api-client-react";

const BUNDLE_DISCOUNT = 15;
const MIN_ITEMS = 3;
const MAX_ITEMS = 5;

const SUBCATEGORY_IMAGES: Record<string, string[]> = {
  "Moisturizers": ["photo-1556228720-195a672e8a03"],
  "Serums": ["photo-1620916566398-39f1143ab7be"],
  "Face Masks": ["photo-1570172619644-dfd03ed5d881"],
  "Scrubs": ["photo-1608248543803-ba4f8c70ae0b"],
  "Toners": ["photo-1601049676869-702ea24cfd58"],
  "Eye Cream": ["photo-1571781926291-c477ebfd024b"],
  "SPF": ["photo-1598440947619-2c35fc9aa908"],
  "Cleansers": ["photo-1576426863848-c21f53c60b19"],
  "Shampoo": ["photo-1527799820374-dcf8d9d4a388"],
  "Conditioner": ["photo-1618354691438-25bc04584c23"],
  "Hair Masks": ["photo-1583195764036-6dc248ac07d9"],
  "Hair Oils": ["photo-1526758097130-bab247274f58"],
  "Body Lotions": ["photo-1571781926291-c477ebfd024b"],
  "Body Scrubs": ["photo-1608248543803-ba4f8c70ae0b"],
  "Body Oils": ["photo-1526758097130-bab247274f58"],
  "Body Wash": ["photo-1576426863848-c21f53c60b19"],
  "Hand Cream": ["photo-1556228720-195a672e8a03"],
  "Sets & Bundles": ["photo-1540555700478-4be289fbecef"],
};

function getProductImage(product: Product): string {
  const existing = (product.images as string[])?.[0];
  if (existing && !existing.includes("picsum.photos")) return existing;
  let hash = 0;
  for (let i = 0; i < (product.slug ?? "").length; i++) {
    hash = ((hash << 5) - hash + (product.slug ?? "").charCodeAt(i)) | 0;
  }
  const pool = SUBCATEGORY_IMAGES[product.subcategory ?? ""] ?? ["photo-1540555700478-4be289fbecef"];
  return `https://images.unsplash.com/${pool[Math.abs(hash) % pool.length]}?w=500&q=80&fit=crop&auto=format`;
}

function BundleProductCard({
  product,
  selected,
  onToggle,
  disabled,
}: {
  product: Product;
  selected: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const price = typeof product.price === "number" ? product.price : parseFloat(String(product.price));
  const salePrice = product.salePrice != null ? parseFloat(String(product.salePrice)) : null;
  const displayPrice = salePrice ?? price;

  return (
    <motion.button
      layout
      onClick={onToggle}
      disabled={disabled && !selected}
      whileHover={!disabled || selected ? { y: -4 } : {}}
      transition={{ duration: 0.2 }}
      className={`relative text-left rounded-sm border-2 overflow-hidden transition-all duration-200 ${
        selected
          ? "border-primary shadow-md"
          : disabled
          ? "border-transparent opacity-50 cursor-not-allowed"
          : "border-transparent hover:border-primary/30 cursor-pointer"
      }`}
    >
      {/* Selection checkmark */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow"
          >
            <Check size={12} className="text-primary-foreground" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="aspect-[3/4] overflow-hidden bg-white">
        <img
          src={getProductImage(product)}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-3 bg-background">
        <p className="text-[9px] tracking-widest uppercase text-muted-foreground font-sans mb-0.5">{product.subcategory}</p>
        <p className="font-serif text-sm text-foreground leading-tight line-clamp-2 mb-1">{product.name}</p>
        <div className="flex items-center gap-1.5">
          {salePrice ? (
            <>
              <span className="text-primary font-semibold text-sm font-sans">${salePrice.toFixed(2)}</span>
              <span className="text-muted-foreground line-through text-xs font-sans">${price.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-foreground font-medium text-sm font-sans">${displayPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export default function BundleBuilder() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [adding, setAdding] = useState(false);

  const { data: productsData, isLoading } = useGetProducts({ query: { enabled: true } });
  const { data: categories } = useGetCategories();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const allProducts: Product[] = (productsData as any)?.products ?? [];
  const allCategories = ["All", ...(categories ?? []).map((c: any) => c.name ?? c)];

  const filtered = useMemo(() => {
    if (activeCategory === "All") return allProducts;
    return allProducts.filter(p => p.category === activeCategory);
  }, [allProducts, activeCategory]);

  const selectedProducts = allProducts.filter(p => selectedIds.includes(p.id));
  const isFull = selectedIds.length >= MAX_ITEMS;
  const isReady = selectedIds.length >= MIN_ITEMS;

  const originalTotal = selectedProducts.reduce((sum, p) => {
    const price = typeof p.price === "number" ? p.price : parseFloat(String(p.price));
    const salePrice = p.salePrice != null ? parseFloat(String(p.salePrice)) : null;
    return sum + (salePrice ?? price);
  }, 0);

  const savings = isReady ? parseFloat(((originalTotal * BUNDLE_DISCOUNT) / 100).toFixed(2)) : 0;
  const bundleTotal = originalTotal - savings;

  const toggle = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : isFull ? prev : [...prev, id]
    );
  };

  const handleAddBundle = async () => {
    if (!isReady) return;
    setAdding(true);
    try {
      for (const product of selectedProducts) {
        await addToCart(product.id, 1);
      }
      toast({
        title: `Bundle added! (${selectedProducts.length} items)`,
        description: `Apply code LUMIERE15 at checkout to save ${BUNDLE_DISCOUNT}% — $${savings.toFixed(2)} off.`,
      });
      setSelectedIds([]);
    } catch {
      toast({ title: "Error adding bundle", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-28 pb-40">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center">
            <Layers size={16} className="text-primary" />
          </div>
          <p className="text-[11px] tracking-[0.35em] uppercase text-primary font-sans">Personalise Your Routine</p>
        </div>
        <h1 className="font-serif text-5xl font-light text-foreground mb-4">Build Your Bundle</h1>
        <p className="text-muted-foreground font-sans text-sm max-w-lg leading-relaxed">
          Pick {MIN_ITEMS}–{MAX_ITEMS} products and save {BUNDLE_DISCOUNT}% automatically. Apply code <span className="text-primary font-medium">LUMIERE15</span> at checkout.
        </p>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8 p-4 bg-accent/10 rounded-xl border border-accent/30">
        {Array.from({ length: MAX_ITEMS }).map((_, i) => {
          const filled = i < selectedIds.length;
          const active = i === selectedIds.length;
          return (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans font-semibold transition-all ${
                filled ? "bg-primary text-primary-foreground" :
                active ? "bg-primary/20 text-primary border-2 border-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                {filled ? <Check size={13} /> : i + 1}
              </div>
              {i < MAX_ITEMS - 1 && (
                <div className={`h-px w-8 transition-colors ${filled ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
        <span className="ml-2 text-sm font-sans text-muted-foreground">
          {selectedIds.length === 0
            ? `Select at least ${MIN_ITEMS} items`
            : selectedIds.length < MIN_ITEMS
            ? `${MIN_ITEMS - selectedIds.length} more to unlock discount`
            : isFull
            ? "Bundle is full!"
            : `${selectedIds.length} selected — add up to ${MAX_ITEMS - selectedIds.length} more`
          }
        </span>
        {isReady && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-auto inline-flex items-center gap-1.5 bg-primary/10 text-primary text-[10px] tracking-widest uppercase font-sans px-3 py-1.5 rounded-full"
          >
            <Tag size={11} /> {BUNDLE_DISCOUNT}% Off Unlocked
          </motion.span>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-8">
        {allCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-[10px] tracking-widest uppercase font-sans px-4 py-2 rounded-full border transition-all ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-muted rounded-sm" />
              <div className="p-3 space-y-2">
                <div className="h-2 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filtered.map((product) => (
            <BundleProductCard
              key={product.id}
              product={product}
              selected={selectedIds.includes(product.id)}
              onToggle={() => toggle(product.id)}
              disabled={isFull && !selectedIds.includes(product.id)}
            />
          ))}
        </motion.div>
      )}

      {/* Sticky bottom bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed bottom-0 inset-x-0 z-40 pointer-events-none"
          >
            <div className="max-w-4xl mx-auto px-4 pb-4 pointer-events-auto">
              <div className="bg-foreground text-primary-foreground rounded-xl shadow-2xl px-5 py-4 flex items-center gap-5">
                {/* Selected thumbs */}
                <div className="flex items-center gap-2 shrink-0">
                  {selectedProducts.map(p => (
                    <img
                      key={p.id}
                      src={getProductImage(p)}
                      alt={p.name}
                      className="w-10 h-10 rounded object-cover border-2 border-white/20"
                    />
                  ))}
                  {Array.from({ length: MAX_ITEMS - selectedProducts.length }).map((_, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded border-2 border-dashed border-white/20 flex items-center justify-center text-white/30 text-lg"
                    >
                      +
                    </div>
                  ))}
                </div>

                <div className="h-10 w-px bg-white/20 shrink-0" />

                {/* Pricing */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-serif text-xl text-primary-foreground">
                      ${isReady ? bundleTotal.toFixed(2) : originalTotal.toFixed(2)}
                    </span>
                    {isReady && (
                      <>
                        <span className="text-white/40 line-through text-sm font-sans">${originalTotal.toFixed(2)}</span>
                        <span className="text-[10px] tracking-widest uppercase bg-primary/20 text-primary px-2 py-0.5 font-sans rounded">
                          Save ${savings.toFixed(2)}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-white/50 font-sans mt-0.5">
                    {isReady
                      ? `${selectedIds.length} items · use LUMIERE15 at checkout`
                      : `${MIN_ITEMS - selectedIds.length} more item${MIN_ITEMS - selectedIds.length !== 1 ? "s" : ""} to unlock ${BUNDLE_DISCOUNT}% off`
                    }
                  </p>
                </div>

                {/* CTA */}
                <button
                  onClick={handleAddBundle}
                  disabled={!isReady || adding}
                  className={`inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-sans px-5 py-3 rounded shrink-0 transition-all ${
                    isReady
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-white/10 text-white/40 cursor-not-allowed"
                  }`}
                >
                  <ShoppingBag size={12} />
                  {adding ? "Adding..." : "Add Bundle to Cart"}
                  {isReady && <ArrowRight size={11} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
