import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Package, ShoppingCart, Users, Star, TrendingUp, AlertTriangle } from "lucide-react";
import {
  useGetAdminStats, useAdminGetProducts, useAdminGetOrders, useAdminGetCustomers,
  useAdminGetReviews, useGetLowStockProducts, useGetSalesAnalytics,
  useAdminUpdateOrderStatus, useAdminDeleteProduct, useAdminApproveReview, useAdminDeleteReview,
  useGenerateProductDescription,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Link } from "wouter";

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "products", label: "Products", icon: Package },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "customers", label: "Customers", icon: Users },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "analytics", label: "Analytics", icon: TrendingUp },
];

const CHART_COLORS = ["#c9a96e", "#b8866a", "#9e7a5c", "#856e50"];

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="bg-card border border-card-border p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs tracking-widest uppercase text-muted-foreground font-sans">{label}</p>
        <Icon size={16} className="text-primary" />
      </div>
      <p className="font-serif text-3xl">{value}</p>
    </div>
  );
}

function OverviewTab() {
  const { data: stats, isLoading } = useGetAdminStats();
  const { data: lowStock } = useGetLowStockProducts();

  if (isLoading) return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-card" />)}</div>;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`$${Number(stats?.totalRevenue ?? 0).toFixed(0)}`} icon={TrendingUp} />
        <StatCard label="Orders Today" value={stats?.ordersToday ?? 0} icon={ShoppingCart} />
        <StatCard label="Products" value={stats?.totalProducts ?? 0} icon={Package} />
        <StatCard label="Customers" value={stats?.totalCustomers ?? 0} icon={Users} />
      </div>

      {lowStock && lowStock.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} className="text-yellow-400" />
            <h3 className="text-xs tracking-widest uppercase font-sans">Low Stock ({lowStock.length})</h3>
          </div>
          <div className="space-y-2">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-card border border-card-border p-3 text-sm font-sans">
                <span>{p.name}</span>
                <span className={`text-xs font-medium ${p.stock <= 5 ? "text-destructive" : "text-yellow-400"}`}>{p.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.recentOrders && stats.recentOrders.length > 0 && (
        <div>
          <h3 className="text-xs tracking-widest uppercase font-sans mb-4">Recent Orders</h3>
          <div className="space-y-2">
            {(stats.recentOrders as any[]).map(order => (
              <div key={order.id} className="flex items-center justify-between bg-card border border-card-border p-3 text-sm font-sans">
                <span className="text-muted-foreground">{order.orderNumber}</span>
                <span className="capitalize text-xs">{order.status}</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductsTab() {
  const { data, isLoading, refetch } = useAdminGetProducts();
  const deleteMutation = useAdminDeleteProduct();
  const generateMutation = useGenerateProductDescription();
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteMutation.mutateAsync({ id: String(id) });
      refetch();
      toast({ title: "Product deleted" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleGenerateDesc = async (id: number) => {
    try {
      const res = await generateMutation.mutateAsync({ id: String(id) });
      toast({ title: "Description generated", description: (res as any).description?.slice(0, 80) + "..." });
    } catch {
      toast({ title: "Error generating description", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="space-y-2 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-16 bg-card" />)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground font-sans">{data?.total ?? 0} products</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-border">
              {["Name", "Category", "Price", "Stock", "Rating", "Actions"].map(h => (
                <th key={h} className="text-left py-3 px-2 text-xs tracking-widest uppercase text-muted-foreground font-sans">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.products ?? []).map(p => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                <td className="py-3 px-2">
                  <div className="flex items-center gap-3">
                    <img src={(p.images as string[])[0]} alt="" className="w-10 h-12 object-cover bg-card" />
                    <span className="font-medium text-sm">{p.name}</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-muted-foreground">{p.subcategory}</td>
                <td className="py-3 px-2">${Number(p.price).toFixed(2)}</td>
                <td className="py-3 px-2">
                  <span className={p.stock <= 5 ? "text-destructive" : p.stock <= 10 ? "text-yellow-400" : "text-green-400"}>{p.stock}</span>
                </td>
                <td className="py-3 px-2">{Number(p.rating).toFixed(1)}</td>
                <td className="py-3 px-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateDesc(p.id)}
                      disabled={generateMutation.isPending}
                      className="text-xs tracking-wider uppercase text-primary hover:opacity-70 transition-opacity font-sans"
                    >
                      AI Desc
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-xs tracking-wider uppercase text-destructive hover:opacity-70 transition-opacity font-sans"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersTab() {
  const { data: orders, isLoading, refetch } = useAdminGetOrders();
  const updateMutation = useAdminUpdateOrderStatus();
  const { toast } = useToast();

  const updateStatus = async (id: number, status: string) => {
    try {
      await updateMutation.mutateAsync({ id: String(id), data: { status } });
      refetch();
      toast({ title: "Order updated" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="space-y-2 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-16 bg-card" />)}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-sans">
        <thead>
          <tr className="border-b border-border">
            {["Order #", "Date", "Status", "Total", "Actions"].map(h => (
              <th key={h} className="text-left py-3 px-2 text-xs tracking-widest uppercase text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(orders ?? []).map(order => (
            <tr key={order.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
              <td className="py-3 px-2 text-primary">{order.orderNumber}</td>
              <td className="py-3 px-2 text-muted-foreground">{new Date(order.createdAt as string).toLocaleDateString()}</td>
              <td className="py-3 px-2">
                <span className={`text-xs capitalize px-2 py-0.5 ${
                  order.status === "delivered" ? "bg-green-900/30 text-green-400" :
                  order.status === "cancelled" ? "bg-red-900/30 text-red-400" :
                  "bg-primary/20 text-primary"
                }`}>{order.status}</span>
              </td>
              <td className="py-3 px-2">${Number(order.total).toFixed(2)}</td>
              <td className="py-3 px-2">
                <select
                  value={order.status}
                  onChange={e => updateStatus(order.id, e.target.value)}
                  className="bg-background border border-border text-xs px-2 py-1 text-foreground"
                >
                  {["pending","processing","shipped","delivered","cancelled"].map(s => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomersTab() {
  const { data: customers, isLoading } = useAdminGetCustomers();
  if (isLoading) return <div className="animate-pulse space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-card" />)}</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-sans">
        <thead>
          <tr className="border-b border-border">
            {["Name", "Email", "Skin Type", "Role", "Joined"].map(h => (
              <th key={h} className="text-left py-3 px-2 text-xs tracking-widest uppercase text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(customers ?? []).map(c => (
            <tr key={c.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
              <td className="py-3 px-2 font-medium">{c.firstName} {c.lastName}</td>
              <td className="py-3 px-2 text-muted-foreground">{c.email}</td>
              <td className="py-3 px-2 capitalize">{c.skinType ?? "—"}</td>
              <td className="py-3 px-2">
                <span className={`text-xs capitalize ${c.role === "admin" ? "text-primary" : "text-muted-foreground"}`}>{c.role}</span>
              </td>
              <td className="py-3 px-2 text-muted-foreground">{new Date(c.createdAt as string).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewsTab() {
  const { data: reviews, isLoading, refetch } = useAdminGetReviews();
  const approveMutation = useAdminApproveReview();
  const deleteMutation = useAdminDeleteReview();
  const { toast } = useToast();

  const approve = async (id: number) => {
    try { await approveMutation.mutateAsync({ id: String(id) }); refetch(); toast({ title: "Approved" }); }
    catch { toast({ title: "Error", variant: "destructive" }); }
  };
  const remove = async (id: number) => {
    if (!confirm("Delete this review?")) return;
    try { await deleteMutation.mutateAsync({ id: String(id) }); refetch(); toast({ title: "Deleted" }); }
    catch { toast({ title: "Error", variant: "destructive" }); }
  };

  if (isLoading) return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-card" />)}</div>;
  return (
    <div className="space-y-3">
      {(reviews ?? []).map(r => (
        <div key={r.id} className="bg-card border border-card-border p-4 text-sm font-sans">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-medium">{r.reviewerName}</p>
              <p className="text-xs text-muted-foreground">Product #{r.productId} • {new Date(r.createdAt as string).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 ${r.isApproved ? "bg-green-900/30 text-green-400" : "bg-yellow-900/30 text-yellow-400"}`}>
                {r.isApproved ? "Approved" : "Pending"}
              </span>
              {!r.isApproved && (
                <button onClick={() => approve(r.id)} className="text-xs text-primary hover:opacity-70 transition-opacity">Approve</button>
              )}
              <button onClick={() => remove(r.id)} className="text-xs text-destructive hover:opacity-70 transition-opacity">Delete</button>
            </div>
          </div>
          <p className="text-muted-foreground">{r.body}</p>
        </div>
      ))}
    </div>
  );
}

function AnalyticsTab() {
  const { data, isLoading } = useGetSalesAnalytics();
  if (isLoading) return <div className="animate-pulse space-y-6">{[1,2].map(i => <div key={i} className="h-64 bg-card" />)}</div>;

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-xs tracking-widest uppercase font-sans mb-6">Revenue by Month</h3>
        <div className="bg-card border border-card-border p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(data as any)?.revenueByMonth ?? []}>
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10, fontFamily: "Jost" }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10, fontFamily: "Jost" }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "Jost", fontSize: 12 }}
                formatter={(v: any) => [`$${Number(v).toFixed(0)}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xs tracking-widest uppercase font-sans mb-6">Sales by Category</h3>
          <div className="bg-card border border-card-border p-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={(data as any)?.salesByCategory ?? []} dataKey="sales" nameKey="category" cx="50%" cy="50%" outerRadius={70}>
                  {((data as any)?.salesByCategory ?? []).map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "Jost", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-xs tracking-widest uppercase font-sans mb-6">Top Products</h3>
          <div className="space-y-2">
            {((data as any)?.topProducts ?? []).map((p: any, i: number) => (
              <div key={p.name} className="flex items-center gap-3 font-sans text-sm">
                <span className="text-primary w-5 text-right font-medium">{i + 1}</span>
                <span className="flex-1 text-muted-foreground truncate">{p.name}</span>
                <span className="text-foreground">{p.sales} sold</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="max-w-lg mx-auto px-4 pt-28 pb-20 text-center">
        <h1 className="font-serif text-3xl font-light mb-4">Access Restricted</h1>
        <p className="text-muted-foreground font-sans mb-8">This area is for administrators only.</p>
        <Link href="/" className="bg-primary text-primary-foreground px-8 py-3 text-xs tracking-widest uppercase hover:opacity-90 font-sans">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2 font-sans">Administrator</p>
        <h1 className="font-serif text-4xl font-light">Dashboard</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-44 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-xs tracking-widest uppercase font-sans w-full text-left transition-colors ${
                    activeTab === tab.key ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "products" && <ProductsTab />}
            {activeTab === "orders" && <OrdersTab />}
            {activeTab === "customers" && <CustomersTab />}
            {activeTab === "reviews" && <ReviewsTab />}
            {activeTab === "analytics" && <AnalyticsTab />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
