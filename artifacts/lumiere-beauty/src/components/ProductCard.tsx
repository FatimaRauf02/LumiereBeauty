import { Link } from "wouter";
import { motion } from "framer-motion";
import { Star, ShoppingBag, Heart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useAddToWishlist } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@workspace/api-client-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const wishlistMutation = useAddToWishlist();
  const { toast } = useToast();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await addToCart(product.id);
      toast({ title: "Added to cart", description: product.name });
    } catch {
      toast({ title: "Error", description: "Could not add to cart", variant: "destructive" });
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in to save wishlist items" });
      return;
    }
    try {
      await wishlistMutation.mutateAsync({ data: { productId: product.id } });
      toast({ title: "Saved", description: "Added to wishlist" });
    } catch {
      toast({ title: "Error", description: "Could not save item", variant: "destructive" });
    }
  };

  const price = typeof product.price === 'number' ? product.price : parseFloat(String(product.price));
  const salePrice = product.salePrice != null ? (typeof product.salePrice === 'number' ? product.salePrice : parseFloat(String(product.salePrice))) : null;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link href={`/products/${product.slug}`} className="block group">
        <div className="relative overflow-hidden bg-card border border-card-border aspect-[3/4]">
          <img
            src={(product.images as string[])[0] ?? `https://picsum.photos/seed/${product.slug}/400/500`}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {product.isBestSeller && (
            <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] tracking-widest uppercase px-2 py-1 font-sans">
              Bestseller
            </span>
          )}
          {product.isNewArrival && !product.isBestSeller && (
            <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-[10px] tracking-widest uppercase px-2 py-1 font-sans">
              New
            </span>
          )}
          {salePrice && (
            <span className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-[10px] tracking-widest uppercase px-2 py-1 font-sans">
              Sale
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-1 p-3">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-primary text-primary-foreground text-xs tracking-widest uppercase py-3 hover:opacity-90 transition-opacity font-sans flex items-center justify-center gap-2"
            >
              <ShoppingBag size={14} />
              Add to Cart
            </button>
            <button
              onClick={handleWishlist}
              className="bg-background/80 backdrop-blur-sm border border-border p-3 hover:text-primary transition-colors"
            >
              <Heart size={14} />
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <p className="text-muted-foreground text-xs tracking-widest uppercase">{product.subcategory}</p>
          <h3 className="font-serif text-base text-foreground group-hover:text-primary transition-colors">{product.name}</h3>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  size={10}
                  className={s <= Math.round(Number(product.rating)) ? "fill-primary text-primary" : "fill-muted text-muted"}
                />
              ))}
            </div>
            <span className="text-muted-foreground text-xs font-sans">({product.reviewCount})</span>
          </div>
          <div className="flex items-center gap-2 font-sans">
            {salePrice ? (
              <>
                <span className="text-primary font-medium">${salePrice.toFixed(2)}</span>
                <span className="text-muted-foreground line-through text-sm">${price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-foreground font-medium">${price.toFixed(2)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
