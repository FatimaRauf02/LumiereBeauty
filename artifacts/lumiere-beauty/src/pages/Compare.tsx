import { Link } from "wouter";
import { motion } from "framer-motion";
import { Star, ShoppingBag, X, ArrowLeft, Check, Minus } from "lucide-react";
import { useCompare } from "@/hooks/use-compare";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
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

function getProductImage(product: Product): string {
  const existing = (product.images as string[])?.[0];
  if (existing && !existing.includes("picsum.photos")) return existing;
  const key = Object.keys(SUBCATEGORY_IMAGES).find(k => k === product.subcategory) ?? "";
  const id = SUBCATEGORY_IMAGES[key] ?? "photo-1540555700478-4be289fbecef";
  return `https://images.unsplash.com/${id}?w=600&q=85&fit=crop&auto=format`;
}

function Cell({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <td className={`px-6 py-5 align-top text-sm font-sans text-foreground border-b border-border ${highlight ? "bg-accent/10" : ""}`}>
      {children}
    </td>
  );
}

function LabelCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-6 py-5 align-middle text-[11px] tracking-[0.2em] uppercase font-sans text-muted-foreground font-medium bg-muted/30 border-b border-border w-36 whitespace-nowrap">
      {children}
    </td>
  );
}

export default function Compare() {
  const { items, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product.id, 1);
      toast({ title: "Added to cart", description: product.name });
    } catch {
      toast({ title: "Error", description: "Could not add to cart", variant: "destructive" });
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
          <Star size={24} className="text-primary/40" />
        </div>
        <div>
          <h2 className="font-serif text-2xl text-foreground mb-2">Nothing to Compare</h2>
          <p className="text-muted-foreground text-sm font-sans">
            Browse products and tap the compare icon to add up to 3 items.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs tracking-widest uppercase px-8 py-3.5 hover:opacity-90 transition-opacity font-sans"
        >
          <ArrowLeft size={12} /> Browse Products
        </Link>
      </div>
    );
  }

  const prices = items.map(p =>
    p.salePrice != null ? parseFloat(String(p.salePrice)) : parseFloat(String(p.price))
  );
  const ratings = items.map(p => parseFloat(String(p.rating)));
  const minPrice = Math.min(...prices);
  const maxRating = Math.max(...ratings);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16 pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between mb-12"
      >
        <div>
          <p className="text-[11px] tracking-[0.35em] uppercase text-primary mb-2 font-sans">Side by Side</p>
          <h1 className="font-serif text-4xl font-light text-foreground">Compare Products</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={clearCompare}
            className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors font-sans"
          >
            Clear All
          </button>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors font-sans"
          >
            <ArrowLeft size={12} /> Back
          </Link>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="overflow-x-auto rounded-sm border border-border shadow-sm"
      >
        <table className="w-full border-collapse min-w-[600px]">
          <colgroup>
            <col className="w-36" />
            {items.map(p => <col key={p.id} />)}
          </colgroup>

          <tbody>
            {/* Product images + name */}
            <tr>
              <td className="bg-muted/30 border-b border-border" />
              {items.map(p => {
                const price = parseFloat(String(p.price));
                const salePrice = p.salePrice != null ? parseFloat(String(p.salePrice)) : null;
                const displayPrice = salePrice ?? price;
                return (
                  <td key={p.id} className="px-6 py-8 align-top border-b border-r border-border last:border-r-0">
                    <div className="relative">
                      <button
                        onClick={() => removeFromCompare(p.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-colors"
                      >
                        <X size={11} />
                      </button>
                      <Link href={`/products/${p.slug}`}>
                        <img
                          src={getProductImage(p)}
                          alt={p.name}
                          className="w-full aspect-[3/4] object-cover rounded-sm mb-4 hover:opacity-90 transition-opacity"
                        />
                      </Link>
                      <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-sans mb-1">{p.subcategory}</p>
                      <h3 className="font-serif text-lg text-foreground leading-snug mb-2">{p.name}</h3>
                      <div className="flex items-center gap-1.5 mb-3">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={11} className={s <= Math.round(parseFloat(String(p.rating))) ? "fill-primary text-primary" : "fill-muted text-muted-foreground/30"} />
                        ))}
                        <span className="text-xs text-muted-foreground font-sans">({p.reviewCount})</span>
                      </div>
                      <div className="flex items-center gap-2 mb-4 font-sans">
                        <span className={`font-semibold ${displayPrice === minPrice ? "text-primary" : "text-foreground"}`}>
                          ${displayPrice.toFixed(2)}
                        </span>
                        {salePrice && <span className="text-muted-foreground line-through text-sm">${price.toFixed(2)}</span>}
                        {displayPrice === minPrice && items.length > 1 && (
                          <span className="text-[9px] tracking-widest uppercase bg-primary/10 text-primary px-1.5 py-0.5 font-sans">Best Value</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="w-full bg-primary text-primary-foreground text-[10px] tracking-widest uppercase py-3 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity font-sans"
                      >
                        <ShoppingBag size={12} /> Add to Cart
                      </button>
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Rating row */}
            <tr>
              <LabelCell>Rating</LabelCell>
              {items.map(p => {
                const rating = parseFloat(String(p.rating));
                const isTop = rating === maxRating && items.length > 1;
                return (
                  <Cell key={p.id} highlight={isTop}>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={12} className={s <= Math.round(rating) ? "fill-primary text-primary" : "fill-muted text-muted-foreground/30"} />
                        ))}
                      </div>
                      <span className="text-muted-foreground text-xs">{rating.toFixed(1)}</span>
                      {isTop && <span className="text-[9px] tracking-widest uppercase text-primary font-sans">Top Rated</span>}
                    </div>
                  </Cell>
                );
              })}
            </tr>

            {/* Reviews */}
            <tr>
              <LabelCell>Reviews</LabelCell>
              {items.map(p => (
                <Cell key={p.id}>
                  <span className="text-muted-foreground">{p.reviewCount ?? 0} reviews</span>
                </Cell>
              ))}
            </tr>

            {/* Category */}
            <tr>
              <LabelCell>Category</LabelCell>
              {items.map(p => (
                <Cell key={p.id}>{p.category ?? "—"}</Cell>
              ))}
            </tr>

            {/* Subcategory */}
            <tr>
              <LabelCell>Type</LabelCell>
              {items.map(p => (
                <Cell key={p.id}>{p.subcategory ?? "—"}</Cell>
              ))}
            </tr>

            {/* Badges */}
            <tr>
              <LabelCell>Badges</LabelCell>
              {items.map(p => (
                <Cell key={p.id}>
                  <div className="flex flex-wrap gap-1.5">
                    {p.isBestSeller && (
                      <span className="inline-flex items-center gap-1 text-[9px] tracking-widest uppercase bg-primary/10 text-primary px-2 py-0.5 font-sans">
                        <Check size={9} /> Bestseller
                      </span>
                    )}
                    {p.isNewArrival && (
                      <span className="inline-flex items-center gap-1 text-[9px] tracking-widest uppercase bg-accent/30 text-foreground px-2 py-0.5 font-sans">
                        New
                      </span>
                    )}
                    {p.isFeatured && (
                      <span className="inline-flex items-center gap-1 text-[9px] tracking-widest uppercase bg-muted text-muted-foreground px-2 py-0.5 font-sans">
                        Featured
                      </span>
                    )}
                    {!p.isBestSeller && !p.isNewArrival && !p.isFeatured && (
                      <Minus size={12} className="text-muted-foreground/40" />
                    )}
                  </div>
                </Cell>
              ))}
            </tr>

            {/* Description */}
            <tr>
              <LabelCell>Description</LabelCell>
              {items.map(p => (
                <Cell key={p.id}>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{p.description ?? "—"}</p>
                </Cell>
              ))}
            </tr>

            {/* Ingredients */}
            <tr>
              <LabelCell>Ingredients</LabelCell>
              {items.map(p => (
                <Cell key={p.id}>
                  {p.ingredients ? (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-5">{p.ingredients}</p>
                  ) : (
                    <Minus size={12} className="text-muted-foreground/40" />
                  )}
                </Cell>
              ))}
            </tr>
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
