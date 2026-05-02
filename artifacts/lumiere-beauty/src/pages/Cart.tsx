import { Link } from "wouter";
import { motion } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

export default function Cart() {
  const { cart, isLoading, updateItem, removeItem } = useCart();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-20 animate-pulse">
        <div className="h-8 bg-card w-48 mb-10" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4 mb-6 border-b border-border pb-6">
            <div className="w-24 h-32 bg-card" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-card w-1/3" />
              <div className="h-3 bg-card w-1/4" />
              <div className="h-6 bg-card w-1/5 mt-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const shipping = cart?.shipping ?? 0;
  const total = cart?.total ?? 0;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-28 pb-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-6" />
        <h1 className="font-serif text-3xl font-light mb-4">Your Bag is Empty</h1>
        <p className="text-muted-foreground font-sans mb-8">Discover our curated collection of luxury skincare.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-10 py-4 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity font-sans"
        >
          Shop Now <ArrowRight size={14} />
        </Link>
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
          {items.map((item, i) => {
            const p = item.product;
            const price = p.salePrice ?? p.price;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-5 py-6 border-b border-border"
              >
                <Link href={`/products/${p.slug}`} className="flex-shrink-0">
                  <img
                    src={(p.images as string[])[0] ?? `https://picsum.photos/seed/${p.slug}/200/250`}
                    alt={p.name}
                    className="w-24 h-32 object-cover bg-card"
                  />
                </Link>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs tracking-widest uppercase text-muted-foreground font-sans">{p.subcategory}</p>
                    <Link href={`/products/${p.slug}`} className="font-serif text-lg hover:text-primary transition-colors">{p.name}</Link>
                    <p className="font-sans text-sm font-medium mt-1">${price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-border">
                      <button
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                        className="px-2.5 py-2 hover:text-primary transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-3 font-sans text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        className="px-2.5 py-2 hover:text-primary transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-sans font-medium">${(price * item.quantity).toFixed(2)}</span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-card-border p-6 sticky top-24">
            <h2 className="font-serif text-xl mb-6">Order Summary</h2>
            <div className="space-y-3 text-sm font-sans">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-400">Free</span> : `$${shipping.toFixed(2)}`}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted-foreground">Free shipping on orders over $50</p>
              )}
              <div className="border-t border-border pt-3 flex justify-between font-medium text-base">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-6 w-full bg-primary text-primary-foreground py-4 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity font-sans flex items-center justify-center gap-2 block text-center"
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
