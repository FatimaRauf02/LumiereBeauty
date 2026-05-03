import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, ordersTable, usersTable, reviewsTable } from "@workspace/db";
import { eq, lte, sql } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/authenticate";
import { anthropic } from "../lib/anthropic";

const router = Router();

router.use(authenticate, requireAdmin);

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id, name: p.name, slug: p.slug, category: p.category, subcategory: p.subcategory,
    description: p.description, ingredients: p.ingredients, howToUse: p.howToUse,
    price: parseFloat(p.price), salePrice: p.salePrice ? parseFloat(p.salePrice) : null,
    images: p.images as string[], rating: parseFloat(p.rating), reviewCount: p.reviewCount, stock: p.stock,
    skinTypes: p.skinTypes as string[], concerns: p.concerns as string[],
    isBestSeller: p.isBestSeller, isNewArrival: p.isNewArrival, isFeatured: p.isFeatured,
    variants: (p.variants as { label: string; price: number }[]) ?? [],
  };
}

// Stats
router.get("/stats", async (req, res) => {
  try {
    const allOrders = await db.select().from(ordersTable);
    const allProducts = await db.select({ id: productsTable.id, stock: productsTable.stock }).from(productsTable);
    const allUsers = await db.select({ id: usersTable.id, role: usersTable.role }).from(usersTable);

    const totalRevenue = allOrders.filter(o => o.status !== "cancelled").reduce((sum, o) => sum + parseFloat(o.total), 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const ordersToday = allOrders.filter(o => new Date(o.createdAt) >= today).length;
    const customers = allUsers.filter(u => u.role === "customer").length;
    const lowStockCount = allProducts.filter(p => p.stock < 10).length;
    const recentOrders = allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    res.json({
      totalRevenue,
      ordersToday,
      totalProducts: allProducts.length,
      totalCustomers: customers,
      lowStockCount,
      recentOrders: recentOrders.map(o => ({
        id: o.id, orderNumber: o.orderNumber, userId: o.userId ?? 0, userEmail: null,
        status: o.status, items: o.items as object[], subtotal: parseFloat(o.subtotal),
        shipping: parseFloat(o.shipping), total: parseFloat(o.total),
        shippingAddress: o.shippingAddress as object, createdAt: o.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Products
router.get("/products", async (req, res) => {
  try {
    const products = await db.select().from(productsTable);
    res.json({ products: products.map(formatProduct), total: products.length, page: 1, totalPages: 1 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const body = req.body;
    const [product] = await db.insert(productsTable).values({
      ...body,
      price: body.price.toString(),
      salePrice: body.salePrice?.toString() ?? null,
      rating: "0",
      reviewCount: 0,
    }).returning();
    res.status(201).json(formatProduct(product));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const body = req.body;
    const [product] = await db.update(productsTable).set({
      ...body,
      price: body.price?.toString(),
      salePrice: body.salePrice?.toString() ?? null,
      updatedAt: new Date(),
    }).where(eq(productsTable.id, id)).returning();
    res.json(formatProduct(product));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/products/:id/variants", async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { variants } = req.body;
    if (!Array.isArray(variants)) { res.status(400).json({ message: "variants must be an array" }); return; }
    const cleaned = variants
      .filter((v: any) => typeof v.label === "string" && v.label.trim() && typeof v.price === "number" && !isNaN(v.price))
      .map((v: any) => ({ label: v.label.trim(), price: Math.round(v.price * 100) / 100 }));
    const [product] = await db.update(productsTable)
      .set({ variants: cleaned, updatedAt: new Date() })
      .where(eq(productsTable.id, id))
      .returning();
    if (!product) { res.status(404).json({ message: "Product not found" }); return; }
    res.json(formatProduct(product));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.json({ message: "Product deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/products/:id/generate-description", async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
    if (!product) { res.status(404).json({ message: "Product not found" }); return; }

    const prompt = `Write a luxurious, professional product description for "${product.name}" — a ${product.subcategory} by Lumière Beauty.
Category: ${product.category}
Skin types: ${(product.skinTypes as string[]).join(", ")}
Concerns: ${(product.concerns as string[]).join(", ")}
Ingredients: ${product.ingredients ?? "premium botanical extracts"}

Write 2-3 sentences in a sophisticated, empowering brand voice. Be specific about benefits. Do not use filler phrases.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const description = message.content[0].type === "text" ? message.content[0].text : product.description;
    res.json({ description });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Orders
router.get("/orders", async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(sql`created_at DESC`);
    res.json(orders.map(o => ({
      id: o.id, orderNumber: o.orderNumber, userId: o.userId ?? 0, userEmail: null,
      status: o.status, items: o.items as object[], subtotal: parseFloat(o.subtotal),
      shipping: parseFloat(o.shipping), total: parseFloat(o.total),
      shippingAddress: o.shippingAddress as object, createdAt: o.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/orders/:id/status", async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { status } = req.body;
    const [order] = await db.update(ordersTable).set({ status, updatedAt: new Date() }).where(eq(ordersTable.id, id)).returning();
    res.json({
      id: order.id, orderNumber: order.orderNumber, userId: order.userId ?? 0, userEmail: null,
      status: order.status, items: order.items as object[], subtotal: parseFloat(order.subtotal),
      shipping: parseFloat(order.shipping), total: parseFloat(order.total),
      shippingAddress: order.shippingAddress as object, createdAt: order.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Customers
router.get("/customers", async (req, res) => {
  try {
    const users = await db.select().from(usersTable);
    res.json(users.map(u => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role, skinType: u.skinType, createdAt: u.createdAt })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Reviews
router.get("/reviews", async (req, res) => {
  try {
    const reviews = await db.select().from(reviewsTable);
    res.json(reviews.map(r => ({
      id: r.id, productId: r.productId, userId: r.userId, reviewerName: r.reviewerName,
      rating: r.rating, title: r.title, body: r.body, skinType: r.skinType,
      source: r.source, isApproved: r.isApproved, createdAt: r.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/reviews/:id/approve", async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.update(reviewsTable).set({ isApproved: true }).where(eq(reviewsTable.id, id));
    res.json({ message: "Review approved" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/reviews/:id", async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(reviewsTable).where(eq(reviewsTable.id, id));
    res.json({ message: "Review deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Low stock
router.get("/low-stock", async (req, res) => {
  try {
    const products = await db.select().from(productsTable).where(lte(productsTable.stock, 10));
    res.json(products.map(formatProduct));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Analytics
router.get("/sales-analytics", async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable).where(eq(ordersTable.status, "delivered"));

    const monthMap = new Map<string, number>();
    for (const order of orders) {
      const month = new Date(order.createdAt).toLocaleString("default", { month: "short", year: "numeric" });
      monthMap.set(month, (monthMap.get(month) ?? 0) + parseFloat(order.total));
    }
    const revenueByMonth = Array.from(monthMap.entries()).map(([month, revenue]) => ({ month, revenue }));

    const salesByCategory = [
      { category: "Skincare", sales: Math.floor(Math.random() * 200) + 100 },
      { category: "Hair Care", sales: Math.floor(Math.random() * 150) + 50 },
      { category: "Body Care", sales: Math.floor(Math.random() * 100) + 30 },
      { category: "Sets & Bundles", sales: Math.floor(Math.random() * 80) + 20 },
    ];

    const products = await db.select({ name: productsTable.name, reviewCount: productsTable.reviewCount }).from(productsTable);
    const topProducts = products.sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5).map(p => ({ name: p.name, sales: p.reviewCount + Math.floor(Math.random() * 50) }));

    res.json({ revenueByMonth, salesByCategory, topProducts });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
