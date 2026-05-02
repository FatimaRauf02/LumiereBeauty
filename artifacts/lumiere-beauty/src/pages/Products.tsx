import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
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

export default function Products() {
  const searchStr = useSearch();
  const [, navigate] = useLocation();

  const getParam = (key: string) => new URLSearchParams(searchStr).get(key) ?? "";

  const [category, setCategory] = useState(getParam("category"));
  const [sort, setSort] = useState(getParam("sort"));
  const [search, setSearch] = useState("");
  const [skinType, setSkinType] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(searchStr);
    setCategory(p.get("category") ?? "");
    setSort(p.get("sort") ?? "");
    setPage(1);
    setSearch("");
    setSkinType("");
  }, [searchStr]);

  const updateUrl = (newCategory: string, newSort: string) => {
    const p = new URLSearchParams();
    if (newCategory) p.set("category", newCategory);
    if (newSort) p.set("sort", newSort);
    const qs = p.toString();
    navigate(`/products${qs ? `?${qs}` : ""}`);
  };

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

  const FilterSidebar = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs tracking-widest uppercase text-foreground mb-4 font-sans">Search</h3>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..."
          className="w-full bg-white border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-sans rounded-lg"
        />
      </div>

      <div>
        <h3 className="text-xs tracking-widest uppercase text-foreground mb-4 font-sans">Category</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => updateUrl("", sort)}
            className={`block w-full text-left text-sm font-sans py-1.5 px-2 rounded-md transition-colors ${
              !category ? "text-primary bg-primary/8 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            All Products
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.name}
              onClick={() => updateUrl(cat.name, sort)}
              className={`block w-full text-left text-sm font-sans py-1.5 px-2 rounded-md transition-colors ${
                category === cat.name ? "text-primary bg-primary/8 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs tracking-widest uppercase text-foreground mb-4 font-sans">Skin Type</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => setSkinType("")}
            className={`block w-full text-left text-sm font-sans py-1.5 px-2 rounded-md transition-colors capitalize ${
              !skinType ? "text-primary bg-primary/8 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            All Types
          </button>
          {SKIN_TYPES.map((st) => (
            <button
              key={st}
              onClick={() => setSkinType(st === skinType ? "" : st)}
              className={`block w-full text-left text-sm font-sans py-1.5 px-2 rounded-md transition-colors capitalize ${
                skinType === st ? "text-primary bg-primary/8 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs tracking-widest uppercase text-foreground mb-4 font-sans">Sort By</h3>
        <div className="space-y-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateUrl(category, opt.value)}
              className={`block w-full text-left text-sm font-sans py-1.5 px-2 rounded-md transition-colors ${
                sort === opt.value ? "text-primary bg-primary/8 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
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
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24 bg-white rounded-xl border border-border p-5 shadow-sm">
            <FilterSidebar />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 border border-border px-4 py-2 text-xs tracking-widest uppercase font-sans rounded-lg bg-white"
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>
            <select
              value={sort}
              onChange={(e) => updateUrl(category, e.target.value)}
              className="bg-white border border-border px-3 py-2 text-xs font-sans text-foreground rounded-lg"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {category && (
              <button
                onClick={() => updateUrl("", sort)}
                className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-3 py-2 rounded-full font-sans"
              >
                {category} <X size={12} />
              </button>
            )}
          </div>

          {filtersOpen && (
            <div className="lg:hidden bg-white border border-border rounded-xl p-5 mb-6 shadow-sm">
              <FilterSidebar />
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted aspect-[3/4] rounded-sm" />
                  <div className="mt-3 space-y-2">
                    <div className="h-2.5 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-serif text-2xl text-muted-foreground mb-4">No products found</p>
              <button
                onClick={() => { updateUrl("", ""); setSearch(""); setSkinType(""); }}
                className="text-xs tracking-widest uppercase text-primary hover:opacity-80 transition-opacity font-sans"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-6"
            >
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </motion.div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-9 h-9 text-sm font-sans border rounded-md ${
                    page === n
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground bg-white"
                  } transition-colors`}
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
