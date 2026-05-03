import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useCreateOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Lock } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

interface ShippingForm {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

function PaymentForm({
  total,
  shippingForm,
  onSuccess,
}: {
  total: number;
  shippingForm: ShippingForm;
  onSuccess: (order: any) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { isAuthenticated } = useAuth();
  const createOrderMutation = useCreateOrder();
  const { clearCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [paying, setPaying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in to place an order." });
      navigate("/auth");
      return;
    }
    if (!stripe || !elements) return;

    setPaying(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast({ title: "Payment error", description: submitError.message, variant: "destructive" });
        setPaying(false);
        return;
      }

      const intentRes = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("lumiere_access_token") ?? ""}`,
        },
        body: JSON.stringify({ amount: total }),
      });
      if (!intentRes.ok) {
        const err = await intentRes.json();
        throw new Error(err.message ?? "Failed to initialise payment");
      }
      const { clientSecret } = await intentRes.json();

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: window.location.origin },
        redirect: "if_required",
      });

      if (confirmError) {
        toast({ title: "Payment declined", description: confirmError.message, variant: "destructive" });
        setPaying(false);
        return;
      }

      const order = await createOrderMutation.mutateAsync({ data: { shippingAddress: shippingForm } });
      await clearCart();
      onSuccess(order);
    } catch (err: any) {
      toast({ title: "Order failed", description: err?.message ?? "Please try again", variant: "destructive" });
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-border rounded-lg p-4 bg-background">
        <PaymentElement
          options={{
            layout: "tabs",
            fields: { billingDetails: { name: "auto" } },
          }}
        />
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground font-sans">
        <Lock size={11} />
        Secured by Stripe. Test card: 4242 4242 4242 4242 · any future date · any CVC
      </p>
      <button
        type="submit"
        disabled={!stripe || !elements || paying}
        className="w-full bg-primary text-primary-foreground py-4 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50 font-sans"
      >
        {paying ? "Processing..." : `Pay $${total.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function Checkout() {
  const { cart } = useCart();
  const { isAuthenticated } = useAuth();
  const [completed, setCompleted] = useState<any>(null);
  const [shippingDone, setShippingDone] = useState(false);

  const [form, setForm] = useState<ShippingForm>({
    fullName: "", street: "", city: "", state: "", zip: "", country: "US",
  });

  const update = (field: keyof ShippingForm, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const shipping = cart?.shipping ?? 0;
  const total = cart?.total ?? 0;

  const stripeOptions = {
    mode: "payment" as const,
    amount: Math.round(total * 100),
    currency: "usd",
    appearance: {
      theme: "stripe" as const,
      variables: {
        colorPrimary: "#b08d7a",
        colorBackground: "#faf9f7",
        colorText: "#2c2c2c",
        borderRadius: "8px",
        fontFamily: "inherit",
      },
    },
  };

  if (completed) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-28 pb-20 text-center">
        <CheckCircle size={56} className="mx-auto text-primary mb-6" />
        <h1 className="font-serif text-4xl font-light mb-4">Order Confirmed</h1>
        <p className="text-muted-foreground font-sans mb-2">Thank you for your order!</p>
        <p className="font-sans text-sm mb-8">
          Order <span className="text-primary font-medium">{completed.orderNumber}</span> has been placed successfully.
        </p>
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
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={`/orders/${completed.id}`} className="bg-primary text-primary-foreground px-8 py-3 text-xs tracking-widest uppercase hover:opacity-90 font-sans text-center">
            Track Order
          </Link>
          <Link href="/account" className="border border-border px-8 py-3 text-xs tracking-widest uppercase hover:bg-secondary font-sans transition-colors text-center">
            My Account
          </Link>
          <Link href="/products" className="border border-border px-8 py-3 text-xs tracking-widest uppercase hover:bg-secondary font-sans transition-colors text-center">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

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
        {/* Left: shipping then payment */}
        <div>
          {/* Step 1 – Shipping */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-sans font-semibold ${shippingDone ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground"}`}>1</span>
              <h2 className="font-serif text-2xl font-light">Shipping Address</h2>
            </div>

            {!shippingDone ? (
              <form
                onSubmit={e => { e.preventDefault(); setShippingDone(true); }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs tracking-widest uppercase font-sans block mb-2">Full Name *</label>
                  <input required value={form.fullName} onChange={e => update("fullName", e.target.value)}
                    className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans rounded-lg" />
                </div>
                <div>
                  <label className="text-xs tracking-widest uppercase font-sans block mb-2">Street Address *</label>
                  <input required value={form.street} onChange={e => update("street", e.target.value)}
                    className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs tracking-widest uppercase font-sans block mb-2">City *</label>
                    <input required value={form.city} onChange={e => update("city", e.target.value)}
                      className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans rounded-lg" />
                  </div>
                  <div>
                    <label className="text-xs tracking-widest uppercase font-sans block mb-2">State *</label>
                    <input required value={form.state} onChange={e => update("state", e.target.value)}
                      className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs tracking-widest uppercase font-sans block mb-2">ZIP Code *</label>
                    <input required value={form.zip} onChange={e => update("zip", e.target.value)}
                      className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans rounded-lg" />
                  </div>
                  <div>
                    <label className="text-xs tracking-widest uppercase font-sans block mb-2">Country</label>
                    <input value={form.country} onChange={e => update("country", e.target.value)}
                      className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans rounded-lg" />
                  </div>
                </div>
                <button type="submit"
                  className="w-full bg-foreground text-background py-3.5 text-xs tracking-widest uppercase hover:opacity-85 transition-opacity font-sans rounded-lg">
                  Continue to Payment
                </button>
              </form>
            ) : (
              <div className="bg-card border border-border rounded-lg p-4 flex items-start justify-between">
                <div className="text-sm font-sans text-muted-foreground leading-relaxed">
                  <p className="font-medium text-foreground">{form.fullName}</p>
                  <p>{form.street}</p>
                  <p>{form.city}, {form.state} {form.zip}</p>
                  <p>{form.country}</p>
                </div>
                <button onClick={() => setShippingDone(false)}
                  className="text-xs tracking-widest uppercase text-primary hover:opacity-80 font-sans ml-4 flex-shrink-0">
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Step 2 – Payment */}
          {shippingDone && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-sans font-semibold bg-primary text-primary-foreground">2</span>
                <h2 className="font-serif text-2xl font-light">Payment</h2>
              </div>
              {total > 0 ? (
                <Elements stripe={stripePromise} options={stripeOptions}>
                  <PaymentForm
                    total={total}
                    shippingForm={form}
                    onSuccess={setCompleted}
                  />
                </Elements>
              ) : (
                <p className="text-sm text-muted-foreground font-sans">Loading cart total…</p>
              )}
            </div>
          )}
        </div>

        {/* Right: Order summary */}
        <div>
          <h2 className="font-serif text-2xl font-light mb-6">Order Summary</h2>
          <div className="space-y-4">
            {items.map(item => {
              const p = item.product;
              const price = p.salePrice ?? p.price;
              return (
                <div key={item.id} className="flex gap-4">
                  <div className="relative">
                    <img
                      src={(p.images as string[])[0] ?? `https://picsum.photos/seed/${p.slug}/100/120`}
                      alt={p.name}
                      className="w-16 h-20 object-cover bg-card rounded-sm"
                    />
                    <span className="absolute -top-1.5 -right-1.5 bg-muted text-muted-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-sans">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-sans text-sm font-medium">{p.name}</p>
                    <p className="text-muted-foreground text-xs font-sans">{p.subcategory}</p>
                  </div>
                  <span className="font-sans text-sm">${(Number(price) * item.quantity).toFixed(2)}</span>
                </div>
              );
            })}
            <div className="border-t border-border pt-4 space-y-2 text-sm font-sans">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-500">Free</span> : `$${shipping.toFixed(2)}`}</span>
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
