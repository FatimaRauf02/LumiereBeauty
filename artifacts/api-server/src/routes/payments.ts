import { Router } from "express";
import Stripe from "stripe";
import { authenticate, type AuthRequest } from "../middlewares/authenticate";

const router = Router();

/* =========================
   STRIPE INIT (SAFE)
========================= */

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  return new Stripe(key, {
    apiVersion: "2025-04-30.basil",
  });
}

/* =========================
   CREATE PAYMENT INTENT
========================= */

router.post(
  "/api/payments/create-intent",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const stripe = getStripe();

      const { amount, currency = "usd" } = req.body as {
        amount: number;
        currency?: string;
      };

      // validation
      if (!amount || typeof amount !== "number" || amount <= 0) {
        res.status(400).json({
          message: "Invalid amount",
        });
        return;
      }

      /* =========================
         CREATE STRIPE PAYMENT INTENT
      ========================= */

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // dollars → cents
        currency,

        // modern Stripe recommended method
        automatic_payment_methods: {
          enabled: true,
        },

        metadata: {
          userId: String(req.user?.userId ?? ""),
        },
      });

      /* =========================
         SEND CLIENT SECRET TO FRONTEND
      ========================= */

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (err: any) {
      req.log?.error?.(err, "create-intent failed");

      res.status(500).json({
        message: err.message ?? "Payment setup failed",
      });
    }
  }
);

export default router;