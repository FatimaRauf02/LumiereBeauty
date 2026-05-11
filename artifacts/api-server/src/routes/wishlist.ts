import { Router } from "express";
import { db } from "@workspace/db";
import { wishlistTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/authenticate";

const router = Router();

router.get("/wishlist", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const wishlistItems = await db.select().from(wishlistTable).where(eq(wishlistTable.userId, userId));
    if (wishlistItems.length === 0) {
      res.json([]);
      return;
    }
    const productIds = wishlistItems.map(w => w.productId);
    const products = await db.select().from(productsTable);
    const filtered = products.filter(p => productIds.includes(p.id));
    res.json(filtered.map(p => ({
      id: p.id, name: p.name, slug: p.slug, category: p.category, subcategory: p.subcategory,
      description: p.description, price: parseFloat(p.price), salePrice: p.salePrice ? parseFloat(p.salePrice) : null,
      images: p.images as string[], rating: parseFloat(p.rating), reviewCount: p.reviewCount, stock: p.stock,
      skinTypes: p.skinTypes as string[], concerns: p.concerns as string[],
      isBestSeller: p.isBestSeller, isNewArrival: p.isNewArrival, isFeatured: p.isFeatured,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/wishlist", authenticate, async (req: AuthRequest, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user!.userId;
    const [existing] = await db.select().from(wishlistTable)
      .where(and(eq(wishlistTable.userId, userId), eq(wishlistTable.productId, productId))).limit(1);
    if (!existing) {
      await db.insert(wishlistTable).values({ userId, productId });
    }
    res.json({ message: "Added to wishlist" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/wishlist/:productId", authenticate, async (req: AuthRequest, res) => {
  try {
    const productId = parseInt(String(req.params.productId));
    const userId = req.user!.userId;
    await db.delete(wishlistTable).where(and(eq(wishlistTable.userId, userId), eq(wishlistTable.productId, productId)));
    res.json({ message: "Removed from wishlist" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
