import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Package, ShoppingCart, Users, Star, TrendingUp, AlertTriangle, Plus, Pencil, Trash2, X, Check, Loader2, Sparkles, Upload, Info, Layers, ChevronDown, ChevronRight } from "lucide-react";
import {
  useGetAdminStats, useAdminGetProducts, useAdminGetOrders, useAdminGetCustomers,
  useAdminGetReviews, useGetLowStockProducts, useGetSalesAnalytics,
  useAdminUpdateOrderStatus, useAdminDeleteProduct, useAdminApproveReview, useAdminDeleteReview,
  useGenerateProductDescription, useAdminCreateProduct, useAdminUpdateProduct,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Link } from "wouter";

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "products", label: "Products", icon: Package },
  { key: "variants", label: "Variants", icon: Layers },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "customers", label: "Customers", icon: Users },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "analytics", label: "Analytics", icon: TrendingUp },
];

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#9e7a5c", "#c9a96e"];

const CATEGORIES = ["Skincare", "Hair Care", "Body Care", "Sets & Bundles"];

const SUBCATEGORIES_BY_CATEGORY: Record<string, string[]> = {
  "Skincare": [
    "Cleansers", "Toners", "Serums", "Moisturizers", "Cream", "Lotion",
    "Eye Cream", "Face Masks", "Scrubs", "Exfoliants", "SPF", "Sunscreen",
    "Night Cream", "Face Oil", "Lip Care", "BB & CC Cream", "Retinol",
    "Vitamin C", "Niacinamide", "Hyaluronic Acid", "Primers", "Mists",
  ],
  "Hair Care": [
    "Shampoo", "Conditioner", "Hair Masks", "Hair Oils", "Scalp Treatments",
    "Leave-in Conditioner", "Dry Shampoo", "Hair Serum", "Heat Protectant",
    "Hair Spray", "Hair Mousse", "Hair Color", "Deep Conditioner",
  ],
  "Body Care": [
    "Body Lotions", "Body Butter", "Body Cream", "Body Scrubs", "Body Oils",
    "Body Wash", "Shower Gel", "Hand Cream", "Hand Wash", "Foot Cream",
    "Bath Salts", "Bath Bombs", "Deodorant", "Cellulite Cream",
  ],
  "Sets & Bundles": [
    "Sets & Bundles", "Gift Sets", "Travel Kits", "Routine Kits", "Duo Sets",
  ],
};

const ALL_SUBCATEGORIES = Object.values(SUBCATEGORIES_BY_CATEGORY).flat();
const SKIN_TYPES_ALL = ["dry", "oily", "combination", "normal", "sensitive", "all"];

function StatCard({ label, value, icon: Icon, trend }: { label: string; value: string | number; icon: any; trend?: string }) {
  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-sans">{label}</p>
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon size={15} className="text-primary" />
        </div>
      </div>
      <p className="font-serif text-3xl">{value}</p>
      {trend && <p className="text-xs text-green-500 font-sans mt-1">{trend}</p>}
    </div>
  );
}

interface ProductFormData {
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  description: string;
  ingredients: string;
  howToUse: string;
  price: string;
  salePrice: string;
  images: string;
  stock: string;
  skinTypes: string[];
  concerns: string[];
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
}

const emptyForm = (): ProductFormData => ({
  name: "", slug: "", category: "Skincare", subcategory: "Moisturizers",
  description: "", ingredients: "", howToUse: "", price: "", salePrice: "",
  images: "", stock: "50", skinTypes: [], concerns: [],
  isBestSeller: false, isNewArrival: false, isFeatured: false,
});

