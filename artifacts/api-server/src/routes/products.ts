import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq, ilike, and, gte, lte, sql, inArray } from "drizzle-orm";

const router = Router();

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    subcategory: p.subcategory,
    description: p.description,
    ingredients: p.ingredients,
    howToUse: p.howToUse,
    price: parseFloat(p.price),
    salePrice: p.salePrice ? parseFloat(p.salePrice) : null,
    images: p.images as string[],
    rating: parseFloat(p.rating),
    reviewCount: p.reviewCount,
    stock: p.stock,
    skinTypes: p.skinTypes as string[],
    concerns: p.concerns as string[],
    isBestSeller: p.isBestSeller,
    isNewArrival: p.isNewArrival,
    isFeatured: p.isFeatured,
    variants: (p.variants as { label: string; price: number }[]) ?? [],
  };
}

router.get("/products", async (req, res) => {
  try {
    const { category, subcategory, skinType, minPrice, maxPrice, minRating, inStock, sort, search, page = "1", limit = "12" } = req.query as Record<string, string>;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const offset = (pageNum - 1) * limitNum;

    const conditions: ReturnType<typeof eq>[] = [];
    if (category) conditions.push(eq(productsTable.category, category));
    if (subcategory) conditions.push(eq(productsTable.subcategory, subcategory));
    if (inStock === "true") conditions.push(gte(productsTable.stock, 1));
    if (minPrice) conditions.push(gte(productsTable.price, minPrice));
    if (maxPrice) conditions.push(lte(productsTable.price, maxPrice));

    let query = db.select().from(productsTable);
    if (conditions.length > 0) query = query.where(and(...conditions)) as typeof query;

    const allProducts = await query;

    let filtered = allProducts;
    if (skinType) {
      filtered = filtered.filter(p => (p.skinTypes as string[]).includes(skinType));
    }
    if (minRating) {
      filtered = filtered.filter(p => parseFloat(p.rating) >= parseFloat(minRating));
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
    }

    if (sort === "bestSelling") filtered.sort((a, b) => b.reviewCount - a.reviewCount);
    else if (sort === "newArrivals") filtered.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    else if (sort === "priceLow") filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    else if (sort === "priceHigh") filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    else if (sort === "topRated") filtered.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limitNum);

    res.json({
      products: paginated.map(formatProduct),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/products/featured", async (req, res) => {
  try {
    const products = await db.select().from(productsTable).where(eq(productsTable.isFeatured, true)).limit(8);
    res.json(products.map(formatProduct));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/products/bestsellers", async (req, res) => {
  try {
    const products = await db.select().from(productsTable).where(eq(productsTable.isBestSeller, true)).limit(8);
    res.json(products.map(formatProduct));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/products/new-arrivals", async (req, res) => {
  try {
    const products = await db.select().from(productsTable).where(eq(productsTable.isNewArrival, true)).limit(8);
    res.json(products.map(formatProduct));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/products/categories", async (req, res) => {
  try {
    const products = await db.select({ category: productsTable.category, subcategory: productsTable.subcategory }).from(productsTable);
    const categoryMap = new Map<string, Set<string>>();
    for (const p of products) {
      if (!categoryMap.has(p.category)) categoryMap.set(p.category, new Set());
      categoryMap.get(p.category)!.add(p.subcategory);
    }
    const categories = Array.from(categoryMap.entries()).map(([name, subs]) => ({
      name,
      subcategories: Array.from(subs),
    }));
    res.json(categories);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/products/:slug", async (req, res) => {
  try {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.slug, req.params.slug)).limit(1);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json(formatProduct(product));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/products/:id/related", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
    if (!product) {
      res.json([]);
      return;
    }
    const related = await db.select().from(productsTable)
      .where(and(eq(productsTable.category, product.category), sql`${productsTable.id} != ${id}`))
      .limit(4);
    res.json(related.map(formatProduct));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
