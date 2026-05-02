import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { anthropic, BEAUTY_ADVISOR_SYSTEM } from "../lib/anthropic";
import { authenticateOptional, type AuthRequest } from "../middlewares/authenticate";

const router = Router();

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/#{1,6}\s*/g, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^[-*+•]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/([a-zA-Z])\n([a-zA-Z])/g, "$1 $2")
    .trim();
}

router.post("/chat", authenticateOptional, async (req: AuthRequest, res) => {
  try {
    const { message, history = [] } = req.body;

    const products = await db.select({
      id: productsTable.id,
      name: productsTable.name,
      category: productsTable.category,
      subcategory: productsTable.subcategory,
      price: productsTable.price,
      skinTypes: productsTable.skinTypes,
      concerns: productsTable.concerns,
      description: productsTable.description,
    }).from(productsTable).limit(40);

    const productContext = `Available products in our catalog:\n${products.map(p =>
      `- ${p.name} (${p.subcategory}, $${p.price}) for skin types: ${(p.skinTypes as string[]).join(", ")}, concerns: ${(p.concerns as string[]).join(", ")}`
    ).join("\n")}`;

    const messages = [
      ...history.slice(-6).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: `${BEAUTY_ADVISOR_SYSTEM}\n\n${productContext}`,
      messages,
    });

    const rawReply = response.content[0].type === "text" ? response.content[0].text : "I am here to help with your skincare needs!";
    const reply = stripMarkdown(rawReply);
    res.json({ reply });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
