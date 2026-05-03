import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, cartItemsTable, productsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/authenticate";
import { awardLoyaltyPoints } from "./loyalty";
import { applyReferralBonus } from "./referrals";

const router = Router();

function formatOrder(o: typeof ordersTable.$inferSelect, userEmail?: string | null) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    userId: o.userId ?? 0,
    userEmail: userEmail ?? null,
    status: o.status,
    items: o.items as object[],
    subtotal: parseFloat(o.subtotal),
    shipping: parseFloat(o.shipping),
    total: parseFloat(o.total),
    shippingAddress: o.shippingAddress as object,
    createdAt: o.createdAt.toISOString(),
  };
}

router.get("/orders", authenticate, async (req: AuthRequest, res) => {
  try {
    const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, req.user!.userId));
    res.json(orders.map(o => formatOrder(o)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/orders", authenticate, async (req: AuthRequest, res) => {
  try {
    const { shippingAddress } = req.body;
    const userId = req.user!.userId;

    const cartItems = await db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, userId));
    if (cartItems.length === 0) {
      res.status(400).json({ message: "Cart is empty" });
      return;
    }

    const productIds = cartItems.map(i => i.productId);
    const products = await db.select().from(productsTable);
    const productMap = new Map(products.map(p => [p.id, p]));

    const items = cartItems.map(item => {
      const product = productMap.get(item.productId);
      return {
        productId: item.productId,
        productName: product?.name ?? "",
        productImage: ((product?.images as string[]) ?? [])[0] ?? "",
        price: parseFloat(product?.price ?? "0"),
        quantity: item.quantity,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= 50 ? 0 : 5.99;
    const total = subtotal + shipping;
    const orderNumber = `LB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const [order] = await db.insert(ordersTable).values({
      orderNumber,
      userId,
      status: "pending",
      items,
      subtotal: subtotal.toString(),
      shipping: shipping.toString(),
      total: total.toString(),
      shippingAddress,
    }).returning();

    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

    // Award loyalty points: 1 point per $1 of order total
    try {
      await awardLoyaltyPoints(userId, total);
    } catch (loyaltyErr) {
      req.log.warn(loyaltyErr, "Failed to award loyalty points — order still created");
    }

    // Apply referral bonus if this user was referred
    try {
      await applyReferralBonus(userId);
    } catch (refErr) {
      req.log.warn(refErr, "Failed to apply referral bonus — order still created");
    }

    res.status(201).json(formatOrder(order));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/orders/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order || order.userId !== req.user!.userId) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    res.json(formatOrder(order));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
