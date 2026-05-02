import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X, CheckCircle } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const { cart, isLoading, updateItem, removeItem } = useCart();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAppliedCoupon(data);
      toast({ title: "Coupon applied!", description: data.label });
    } catch (err: any) {
      toast({ title: "Invalid coupon", description: err.message ?? "Please check your coupon code and try again.", variant: "destructive" });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-20 animate-pulse">
        <div className="h-8 bg-muted w-48 mb-10 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 mb-6 border-b border-border pb-6">
            <div className="w-24 h-32 bg-muted rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/4" />
              <div className="h-6 bg-muted rounded w-1/5 mt-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const shipping = cart?.shipping ?? 0;
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discount) / 100 : 0;
  const total = Math.max(0, subtotal + shipping - discountAmount);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-28 pb-20 text-center">
        <ShoppingBag size={56} className="mx-auto text-muted-foreground/50 mb-6" />
        <h1 className="font-serif text-3xl font-light mb-4">Your Bag is Empty</h1>
        <p className="text-muted-foreground font-sans mb-8 leading-relaxed">
          Discover our curated collection of luxury skincare and beauty.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-10 py-4 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity font-sans rounded-lg shadow"
        >
          Shop Now <ArrowRight size={14} />
        </Link>
        <p className="mt-6 text-sm text-muted-foreground font-sans">
          Use code <span className="text-primary font-semibold">WELCOME10</span> for 10% off your first order.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2 font-sans">Your Selection</p>
        <h1 className="font-serif text-4xl font-light">Shopping Bag ({cart?.itemCount ?? 0})</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-0">
          <AnimatePresence>
            {items.map((item, i) => {
              const p = item.product;
              const price = p.salePrice ?? p.price;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-5 py-6 border-b border-border"
                >
                  <Link href={`/products/${p.slug}`} className="flex-shrink-0">
                    <img
                      src={(p.images as string[])[0] ?? `https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&q=80&fit=crop`}
                      alt={p.name}
                      className="w-24 h-32 object-cover bg-muted rounded-sm"
                    />
                  </Link>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-sans">{p.subcategory}</p>
                      <Link href={`/products/${p.slug}`} className="font-serif text-lg hover:text-primary transition-colors">{p.name}</Link>
                      <p className="font-sans text-sm font-medium mt-1 text-primary">${price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateItem(item.id, item.quantity - 1)}
                          className="px-3 py-2 hover:text-primary hover:bg-muted transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 font-sans text-sm border-x border-border">{item.quantity}</span>
                        <button
                          onClick={() => updateItem(item.id, item.quantity + 1)}
                          className="px-3 py-2 hover:text-primary hover:bg-muted transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-sans font-semibold">${(price * item.quantity).toFixed(2)}</span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Coupon code section */}
          <div className="pt-6">
            <p className="text-xs tracking-widest uppercase font-sans text-foreground mb-3">Have a coupon?</p>
            {appliedCoupon ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3"
              >
                <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-sans font-medium text-green-700">{appliedCoupon.code}</p>
                  <p className="text-xs text-green-600 font-sans">{appliedCoupon.label} — saving ${discountAmount.toFixed(2)}</p>
                </div>
                <button onClick={removeCoupon} className="text-green-500 hover:text-green-700 transition-colors">
                  <X size={15} />
                </button>
              </motion.div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                    placeholder="Enter coupon code"
                    className="w-full bg-white border border-border pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans rounded-lg tracking-wider"
                  />
                </div>
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-5 py-3 bg-foreground text-background text-xs tracking-widest uppercase font-sans rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40"
                >
                  {couponLoading ? "..." : "Apply"}
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground font-sans mt-2">
              Try: <button className="text-primary hover:underline" onClick={() => { setCouponCode("WELCOME10"); }}>WELCOME10</button>, GLOW10, BEAUTY5, LUMIERE15
            </p>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-border rounded-xl p-6 sticky top-24 shadow-sm">
            <h2 className="font-serif text-xl mb-6">Order Summary</h2>
            <div className="space-y-3 text-sm font-sans">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-600 font-medium">Free</span> : `$${shipping.toFixed(2)}`}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted-foreground">Free shipping on orders over $50</p>
              )}
              {appliedCoupon && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex justify-between text-green-600"
                >
                  <span>Discount ({appliedCoupon.discount}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </motion.div>
              )}
              <div className="border-t border-border pt-3 flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-6 w-full bg-primary text-primary-foreground py-4 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity font-sans flex items-center justify-center gap-2 rounded-lg shadow block text-center"
            >
              Proceed to Checkout <ArrowRight size={14} />
            </Link>
            <Link
              href="/products"
              className="mt-3 block text-center text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors font-sans py-2"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
