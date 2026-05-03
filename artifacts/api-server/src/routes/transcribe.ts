import { Router } from "express";
import OpenAI, { toFile } from "openai";
import type { AuthRequest } from "../middlewares/authenticate";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "placeholder",
});

router.post("/transcribe", async (req: AuthRequest, res) => {
  try {
    const { audio, mimeType } = req.body as { audio?: string; mimeType?: string };
    if (!audio) {
      res.status(400).json({ message: "No audio data provided" });
      return;
    }

    const mime = mimeType ?? "audio/webm";
    const ext = mime.includes("webm") ? "webm"
      : mime.includes("mp4") ? "mp4"
      : mime.includes("ogg") ? "ogg"
      : mime.includes("wav") ? "wav"
      : "webm";

    const buffer = Buffer.from(audio, "base64");

    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(buffer, `audio.${ext}`, { type: mime }),
      model: "gpt-4o-mini-transcribe",
      response_format: "json",
    });

    res.json({ transcript: transcription.text ?? "" });
  } catch (err) {
    req.log.error(err, "Transcription error");
    res.status(500).json({ message: "Transcription failed. Please type your message instead." });
  }
});

export default router;
