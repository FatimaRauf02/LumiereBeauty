import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Trash2, Bell, BellOff, Star, ArrowRight, Sparkles } from "lucide-react";
import { useGetWishlist, useRemoveFromWishlist } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function getAuthFetch(token: string | null) {
  return (url: string, options: RequestInit = {}) =>
    fetch(`${BASE}${url}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
}

function getProductImage(product: Product): string {
  const img = (product.images as string[])?.[0];
  if (img && !img.includes("picsum")) return img;
  return `https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=85&fit=crop`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={11} className={s <= Math.round(rating) ? "fill-primary text-primary" : "fill-muted text-muted/30"} />
      ))}
    </div>
  );
}

interface WishlistCardProps {
  product: Product;
  notified: boolean;
  onRemove: (id: number) => void;
  onAddToCart: (product: Product) => void;
  onToggleNotify: (product: Product) => void;
}

function WishlistCard({ product, notified, onRemove, onAddToCart, onToggleNotify }: WishlistCardProps) {
  const price = typeof product.price === "number" ? product.price : parseFloat(String(product.price));
  const salePrice = product.salePrice != null
    ? (typeof product.salePrice === "number" ? product.salePrice : parseFloat(String(product.salePrice)))
    : null;
  const isLowStock = product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.25 }}
      className="group bg-white border border-border rounded-sm shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="block relative overflow-hidden aspect-[3/4]">
        <img
          src={getProductImage(product)}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {product.isBestSeller && (
          <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] tracking-widest uppercase px-2.5 py-1 font-sans shadow-sm">Bestseller</span>
        )}
        {salePrice && (
          <span className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-[10px] tracking-widest uppercase px-2.5 py-1 font-sans">Sale</span>
        )}
        {isLowStock && !isOutOfStock && (
          <div className="absolute bottom-0 left-0 right-0 bg-amber-500/90 text-white text-[10px] tracking-widest uppercase font-sans text-center py-1.5">
            Only {product.stock} left
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs tracking-widest uppercase font-sans bg-black/60 px-3 py-1.5">Out of Stock</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-muted-foreground text-[10px] tracking-widest uppercase font-sans">{product.subcategory}</p>
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-serif text-base text-foreground hover:text-primary transition-colors leading-snug mt-0.5">{product.name}</h3>
          </Link>
          <div className="flex items-center gap-2 mt-1.5">
            <StarRating rating={Number(product.rating)} />
            <span className="text-muted-foreground text-xs font-sans">({product.reviewCount})</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 font-sans">
            {salePrice ? (
              <>
                <span className="text-primary font-semibold">${salePrice.toFixed(2)}</span>
                <span className="text-muted-foreground line-through text-sm">${price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-foreground font-medium">${price.toFixed(2)}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className="w-full bg-primary text-primary-foreground text-xs tracking-widest uppercase py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40 font-sans flex items-center justify-center gap-2"
          >
            <ShoppingBag size={12} />
            {isOutOfStock ? "Out of Stock" : "Move to Cart"}
          </button>

          <div className="flex gap-2">
            {(isLowStock || isOutOfStock) && (
              <button
                onClick={() => onToggleNotify(product)}
                className={`flex-1 text-xs tracking-widest uppercase py-2.5 font-sans flex items-center justify-center gap-1.5 border transition-colors ${
                  notified
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
                title={notified ? "Cancel notification" : "Notify me when restocked"}
              >
                {notified ? <BellOff size={11} /> : <Bell size={11} />}
                {notified ? "Notified" : "Notify Me"}
              </button>
            )}
            <button
              onClick={() => onRemove(product.id)}
              className="flex-1 border border-border text-xs tracking-widest uppercase py-2.5 font-sans flex items-center justify-center gap-1.5 text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
              title="Remove from wishlist"
            >
              <Trash2 size={11} />
              Remove
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Wishlist() {
  const { isAuthenticated, accessToken } = useAuth();
  const [, navigate] = useLocation();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { data: wishlist, isLoading, refetch } = useGetWishlist();
  const removeMutation = useRemoveFromWishlist();
  const [notifiedIds, setNotifiedIds] = useState<Set<number>>(new Set());
  const [notifyLoading, setNotifyLoading] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!accessToken) return;
    getAuthFetch(accessToken).then(f =>
      f("/api/restock-notify")
        .then(r => r.json())
        .then((d: { productIds: number[] }) => setNotifiedIds(new Set(d.productIds)))
        .catch(() => {})
    );
  }, [accessToken]);

  const handleRemove = async (productId: number) => {
    try {
      await removeMutation.mutateAsync({ productId: String(productId) });
      refetch();
      toast({ title: "Removed from wishlist" });
    } catch {
      toast({ title: "Error", description: "Could not remove item", variant: "destructive" });
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (product.stock === 0) {
      toast({ title: "Out of stock", description: "This item is currently unavailable." });
      return;
    }
    try {
      await addToCart(product.id);
      toast({ title: "Added to cart", description: product.name });
    } catch {
      toast({ title: "Error", description: "Could not add to cart", variant: "destructive" });
    }
  };

  const handleToggleNotify = async (product: Product) => {
    if (!accessToken) return;
    const productId = product.id;
    const isNotified = notifiedIds.has(productId);

    setNotifyLoading(prev => new Set(prev).add(productId));
    const f = await getAuthFetch(accessToken);
    try {
      if (isNotified) {
        await f(`/api/restock-notify/${productId}`, { method: "DELETE" });
        setNotifiedIds(prev => { const s = new Set(prev); s.delete(productId); return s; });
        toast({ title: "Notification removed", description: `You won't be notified for ${product.name}.` });
      } else {
        const res = await f("/api/restock-notify", { method: "POST", body: JSON.stringify({ productId }) });
        const data = await res.json();
        setNotifiedIds(prev => new Set(prev).add(productId));
        toast({ title: "Notification set!", description: data.message });
      }
    } catch {
      toast({ title: "Error", description: "Could not update notification", variant: "destructive" });
    } finally {
      setNotifyLoading(prev => { const s = new Set(prev); s.delete(productId); return s; });
    }
  };

  if (!isAuthenticated) return null;

  const items = (wishlist as Product[] | undefined) ?? [];
  const lowStockCount = items.filter(p => p.stock <= 5).length;

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Hero */}
      <section className="bg-gradient-to-br from-accent/20 via-background to-primary/5 border-b border-border py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-2">
              <Heart size={18} className="text-primary fill-primary" />
              <span className="text-xs tracking-widest uppercase text-muted-foreground font-sans">My Collection</span>
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl text-foreground mb-3">Wishlist</h1>
            <p className="text-muted-foreground font-sans text-sm">
              {isLoading ? "Loading..." : items.length === 0 ? "Your wishlist is empty" : `${items.length} saved item${items.length !== 1 ? "s" : ""}`}
              {lowStockCount > 0 && !isLoading && (
                <span className="ml-3 text-amber-600 font-medium">· {lowStockCount} item{lowStockCount !== 1 ? "s" : ""} running low</span>
              )}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-card rounded-sm" />
                <div className="mt-3 space-y-2">
                  <div className="h-3 bg-card rounded w-1/2" />
                  <div className="h-4 bg-card rounded w-3/4" />
                  <div className="h-3 bg-card rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-6">
              <Heart size={28} className="text-primary" />
            </div>
            <h2 className="font-serif text-2xl text-foreground mb-3">Your wishlist is empty</h2>
            <p className="text-muted-foreground font-sans text-sm max-w-sm mb-8">
              Save your favourite products here to revisit them later and get notified when they're back in stock.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs tracking-widest uppercase px-8 py-4 hover:opacity-90 transition-opacity font-sans"
            >
              <Sparkles size={13} />
              Discover Products
              <ArrowRight size={13} />
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Low-stock banner */}
            {lowStockCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 bg-amber-50 border border-amber-200 rounded-sm px-5 py-4 flex items-center gap-3"
              >
                <Bell size={16} className="text-amber-600 flex-shrink-0" />
                <p className="text-amber-800 font-sans text-sm">
                  <span className="font-semibold">{lowStockCount} item{lowStockCount !== 1 ? "s" : ""} in your wishlist {lowStockCount === 1 ? "is" : "are"} running low on stock.</span>
                  {" "}Tap <strong>Notify Me</strong> to get an alert when they're restocked.
                </p>
              </motion.div>
            )}

            <AnimatePresence mode="popLayout">
              <motion.div
                layout
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              >
                {items.map((product) => (
                  <WishlistCard
                    key={product.id}
                    product={product}
                    notified={notifiedIds.has(product.id)}
                    onRemove={handleRemove}
                    onAddToCart={handleAddToCart}
                    onToggleNotify={handleToggleNotify}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-16 text-center border-t border-border pt-12"
            >
              <p className="font-serif text-2xl text-foreground mb-2">Keep Exploring</p>
              <p className="text-muted-foreground font-sans text-sm mb-6">Discover more products crafted for your skin.</p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-xs tracking-widest uppercase font-sans text-primary hover:opacity-70 transition-opacity border-b border-primary pb-0.5"
              >
                Shop All Products <ArrowRight size={12} />
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
