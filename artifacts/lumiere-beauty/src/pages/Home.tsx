import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, Leaf, Shield, Recycle } from "lucide-react";
import { useGetFeaturedProducts, useGetBestsellers, useGetNewArrivals } from "@workspace/api-client-react";
import ProductCard from "@/components/ProductCard";
import { useRef } from "react";

function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-muted aspect-[3/4] w-full rounded-sm" />
      <div className="mt-3 space-y-2">
        <div className="h-2.5 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/4" />
      </div>
    </div>
  );
}

function ProductGrid({ products, isLoading }: { products: any[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products?.slice(0, 8).map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.07, duration: 0.5 }}
        >
          <ProductCard product={p} />
        </motion.div>
      ))}
    </div>
  );
}

const VALUES = [
  { icon: Leaf, title: "Clean Formulas", desc: "Free from harmful chemicals & parabens" },
  { icon: Shield, title: "Dermatologist Tested", desc: "Clinically proven for all skin types" },
  { icon: Sparkles, title: "Cruelty Free", desc: "Never tested on animals, always kind" },
  { icon: Recycle, title: "Sustainable", desc: "Eco-conscious, recyclable packaging" },
];

export default function Home() {
  const { data: featured, isLoading: featLoading } = useGetFeaturedProducts();
  const { data: bestsellers, isLoading: bestLoading } = useGetBestsellers();
  const { data: newArrivals, isLoading: newLoading } = useGetNewArrivals();

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="bg-background">
      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative min-h-screen overflow-hidden flex items-center">
        {/* Background warm blush gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#fdf3ee] via-[#faeaea] to-[#f9e8f0]" />

        {/* Decorative circles */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-accent/20 blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/10 blur-3xl pointer-events-none"
        />

        <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center py-24 pt-32">
          {/* Left — text */}
          <motion.div style={{ y: textY, opacity }} className="flex flex-col gap-7 order-2 lg:order-1">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.45em] uppercase text-primary font-sans"
            >
              <span className="w-8 h-px bg-primary" />
              Premium Skincare & Beauty
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.8 }}
              className="font-serif text-5xl md:text-6xl xl:text-7xl font-light text-foreground leading-[1.05] tracking-tight"
            >
              Reveal Your<br />
              <em className="text-primary not-italic">Luminous</em><br />
              Natural Glow
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="text-muted-foreground text-base font-sans font-light leading-relaxed max-w-md"
            >
              Science-backed formulas crafted with the finest botanicals — for skin that glows with confidence every single day.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.7 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/products"
                className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-9 py-4 text-xs tracking-widest uppercase hover:opacity-90 transition-all font-sans shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Shop Collection <ArrowRight size={13} />
              </Link>
              <Link
                href="/quiz"
                className="inline-flex items-center gap-3 border border-primary text-primary px-9 py-4 text-xs tracking-widest uppercase hover:bg-primary/8 transition-all font-sans"
              >
                Skin Quiz <Sparkles size={13} />
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="flex gap-6 pt-2"
            >
              {["10K+ Reviews", "100% Clean", "Dermatologist Approved"].map((badge) => (
                <div key={badge} className="text-center">
                  <p className="text-[10px] tracking-wider uppercase text-muted-foreground font-sans">{badge}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — woman image */}
          <motion.div
            style={{ y: imgY }}
            className="relative order-1 lg:order-2 flex justify-center lg:justify-end"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, x: 40 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative w-full max-w-sm lg:max-w-md"
            >
              {/* Decorative ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 rounded-full border border-accent/30 border-dashed"
              />

              {/* Main image container */}
              <div className="relative rounded-full overflow-hidden aspect-square shadow-2xl border-4 border-white">
                <img
                  src="/hero-product.jpg"
                  alt="Beautiful woman with glowing skin"
                  className="w-full h-full object-cover"
                />
                {/* Subtle inner glow overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-accent/15 via-transparent to-transparent" />
              </div>

              {/* Floating product card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.7 }}
                className="absolute -left-10 top-1/3 bg-white shadow-xl rounded-2xl p-3 flex items-center gap-3 min-w-[160px]"
              >
                <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=80&q=80&fit=crop"
                    alt="Serum"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-sans">Bestseller</p>
                  <p className="text-xs font-serif text-foreground leading-tight">Glow Serum</p>
                  <div className="flex mt-0.5">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className="text-primary text-[8px]">★</span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Floating skin type badge */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 0.7 }}
                className="absolute -right-6 bottom-1/4 bg-primary text-primary-foreground shadow-xl rounded-xl px-4 py-2.5"
              >
                <p className="text-[9px] tracking-widest uppercase font-sans opacity-80">Formulated for</p>
                <p className="text-sm font-serif font-light">All Skin Types</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 9, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="w-5 h-8 border border-primary/40 rounded-full flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-1.5 bg-primary rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── CATEGORIES STRIP ─── */}
      <section className="bg-white border-y border-border py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Skincare", img: "photo-1620916566398-39f1143ab7be", href: "/products?category=Skincare" },
              { label: "Hair Care", img: "photo-1527799820374-dcf8d9d4a388", href: "/products?category=Hair+Care" },
              { label: "Body Care", img: "photo-1601049676869-702ea24cfd58", href: "/products?category=Body+Care" },
              { label: "Sets & Bundles", img: "photo-1540555700478-4be289fbecef", href: "/products?category=Sets+%26+Bundles" },
            ].map((cat, i) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={cat.href} className="group relative overflow-hidden rounded-lg aspect-[4/5] block shadow-sm hover:shadow-md transition-shadow">
                  <img
                    src={`https://images.unsplash.com/${cat.img}?w=400&q=80&fit=crop&auto=format`}
                    alt={cat.label}
                    className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-serif text-lg font-light">{cat.label}</p>
                    <p className="text-white/70 text-xs font-sans tracking-widest uppercase mt-0.5 group-hover:text-white transition-colors">
                      Shop Now →
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ─── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <p className="text-[11px] tracking-[0.35em] uppercase text-primary mb-3 font-sans">Curated Picks</p>
            <h2 className="font-serif text-4xl font-light text-foreground">Featured Products</h2>
          </div>
          <Link
            href="/products"
            className="hidden md:flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors font-sans"
          >
            View All <ArrowRight size={13} />
          </Link>
        </motion.div>
        <ProductGrid products={featured ?? []} isLoading={featLoading} />
      </section>

      {/* ─── QUIZ BANNER ─── */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=1600&q=85&fit=crop&auto=format"
            alt="Skincare"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/65" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-2xl mx-auto px-6 text-center"
        >
          <p className="text-[11px] tracking-[0.4em] uppercase text-accent mb-4 font-sans">AI-Powered</p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-white mb-6">
            Find Your Perfect<br />Skincare Routine
          </h2>
          <p className="text-white/75 mb-10 font-sans font-light text-base leading-relaxed">
            Take our AI-powered skin quiz and receive personalized product recommendations tailored specifically for your unique complexion.
          </p>
          <Link
            href="/quiz"
            className="inline-flex items-center gap-3 bg-accent text-accent-foreground px-10 py-4 text-xs tracking-widest uppercase hover:opacity-90 transition-all font-sans shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Start Your Skin Quiz <ArrowRight size={13} />
          </Link>
        </motion.div>
      </section>

      {/* ─── BESTSELLERS ─── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <p className="text-[11px] tracking-[0.35em] uppercase text-primary mb-3 font-sans">Customer Favorites</p>
            <h2 className="font-serif text-4xl font-light text-foreground">Bestsellers</h2>
          </div>
          <Link
            href="/products?sort=bestSelling"
            className="hidden md:flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors font-sans"
          >
            View All <ArrowRight size={13} />
          </Link>
        </motion.div>
        <ProductGrid products={bestsellers ?? []} isLoading={bestLoading} />
      </section>

      {/* ─── VALUES ─── */}
      <section className="bg-white border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <v.icon size={18} className="text-primary" />
                </div>
                <h3 className="font-serif text-base text-foreground">{v.title}</h3>
                <p className="text-muted-foreground text-sm font-sans leading-snug">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEW ARRIVALS ─── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <p className="text-[11px] tracking-[0.35em] uppercase text-primary mb-3 font-sans">Just Arrived</p>
            <h2 className="font-serif text-4xl font-light text-foreground">New Arrivals</h2>
          </div>
          <Link
            href="/products?sort=newArrivals"
            className="hidden md:flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors font-sans"
          >
            View All <ArrowRight size={13} />
          </Link>
        </motion.div>
        <ProductGrid products={newArrivals ?? []} isLoading={newLoading} />
      </section>

      {/* ─── FINAL CTA STRIP ─── */}
      <section className="bg-primary py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto px-6"
        >
          <p className="text-primary-foreground/80 text-[11px] tracking-[0.4em] uppercase font-sans mb-3">Free Shipping Over $75</p>
          <h2 className="font-serif text-3xl md:text-4xl font-light text-primary-foreground mb-6">
            Your Glow Awaits
          </h2>
          <Link
            href="/products"
            className="inline-flex items-center gap-3 bg-white text-primary px-10 py-4 text-xs tracking-widest uppercase hover:bg-primary-foreground/90 transition-all font-sans shadow"
          >
            Shop All Products <ArrowRight size={13} />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
