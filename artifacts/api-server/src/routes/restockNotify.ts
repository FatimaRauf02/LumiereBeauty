import { Router } from "express";
import { authenticate, type AuthRequest } from "../middlewares/authenticate";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// In-memory store: userId -> Set<productId>
const notifyMap = new Map<number, Set<number>>();

router.get("/restock-notify", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const subs = notifyMap.get(userId) ?? new Set<number>();
    res.json({ productIds: Array.from(subs) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/restock-notify", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.body;
    if (!productId) {
      res.status(400).json({ message: "productId required" });
      return;
    }
    const [product] = await db.select({ id: productsTable.id, name: productsTable.name, stock: productsTable.stock })
      .from(productsTable).where(eq(productsTable.id, Number(productId))).limit(1);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    if (!notifyMap.has(userId)) notifyMap.set(userId, new Set());
    notifyMap.get(userId)!.add(Number(productId));
    req.log.info({ userId, productId, productName: product.name }, "Restock notification subscribed");
    res.json({ message: `You will be notified when ${product.name} is back in stock.`, productId: product.id });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/restock-notify/:productId", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const productId = Number(req.params.productId);
    notifyMap.get(userId)?.delete(productId);
    res.json({ message: "Notification removed." });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
