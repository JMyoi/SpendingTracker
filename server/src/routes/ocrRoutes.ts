import express from "express";
import multer from "multer";
import { createWorker } from "tesseract.js";
import fs from "fs";

const router = express.Router();

const upload = multer({
  dest: "uploads/",
});

function extractAmount(text: string): number | null {
  // First, try to find the amount near the word "TOTAL"
  const totalMatch = text.match(/TOTAL[:\s]*\$?(\d+(\.\d{1,2})?)/i);

  if (totalMatch) {
    return Number(totalMatch[1]);
  }

  // If no TOTAL is found, fall back to the largest price-like number
  const matches = text.match(/\$?\d+(\.\d{1,2})?/g);

  if (!matches || matches.length === 0) {
    return null;
  }

  const amounts = matches
    .map((item) => Number(item.replace("$", "")))
    .filter((num) => !isNaN(num));

  if (amounts.length === 0) {
    return null;
  }

  return Math.max(...amounts);
}

router.post("/", upload.single("receipt"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const worker = await createWorker("eng");

    const result = await worker.recognize(req.file.path);
    const text = result.data.text;

    await worker.terminate();

    const amount = extractAmount(text);

    fs.unlinkSync(req.file.path);

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