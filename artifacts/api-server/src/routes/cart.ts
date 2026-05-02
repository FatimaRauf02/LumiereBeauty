import { Router } from "express";
import { db } from "@workspace/db";
import { cartItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticateOptional, type AuthRequest } from "../middlewares/authenticate";

const router = Router();

function getCartOwner(req: AuthRequest) {
  if (req.user?.userId) return { userId: req.user.userId };
  const sid = req.headers["x-session-id"];
  return { sessionId: (Array.isArray(sid) ? sid[0] : sid) ?? "anon" };
}

async function buildCartResponse(userId?: number, sessionId?: string) {
  const condition = userId
    ? eq(cartItemsTable.userId, userId)
    : eq(cartItemsTable.sessionId, sessionId ?? "anon");

  const cartItems = await db.select().from(cartItemsTable).where(condition);
  if (cartItems.length === 0) return { items: [], subtotal: 0, shipping: 0, total: 0, itemCount: 0 };

  const allProducts = await db.select().from(productsTable);
  const productMap = new Map(allProducts.map(p => [p.id, p]));

  type CartItemResult = {
    id: number;
    productId: number;
    quantity: number;
    product: {
      id: number; name: string; slug: string; category: string; subcategory: string;
      description: string; price: number; salePrice: number | null; images: string[];
      rating: number; reviewCount: number; stock: number; skinTypes: string[];
      concerns: string[]; isBestSeller: boolean; isNewArrival: boolean; isFeatured: boolean;
    };
  };

  const items: CartItemResult[] = cartItems.flatMap(item => {
    const product = productMap.get(item.productId);
    if (!product) return [];
    return [{
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category,
        subcategory: product.subcategory,
        description: product.description,
        price: parseFloat(product.price),
        salePrice: product.salePrice ? parseFloat(product.salePrice) : null,
        images: product.images as string[],
        rating: parseFloat(product.rating),
        reviewCount: product.reviewCount,
        stock: product.stock,
        skinTypes: product.skinTypes as string[],
        concerns: product.concerns as string[],
        isBestSeller: product.isBestSeller,
        isNewArrival: product.isNewArrival,
        isFeatured: product.isFeatured,
      },
    }];
  });

  const subtotal = items.reduce((sum: number, item: CartItemResult) => {
    const price = item.product.salePrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + shipping;
  const itemCount = items.reduce((sum: number, item: CartItemResult) => sum + item.quantity, 0);

  return { items, subtotal, shipping, total, itemCount };
}

router.get("/cart", authenticateOptional, async (req: AuthRequest, res) => {
  try {
    const owner = getCartOwner(req);
    const cart = await buildCartResponse("userId" in owner ? owner.userId : undefined, "sessionId" in owner ? owner.sessionId : undefined);
    res.json(cart);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/cart", authenticateOptional, async (req: AuthRequest, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const owner = getCartOwner(req);
    const userId = "userId" in owner ? owner.userId : undefined;
    const sessionId = "sessionId" in owner ? (owner.sessionId as string) : undefined;

    const condition = userId
      ? and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, productId))
      : and(eq(cartItemsTable.sessionId, sessionId ?? "anon"), eq(cartItemsTable.productId, productId));

    const [existing] = await db.select().from(cartItemsTable).where(condition).limit(1);
    if (existing) {
      await db.update(cartItemsTable).set({ quantity: existing.quantity + quantity }).where(eq(cartItemsTable.id, existing.id));
    } else {
      await db.insert(cartItemsTable).values({
        userId: userId ?? null,
        sessionId: sessionId ?? null,
        productId,
        quantity,
      });
    }

    const cart = await buildCartResponse(userId, sessionId);
    res.json(cart);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/cart/:itemId", authenticateOptional, async (req: AuthRequest, res) => {
  try {
    const itemId = parseInt(String(req.params.itemId));
    const { quantity } = req.body;
    if (quantity <= 0) {
      await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
    } else {
      await db.update(cartItemsTable).set({ quantity }).where(eq(cartItemsTable.id, itemId));
    }
    const owner = getCartOwner(req);
    const cart = await buildCartResponse("userId" in owner ? owner.userId : undefined, "sessionId" in owner ? owner.sessionId : undefined);
    res.json(cart);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/cart/:itemId", authenticateOptional, async (req: AuthRequest, res) => {
  try {
    const itemId = parseInt(String(req.params.itemId));
    await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
    const owner = getCartOwner(req);
    const cart = await buildCartResponse("userId" in owner ? owner.userId : undefined, "sessionId" in owner ? owner.sessionId : undefined);
    res.json(cart);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/cart", authenticateOptional, async (req: AuthRequest, res) => {
  try {
    const owner = getCartOwner(req);
    if ("userId" in owner) {
      const uid = (owner as { userId: number }).userId;
      await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, uid));
    } else {
      await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, owner.sessionId));
    }
    res.json({ message: "Cart cleared" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
