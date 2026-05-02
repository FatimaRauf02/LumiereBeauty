import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useGetFeaturedProducts, useGetBestsellers, useGetNewArrivals } from "@workspace/api-client-react";
import ProductCard from "@/components/ProductCard";

function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-card aspect-[3/4] w-full" />
      <div className="mt-3 space-y-2">
        <div className="h-3 bg-card w-1/2" />
        <div className="h-4 bg-card w-3/4" />
        <div className="h-3 bg-card w-1/3" />
      </div>
    </div>
  );
}

function ProductGrid({ products, isLoading }: { products: any[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products?.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

export default function Home() {
  const { data: featured, isLoading: featLoading } = useGetFeaturedProducts();
  const { data: bestsellers, isLoading: bestLoading } = useGetBestsellers();
  const { data: newArrivals, isLoading: newLoading } = useGetNewArrivals();

  return (
    <div>
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://picsum.photos/seed/lumiereHero/1600/900')" }}
        />
        <div className="absolute inset-0 bg-background/70" />
        <div className="relative text-center px-4 max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs tracking-[0.4em] uppercase text-primary mb-6 font-sans"
          >
            Premium Skincare & Beauty
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-serif text-5xl md:text-7xl font-light text-foreground leading-none mb-8"
          >
            Reveal Your<br />
            <span className="italic text-primary">Luminous</span> Self
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-muted-foreground text-base mb-10 font-sans font-light max-w-md mx-auto"
          >
            Science-backed formulas crafted with the finest botanicals for skin that truly glows.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/products"
              className="bg-primary text-primary-foreground px-10 py-4 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity font-sans"
            >
              Shop Now
            </Link>
            <Link
              href="/quiz"
              className="border border-foreground text-foreground px-10 py-4 text-xs tracking-widest uppercase hover:bg-foreground hover:text-background transition-colors font-sans"
            >
              Take the Quiz
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-muted-foreground text-xs tracking-widest uppercase font-sans">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-px h-8 bg-gradient-to-b from-muted-foreground to-transparent"
          />
        </motion.div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-primary mb-3 font-sans">Curated Picks</p>
            <h2 className="font-serif text-4xl font-light">Featured Products</h2>
          </div>
          <Link href="/products" className="hidden md:flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors font-sans">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <ProductGrid products={featured ?? []} isLoading={featLoading} />
      </section>

      {/* Banner */}
      <section className="relative bg-card border-y border-border py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src="https://picsum.photos/seed/banner1/1600/400" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-4 font-sans">Personalized Beauty</p>
          <h2 className="font-serif text-4xl md:text-5xl font-light mb-6">Find Your Perfect Routine</h2>
          <p className="text-muted-foreground mb-10 font-sans font-light">
            Take our AI-powered skin quiz and receive personalized product recommendations tailored to your unique complexion.
          </p>
          <Link
            href="/quiz"
            className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-10 py-4 text-xs tracking-widest uppercase hover:opacity-90 transition-opacity font-sans"
          >
            Start Quiz <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-primary mb-3 font-sans">Customer Favorites</p>
            <h2 className="font-serif text-4xl font-light">Bestsellers</h2>
          </div>
          <Link href="/products?sort=bestSelling" className="hidden md:flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors font-sans">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <ProductGrid products={bestsellers ?? []} isLoading={bestLoading} />
      </section>

      {/* Values */}
      <section className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { title: "Clean Formulas", desc: "Free from harmful chemicals" },
              { title: "Dermatologist Tested", desc: "Safe for all skin types" },
              { title: "Cruelty Free", desc: "Never tested on animals" },
              { title: "Sustainable", desc: "Eco-conscious packaging" },
            ].map(v => (
              <div key={v.title} className="space-y-2">
                <h3 className="font-serif text-lg text-primary">{v.title}</h3>
                <p className="text-muted-foreground text-sm font-sans">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-primary mb-3 font-sans">Just Arrived</p>
            <h2 className="font-serif text-4xl font-light">New Arrivals</h2>
          </div>
          <Link href="/products?sort=newArrivals" className="hidden md:flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors font-sans">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <ProductGrid products={newArrivals ?? []} isLoading={newLoading} />
      </section>
    </div>
  );
}
