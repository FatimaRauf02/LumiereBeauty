import { Router } from "express";
import Stripe from "stripe";
import { authenticate, type AuthRequest } from "../middlewares/authenticate";

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key);
}

router.post("/api/payments/create-intent", authenticate, async (req: AuthRequest, res) => {
  try {
    const stripe = getStripe();
    const { amount, currency = "usd" } = req.body as { amount: number; currency?: string };

    if (!amount || typeof amount !== "number" || amount <= 0) {
      res.status(400).json({ message: "Invalid amount" });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { userId: String(req.user?.userId ?? "") },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    req.log.error(err, "create-intent failed");
    res.status(500).json({ message: err.message ?? "Payment setup failed" });
  }
});

export default router;
