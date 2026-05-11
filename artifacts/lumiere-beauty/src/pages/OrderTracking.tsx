import { useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { useGetOrder } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle, Circle, Package, Truck, Home, XCircle, ChevronLeft } from "lucide-react";

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

const STEPS = [
  {
    key: "pending",
    label: "Order Placed",
    description: "We've received your order",
    icon: Package,
  },
  {
    key: "processing",
    label: "Processing",
    description: "Your items are being prepared",
    icon: CheckCircle,
  },
  {
    key: "shipped",
    label: "Shipped",
    description: "On its way to you",
    icon: Truck,
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Enjoy your Lumière products",
    icon: Home,
  },
] as const;

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
};

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) navigate("/auth");
  }, [isAuthenticated]);

  const orderId = parseInt(id ?? "0");
  const { data: order, isLoading, isError } = useGetOrder(orderId, { query: { enabled: !!orderId && isAuthenticated } });

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-28 pb-20">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-card rounded w-48" />
          <div className="h-4 bg-card rounded w-32" />
          <div className="h-48 bg-card rounded" />
          <div className="h-32 bg-card rounded" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-28 pb-20 text-center">
        <XCircle size={48} className="mx-auto text-destructive mb-4" />
        <h1 className="font-serif text-3xl font-light mb-3">Order Not Found</h1>
        <p className="text-muted-foreground font-sans mb-8">We couldn't find this order on your account.</p>
        <Link href="/account" className="bg-primary text-primary-foreground px-8 py-3 text-xs tracking-widest uppercase hover:opacity-90 font-sans">
          My Orders
        </Link>
      </div>
    );
  }

  const status = order.status as OrderStatus;
  const isCancelled = status === "cancelled";
  const currentStep = STATUS_ORDER[status] ?? 0;
  const createdAt = new Date(order.createdAt as string);

  const stepDates = [
    createdAt,
    addDays(createdAt, 1),
    addDays(createdAt, 3),
    addDays(createdAt, 7),
  ];

  const address = order.shippingAddress as {
    fullName?: string; street?: string; city?: string; state?: string; zip?: string; country?: string;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-20">
      {/* Back link */}
      <Link href="/account" className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors font-sans mb-10">
        <ChevronLeft size={14} /> Back to Orders
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2 font-sans">Order Tracking</p>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="font-serif text-4xl font-light">{order.orderNumber}</h1>
            <p className="text-muted-foreground text-sm font-sans mt-1">
              Placed on {fmtDate(createdAt)}
            </p>
          </div>
          <span className={`text-xs tracking-widest uppercase font-sans px-3 py-1.5 rounded-full ${
            status === "delivered" ? "bg-green-100 text-green-700" :
            status === "cancelled" ? "bg-red-100 text-red-600" :
            status === "shipped" ? "bg-blue-100 text-blue-700" :
            "bg-primary/15 text-primary"
          }`}>
            {status}
          </span>
        </div>
      </motion.div>

      {/* Timeline */}
      {isCancelled ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4 mb-10"
        >
          <XCircle size={32} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="font-sans font-medium text-red-700">This order has been cancelled</p>
            <p className="text-sm text-red-500 font-sans mt-0.5">Please contact support if you need assistance.</p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-card-border rounded-xl p-6 mb-8"
        >
          <h2 className="font-serif text-xl font-light mb-6">Shipment Progress</h2>
          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />
            <div
              className="absolute left-5 top-5 w-0.5 bg-primary transition-all duration-700"
              style={{ height: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
            />

            <div className="space-y-0">
              {STEPS.map((step, idx) => {
                const done = idx <= currentStep;
                const active = idx === currentStep;
                const Icon = step.icon;
                const date = stepDates[idx];
                const future = idx > currentStep;

                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + idx * 0.08 }}
                    className="relative flex items-start gap-5 pb-8 last:pb-0"
                  >
                    {/* Node */}
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      done
                        ? active
                          ? "bg-primary ring-4 ring-primary/20 shadow-lg shadow-primary/20"
                          : "bg-primary"
                        : "bg-background border-2 border-border"
                    }`}>
                      {done ? (
                        <Icon size={16} className="text-primary-foreground" />
                      ) : (
                        <Circle size={10} className="text-border" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pt-1.5 flex-1">
                      <div className="flex items-baseline justify-between gap-4">
                        <p className={`font-sans font-medium text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                          {active && (
                            <span className="ml-2 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            </span>
                          )}
                        </p>
                        <p className={`text-xs font-sans flex-shrink-0 ${future ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
                          {future ? `Est. ${fmtDate(date)}` : fmtDate(date)}
                        </p>
                      </div>
                      <p className={`text-xs font-sans mt-0.5 ${done ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Estimated delivery callout */}
          {status !== "delivered" && (
            <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
              <p className="text-xs tracking-widest uppercase font-sans text-muted-foreground">Estimated Delivery</p>
              <p className="font-serif text-lg">{fmtDate(stepDates[3])}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Order items + shipping info */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Items */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card border border-card-border rounded-xl p-5"
        >
          <h3 className="font-serif text-lg font-light mb-4">Items</h3>
          <div className="space-y-3">
            {(order.items as any[]).map((item: any) => (
              <div key={item.productId} className="flex justify-between text-sm font-sans">
                <span className="text-muted-foreground">{item.productName} <span className="text-foreground/50">×{item.quantity}</span></span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-4 pt-4 space-y-1.5 text-sm font-sans">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>{Number(order.shipping) === 0 ? <span className="text-green-500">Free</span> : `$${Number(order.shipping).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-1 border-t border-border">
              <span>Total</span><span>${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* Shipping address */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-card-border rounded-xl p-5"
        >
          <h3 className="font-serif text-lg font-light mb-4">Shipping To</h3>
          <div className="text-sm font-sans text-muted-foreground space-y-1 leading-relaxed">
            {address.fullName && <p className="font-medium text-foreground">{address.fullName}</p>}
            {address.street && <p>{address.street}</p>}
            {(address.city || address.state || address.zip) && (
              <p>{[address.city, address.state, address.zip].filter(Boolean).join(", ")}</p>
            )}
            {address.country && <p>{address.country}</p>}
          </div>

          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs tracking-widest uppercase font-sans text-muted-foreground mb-3">Need Help?</p>
            <Link href="/account" className="text-xs tracking-widest uppercase text-primary hover:opacity-80 font-sans transition-opacity">
              Contact Support →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
