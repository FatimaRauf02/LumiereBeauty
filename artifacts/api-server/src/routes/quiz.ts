import { Router } from "express";
import { db } from "@workspace/db";
import { quizResultsTable, productsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authenticateOptional, type AuthRequest } from "../middlewares/authenticate";
import { anthropic } from "../lib/anthropic";

const router = Router();

router.post("/quiz/submit", authenticateOptional, async (req: AuthRequest, res) => {
  try {
    const { skinType, concerns, ageRange, dailyTime, budget } = req.body;

    const allProducts = await db.select().from(productsTable);
    const productList = allProducts.slice(0, 30).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      price: parseFloat(p.price),
      skinTypes: p.skinTypes as string[],
      concerns: p.concerns as string[],
    }));

    const prompt = `You are a skincare expert. Based on these quiz answers, recommend exactly 6 products from the product list.

Answers:
- Skin type: ${skinType}
- Concerns: ${concerns.join(", ")}
- Age range: ${ageRange}
- Daily skincare time: ${dailyTime}
- Budget per product: ${budget}

Product list:
${JSON.stringify(productList, null, 2)}

Return a JSON array of exactly 6 objects: [{"productId": number, "reason": "personalized 1-2 sentence explanation"}]
Only include productId and reason. Return ONLY the JSON array, no other text.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    let recommendations: { productId: number; reason: string }[] = [];
    try {
      const text = message.content[0].type === "text" ? message.content[0].text : "[]";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      recommendations = productList.slice(0, 6).map(p => ({ productId: p.id, reason: "Great match for your skin profile." }));
    }

    if (req.user?.userId) {
      await db.insert(quizResultsTable).values({
        userId: req.user.userId,
        answers: { skinType, concerns, ageRange, dailyTime, budget },
        recommendations,
      });
    }

    const productIds = recommendations.map(r => r.productId);
    const recProducts = await db.select().from(productsTable);
    const productMap = new Map(recProducts.map(p => [p.id, p]));

    const fullRecommendations = recommendations.map(r => {
      const p = productMap.get(r.productId);
      if (!p) return null;
      return {
        product: {
          id: p.id, name: p.name, slug: p.slug, category: p.category, subcategory: p.subcategory,
          description: p.description, price: parseFloat(p.price), salePrice: p.salePrice ? parseFloat(p.salePrice) : null,
          images: p.images as string[], rating: parseFloat(p.rating), reviewCount: p.reviewCount, stock: p.stock,
          skinTypes: p.skinTypes as string[], concerns: p.concerns as string[],
          isBestSeller: p.isBestSeller, isNewArrival: p.isNewArrival, isFeatured: p.isFeatured,
        },
        reason: r.reason,
      };
    }).filter(Boolean);

    res.json({
      skinProfile: { skinType, concerns, ageRange, dailyTime, budget },
      recommendations: fullRecommendations,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/quiz/results", authenticateOptional, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: "Login to see saved results" });
      return;
    }
    const [result] = await db.select().from(quizResultsTable)
      .where(eq(quizResultsTable.userId, req.user.userId))
      .orderBy(desc(quizResultsTable.createdAt))
      .limit(1);

    if (!result) {
      res.status(404).json({ message: "No quiz results found" });
      return;
    }

    const recommendations = result.recommendations as { productId: number; reason: string }[];
    const allProducts = await db.select().from(productsTable);
    const productMap = new Map(allProducts.map(p => [p.id, p]));

    const fullRecs = recommendations.map(r => {
      const p = productMap.get(r.productId);
      if (!p) return null;
      return {
        product: {
          id: p.id, name: p.name, slug: p.slug, category: p.category, subcategory: p.subcategory,
          description: p.description, price: parseFloat(p.price), salePrice: p.salePrice ? parseFloat(p.salePrice) : null,
          images: p.images as string[], rating: parseFloat(p.rating), reviewCount: p.reviewCount, stock: p.stock,
          skinTypes: p.skinTypes as string[], concerns: p.concerns as string[],
          isBestSeller: p.isBestSeller, isNewArrival: p.isNewArrival, isFeatured: p.isFeatured,
        },
        reason: r.reason,
      };
    }).filter(Boolean);

    res.json({
      skinProfile: result.answers,
      recommendations: fullRecs,
      createdAt: result.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
