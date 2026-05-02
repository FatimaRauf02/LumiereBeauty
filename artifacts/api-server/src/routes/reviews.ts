import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate, authenticateOptional, type AuthRequest } from "../middlewares/authenticate";

const router = Router();

function formatReview(r: typeof reviewsTable.$inferSelect) {
  return {
    id: r.id,
    productId: r.productId,
    userId: r.userId,
    reviewerName: r.reviewerName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    skinType: r.skinType,
    source: r.source,
    isApproved: r.isApproved,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/reviews/:productId", async (req, res) => {
  try {
    const productId = parseInt(String(req.params.productId));
    const reviews = await db.select().from(reviewsTable)
      .where(and(eq(reviewsTable.productId, productId), eq(reviewsTable.isApproved, true)));
    res.json(reviews.map(formatReview));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/reviews/:productId", authenticate, async (req: AuthRequest, res) => {
  try {
    const productId = parseInt(String(req.params.productId));
    const { rating, title, body, skinType } = req.body;
    const userId = req.user!.userId;

    const [product] = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.id, productId)).limit(1);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const [review] = await db.insert(reviewsTable).values({
      productId,
      userId,
      reviewerName: "Verified Customer",
      rating,
      title: title ?? null,
      body,
      skinType: skinType ?? null,
      source: "user",
      isApproved: true,
    }).returning();

    // Update product rating
    const allReviews = await db.select({ rating: reviewsTable.rating }).from(reviewsTable)
      .where(and(eq(reviewsTable.productId, productId), eq(reviewsTable.isApproved, true)));
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await db.update(productsTable).set({ rating: avgRating.toFixed(2), reviewCount: allReviews.length }).where(eq(productsTable.id, productId));

    res.status(201).json(formatReview(review));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
