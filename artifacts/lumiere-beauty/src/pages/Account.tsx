import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Package, User, MapPin, Heart, Star, Gift, TrendingUp, Users, Copy, Check } from "lucide-react";
import {
  useGetProfile, useGetOrders, useGetAddresses, useGetWishlist,
  useUpdateProfile, useAddAddress, useRemoveFromWishlist, useLogout
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";

const TABS = [
  { key: "orders", label: "Orders", icon: Package },
  { key: "profile", label: "Profile", icon: User },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "wishlist", label: "Wishlist", icon: Heart },
  { key: "loyalty", label: "Rewards", icon: Star },
  { key: "referrals", label: "Refer", icon: Users },
];

function OrdersTab() {
  const { data: orders, isLoading } = useGetOrders();
  if (isLoading) return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-card" />)}</div>;
  if (!orders?.length) return <div className="text-center py-16"><p className="font-serif text-xl text-muted-foreground">No orders yet</p><Link href="/products" className="text-xs tracking-widest uppercase text-primary mt-4 inline-block hover:opacity-80 font-sans">Shop Now</Link></div>;
  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div key={order.id} className="bg-card border border-card-border p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-sans text-sm font-medium">{order.orderNumber}</p>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                {new Date(order.createdAt as string).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs tracking-widest uppercase font-sans px-2 py-1 ${
                order.status === "delivered" ? "bg-green-900/30 text-green-400" :
                order.status === "cancelled" ? "bg-red-900/30 text-red-400" :
                "bg-primary/20 text-primary"
              }`}>{order.status}</span>
              <Link href={`/orders/${order.id}`} className="text-xs tracking-widest uppercase text-primary hover:opacity-75 transition-opacity font-sans whitespace-nowrap">
                Track →
              </Link>
            </div>
          </div>
          <div className="space-y-2">
            {(order.items as any[]).map((item: any) => (
              <div key={item.productId} className="flex justify-between text-sm font-sans text-muted-foreground">
                <span>{item.productName} ×{item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-3 pt-3 flex justify-between font-sans text-sm font-medium">
            <span>Total</span>
            <span>${Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileTab() {
  const { data: profile, isLoading, refetch } = useGetProfile();
  const updateMutation = useUpdateProfile();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", skinType: "" });

  const startEdit = () => {
    if (profile) setForm({ firstName: profile.firstName ?? "", lastName: profile.lastName ?? "", skinType: profile.skinType ?? "" });
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({ data: form });
      await refetch();
      setEditing(false);
      toast({ title: "Profile updated" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-12 bg-card" />)}</div>;

  return (
    <div className="max-w-md">
      {editing ? (
        <form onSubmit={handleSave} className="space-y-4">
          {[["firstName", "First Name"], ["lastName", "Last Name"]].map(([field, label]) => (
            <div key={field}>
              <label className="text-xs tracking-widest uppercase font-sans block mb-2">{label}</label>
              <input
                value={(form as any)[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans"
              />
            </div>
          ))}
          <div>
            <label className="text-xs tracking-widest uppercase font-sans block mb-2">Skin Type</label>
            <select
              value={form.skinType}
              onChange={e => setForm(f => ({ ...f, skinType: e.target.value }))}
              className="w-full bg-background border border-border px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans text-foreground"
            >
              <option value="">Not specified</option>
              {["dry","oily","combination","normal","sensitive"].map(st => (
                <option key={st} value={st} className="capitalize">{st.charAt(0).toUpperCase() + st.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={updateMutation.isPending} className="bg-primary text-primary-foreground px-6 py-2 text-xs tracking-widest uppercase hover:opacity-90 font-sans disabled:opacity-50">Save</button>
            <button type="button" onClick={() => setEditing(false)} className="border border-border px-6 py-2 text-xs tracking-widest uppercase hover:bg-secondary font-sans transition-colors">Cancel</button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {[
            { label: "Email", value: profile?.email },
            { label: "Name", value: `${profile?.firstName} ${profile?.lastName}` },
            { label: "Skin Type", value: profile?.skinType ?? "Not specified" },
            { label: "Member Since", value: profile?.createdAt ? new Date(profile.createdAt as string).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "" },
          ].map(item => (
            <div key={item.label} className="border-b border-border pb-4">
              <p className="text-xs tracking-widest uppercase text-muted-foreground font-sans mb-1">{item.label}</p>
              <p className="font-sans text-sm capitalize">{item.value}</p>
            </div>
          ))}
          <button onClick={startEdit} className="bg-primary text-primary-foreground px-6 py-2 text-xs tracking-widest uppercase hover:opacity-90 font-sans">Edit Profile</button>
        </div>
      )}
    </div>
  );
}

function AddressesTab() {
  const { data: addresses, isLoading, refetch } = useGetAddresses();
  const addMutation = useAddAddress();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ fullName: "", street: "", city: "", state: "", zip: "", country: "US" });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addMutation.mutateAsync({ data: form });
      await refetch();
      setAdding(false);
      setForm({ fullName: "", street: "", city: "", state: "", zip: "", country: "US" });
      toast({ title: "Address saved" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="animate-pulse h-32 bg-card" />;

  return (
    <div className="space-y-4">
      {(addresses ?? []).map(addr => (
        <div key={addr.id} className="bg-card border border-card-border p-4 text-sm font-sans">
          <p className="font-medium mb-1">{addr.fullName}</p>
          <p className="text-muted-foreground">{addr.street}</p>
          <p className="text-muted-foreground">{addr.city}, {addr.state} {addr.zip}</p>
          <p className="text-muted-foreground">{addr.country}</p>
        </div>
      ))}

      {adding ? (
        <form onSubmit={handleAdd} className="bg-card border border-card-border p-5 space-y-3 max-w-md">
          {[["fullName","Full Name"],["street","Street"],["city","City"],["state","State"],["zip","ZIP"],["country","Country"]].map(([field, label]) => (
            <div key={field}>
              <label className="text-xs tracking-widest uppercase font-sans block mb-1.5">{label}</label>
              <input
                required={field !== "country"}
                value={(form as any)[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={addMutation.isPending} className="bg-primary text-primary-foreground px-5 py-2 text-xs tracking-widest uppercase hover:opacity-90 font-sans disabled:opacity-50">Save</button>
            <button type="button" onClick={() => setAdding(false)} className="border border-border px-5 py-2 text-xs tracking-widest uppercase hover:bg-secondary font-sans transition-colors">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="border border-dashed border-border p-4 w-full text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors font-sans text-center">
          + Add New Address
        </button>
      )}
    </div>
  );
}

function LoyaltyTab() {
  const { data, isLoading } = useQuery<{ points: number; totalEarned: number; totalRedeemed: number; discountValue: number }>({
    queryKey: ["loyalty"],
    queryFn: async () => {
      const token = localStorage.getItem("lumiere_access_token");
      const res = await fetch("/api/loyalty", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch loyalty");
      return res.json();
    },
  });

  const points = data?.points ?? 0;
  const totalEarned = data?.totalEarned ?? 0;
  const totalRedeemed = data?.totalRedeemed ?? 0;
  const discountValue = data?.discountValue ?? 0;

  const TIER_THRESHOLDS = [
    { name: "Silver", min: 0, max: 500, color: "text-slate-400", bg: "bg-slate-100" },
    { name: "Gold", min: 500, max: 1500, color: "text-amber-500", bg: "bg-amber-50" },
    { name: "Platinum", min: 1500, max: Infinity, color: "text-purple-500", bg: "bg-purple-50" },
  ];
  const tier = TIER_THRESHOLDS.find(t => totalEarned >= t.min && totalEarned < t.max) ?? TIER_THRESHOLDS[0];
  const nextTier = TIER_THRESHOLDS[TIER_THRESHOLDS.indexOf(tier) + 1];
  const progressPct = nextTier
    ? Math.min(100, Math.round(((totalEarned - tier.min) / (nextTier.min - tier.min)) * 100))
    : 100;

  if (isLoading) return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-card rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 max-w-lg">
      {/* Points hero */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-background border border-primary/20 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-primary font-sans mb-1">Your Balance</p>
            <p className="font-serif text-5xl font-light text-foreground">{points.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground font-sans mt-1">points</p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium tracking-widest uppercase ${tier.bg} ${tier.color}`}>
            {tier.name}
          </div>
        </div>
        {discountValue > 0 && (
          <div className="flex items-center gap-2 bg-white/70 rounded-xl px-4 py-2.5 border border-primary/10">
            <Gift size={14} className="text-primary flex-shrink-0" />
            <p className="text-sm font-sans text-foreground">Worth <span className="font-semibold text-primary">${discountValue.toFixed(2)}</span> in discounts</p>
          </div>
        )}
      </div>

      {/* Tier progress */}
      {nextTier && (
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs tracking-widest uppercase font-sans text-muted-foreground">Progress to {nextTier.name}</p>
            <p className="text-xs font-sans text-muted-foreground">{totalEarned} / {nextTier.min} pts</p>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            />
          </div>
          <p className="text-xs font-sans text-muted-foreground mt-2">{nextTier.min - totalEarned} more points to reach {nextTier.name}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Total Earned", value: totalEarned.toLocaleString(), icon: TrendingUp },
          { label: "Total Redeemed", value: totalRedeemed.toLocaleString(), icon: Gift },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card border border-card-border rounded-xl p-4">
            <Icon size={16} className="text-primary mb-2" />
            <p className="font-serif text-2xl font-light">{value}</p>
            <p className="text-xs tracking-widest uppercase text-muted-foreground font-sans mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <p className="text-xs tracking-widest uppercase font-sans text-muted-foreground mb-4">How It Works</p>
        <div className="space-y-3 text-sm font-sans text-foreground">
          {[
            "Earn 1 point for every $1 you spend",
            "100 points = $5 discount at checkout",
            "Reach Gold (500 pts) for early access to sales",
            "Reach Platinum (1500 pts) for free shipping on every order",
          ].map((rule, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-medium flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-muted-foreground">{rule}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReferralsTab() {
  const [copied, setCopied] = useState(false);
  const { data, isLoading } = useQuery<{
    code: string;
    refereeCount: number;
    completedCount: number;
    pendingCount: number;
    pointsEarned: number;
    referrerBonus: number;
    refereeBonus: number;
  }>({
    queryKey: ["referrals-me"],
    queryFn: async () => {
      const token = localStorage.getItem("lumiere_access_token");
      const res = await fetch("/api/referrals/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch referral info");
      return res.json();
    },
  });

  const referralLink = data?.code
    ? `${window.location.origin}/auth?ref=${data.code}`
    : "";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-card rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 max-w-lg">
      {/* Hero card */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-background border border-primary/20 rounded-2xl p-6">
        <p className="text-xs tracking-[0.3em] uppercase text-primary font-sans mb-1">Refer a Friend</p>
        <h2 className="font-serif text-2xl font-light mb-1">Share the glow</h2>
        <p className="text-sm text-muted-foreground font-sans leading-relaxed">
          You earn <span className="font-semibold text-foreground">{data?.referrerBonus ?? 200} pts</span> and your friend earns{" "}
          <span className="font-semibold text-foreground">{data?.refereeBonus ?? 100} pts</span> when they place their first order.
        </p>
      </div>

      {/* Your code */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <p className="text-xs tracking-widest uppercase font-sans text-muted-foreground mb-3">Your Referral Code</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-background border border-border rounded-lg px-4 py-3">
            <span className="font-mono text-lg font-semibold tracking-widest text-primary">{data?.code ?? "—"}</span>
          </div>
          <button
            onClick={() => handleCopy(data?.code ?? "")}
            className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground text-xs tracking-widest uppercase font-sans rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Share link */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <p className="text-xs tracking-widest uppercase font-sans text-muted-foreground mb-3">Or Share This Link</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-background border border-border rounded-lg px-4 py-3 overflow-hidden">
            <span className="text-xs font-sans text-muted-foreground truncate block">{referralLink}</span>
          </div>
          <button
            onClick={() => handleCopy(referralLink)}
            className="flex items-center gap-2 px-4 py-3 border border-border text-xs tracking-widest uppercase font-sans rounded-lg hover:bg-muted transition-colors whitespace-nowrap"
          >
            <Copy size={14} />
            Copy
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Friends Invited", value: data?.refereeCount ?? 0, icon: Users },
          { label: "Orders Placed", value: data?.completedCount ?? 0, icon: Check },
          { label: "Points Earned", value: (data?.pointsEarned ?? 0).toLocaleString(), icon: Star },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card border border-card-border rounded-xl p-4 text-center">
            <Icon size={16} className="text-primary mx-auto mb-2" />
            <p className="font-serif text-2xl font-light">{value}</p>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-sans mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <p className="text-xs tracking-widest uppercase font-sans text-muted-foreground mb-4">How It Works</p>
        <div className="space-y-4">
          {[
            { step: "1", title: "Share your code", desc: "Give your unique code or link to friends" },
            { step: "2", title: "Friend signs up", desc: "They create an account using your code" },
            { step: "3", title: "They place their first order", desc: `You get ${data?.referrerBonus ?? 200} pts · They get ${data?.refereeBonus ?? 100} pts` },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-4">
              <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">{step}</span>
              <div>
                <p className="text-sm font-sans font-medium text-foreground">{title}</p>
                <p className="text-xs font-sans text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WishlistTab() {
  const { data: wishlist, isLoading, refetch } = useGetWishlist();
  const removeMutation = useRemoveFromWishlist();
  const { toast } = useToast();

  const remove = async (productId: number) => {
    try {
      await removeMutation.mutateAsync({ productId: String(productId) });
      refetch();
      toast({ title: "Removed from wishlist" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">{[1,2,3].map(i => <div key={i} className="aspect-[3/4] bg-card" />)}</div>;
  if (!wishlist?.length) return <div className="text-center py-16"><p className="font-serif text-xl text-muted-foreground">Your wishlist is empty</p><Link href="/products" className="text-xs tracking-widest uppercase text-primary mt-4 inline-block hover:opacity-80 font-sans">Discover Products</Link></div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {wishlist.map(product => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}

export default function Account() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user, clearAuth } = useAuth();
  const { toast } = useToast();
  const logoutMutation = useLogout();
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    if (!isAuthenticated) navigate("/auth");
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const handleLogout = async () => {
    try { await logoutMutation.mutateAsync(); } catch {}
    clearAuth();
    toast({ title: "Signed out" });
    navigate("/");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2 font-sans">Welcome back</p>
        <h1 className="font-serif text-4xl font-light">{user?.firstName} {user?.lastName}</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Tabs sidebar */}
        <aside className="lg:w-48 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-3 px-3 py-3 text-xs tracking-widest uppercase font-sans transition-colors w-full text-left ${
                    activeTab === tab.key ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === "orders" && <OrdersTab />}
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "addresses" && <AddressesTab />}
            {activeTab === "wishlist" && <WishlistTab />}
            {activeTab === "loyalty" && <LoyaltyTab />}
            {activeTab === "referrals" && <ReferralsTab />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
