import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const imageUpdates = [
  // SKINCARE
  { slug: "radiance-revival-serum", images: ["/hyaluronic_serum.jpg"] },
  { slug: "velvet-moisture-cream", images: ["/velvet_moisture_cream.jpg"] },
  { slug: "crystal-clear-cleanser", images: ["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&auto=format&fit=crop"] },
  { slug: "midnight-repair-eye-cream", images: ["/midnight_eye_cream.jpg"] },
  { slug: "golden-hour-face-oil", images: ["https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&auto=format&fit=crop"] },
  { slug: "pore-perfecting-toner", images: ["https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop"] },
  { slug: "retinol-renewal-night-cream", images: ["/retinol_night_cream.jpg"] },
  { slug: "hyaluronic-acid-booster", images: ["/hyaluronic_serum.jpg"] },
  { slug: "spf-50-invisible-shield", images: ["/spf50.jpg"] },
  { slug: "rose-quartz-exfoliating-mask", images: ["/rose_mask.jpg"] },
  // HAIR CARE
  { slug: "silk-therapy-shampoo", images: ["/silk_shampoo.jpg"] },
  { slug: "silk-therapy-conditioner", images: ["/silk_shampoo.jpg"] },
  { slug: "gold-repair-hair-mask", images: ["/gold_hair_mask.jpg"] },
  { slug: "scalp-revival-treatment", images: ["/scalp_revival.jpg"] },
  { slug: "heat-protection-elixir", images: ["/silk_shampoo.jpg"] },
  { slug: "overnight-hair-serum", images: ["/hyaluronic_serum.jpg"] },
  { slug: "volumizing-root-lift-spray", images: ["/silk_shampoo.jpg"] },
  { slug: "color-protect-shampoo", images: ["/silk_shampoo.jpg"] },
  { slug: "curl-definition-cream", images: ["/curl_cream.jpg"] },
  // BODY CARE
  { slug: "champagne-body-scrub", images: ["/champagne_scrub.jpg"] },
  { slug: "velvet-body-lotion", images: ["/bodycare.jpg"] },
  { slug: "satin-body-oil", images: ["/hyaluronic_serum.jpg"] },
  { slug: "rose-petal-bath-soak", images: ["/body_scrub.jpg"] },
  { slug: "firming-body-serum", images: ["/firming_serum.jpg"] },
  { slug: "whipped-body-butter", images: ["/velvet_moisture_cream.jpg"] },
  { slug: "luxury-hand-cream", images: ["/velvet_moisture_cream.jpg"] },
  { slug: "detox-charcoal-body-wash", images: ["/bodycare.jpg"] },
  { slug: "peptide-neck-decollete-cream", images: ["/retinol_night_cream.jpg"] },
  { slug: "shimmer-body-mist", images: ["/body_mist.jpg"] },
  // SETS & BUNDLES — each with unique image
  { slug: "the-radiance-collection", images: ["/set1.jpg"] },
  { slug: "silk-hair-ritual-set", images: ["/set2.jpg"] },
  { slug: "body-luxe-gift-set", images: ["/set3.jpg"] },
  { slug: "anti-aging-power-duo", images: ["/set4.jpg"] },
  { slug: "hydration-heroes-bundle", images: ["/set5.jpg"] },
  { slug: "the-complete-lumiere-experience", images: ["/set6.jpg"] },
  { slug: "mens-grooming-essentials", images: ["/set7.jpg"] },
  { slug: "sensitive-skin-sanctuary", images: ["/set8.jpg"] },
  { slug: "bridal-glow-collection", images: ["/set9.jpg"] },
  { slug: "the-new-year-new-skin-set", images: ["/set10.jpg"] },
];

async function updateImages() {
  const client = await pool.connect();
  try {
    console.log("🖼️  Updating product images...");
    let updated = 0;
    for (const item of imageUpdates) {
      const result = await client.query(
        `UPDATE products SET images = $1 WHERE slug = $2`,
        [JSON.stringify(item.images), item.slug]
      );
      if (result.rowCount && result.rowCount > 0) updated++;
    }
    console.log(`✅ Updated ${updated} products with local images!`);
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

updateImages();