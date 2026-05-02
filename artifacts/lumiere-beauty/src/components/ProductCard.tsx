import { Link, useLocation } from "wouter";
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

const SUBCATEGORY_IMAGES: Record<string, string[]> = {
  "Moisturizers": [
    "photo-1556228720-195a672e8a03",
    "photo-1598440947619-2c35fc9aa908",
    "photo-1571781926291-c477ebfd024b",
  ],
  "Serums": [
    "photo-1620916566398-39f1143ab7be",
    "photo-1559181567-c3190ca9959b",
    "photo-1616683693504-3ea7e9ad6fec",
  ],
  "Face Masks": [
    "photo-1570172619644-dfd03ed5d881",
    "photo-1607748851687-ba9a10438621",
    "photo-1608248543803-ba4f8c70ae0b",
  ],
  "Scrubs": [
    "photo-1608248543803-ba4f8c70ae0b",
    "photo-1556228578-0d85b1a4d571",
  ],
  "Toners": [
    "photo-1601049676869-702ea24cfd58",
    "photo-1556228453-efd6c1ff04f6",
  ],
  "Eye Cream": [
    "photo-1571781926291-c477ebfd024b",
    "photo-1559181567-c3190ca9959b",
  ],
  "SPF": [
    "photo-1598440947619-2c35fc9aa908",
    "photo-1540555700478-4be289fbecef",
  ],
  "Cleansers": [
    "photo-1576426863848-c21f53c60b19",
    "photo-1556228578-0d85b1a4d571",
    "photo-1601049676869-702ea24cfd58",
  ],
  "Shampoo": [
    "photo-1527799820374-dcf8d9d4a388",
    "photo-1618354691438-25bc04584c23",
  ],
  "Conditioner": [
    "photo-1618354691438-25bc04584c23",
    "photo-1527799820374-dcf8d9d4a388",
  ],
  "Hair Masks": [
    "photo-1583195764036-6dc248ac07d9",
    "photo-1618354691438-25bc04584c23",
  ],
  "Hair Oils": [
    "photo-1526758097130-bab247274f58",
    "photo-1618354691438-25bc04584c23",
  ],
  "Scalp Treatments": [
    "photo-1527799820374-dcf8d9d4a388",
    "photo-1616683693504-3ea7e9ad6fec",
  ],
  "Body Lotions": [
    "photo-1571781926291-c477ebfd024b",
    "photo-1580489944761-15a19d654956",
  ],
  "Body Scrubs": [
    "photo-1608248543803-ba4f8c70ae0b",
    "photo-1526758097130-bab247274f58",
  ],
  "Body Oils": [
    "photo-1526758097130-bab247274f58",
    "photo-1571781926291-c477ebfd024b",
  ],
  "Body Wash": [
    "photo-1576426863848-c21f53c60b19",
    "photo-1556228578-0d85b1a4d571",
  ],
  "Hand Cream": [
    "photo-1556228720-195a672e8a03",
    "photo-1571781926291-c477ebfd024b",
  ],
  "Sets & Bundles": [
    "photo-1540555700478-4be289fbecef",
    "photo-1498843053639-170ff2122f35",
    "photo-1583195764036-6dc248ac07d9",
  ],
};

function getProductImage(product: Product): string {
  const existing = (product.images as string[])?.[0];
  if (existing && !existing.includes("picsum.photos")) return existing;

  const pool = SUBCATEGORY_IMAGES[product.subcategory ?? ""] ?? ["photo-1540555700478-4be289fbecef"];
  let hash = 0;
  for (let i = 0; i < (product.slug ?? "").length; i++) {
    hash = ((hash << 5) - hash + (product.slug ?? "").charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % pool.length;
  return `https://images.unsplash.com/${pool[idx]}?w=600&q=85&fit=crop&auto=format`;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const wishlistMutation = useAddToWishlist();
  const { toast } = useToast();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please create an account or sign in to add items to your cart.",
      });
      navigate("/auth");
      return;
    }
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
      toast({ title: "Sign in required", description: "Please sign in to save wishlist items." });
      navigate("/auth");
      return;
    }
    try {
      await wishlistMutation.mutateAsync({ data: { productId: product.id } });
      toast({ title: "Saved", description: "Added to wishlist" });
    } catch {
      toast({ title: "Error", description: "Could not save item", variant: "destructive" });
    }
  };

  const price = typeof product.price === "number" ? product.price : parseFloat(String(product.price));
  const salePrice =
    product.salePrice != null
      ? typeof product.salePrice === "number"
        ? product.salePrice
        : parseFloat(String(product.salePrice))
      : null;

  const imgSrc = getProductImage(product);

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.25 }}>
      <Link href={`/products/${product.slug}`} className="block group">
        <div className="relative overflow-hidden bg-white border border-card-border aspect-[3/4] rounded-sm shadow-sm">
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          {product.isBestSeller && (
            <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] tracking-widest uppercase px-2.5 py-1 font-sans shadow-sm">
              Bestseller
            </span>
          )}
          {product.isNewArrival && !product.isBestSeller && (
            <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-[10px] tracking-widest uppercase px-2.5 py-1 font-sans shadow-sm">
              New
            </span>
          )}
          {salePrice && (
            <span className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-[10px] tracking-widest uppercase px-2.5 py-1 font-sans">
              Sale
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-1 p-3">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-primary text-primary-foreground text-xs tracking-widest uppercase py-3 hover:opacity-90 transition-opacity font-sans flex items-center justify-center gap-2 shadow"
            >
              <ShoppingBag size={13} />
              Add to Cart
            </button>
            <button
              onClick={handleWishlist}
              className="bg-white/90 backdrop-blur-sm border border-border p-3 hover:text-primary transition-colors"
            >
              <Heart size={13} />
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-1 px-0.5">
          <p className="text-muted-foreground text-[10px] tracking-widest uppercase font-sans">{product.subcategory}</p>
          <h3 className="font-serif text-base text-foreground group-hover:text-primary transition-colors leading-snug">{product.name}</h3>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={10}
                  className={s <= Math.round(Number(product.rating)) ? "fill-primary text-primary" : "fill-muted text-muted-foreground/30"}
                />
              ))}
            </div>
            <span className="text-muted-foreground text-xs font-sans">({product.reviewCount})</span>
          </div>
          <div className="flex items-center gap-2 font-sans">
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
      </Link>
    </motion.div>
  );
}
