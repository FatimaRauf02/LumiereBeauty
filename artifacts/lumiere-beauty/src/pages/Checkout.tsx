import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useCreateOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { CheckCircle } from "lucide-react";

interface ShippingForm {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export default function Checkout() {
  const [, navigate] = useLocation();
  const { cart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const createOrderMutation = useCreateOrder();
  const { toast } = useToast();
  const [completed, setCompleted] = useState<any>(null);

  const [form, setForm] = useState<ShippingForm>({
    fullName: "", street: "", city: "", state: "", zip: "", country: "US"
  });

  const update = (field: keyof ShippingForm, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({ title: "Sign in to place an order", description: "Please create an account first" });
      navigate("/auth");
      return;
    }
    try {
      const order = await createOrderMutation.mutateAsync({ data: { shippingAddress: form } });
      await clearCart();
      setCompleted(order);
    } catch (err: any) {
      toast({ title: "Order failed", description: err?.message ?? "Please try again", variant: "destructive" });
    }
  };

  if (completed) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-28 pb-20 text-center">
        <CheckCircle size={56} className="mx-auto text-primary mb-6" />
        <h1 className="font-serif text-4xl font-light mb-4">Order Confirmed</h1>
        <p className="text-muted-foreground font-sans mb-2">Thank you for your order!</p>
        <p className="font-sans text-sm mb-8">Order <span className="text-primary font-medium">{completed.orderNumber}</span> has been placed successfully.</p>
        <div className="bg-card border border-card-border p-6 text-left mb-8 space-y-3">
          <h3 className="font-serif text-lg">Order Summary</h3>
          {(completed.items as any[]).map((item: any) => (
            <div key={item.productId} className="flex justify-between text-sm font-sans">
              <span className="text-muted-foreground">{item.productName} x{item.quantity}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-3 flex justify-between font-sans font-medium">
            <span>Total</span>
            <span>${completed.total?.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <Link href="/account" className="bg-primary text-primary-foreground px-8 py-3 text-xs tracking-widest uppercase hover:opacity-90 font-sans">
            View Orders
          </Link>
          <Link href="/products" className="border border-border px-8 py-3 text-xs tracking-widest uppercase hover:bg-secondary font-sans transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const shipping = cart?.shipping ?? 0;
  const total = cart?.total ?? 0;

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-28 pb-20 text-center">
        <h1 className="font-serif text-3xl font-light mb-4">Your Bag is Empty</h1>
        <Link href="/products" className="text-primary text-xs tracking-widest uppercase font-sans hover:opacity-80">Shop Now</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2 font-sans">Final Step</p>
        <h1 className="font-serif text-4xl font-light">Checkout</h1>
      </div>

      {!isAuthenticated && (
        <div className="bg-card border border-primary/30 p-4 mb-8 flex items-center justify-between">
          <p className="text-sm font-sans text-muted-foreground">Sign in to save your order and earn rewards.</p>
          <Link href="/auth" className="text-xs tracking-widest uppercase text-primary hover:opacity-80 font-sans">Sign In</Link>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Shipping form */}
        <div>
          <h2 className="font-serif text-2xl font-light mb-6">Shipping Address</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs tracking-widest uppercase font-sans block mb-2">Full Name *</label>
              <input
                required value={form.fullName} onChange={e => update("fullName", e.target.value)}
                className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans"
              />
            </div>
            <div>
              <label className="text-xs tracking-widest uppercase font-sans block mb-2">Street Address *</label>
              <input
                required value={form.street} onChange={e => update("street", e.target.value)}
                className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs tracking-widest uppercase font-sans block mb-2">City *</label>
                <input
                  required value={form.city} onChange={e => update("city", e.target.value)}
                  className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                />
              </div>
              <div>
                <label className="text-xs tracking-widest uppercase font-sans block mb-2">State *</label>
                <input
                  required value={form.state} onChange={e => update("state", e.target.value)}
                  className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs tracking-widest uppercase font-sans block mb-2">ZIP Code *</label>
                <input
                  required value={form.zip} onChange={e => update("zip", e.target.value)}
                  className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                />
              </div>
              <div>
                <label className="text-xs tracking-widest uppercase font-sans block mb-2">Country</label>
                <input
                  value={form.country} onChange={e => update("country", e.target.value)}
                  className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                />
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="font-serif text-xl mb-4">Payment</h3>
              <div className="bg-secondary border border-border p-4">
                <p className="text-sm text-muted-foreground font-sans">
                  This is a demo store. No real payment is processed. Click "Place Order" to complete.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="w-full bg-primary text-primary-foreground py-4 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50 font-sans mt-2"
            >
              {createOrderMutation.isPending ? "Placing Order..." : `Place Order — $${total.toFixed(2)}`}
            </button>
          </form>
        </div>

        {/* Order summary */}
        <div>
          <h2 className="font-serif text-2xl font-light mb-6">Order Summary</h2>
          <div className="space-y-4">
            {items.map(item => {
              const p = item.product;
              const price = p.salePrice ?? p.price;
              return (
                <div key={item.id} className="flex gap-4">
                  <div className="relative">
                    <img src={(p.images as string[])[0] ?? `https://picsum.photos/seed/${p.slug}/100/120`} alt={p.name} className="w-16 h-20 object-cover bg-card" />
                    <span className="absolute -top-1.5 -right-1.5 bg-muted text-muted-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-sans">{item.quantity}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-sans text-sm font-medium">{p.name}</p>
                    <p className="text-muted-foreground text-xs font-sans">{p.subcategory}</p>
                  </div>
                  <span className="font-sans text-sm">${(price * item.quantity).toFixed(2)}</span>
                </div>
              );
            })}
            <div className="border-t border-border pt-4 space-y-2 text-sm font-sans">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-400">Free</span> : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-medium text-base border-t border-border pt-2">
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
