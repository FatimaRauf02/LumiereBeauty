import { Router } from "express";

const router = Router();

const subscribers = new Set<string>();

router.post("/newsletter/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ message: "Please enter a valid email address." });
      return;
    }
    subscribers.add(email.toLowerCase().trim());
    req.log?.info({ email }, "Newsletter subscription");
    res.json({ message: "You have been subscribed successfully! Welcome to the Lumière family." });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
