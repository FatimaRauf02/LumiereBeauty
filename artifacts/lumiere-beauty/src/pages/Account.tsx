import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Package, User, MapPin, Heart, LogOut } from "lucide-react";
import {
  useGetProfile, useGetOrders, useGetAddresses, useGetWishlist,
  useUpdateProfile, useAddAddress, useRemoveFromWishlist, useLogout
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/ProductCard";

const TABS = [
  { key: "orders", label: "Orders", icon: Package },
  { key: "profile", label: "Profile", icon: User },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "wishlist", label: "Wishlist", icon: Heart },
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
            <span className={`text-xs tracking-widest uppercase font-sans px-2 py-1 ${
              order.status === "delivered" ? "bg-green-900/30 text-green-400" :
              order.status === "cancelled" ? "bg-red-900/30 text-red-400" :
              "bg-primary/20 text-primary"
            }`}>{order.status}</span>
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

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-28 pb-20 text-center">
        <h1 className="font-serif text-3xl font-light mb-4">My Account</h1>
        <p className="text-muted-foreground font-sans mb-8">Please sign in to access your account.</p>
        <Link href="/auth" className="bg-primary text-primary-foreground px-10 py-4 text-xs tracking-widest uppercase hover:opacity-90 font-sans">Sign In</Link>
      </div>
    );
  }

  const handleLogout = async () => {
    try { await logoutMutation.mutateAsync(); } catch {}
    clearAuth();
    toast({ title: "Signed out" });
    navigate("/");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2 font-sans">Welcome back</p>
          <h1 className="font-serif text-4xl font-light">{user?.firstName} {user?.lastName}</h1>
        </div>
        <button onClick={handleLogout} className="hidden lg:flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors font-sans">
          <LogOut size={14} /> Sign Out
        </button>
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}
