import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useCreateOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Lock, Tag, X, CreditCard, Shield } from "lucide-react";
import { motion } from "framer-motion";

const VALID_COUPONS: Record<string, { discount: number; label: string }> = {
  WELCOME10: { discount: 10, label: "10% off — Welcome offer" },
  GLOW10: { discount: 10, label: "10% off — Glow promo" },
  BEAUTY5: { discount: 5, label: "5% off — Beauty special" },
  LUMIERE15: { discount: 15, label: "15% off — Lumière exclusive" },
};

interface ShippingForm {
  fullName: string;
  street: string;
  city: string;
  zip: string;
  country: string;
}

interface CardForm {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
}

function formatCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

function getCardType(number: string): string {
  const n = number.replace(/\s/g, "");
  if (n.startsWith("4")) return "VISA";
  if (/^5[1-5]/.test(n)) return "MC";
  if (n.startsWith("34") || n.startsWith("37")) return "AMEX";
  return "";
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
  const { isAuthenticated } = useAuth();
  const createOrderMutation = useCreateOrder();
  const { clearCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [paying, setPaying] = useState(false);
  const [card, setCard] = useState<CardForm>({ number: "", name: "", expiry: "", cvc: "" });
  const [errors, setErrors] = useState<Partial<CardForm>>({});

  const cardType = getCardType(card.number);

  const validate = (): boolean => {
    const e: Partial<CardForm> = {};
    const digits = card.number.replace(/\s/g, "");
    if (digits.length < 13) e.number = "Enter a valid card number";
    if (!card.name.trim()) e.name = "Enter cardholder name";
    const [mm] = card.expiry.split("/");
    if (card.expiry.length < 5 || parseInt(mm) > 12 || parseInt(mm) < 1) e.expiry = "Enter a valid expiry date";
    if (card.cvc.length < 3) e.cvc = "Enter a valid CVC";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in to place an order." });
      navigate("/auth");
      return;
    }
    if (!validate()) return;
    setPaying(true);
    try {
      // Simulate payment processing
      await new Promise(r => setTimeout(r, 1500));
      const order = await createOrderMutation.mutateAsync({ data: { shippingAddress: shippingForm } });
      await clearCart();
      onSuccess(order);
    } catch (err: any) {
      toast({ title: "Order failed", description: err?.message ?? "Please try again", variant: "destructive" });
      setPaying(false);
    }
  };

  const inputClass = (field: keyof CardForm) =>
    `w-full bg-white border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-sans rounded-lg transition-colors ${
      errors[field] ? "border-destructive" : "border-border focus:border-primary/50"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Card preview */}
      <div className="relative h-44 rounded-2xl overflow-hidden shadow-xl"
        style={{ background: "linear-gradient(135deg, #b08d7a 0%, #8b6f5e 50%, #6b4f40 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)" }} />
        <div className="absolute top-5 left-6 right-6 flex justify-between items-start">
          <div>
            <p className="text-white/60 text-[10px] tracking-widest uppercase font-sans">Lumière Beauty</p>
          </div>
          <div className="text-right">
            {cardType && (
              <span className="text-white font-bold text-sm tracking-widest">{cardType}</span>
            )}
          </div>
        </div>
        <div className="absolute bottom-12 left-6">
          <p className="text-white font-mono text-lg tracking-[0.2em]">
            {card.number || "•••• •••• •••• ••••"}
          </p>
        </div>
        <div className="absolute bottom-5 left-6 right-6 flex justify-between">
          <div>
            <p className="text-white/50 text-[9px] uppercase tracking-widest font-sans">Card Holder</p>
            <p className="text-white text-xs font-sans mt-0.5 uppercase tracking-wide">
              {card.name || "Your Name"}
            </p>
          </div>
          <div>
            <p className="text-white/50 text-[9px] uppercase tracking-widest font-sans">Expires</p>
            <p className="text-white text-xs font-sans mt-0.5">{card.expiry || "MM/YY"}</p>
          </div>
        </div>
      </div>

      {/* Card number */}
      <div>
        <label className="text-[11px] tracking-widest uppercase font-sans block mb-2 text-foreground/70">Card Number</label>
        <div className="relative">
          <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={card.number}
            onChange={e => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))}
            placeholder="1234 5678 9012 3456"
            className={`${inputClass("number")} pl-10`}
            maxLength={19}
          />
        </div>
        {errors.number && <p className="text-destructive text-xs font-sans mt-1">{errors.number}</p>}
      </div>

      {/* Cardholder name */}
      <div>
        <label className="text-[11px] tracking-widest uppercase font-sans block mb-2 text-foreground/70">Cardholder Name</label>
        <input
          value={card.name}
          onChange={e => setCard(c => ({ ...c, name: e.target.value }))}
          placeholder="Name on card"
          className={inputClass("name")}
        />
        {errors.name && <p className="text-destructive text-xs font-sans mt-1">{errors.name}</p>}
      </div>

      {/* Expiry + CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] tracking-widest uppercase font-sans block mb-2 text-foreground/70">Expiry Date</label>
          <input
            value={card.expiry}
            onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
            placeholder="MM/YY"
            maxLength={5}
            className={inputClass("expiry")}
          />
          {errors.expiry && <p className="text-destructive text-xs font-sans mt-1">{errors.expiry}</p>}
        </div>
        <div>
          <label className="text-[11px] tracking-widest uppercase font-sans block mb-2 text-foreground/70">CVC</label>
          <input
            value={card.cvc}
            onChange={e => setCard(c => ({ ...c, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
            placeholder="123"
            maxLength={4}
            className={inputClass("cvc")}
          />
          {errors.cvc && <p className="text-destructive text-xs font-sans mt-1">{errors.cvc}</p>}
        </div>
      </div>

      {/* Security badges */}
      <div className="flex items-center gap-4 py-3 border-y border-border">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Lock size={12} />
          <span className="text-[10px] font-sans tracking-wide">256-bit SSL</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Shield size={12} />
          <span className="text-[10px] font-sans tracking-wide">Secure Payment</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CheckCircle size={12} />
          <span className="text-[10px] font-sans tracking-wide">PCI Compliant</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={paying}
        className="w-full bg-primary text-primary-foreground py-4 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-60 font-sans rounded-lg flex items-center justify-center gap-2 shadow-md"
      >
        {paying ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            />
            Processing...
          </>
        ) : (
          <>
            <Lock size={13} />
            Pay ${total.toFixed(2)} Securely
          </>
        )}
      </button>
    </form>
  );
}

export default function Checkout() {
  const { cart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [completed, setCompleted] = useState<any>(null);
  const [shippingDone, setShippingDone] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [form, setForm] = useState<ShippingForm>({
    fullName: "", street: "", city: "", zip: "", country: "",
  });

  const update = (field: keyof ShippingForm, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const match = VALID_COUPONS[couponCode.trim().toUpperCase()];
    if (match) {
      setAppliedCoupon({ code: couponCode.trim().toUpperCase(), ...match });
      toast({ title: "Coupon applied!", description: match.label });
    } else {
      try {
        const res = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: couponCode.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Invalid coupon");
        setAppliedCoupon(data);
        toast({ title: "Coupon applied!", description: data.label });
      } catch (err: any) {
        toast({ title: "Invalid coupon", description: err.message ?? "Please check your code.", variant: "destructive" });
      }
    }
    setCouponLoading(false);
  };

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const shipping = cart?.shipping ?? 0;
  const baseTotal = cart?.total ?? 0;
  const discountAmount = appliedCoupon
    ? parseFloat(((baseTotal * appliedCoupon.discount) / 100).toFixed(2))
    : 0;
  const total = Math.max(0, baseTotal - discountAmount);

  if (completed) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-28 pb-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <CheckCircle size={64} className="mx-auto text-green-500 mb-6" />
        </motion.div>
        <h1 className="font-serif text-4xl font-light mb-4">Order Confirmed!</h1>
        <p className="text-muted-foreground font-sans mb-2">Thank you for your purchase.</p>
        <p className="font-sans text-sm mb-8">
          Order <span className="text-primary font-semibold">{completed.orderNumber}</span> has been placed successfully.
        </p>
        <div className="bg-card border border-card-border p-6 text-left mb-8 space-y-3 rounded-xl">
          <h3 className="font-serif text-lg">Order Summary</h3>
          {(completed.items as any[]).map((item: any) => (
            <div key={item.productId} className="flex justify-between text-sm font-sans">
              <span className="text-muted-foreground">{item.productName} ×{item.quantity}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-3 flex justify-between font-sans font-semibold">
            <span>Total</span>
            <span>${Number(completed.total).toFixed(2)}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={`/orders/${completed.id}`} className="bg-primary text-primary-foreground px-8 py-3 text-xs tracking-widest uppercase hover:opacity-90 font-sans text-center rounded-lg">
            Track Order
          </Link>
          <Link href="/products" className="border border-border px-8 py-3 text-xs tracking-widest uppercase hover:bg-secondary font-sans transition-colors text-center rounded-lg">
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
        <div className="bg-card border border-primary/30 p-4 mb-8 flex items-center justify-between rounded-lg">
          <p className="text-sm font-sans text-muted-foreground">Sign in to save your order history.</p>
          <Link href="/auth" className="text-xs tracking-widest uppercase text-primary hover:opacity-80 font-sans">Sign In</Link>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Left */}
        <div>
          {/* Step 1 — Shipping */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-sans font-bold bg-primary text-primary-foreground">1</span>
              <h2 className="font-serif text-2xl font-light">Shipping Address</h2>
            </div>

            {!shippingDone ? (
              <form onSubmit={e => { e.preventDefault(); setShippingDone(true); }} className="space-y-4">
                {[
                  { field: "fullName", label: "Full Name", required: true },
                  { field: "street", label: "Street Address", required: true },
                  { field: "city", label: "City", required: true },
                ].map(({ field, label, required }) => (
                  <div key={field}>
                    <label className="text-[11px] tracking-widest uppercase font-sans block mb-2 text-foreground/70">{label}{required && " *"}</label>
                    <input
                      required={required}
                      value={(form as any)[field]}
                      onChange={e => update(field as keyof ShippingForm, e.target.value)}
                      className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 font-sans rounded-lg transition-colors"
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] tracking-widest uppercase font-sans block mb-2 text-foreground/70">ZIP Code *</label>
                    <input
                      required
                      value={form.zip}
                      onChange={e => update("zip", e.target.value)}
                      className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-sans rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] tracking-widest uppercase font-sans block mb-2 text-foreground/70">Country</label>
                    <input
                      value={form.country}
                      onChange={e => update("country", e.target.value)}
                      className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-sans rounded-lg"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-foreground text-background py-3.5 text-xs tracking-widest uppercase hover:opacity-85 transition-opacity font-sans rounded-lg"
                >
                  Continue to Payment →
                </button>
              </form>
            ) : (
              <div className="bg-card border border-border rounded-xl p-4 flex items-start justify-between">
                <div className="text-sm font-sans text-muted-foreground leading-relaxed">
                  <p className="font-medium text-foreground mb-1">{form.fullName}</p>
                  <p>{form.street}</p>
                  <p>{form.city} {form.zip}</p>
                  <p>{form.country}</p>
                </div>
                <button onClick={() => setShippingDone(false)} className="text-xs tracking-widest uppercase text-primary hover:opacity-80 font-sans ml-4 flex-shrink-0">
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Step 2 — Payment */}
          {shippingDone && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-sans font-bold bg-primary text-primary-foreground">2</span>
                <h2 className="font-serif text-2xl font-light">Payment Details</h2>
              </div>
              <PaymentForm total={total} shippingForm={form} onSuccess={setCompleted} />
            </motion.div>
          )}
        </div>

        {/* Right — Order Summary */}
        <div>
          <h2 className="font-serif text-2xl font-light mb-6">Order Summary</h2>
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            {items.map(item => {
              const p = item.product;
              const price = p.salePrice ?? p.price;
              return (
                <div key={item.id} className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    <img
                      src={(p.images as string[])[0] ?? `https://picsum.photos/seed/${p.slug}/100/120`}
                      alt={p.name}
                      className="w-16 h-20 object-cover bg-muted rounded-lg"
                    />
                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center font-sans">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-medium leading-snug">{p.name}</p>
                    <p className="text-muted-foreground text-xs font-sans mt-0.5">{p.subcategory}</p>
                  </div>
                  <span className="font-sans text-sm font-medium flex-shrink-0">
                    ${(Number(price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}

            {/* Coupon */}
            <div className="pt-3 border-t border-border">
              <p className="text-[11px] tracking-widest uppercase font-sans text-foreground mb-2">Coupon Code</p>
              {appliedCoupon ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5"
                >
                  <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-sans font-semibold text-green-700">{appliedCoupon.code}</p>
                    <p className="text-[11px] text-green-600 font-sans">{appliedCoupon.label}</p>
                  </div>
                  <button
                    onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                    disabled={shippingDone}
                    className="text-green-500 hover:text-green-700 disabled:opacity-40"
                  >
                    <X size={13} />
                  </button>
                </motion.div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                      placeholder="WELCOME10"
                      disabled={shippingDone}
                      className="w-full bg-background border border-border pl-8 pr-2 py-2.5 text-xs font-sans tracking-wider focus:outline-none focus:ring-1 focus:ring-primary rounded-lg disabled:opacity-50"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim() || shippingDone}
                    className="px-3 py-2 bg-foreground text-background text-[10px] tracking-widest uppercase font-sans rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40"
                  >
                    {couponLoading ? "..." : "Apply"}
                  </button>
                </div>
              )}
              {!appliedCoupon && (
                <p className="text-[10px] text-muted-foreground font-sans mt-1.5">
                  Try: {["WELCOME10", "GLOW10", "LUMIERE15"].map((c, i) => (
                    <span key={c}>
                      <button className="text-primary hover:underline" onClick={() => setCouponCode(c)}>{c}</button>
                      {i < 2 && ", "}
                    </span>
                  ))}
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-4 space-y-2 text-sm font-sans">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-500 font-medium">Free</span> : `$${shipping.toFixed(2)}`}</span>
              </div>
              {appliedCoupon && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-between text-green-600 font-medium"
                >
                  <span>Discount ({appliedCoupon.discount}%)</span>
                  <span>−${discountAmount.toFixed(2)}</span>
                </motion.div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-border pt-3">
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}