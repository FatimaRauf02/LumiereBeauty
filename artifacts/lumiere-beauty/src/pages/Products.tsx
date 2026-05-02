import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { useGetProducts, useGetCategories } from "@workspace/api-client-react";
import ProductCard from "@/components/ProductCard";

const SORT_OPTIONS = [
  { value: "", label: "Featured" },
  { value: "bestSelling", label: "Best Selling" },
  { value: "newArrivals", label: "New Arrivals" },
  { value: "priceLow", label: "Price: Low to High" },
  { value: "priceHigh", label: "Price: High to Low" },
  { value: "topRated", label: "Top Rated" },
];

const SKIN_TYPES = ["dry", "oily", "combination", "normal", "sensitive"];
const CONCERNS = ["acne", "dark spots", "dullness", "dryness", "large pores", "redness", "wrinkles", "uneven texture"];

export default function Products() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "");

  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "");
  const [search, setSearch] = useState("");
  const [skinType, setSkinType] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "");
    setCategory(p.get("category") ?? "");
    setSort(p.get("sort") ?? "");
    setPage(1);
  }, [location]);

  const { data, isLoading } = useGetProducts({
    category: category || undefined,
    sort: sort || undefined,
    search: search || undefined,
    skinType: skinType || undefined,
    page,
    limit: 12,
  });

  const { data: categories } = useGetCategories();

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2 font-sans">
          {category || "All Products"}
        </p>
        <h1 className="font-serif text-4xl font-light">
          {category || "The Collection"}
        </h1>
        {!isLoading && (
          <p className="text-muted-foreground text-sm font-sans mt-2">{total} products</p>
        )}
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters - desktop */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24 space-y-8">
            {/* Search */}
            <div>
              <h3 className="text-xs tracking-widest uppercase text-foreground mb-4 font-sans">Search</h3>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search products..."
                className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans"
              />
            </div>

            {/* Category */}
            <div>
              <h3 className="text-xs tracking-widest uppercase text-foreground mb-4 font-sans">Category</h3>
              <div className="space-y-2">
                <button
                  onClick={() => { setCategory(""); setPage(1); }}
                  className={`block w-full text-left text-sm font-sans py-1 ${!category ? "text-primary" : "text-muted-foreground hover:text-foreground"} transition-colors`}
                >
                  All
                </button>
                {categories?.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => { setCategory(cat.name); setPage(1); }}
                    className={`block w-full text-left text-sm font-sans py-1 ${category === cat.name ? "text-primary" : "text-muted-foreground hover:text-foreground"} transition-colors`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Skin Type */}
            <div>
              <h3 className="text-xs tracking-widest uppercase text-foreground mb-4 font-sans">Skin Type</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSkinType("")}
                  className={`block w-full text-left text-sm font-sans py-1 capitalize ${!skinType ? "text-primary" : "text-muted-foreground hover:text-foreground"} transition-colors`}
                >
                  All Types
                </button>
                {SKIN_TYPES.map(st => (
                  <button
                    key={st}
                    onClick={() => setSkinType(st === skinType ? "" : st)}
                    className={`block w-full text-left text-sm font-sans py-1 capitalize ${skinType === st ? "text-primary" : "text-muted-foreground hover:text-foreground"} transition-colors`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <h3 className="text-xs tracking-widest uppercase text-foreground mb-4 font-sans">Sort By</h3>
              <div className="space-y-2">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSort(opt.value)}
                    className={`block w-full text-left text-sm font-sans py-1 ${sort === opt.value ? "text-primary" : "text-muted-foreground hover:text-foreground"} transition-colors`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter bar */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 border border-border px-4 py-2 text-xs tracking-widest uppercase font-sans"
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="bg-background border border-border px-3 py-2 text-xs font-sans text-foreground"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Products grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-card aspect-[3/4]" />
                  <div className="mt-3 space-y-2">
                    <div className="h-3 bg-card w-1/2" />
                    <div className="h-4 bg-card w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-serif text-2xl text-muted-foreground mb-4">No products found</p>
              <button
                onClick={() => { setCategory(""); setSearch(""); setSkinType(""); setSort(""); }}
                className="text-xs tracking-widest uppercase text-primary hover:opacity-80 transition-opacity font-sans"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-6"
            >
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-9 h-9 text-sm font-sans border ${page === n ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"} transition-colors`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
