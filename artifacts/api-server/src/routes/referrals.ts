import { Router } from "express";
import { db } from "@workspace/db";
import { referralsTable, usersTable } from "@workspace/db";
import { authenticate, type AuthRequest } from "../middlewares/authenticate";
import { eq, sql, isNull, and } from "drizzle-orm";
import { awardLoyaltyPoints } from "./loyalty";

const router = Router();

const REFERRER_BONUS = 200;
const REFEREE_BONUS = 100;

function generateCode(userId: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let hash = userId * 2654435761;
  let result = "LUMI";
  for (let i = 0; i < 6; i++) {
    result += chars[Math.abs(hash >> (i * 4)) % chars.length];
  }
  return result;
}

export async function getOrCreateReferralCode(userId: number): Promise<string> {
  const existing = await db
    .select({ code: referralsTable.code })
    .from(referralsTable)
    .where(eq(referralsTable.referrerId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0].code;

  const code = generateCode(userId);
  await db.insert(referralsTable).values({
    referrerId: userId,
    code,
    refereeId: null,
  });
  return code;
}

export async function applyReferralBonus(userId: number) {
  const [referral] = await db
    .select()
    .from(referralsTable)
    .where(and(eq(referralsTable.refereeId, userId), isNull(referralsTable.bonusAwardedAt)))
    .limit(1);

  if (!referral) return;

  await awardLoyaltyPoints(userId, REFEREE_BONUS);
  await awardLoyaltyPoints(referral.referrerId, REFERRER_BONUS);

  await db
    .update(referralsTable)
    .set({ bonusAwardedAt: new Date() })
    .where(eq(referralsTable.id, referral.id));
}

router.get("/referrals/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const code = await getOrCreateReferralCode(userId);

    const allReferrals = await db
      .select()
      .from(referralsTable)
      .where(and(eq(referralsTable.referrerId, userId), sql`${referralsTable.refereeId} IS NOT NULL`));

    const completedCount = allReferrals.filter(r => r.bonusAwardedAt !== null).length;
    const pendingCount = allReferrals.filter(r => r.bonusAwardedAt === null).length;
    const pointsEarned = completedCount * REFERRER_BONUS;

    res.json({
      code,
      refereeCount: allReferrals.length,
      completedCount,
      pendingCount,
      pointsEarned,
      referrerBonus: REFERRER_BONUS,
      refereeBonus: REFEREE_BONUS,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/referrals/validate", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code?.trim()) {
      res.status(400).json({ valid: false, message: "No code provided" });
      return;
    }
    const [row] = await db
      .select({ referrerId: referralsTable.referrerId })
      .from(referralsTable)
      .where(eq(referralsTable.code, code.trim().toUpperCase()))
      .limit(1);

    if (!row) {
      res.json({ valid: false, message: "Invalid referral code" });
      return;
    }
    const [referrer] = await db
      .select({ firstName: usersTable.firstName })
      .from(usersTable)
      .where(eq(usersTable.id, row.referrerId))
      .limit(1);

    res.json({ valid: true, referrerName: referrer?.firstName ?? "a friend" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ valid: false, message: "Internal server error" });
  }
});

export default router;
