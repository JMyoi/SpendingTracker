import express from "express";
import multer from "multer";
import { createWorker } from "tesseract.js";
import fs from "fs";
import sharp from "sharp";
import path from "path";

const router = express.Router();

const upload = multer({
  dest: "uploads/",
});

function extractAmount(text: string): number | null {
  const lines = text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const moneyRegex = /\$?\s*\d+([.,]\d{2})/g;

  const badKeywords = ["cash", "change", "tax", "subtotal", "visa", "mastercard", "card"];
  const totalKeywords = ["total amount", "grand total", "amount due", "balance due", "total"];

  // Prefer lines with TOTAL-related keywords
  for (const line of lines) {
    const lower = line.toLowerCase();

    const hasTotal = totalKeywords.some(keyword => lower.includes(keyword));
    const isBad = badKeywords.some(keyword => lower.includes(keyword));

    if (hasTotal && !isBad) {
      const matches = line.match(moneyRegex);
      if (matches && matches.length > 0) {
        const last = matches[matches.length - 1];
        return Number(last.replace("$", "").replace(/\s/g, "").replace(",", "."));
      }
    }
  }

  // Fallback: ignore cash/change lines, then use largest remaining amount
  const amounts: number[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (badKeywords.some(keyword => lower.includes(keyword))) {
      continue;
    }

    const matches = line.match(moneyRegex);
    if (matches) {
      for (const item of matches) {
        const value = Number(item.replace("$", "").replace(/\s/g, "").replace(",", "."));
        if (!isNaN(value)) amounts.push(value);
      }
    }
  }

  return amounts.length > 0 ? Math.max(...amounts) : null;
}

router.post("/", upload.single("receipt"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const processedPath = path.join("uploads", `processed-${req.file.filename}.png`);

await sharp(req.file.path)
  .resize({ width: 1600 })
  .grayscale()
  .normalize()
  .sharpen()
  .threshold(180)
  .toFile(processedPath);

    const worker = await createWorker("eng");

    const result = await worker.recognize(processedPath);
    const text = result.data.text;

    await worker.terminate();

    const amount = extractAmount(text);

    
    fs.unlinkSync(req.file.path);
    fs.unlinkSync(processedPath);

    res.json({
      text,
      amount,
    });
  } catch (error) {
    console.error("OCR error:", error);
    res.status(500).json({ error: "Failed to process image" });
  }
});

export default router;