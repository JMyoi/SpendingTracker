import express from "express";
import multer from "multer";
import OpenAI from "openai";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", upload.single("receipt"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No image uploaded",
      });
    }

    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const prompt = [
      "Analyze this receipt image and return ONLY valid JSON.",
      "",
      "Return this exact format:",
      "{",
      '  "merchant": "",',
      '  "date": "",',
      '  "total": null,',
      '  "items": [',
      "    {",
      '      "name": "",',
      '      "price": null',
      "    }",
      "  ],",
      '  "categorySuggestion": "",',
      '  "rawText": ""',
      "}",
      "",
      "Rules:",
      "- total should be the final amount paid.",
      "- Do not use subtotal, tax, cash, change, or card balance as total.",
      "- If a value is unclear, use null or an empty string.",
      "- Do not include markdown.",
    ].join("\n");

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",

      messages: [
        {
          role: "user",

          content: [
            {
              type: "text",
              text: prompt,
            },

            {
              type: "image_url",

              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0].message.content || "{}";

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(500).json({
        error: "Failed to parse OpenAI response",
        rawResponse: content,
      });
    }

    res.json({
      text: parsed.rawText,
      amount: parsed.total,
      merchant: parsed.merchant,
      date: parsed.date,
      items: parsed.items,
      categorySuggestion: parsed.categorySuggestion,
    });

  } catch (error) {
    console.error("OpenAI OCR error:", error);

    res.status(500).json({
      error: "Failed to process image",
    });
  }
});

export default router;