import { Router } from "express";

const router = Router();

const COUPONS: Record<string, { discount: number; label: string }> = {
  GLOW10: { discount: 10, label: "10% off your order" },
  BEAUTY5: { discount: 5, label: "5% off your order" },
  LUMIERE15: { discount: 15, label: "15% off your order" },
  WELCOME10: { discount: 10, label: "10% off for new customers" },
};

router.post("/coupons/validate", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ message: "Please enter a coupon code." });
      return;
    }
    const coupon = COUPONS[String(code).toUpperCase().trim()];
    if (!coupon) {
      res.status(404).json({ message: "Invalid coupon code. Please check and try again." });
      return;
    }
    res.json({ code: String(code).toUpperCase().trim(), discount: coupon.discount, label: coupon.label });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
