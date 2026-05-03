import { Router } from "express";
import { db } from "@workspace/db";
import { loyaltyTable } from "@workspace/db";
import { authenticate, type AuthRequest } from "../middlewares/authenticate";
import { eq, sql } from "drizzle-orm";

const router = Router();

export async function awardLoyaltyPoints(userId: number, orderTotal: number) {
  const points = Math.floor(orderTotal);
  if (points <= 0) return;

  const existing = await db.select().from(loyaltyTable).where(eq(loyaltyTable.userId, userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(loyaltyTable).values({
      userId,
      points,
      totalEarned: points,
      totalRedeemed: 0,
    });
  } else {
    await db.update(loyaltyTable)
      .set({
        points: sql`${loyaltyTable.points} + ${points}`,
        totalEarned: sql`${loyaltyTable.totalEarned} + ${points}`,
        updatedAt: new Date(),
      })
      .where(eq(loyaltyTable.userId, userId));
  }
}

export async function redeemLoyaltyPoints(userId: number, points: number) {
  const [record] = await db.select().from(loyaltyTable).where(eq(loyaltyTable.userId, userId)).limit(1);
  if (!record || record.points < points) throw new Error("Insufficient points");

  await db.update(loyaltyTable)
    .set({
      points: sql`${loyaltyTable.points} - ${points}`,
      totalRedeemed: sql`${loyaltyTable.totalRedeemed} + ${points}`,
      updatedAt: new Date(),
    })
    .where(eq(loyaltyTable.userId, userId));
}

router.get("/loyalty", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const [record] = await db.select().from(loyaltyTable).where(eq(loyaltyTable.userId, userId)).limit(1);
    if (!record) {
      res.json({ points: 0, totalEarned: 0, totalRedeemed: 0, discountValue: 0 });
      return;
    }
    res.json({
      points: record.points,
      totalEarned: record.totalEarned,
      totalRedeemed: record.totalRedeemed,
      discountValue: parseFloat((record.points / 100 * 5).toFixed(2)),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/loyalty/redeem", authenticate, async (req: AuthRequest, res) => {
  try {
    const { points } = req.body as { points: number };
    const userId = req.user!.userId;
    if (!points || points <= 0) {
      res.status(400).json({ message: "Invalid points amount" });
      return;
    }
    await redeemLoyaltyPoints(userId, points);
    const [updated] = await db.select().from(loyaltyTable).where(eq(loyaltyTable.userId, userId)).limit(1);
    res.json({
      points: updated.points,
      totalEarned: updated.totalEarned,
      totalRedeemed: updated.totalRedeemed,
      discountValue: parseFloat((updated.points / 100 * 5).toFixed(2)),
    });
  } catch (err: any) {
    req.log.error(err);
    res.status(400).json({ message: err.message ?? "Failed to redeem points" });
  }
});

export default router;
