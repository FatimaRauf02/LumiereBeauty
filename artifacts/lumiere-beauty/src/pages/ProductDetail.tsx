import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { Star, ShoppingBag, Heart, Minus, Plus, ChevronDown, Camera, X as XIcon } from "lucide-react";
import {
  useGetProductBySlug, useGetRelatedProducts, useGetReviews, useCreateReview, useAddToWishlist, useRemoveFromWishlist, getGetWishlistQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@workspace/api-client-react";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>("description");
  const [selectedVariant, setSelectedVariant] = useState<{ label: string; price: number } | null>(null);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [hoverStar, setHoverStar] = useState(0);
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { addRecentlyViewed } = useRecentlyViewed();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useGetProductBySlug(slug!);

  useEffect(() => {
    if (product) {
      const v = (product as any).variants as { label: string; price: number }[] | undefined;
      if (v && v.length > 0) {
        const mid = Math.floor(v.length / 2);
        setSelectedVariant(v[mid]);
      } else {
        setSelectedVariant(null);
      }
    }
  }, [product?.id]);

  const wishlistData = queryClient.getQueryData<Product[]>(getGetWishlistQueryKey());
  const isInWishlist = wishlistData?.some((p) => p.id === product?.id) ?? false;

  useEffect(() => {
    if (product) addRecentlyViewed(product as any);
  }, [product?.id]);

  const { data: related } = useGetRelatedProducts(String(product?.id ?? ""), { query: { enabled: !!product?.id } });
  const { data: reviews, refetch: refetchReviews } = useGetReviews(String(product?.id ?? ""), { query: { enabled: !!product?.id } });
  const createReviewMutation = useCreateReview();
  const wishlistMutation = useAddToWishlist();

  const handleAddToCart = async () => {
    if (!product) return;
    const variants = (product as any).variants as { label: string; price: number }[] | undefined;
    if (variants && variants.length > 0 && !selectedVariant) {
      toast({ title: "Please select a size", variant: "destructive" });
      return;
    }
    try {
      await addToCart(product.id, quantity, selectedVariant?.label);
      const variantSuffix = selectedVariant ? ` — ${selectedVariant.label}` : "";
      toast({ title: "Added to cart", description: `${quantity}x ${product.name}${variantSuffix}` });
    } catch {
      toast({ title: "Error", description: "Could not add to cart", variant: "destructive" });
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast({ title: "Sign in required" }); return; }
    if (!product) return;
    try {
      await wishlistMutation.mutateAsync({ data: { productId: product.id } });
      toast({ title: "Saved to wishlist" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const resizeImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 600;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.72));
        };
        img.onerror = reject;
        img.src = e.target!.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - reviewPhotos.length);
    const resized = await Promise.all(files.map(resizeImage));
    setReviewPhotos(prev => [...prev, ...resized].slice(0, 3));
    e.target.value = "";
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast({ title: "Sign in to submit a review" }); return; }
    if (!product) return;
    try {
      await createReviewMutation.mutateAsync({
        productId: String(product.id),
        data: { rating: reviewRating, title: reviewTitle, body: reviewBody, photos: reviewPhotos } as any,
      });
      toast({ title: "Review submitted" });
      setReviewBody(""); setReviewTitle(""); setReviewRating(5); setReviewPhotos([]);
      refetchReviews();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 pt-28 pb-20">
        <div className="grid md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-card" />
          <div className="space-y-4">
            <div className="h-4 bg-card w-1/3" />
            <div className="h-8 bg-card w-2/3" />
            <div className="h-6 bg-card w-1/4" />
            <div className="h-24 bg-card w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="max-w-7xl mx-auto px-4 pt-28 text-center"><p className="font-serif text-2xl">Product not found</p></div>;

  const images = (product.images as string[]).length > 0 ? product.images as string[] : [`https://picsum.photos/seed/${product.slug}/600/700`];
  const price = typeof product.price === 'number' ? product.price : parseFloat(String(product.price));
  const salePrice = product.salePrice != null ? (typeof product.salePrice === 'number' ? product.salePrice : parseFloat(String(product.salePrice))) : null;
  const avgRating = typeof product.rating === 'number' ? product.rating : parseFloat(String(product.rating));
  const productVariants = ((product as any).variants as { label: string; price: number }[] | undefined) ?? [];
  const displayPrice = selectedVariant ? selectedVariant.price : (salePrice ?? price);
  const displayOriginalPrice = selectedVariant && selectedVariant.price !== price
    ? price
    : (!selectedVariant && salePrice ? price : null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-sans text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            className="aspect-square overflow-hidden bg-card"
          >
            <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
          </motion.div>
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 overflow-hidden border-2 transition-colors ${selectedImage === i ? "border-primary" : "border-transparent"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-6">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2 font-sans">{product.subcategory}</p>
            <h1 className="font-serif text-4xl font-light leading-tight">{product.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={14} className={s <= Math.round(avgRating) ? "fill-primary text-primary" : "fill-muted text-muted"} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground font-sans">{avgRating.toFixed(1)} ({product.reviewCount} reviews)</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-serif text-3xl text-primary">${displayPrice.toFixed(2)}</span>
            {displayOriginalPrice && (
              <span className="text-muted-foreground line-through text-lg font-sans">${displayOriginalPrice.toFixed(2)}</span>
            )}
          </div>

          {/* Variant selector */}
          {productVariants.length > 0 && (
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-sans mb-3">
                Size
                {selectedVariant && <span className="text-foreground ml-2 normal-case tracking-normal">{selectedVariant.label}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {productVariants.map((v) => (
                  <button
                    key={v.label}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 text-xs font-sans border transition-all rounded-sm ${
                      selectedVariant?.label === v.label
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/60 hover:text-primary"
                    }`}
                  >
                    {v.label}
                    <span className={`ml-2 ${selectedVariant?.label === v.label ? "opacity-75" : "text-muted-foreground"}`}>
                      ${v.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.stock > 0 ? (
            <p className="text-xs tracking-widest uppercase text-green-400 font-sans">In Stock</p>
          ) : (
            <p className="text-xs tracking-widest uppercase text-destructive font-sans">Out of Stock</p>
          )}

          {/* Quantity & Add to Cart */}
          <div className="flex gap-3">
            <div className="flex items-center border border-border">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-3 hover:text-primary transition-colors"><Minus size={14} /></button>
              <span className="px-4 font-sans text-sm">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="px-3 py-3 hover:text-primary transition-colors"><Plus size={14} /></button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 bg-primary text-primary-foreground text-xs tracking-widest uppercase py-4 hover:opacity-90 transition-opacity disabled:opacity-50 font-sans flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              Add to Cart
            </button>
            <button
              onClick={handleWishlist}
              className={`border p-4 transition-colors ${
                isInWishlist
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:text-primary hover:border-primary/50"
              }`}
            >
              <Heart size={16} className={isInWishlist ? "fill-primary" : ""} />
            </button>
          </div>

          {/* Skin types & concerns */}
          {((product.skinTypes as string[]).length > 0 || (product.concerns as string[]).length > 0) && (
            <div className="space-y-2">
              {(product.skinTypes as string[]).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground font-sans">Skin Type:</span>
                  {(product.skinTypes as string[]).map(st => (
                    <span key={st} className="text-xs bg-secondary px-2 py-1 capitalize font-sans">{st}</span>
                  ))}
                </div>
              )}
              {(product.concerns as string[]).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground font-sans">Targets:</span>
                  {(product.concerns as string[]).map(c => (
                    <span key={c} className="text-xs bg-secondary px-2 py-1 capitalize font-sans">{c}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Accordions */}
          <div className="border-t border-border space-y-0">
            {[
              { key: "description", label: "Description", content: product.description },
              { key: "ingredients", label: "Ingredients", content: product.ingredients },
              { key: "howToUse", label: "How to Use", content: product.howToUse },
            ].filter(s => s.content).map(section => (
              <div key={section.key} className="border-b border-border">
                <button
                  onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="text-xs tracking-widest uppercase font-sans">{section.label}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${expandedSection === section.key ? "rotate-180" : ""}`}
                  />
                </button>
                {expandedSection === section.key && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pb-4 text-sm text-muted-foreground font-sans leading-relaxed"
                  >
                    {section.content}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2 font-sans">What Customers Say</p>
            <h2 className="font-serif text-3xl font-light">Reviews</h2>
          </div>
          <div className="text-right">
            <p className="font-serif text-4xl text-primary">{avgRating.toFixed(1)}</p>
            <div className="flex justify-end mt-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={12} className={s <= Math.round(avgRating) ? "fill-primary text-primary" : "fill-muted text-muted"} />
              ))}
            </div>
            <p className="text-muted-foreground text-xs font-sans mt-1">{product.reviewCount} reviews</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Existing reviews */}
          <div className="space-y-6">
            {(reviews ?? []).slice(0, 5).map(review => (
              <div key={review.id} className="border border-border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-sans text-sm font-medium">{review.reviewerName}</p>
                    {review.skinType && <p className="text-xs text-muted-foreground font-sans capitalize">{review.skinType} skin</p>}
                  </div>
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} className={s <= review.rating ? "fill-primary text-primary" : "fill-muted text-muted"} />
                    ))}
                  </div>
                </div>
                {review.title && <p className="font-serif text-base mb-2">{review.title}</p>}
                <p className="text-sm text-muted-foreground font-sans leading-relaxed">{review.body}</p>
                {((review as any).photos as string[] | undefined)?.length ? (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {((review as any).photos as string[]).map((src: string, i: number) => (
                      <img
                        key={i}
                        src={src}
                        alt={`Review photo ${i + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(src, "_blank")}
                      />
                    ))}
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground font-sans mt-3">
                  {new Date(review.createdAt as string).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
            ))}
            {(!reviews || reviews.length === 0) && (
              <p className="text-muted-foreground font-sans text-sm">No reviews yet. Be the first!</p>
            )}
          </div>

          {/* Write a review */}
          <div>
            <h3 className="font-serif text-xl mb-6">Write a Review</h3>
            {!isAuthenticated ? (
              <div className="border border-border p-6 text-center">
                <p className="text-sm text-muted-foreground font-sans mb-4">Sign in to write a review</p>
                <Link href="/auth" className="text-xs tracking-widest uppercase text-primary hover:opacity-80 transition-opacity font-sans">Sign In</Link>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="text-xs tracking-widest uppercase font-sans block mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button
                        key={s}
                        type="button"
                        onMouseEnter={() => setHoverStar(s)}
                        onMouseLeave={() => setHoverStar(0)}
                        onClick={() => setReviewRating(s)}
                      >
                        <Star size={24} className={s <= (hoverStar || reviewRating) ? "fill-primary text-primary" : "fill-muted text-muted"} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs tracking-widest uppercase font-sans block mb-2">Title</label>
                  <input
                    value={reviewTitle}
                    onChange={e => setReviewTitle(e.target.value)}
                    placeholder="Summarize your experience"
                    className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                  />
                </div>
                <div>
                  <label className="text-xs tracking-widest uppercase font-sans block mb-2">Review</label>
                  <textarea
                    value={reviewBody}
                    onChange={e => setReviewBody(e.target.value)}
                    required
                    rows={4}
                    placeholder="Share your thoughts..."
                    className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans resize-none"
                  />
                </div>

                {/* Photo upload */}
                <div>
                  <label className="text-xs tracking-widest uppercase font-sans block mb-2">Photos (optional, up to 3)</label>
                  <div className="flex flex-wrap gap-3">
                    {reviewPhotos.map((src, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border flex-shrink-0">
                        <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setReviewPhotos(prev => prev.filter((_, j) => j !== i))}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                        >
                          <XIcon size={10} className="text-white" />
                        </button>
                      </div>
                    ))}
                    {reviewPhotos.length < 3 && (
                      <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center cursor-pointer gap-1 flex-shrink-0">
                        <Camera size={18} className="text-muted-foreground" />
                        <span className="text-[9px] tracking-wider uppercase text-muted-foreground font-sans">Add</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handlePhotoAdd}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createReviewMutation.isPending}
                  className="bg-primary text-primary-foreground px-8 py-3 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50 font-sans"
                >
                  {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Related products */}
      {related && related.length > 0 && (
        <section className="mt-24">
          <div className="mb-10">
            <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2 font-sans">You May Also Like</p>
            <h2 className="font-serif text-3xl font-light">Related Products</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