function ProductModal({ product, onClose, onSaved }: { product?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!product;
  const [form, setForm] = useState<ProductFormData>(() => {
    if (product) {
      return {
        name: product.name ?? "",
        slug: product.slug ?? "",
        category: product.category ?? "Skincare",
        subcategory: product.subcategory ?? "Moisturizers",
        description: product.description ?? "",
        ingredients: Array.isArray(product.ingredients) ? product.ingredients.join(", ") : (product.ingredients ?? ""),
        howToUse: product.howToUse ?? "",
        price: String(product.price ?? ""),
        salePrice: product.salePrice ? String(product.salePrice) : "",
        images: Array.isArray(product.images) ? product.images.join(", ") : (product.images ?? ""),
        stock: String(product.stock ?? "50"),
        skinTypes: product.skinTypes ?? [],
        concerns: product.concerns ?? [],
        isBestSeller: product.isBestSeller ?? false,
        isNewArrival: product.isNewArrival ?? false,
        isFeatured: product.isFeatured ?? false,
      };
    }
    return emptyForm();
  });

  const createMutation = useAdminCreateProduct();
  const updateMutation = useAdminUpdateProduct();
  const generateMutation = useGenerateProductDescription();
  const { toast } = useToast();
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const set = (key: keyof ProductFormData, val: any) => setForm(f => ({ ...f, [key]: val }));

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const toggleArrayVal = (key: "skinTypes" | "concerns", val: string) => {
    const arr = form[key] as string[];
    set(key, arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    const payload = {
      name: form.name,
      slug: form.slug || autoSlug(form.name),
      category: form.category,
      subcategory: form.subcategory,
      description: form.description,
      ingredients: form.ingredients ? form.ingredients.split(",").map(s => s.trim()).filter(Boolean) : [],
      howToUse: form.howToUse,
      price: parseFloat(form.price),
      salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
      images: form.images ? form.images.split(",").map(s => s.trim()).filter(Boolean) : [],
      stock: parseInt(form.stock) || 50,
      skinTypes: form.skinTypes,
      concerns: form.concerns,
      isBestSeller: form.isBestSeller,
      isNewArrival: form.isNewArrival,
      isFeatured: form.isFeatured,
    };
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: String(product.id), data: payload as any });
        toast({ title: "Product updated" });
      } else {
        await createMutation.mutateAsync({ data: payload as any });
        toast({ title: "Product created" });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message ?? err?.message ?? "Something went wrong", variant: "destructive" });
    }
  };

  const handleGenerateDesc = async () => {
    if (!isEdit || !product?.id) return;
    setIsGeneratingDesc(true);
    try {
      const res = await generateMutation.mutateAsync({ id: String(product.id) });
      set("description", (res as any).description ?? "");
      toast({ title: "Description generated by AI" });
    } catch {
      toast({ title: "Error generating description", variant: "destructive" });
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const existing = form.images.trim();
      set("images", existing ? `${existing}, ${dataUrl}` : dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const availableSubcategories = SUBCATEGORIES_BY_CATEGORY[form.category] ?? ALL_SUBCATEGORIES;

  const labelClass = "text-[10px] tracking-widest uppercase text-muted-foreground font-sans block mb-1.5";
  const inputClass = "w-full bg-background border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans rounded-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="font-serif text-xl">{isEdit ? "Edit Product" : "New Product"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Product Name *</label>
              <input
                required
                value={form.name}
                onChange={e => { set("name", e.target.value); if (!isEdit) set("slug", autoSlug(e.target.value)); }}
                className={inputClass}
                placeholder="e.g. Rose Face Serum"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="text-[10px] tracking-widest uppercase text-muted-foreground font-sans">Slug</label>
                <span title="URL-friendly identifier used in the product page URL. Auto-generated from the name." className="cursor-help">
                  <Info size={11} className="text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                </span>
              </div>
              <input value={form.slug} onChange={e => set("slug", e.target.value)} className={inputClass} placeholder="auto-generated from name" />
              <p className="text-[10px] text-muted-foreground/70 font-sans mt-1">Used in the product URL: /products/<em>slug</em></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category *</label>
              <select value={form.category} onChange={e => set("category", e.target.value)} className={inputClass}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Subcategory</label>
              <select value={form.subcategory} onChange={e => set("subcategory", e.target.value)} className={inputClass}>
                {availableSubcategories.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass.replace("mb-1.5", "")}>Description</label>
              {isEdit ? (
                <button
                  type="button"
                  onClick={handleGenerateDesc}
                  disabled={isGeneratingDesc}
                  className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-sans px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {isGeneratingDesc ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                  {isGeneratingDesc ? "Generating..." : "AI Generate"}
                </button>
              ) : (
                <span title="Save the product first to enable AI description generation" className="flex items-center gap-1.5 text-[10px] font-sans px-2.5 py-1 text-muted-foreground/50 border border-border rounded-full cursor-not-allowed">
                  <Sparkles size={10} />
                  AI Generate
                </span>
              )}
            </div>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} className={`${inputClass} resize-none`} placeholder="Luxurious product description..." />
          </div>

          <div>
            <label className={labelClass}>Ingredients (comma-separated)</label>
            <input value={form.ingredients} onChange={e => set("ingredients", e.target.value)} className={inputClass} placeholder="Hyaluronic Acid, Niacinamide, Vitamin C" />
          </div>

          <div>
            <label className={labelClass}>How to Use</label>
            <textarea value={form.howToUse} onChange={e => set("howToUse", e.target.value)} rows={2} className={`${inputClass} resize-none`} placeholder="Apply to clean skin..." />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Price ($) *</label>
              <input type="number" step="0.01" min="0" required value={form.price} onChange={e => set("price", e.target.value)} className={inputClass} placeholder="45.00" />
            </div>
            <div>
              <label className={labelClass}>Sale Price ($)</label>
              <input type="number" step="0.01" min="0" value={form.salePrice} onChange={e => set("salePrice", e.target.value)} className={inputClass} placeholder="Optional" />
            </div>
            <div>
              <label className={labelClass}>Stock</label>
              <input type="number" min="0" value={form.stock} onChange={e => set("stock", e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Product Images</label>
            <div className="space-y-2">
              <input
                value={form.images}
                onChange={e => set("images", e.target.value)}
                className={inputClass}
                placeholder="https://images.unsplash.com/photo-... (comma-separated for multiple)"
              />
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] tracking-widest uppercase text-muted-foreground font-sans">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors rounded-lg py-3 text-xs font-sans text-muted-foreground hover:text-primary"
              >
                <Upload size={14} />
                Upload from computer
              </button>
              {form.images && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {form.images.split(",").map(u => u.trim()).filter(Boolean).map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-14 h-14 object-cover rounded-lg border border-border bg-muted" />
                      <button
                        type="button"
                        onClick={() => {
                          const urls = form.images.split(",").map(u => u.trim()).filter(Boolean);
                          urls.splice(i, 1);
                          set("images", urls.join(", "));
                        }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={8} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Skin Types</label>
            <div className="flex flex-wrap gap-2">
              {SKIN_TYPES_ALL.map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => toggleArrayVal("skinTypes", st)}
                  className={`px-3 py-1.5 text-xs capitalize font-sans rounded-full border transition-colors ${
                    form.skinTypes.includes(st) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Concerns (comma-separated)</label>
            <input value={form.concerns.join(", ")} onChange={e => set("concerns", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} className={inputClass} placeholder="dryness, acne, dark spots" />
          </div>

          <div className="flex gap-6">
            {([["isBestSeller", "Bestseller"], ["isNewArrival", "New Arrival"], ["isFeatured", "Featured"]] as [keyof ProductFormData, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => set(key, !(form[key] as boolean))}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form[key] ? "bg-primary border-primary" : "border-border"}`}
                >
                  {form[key] && <Check size={12} className="text-white" />}
                </div>
                <span className="text-xs font-sans text-foreground">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-border text-sm font-sans rounded-xl hover:bg-muted transition-colors">Cancel</button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-3 bg-primary text-primary-foreground text-sm font-sans rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : isEdit ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function OverviewTab() {
  const { data: stats, isLoading } = useGetAdminStats();
  const { data: lowStock } = useGetLowStockProducts();

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`$${Number(stats?.totalRevenue ?? 0).toFixed(0)}`} icon={TrendingUp} />
        <StatCard label="Orders Today" value={stats?.ordersToday ?? 0} icon={ShoppingCart} />
        <StatCard label="Products" value={stats?.totalProducts ?? 0} icon={Package} />
        <StatCard label="Customers" value={stats?.totalCustomers ?? 0} icon={Users} />
      </div>

      {lowStock && lowStock.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} className="text-yellow-500" />
            <h3 className="text-xs tracking-widest uppercase font-sans">Low Stock ({lowStock.length})</h3>
          </div>
          <div className="space-y-2">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3 text-sm font-sans">
                <span>{p.name}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.stock <= 5 ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"}`}>{p.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.recentOrders && stats.recentOrders.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-xs tracking-widest uppercase font-sans mb-4">Recent Orders</h3>
          <div className="space-y-2">
            {(stats.recentOrders as any[]).map(order => (
              <div key={order.id} className="flex items-center justify-between bg-muted/40 rounded-lg p-3 text-sm font-sans">
                <span className="text-primary font-medium">{order.orderNumber}</span>
                <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${
                  order.status === "delivered" ? "bg-green-100 text-green-700" :
                  order.status === "cancelled" ? "bg-red-100 text-red-600" :
                  "bg-primary/10 text-primary"
                }`}>{order.status}</span>
                <span className="font-semibold">${Number(order.total).toFixed(2)}</span>
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
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [search, setSearch] = useState("");

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync({ id: String(id) });
      refetch();
      toast({ title: "Product deleted" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const products = (data?.products ?? []).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.subcategory?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="space-y-2 animate-pulse">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted rounded-lg" />)}</div>;

  return (
    <div>
      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => { setShowModal(false); setEditingProduct(null); }}
          onSaved={() => refetch()}
        />
      )}

      <div className="flex items-center justify-between mb-5 gap-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className="bg-white border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans rounded-lg w-56"
        />
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground font-sans">{data?.total ?? 0} products</p>
          <button
            onClick={() => { setEditingProduct(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 text-xs tracking-widest uppercase font-sans rounded-lg hover:opacity-90 transition-opacity shadow"
          >
            <Plus size={13} />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead className="bg-muted/40">
              <tr>
                {["Product", "Subcategory", "Price", "Stock", "Rating", "Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[10px] tracking-widest uppercase text-muted-foreground font-sans">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img src={(p.images as string[])[0]} alt="" className="w-10 h-12 object-cover rounded bg-muted flex-shrink-0" />
                      <div>
                        <span className="font-medium text-sm block">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{p.subcategory}</td>
                  <td className="py-3 px-4">
                    {p.salePrice ? (
                      <div>
                        <span className="text-primary font-semibold">${Number(p.salePrice).toFixed(2)}</span>
                        <span className="text-muted-foreground line-through text-xs ml-1">${Number(p.price).toFixed(2)}</span>
                      </div>
                    ) : (
                      <span>${Number(p.price).toFixed(2)}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.stock <= 5 ? "bg-red-100 text-red-600" : p.stock <= 15 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{Number(p.rating).toFixed(1)} ★</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingProduct(p); setShowModal(true); }}
                        className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

  if (isLoading) return <div className="space-y-2 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-lg" />)}</div>;

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-sans">
          <thead className="bg-muted/40">
            <tr>
              {["Order #", "Date", "Status", "Total", "Update"].map(h => (
                <th key={h} className="text-left py-3 px-4 text-[10px] tracking-widest uppercase text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map(order => (
              <tr key={order.id} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 text-primary font-medium">{order.orderNumber}</td>
                <td className="py-3 px-4 text-muted-foreground">{new Date(order.createdAt as string).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${
                    order.status === "delivered" ? "bg-green-100 text-green-700" :
                    order.status === "cancelled" ? "bg-red-100 text-red-600" :
                    order.status === "shipped" ? "bg-blue-100 text-blue-600" :
                    "bg-primary/10 text-primary"
                  }`}>{order.status}</span>
                </td>
                <td className="py-3 px-4 font-semibold">${Number(order.total).toFixed(2)}</td>
                <td className="py-3 px-4">
                  <select
                    value={order.status}
                    onChange={e => updateStatus(order.id, e.target.value)}
                    className="bg-background border border-border text-xs px-2 py-1.5 text-foreground rounded-lg"
                  >
                    {["pending","processing","shipped","delivered","cancelled"].map(s => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {(orders ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-muted-foreground font-sans text-sm">No orders yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomersTab() {
  const { data: customers, isLoading } = useAdminGetCustomers();
  if (isLoading) return <div className="animate-pulse space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded-lg" />)}</div>;
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-sans">
          <thead className="bg-muted/40">
            <tr>
              {["Name", "Email", "Skin Type", "Role", "Joined"].map(h => (
                <th key={h} className="text-left py-3 px-4 text-[10px] tracking-widest uppercase text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(customers ?? []).map(c => (
              <tr key={c.id} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                <td className="py-3 px-4 font-medium">{c.firstName} {c.lastName}</td>
                <td className="py-3 px-4 text-muted-foreground">{c.email}</td>
                <td className="py-3 px-4 capitalize">{c.skinType ?? "—"}</td>
                <td className="py-3 px-4">
                  <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${c.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{c.role}</span>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{new Date(c.createdAt as string).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReviewsTab() {
  const { data: reviews, isLoading, refetch } = useAdminGetReviews();
  const approveMutation = useAdminApproveReview();
  const deleteMutation = useAdminDeleteReview();
  const { toast } = useToast();

  const approve = async (id: number) => {
    try { await approveMutation.mutateAsync({ id: String(id) }); refetch(); toast({ title: "Review approved" }); }
    catch { toast({ title: "Error", variant: "destructive" }); }
  };
  const remove = async (id: number) => {
    if (!confirm("Delete this review?")) return;
    try { await deleteMutation.mutateAsync({ id: String(id) }); refetch(); toast({ title: "Review deleted" }); }
    catch { toast({ title: "Error", variant: "destructive" }); }
  };

  if (isLoading) return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}</div>;
  return (
    <div className="space-y-3">
      {(reviews ?? []).map(r => (
        <div key={r.id} className="bg-white border border-border rounded-xl p-4 text-sm font-sans shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-medium">{r.reviewerName}</p>
              <p className="text-xs text-muted-foreground">Product #{r.productId} • {new Date(r.createdAt as string).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${r.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {r.isApproved ? "Approved" : "Pending"}
              </span>
              {!r.isApproved && (
                <button onClick={() => approve(r.id)} className="text-xs text-primary hover:opacity-70 transition-opacity font-medium">Approve</button>
              )}
              <button onClick={() => remove(r.id)} className="text-xs text-destructive hover:opacity-70 transition-opacity">Delete</button>
            </div>
          </div>
          <div className="flex mb-1">
            {[1,2,3,4,5].map(s => <span key={s} className={s <= (r.rating ?? 5) ? "text-primary text-xs" : "text-muted-foreground text-xs"}>★</span>)}
          </div>
          <p className="text-muted-foreground">{r.body}</p>
        </div>
      ))}
      {(reviews ?? []).length === 0 && (
        <div className="text-center py-12 text-muted-foreground font-sans text-sm">No reviews yet</div>
      )}
    </div>
  );
}

function VariantsTab() {
  const { data, isLoading, refetch } = useAdminGetProducts();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingVariants, setEditingVariants] = useState<{ label: string; price: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const products = (data?.products ?? []).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.subcategory ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (product: any) => {
    const v = ((product.variants ?? []) as { label: string; price: number }[]);
    setEditingVariants(v.map(x => ({ label: x.label, price: String(x.price) })));
    setEditingId(product.id);
  };

  const cancelEdit = () => { setEditingId(null); setEditingVariants([]); };

  const addVariant = () => setEditingVariants(v => [...v, { label: "", price: "" }]);
  const removeVariant = (i: number) => setEditingVariants(v => v.filter((_, idx) => idx !== i));
  const updateVariant = (i: number, key: "label" | "price", val: string) =>
    setEditingVariants(v => v.map((x, idx) => idx === i ? { ...x, [key]: val } : x));

  const saveVariants = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const variants = editingVariants
        .filter(v => v.label.trim() && v.price.trim())
        .map(v => ({ label: v.label.trim(), price: parseFloat(v.price) }));
      const token = localStorage.getItem("lumiere_access_token");
      const res = await fetch(`/api/admin/products/${editingId}/variants`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ variants }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast({ title: "Variants saved" });
      cancelEdit();
      refetch();
    } catch {
      toast({ title: "Error saving variants", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "bg-white border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans rounded-lg";

  if (isLoading) return <div className="space-y-2 animate-pulse">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted rounded-lg" />)}</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className={`${inputClass} w-56`}
        />
        <p className="text-sm text-muted-foreground font-sans">{products.length} products</p>
      </div>

      <div className="space-y-2">
        {products.map(p => {
          const variants = ((p as any).variants ?? []) as { label: string; price: number }[];
          const isExpanded = editingId === p.id;
          return (
            <div key={p.id} className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <img
                  src={(p.images as string[])[0] ?? ""}
                  alt=""
                  className="w-10 h-12 object-cover rounded bg-muted flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground font-sans mb-1.5">{p.subcategory}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variants.length === 0 ? (
                      <span className="text-[10px] text-muted-foreground/50 font-sans italic">No variants configured</span>
                    ) : (
                      variants.map(v => (
                        <span key={v.label} className="inline-block px-2 py-0.5 text-[10px] tracking-wide font-sans border border-primary/25 text-primary/75 rounded-sm bg-primary/5">
                          {v.label} · ${Number(v.price).toFixed(2)}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <button
                  onClick={() => isExpanded ? cancelEdit() : startEdit(p)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs tracking-widest uppercase font-sans border rounded-lg transition-all flex-shrink-0 ${
                    isExpanded
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/60 hover:text-primary"
                  }`}
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {isExpanded ? "Close" : "Edit"}
                </button>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border p-4 bg-muted/20 space-y-3">
                      <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-sans">
                        Edit Variants — changes are reflected live on the product page
                      </p>

                      <div className="space-y-2">
                        {editingVariants.map((v, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              value={v.label}
                              onChange={e => updateVariant(i, "label", e.target.value)}
                              placeholder="Label (e.g. 30ml, Small, Rose)"
                              className={`${inputClass} flex-1`}
                            />
                            <div className="relative w-32">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={v.price}
                                onChange={e => updateVariant(i, "price", e.target.value)}
                                placeholder="0.00"
                                className={`${inputClass} w-full pl-6`}
                              />
                            </div>
                            <button
                              onClick={() => removeVariant(i)}
                              className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10 flex-shrink-0"
                              title="Remove"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        {editingVariants.length === 0 && (
                          <p className="text-xs text-muted-foreground font-sans italic py-1">
                            No variants — add one to show a size/shade selector on the product page.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={addVariant}
                          className="flex items-center gap-1.5 text-xs font-sans px-3 py-2 border border-dashed border-primary/40 text-primary/70 rounded-lg hover:bg-primary/5 hover:border-primary transition-all"
                        >
                          <Plus size={12} />
                          Add Variant
                        </button>
                        <div className="flex-1" />
                        <button
                          onClick={cancelEdit}
                          className="text-xs font-sans px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveVariants}
                          disabled={saving}
                          className="flex items-center gap-1.5 text-xs font-sans px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          {saving ? "Saving…" : "Save Variants"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const { data, isLoading } = useGetSalesAnalytics();
  if (isLoading) return <div className="animate-pulse space-y-6">{[1,2].map(i => <div key={i} className="h-64 bg-muted rounded-xl" />)}</div>;

  const weeklyMock = [
    { day: "Mon", revenue: 1240 },
    { day: "Tue", revenue: 980 },
    { day: "Wed", revenue: 1560 },
    { day: "Thu", revenue: 2100 },
    { day: "Fri", revenue: 1870 },
    { day: "Sat", revenue: 2840 },
    { day: "Sun", revenue: 1920 },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
        <h3 className="text-xs tracking-widest uppercase font-sans mb-5">Weekly Sales (Current Week)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyMock} barSize={28}>
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fontFamily: "Jost" }} axisLine={false} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fontFamily: "Jost" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "Jost", fontSize: 12, borderRadius: 8 }}
                formatter={(v: any) => [`$${Number(v).toFixed(0)}`, "Revenue"]}
                cursor={{ fill: "hsl(var(--muted))" }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
        <h3 className="text-xs tracking-widest uppercase font-sans mb-5">Monthly Revenue</h3>
        <div className="h-56">
          {(() => {
            const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            const rawData: { month: string; revenue: number }[] = (data as any)?.revenueByMonth ?? [];
            const chartData = MONTHS.map(m => {
              const found = rawData.find(r => r.month === m || String(r.month).startsWith(m));
              return { month: m, revenue: found ? Number(found.revenue) : 0 };
            });
            return (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={18}>
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10, fontFamily: "Jost" }} axisLine={false} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10, fontFamily: "Jost" }} axisLine={false} tickLine={false} tickFormatter={(v) => v === 0 ? "$0" : `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "Jost", fontSize: 12, borderRadius: 8 }}
                    formatter={(v: any) => [`$${Number(v).toFixed(0)}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} minPointSize={2} />
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-xs tracking-widest uppercase font-sans mb-5">Sales by Category</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={(data as any)?.salesByCategory ?? []} dataKey="sales" nameKey="category" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                  {((data as any)?.salesByCategory ?? []).map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "white", border: "1px solid hsl(var(--border))", fontFamily: "Jost", fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Jost" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-xs tracking-widest uppercase font-sans mb-5">Top Products</h3>
          <div className="space-y-3">
            {((data as any)?.topProducts ?? []).map((p: any, i: number) => (
              <div key={p.name} className="flex items-center gap-3 font-sans text-sm">
                <span className="text-primary w-5 text-right font-bold text-xs">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm text-foreground">{p.name}</div>
                  <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (p.sales / (((data as any)?.topProducts?.[0]?.sales ?? 1))) * 100)}%` }} />
                  </div>
                </div>
                <span className="text-muted-foreground text-xs flex-shrink-0">{p.sales} sold</span>
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
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <Users size={24} className="text-muted-foreground" />
        </div>
        <h1 className="font-serif text-3xl font-light mb-4">Access Restricted</h1>
        <p className="text-muted-foreground font-sans mb-8">This area is for administrators only.</p>
        <Link href="/" className="bg-primary text-primary-foreground px-8 py-3 text-xs tracking-widest uppercase hover:opacity-90 font-sans rounded-lg shadow inline-block">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2 font-sans">Administrator</p>
        <h1 className="font-serif text-4xl font-light">Dashboard</h1>
        <p className="text-muted-foreground text-sm font-sans mt-1">Welcome back, {user?.firstName}.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-48 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 bg-white rounded-xl border border-border p-2 shadow-sm">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-xs tracking-widest uppercase font-sans w-full text-left transition-all rounded-lg ${
                    activeTab === tab.key ? "text-primary bg-primary/10 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "products" && <ProductsTab />}
            {activeTab === "variants" && <VariantsTab />}
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
