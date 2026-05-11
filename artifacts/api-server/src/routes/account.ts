import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, addressesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/authenticate";

const router = Router();

router.get("/account/profile", authenticate, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    if (!user) { res.status(404).json({ message: "Not found" }); return; }
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      skinType: user.skinType,
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/account/profile", authenticate, async (req: AuthRequest, res) => {
  try {
    const { firstName, lastName, skinType } = req.body;
    const [user] = await db.update(usersTable)
      .set({ firstName, lastName, skinType: skinType ?? null })
      .where(eq(usersTable.id, req.user!.userId))
      .returning();
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      skinType: user.skinType,
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/account/addresses", authenticate, async (req: AuthRequest, res) => {
  try {
    const addresses = await db.select().from(addressesTable)
      .where(eq(addressesTable.userId, req.user!.userId));
    res.json(addresses);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/account/addresses", authenticate, async (req: AuthRequest, res) => {
  try {
    const { fullName, street, city, zip, country } = req.body;
    const [address] = await db.insert(addressesTable).values({
      userId: req.user!.userId,
      fullName,
      street,
      city,
      state: "",
      zip,
      country: country ?? "",
    }).returning();
    res.status(201).json(address);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;