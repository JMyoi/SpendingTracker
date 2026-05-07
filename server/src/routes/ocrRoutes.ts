import express from "express";
import multer from "multer";
import OpenAI from "openai";
import sharp from "sharp";

const router = express.Router();

const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const allowedCategories = [
  "Food",
  "Food & Dining",
  "Groceries",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills",
  "Bills & Utilities",
  "Health",
  "Healthcare",
  "Personal Care",
  "Education",
  "Travel",
  "Subscriptions",
  "Other",
] as const;

type TransactionCategory = (typeof allowedCategories)[number];

type SourceType =
  | "receipt"
  | "bank_statement"
  | "transaction_screenshot"
  | "unknown";

interface ExtractedTransaction {
  title: string;
  amount: number;
  date: string | null;
  category: TransactionCategory;
  description: string;
}

interface ExtractionResponse {
  transactions: ExtractedTransaction[];
  source_type: SourceType;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error("Unsupported file type"));
    }

    callback(null, true);
  },
});

function uploadReceipt(req: express.Request, res: express.Response) {
  return new Promise<void>((resolve, reject) => {
    upload.single("receipt")(req, res, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function createOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

async function isAnimatedGif(buffer: Buffer) {
  try {
    const metadata = await sharp(buffer, { animated: true }).metadata();
    return (metadata.pages ?? 1) > 1;
  } catch {
    throw new Error("Invalid image file");
  }
}

function isSourceType(value: unknown): value is SourceType {
  return (
    value === "receipt" ||
    value === "bank_statement" ||
    value === "transaction_screenshot" ||
    value === "unknown"
  );
}

function normalizeDate(value: unknown) {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const parsedDate = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return trimmed;
}

function normalizeCategory(value: unknown): TransactionCategory {
  if (
    typeof value === "string" &&
    allowedCategories.includes(value as TransactionCategory)
  ) {
    return value as TransactionCategory;
  }

  return "Other";
}

function normalizeExtraction(value: unknown): ExtractionResponse {
  if (!value || typeof value !== "object") {
    return { transactions: [], source_type: "unknown" };
  }

  const raw = value as Record<string, unknown>;
  const sourceType = isSourceType(raw.source_type) ? raw.source_type : "unknown";
  const rawTransactions = Array.isArray(raw.transactions)
    ? raw.transactions
    : [];

  const transactions = rawTransactions
    .map((transaction) => {
      if (!transaction || typeof transaction !== "object") {
        return null;
      }

      const rawTransaction = transaction as Record<string, unknown>;
      const title =
        typeof rawTransaction.title === "string"
          ? rawTransaction.title.trim()
          : "";
      const amount = Number(rawTransaction.amount);

      if (!title || !Number.isFinite(amount) || amount <= 0) {
        return null;
      }

      return {
        title,
        amount: Number(amount.toFixed(2)),
        date: normalizeDate(rawTransaction.date),
        category: normalizeCategory(rawTransaction.category),
        description:
          typeof rawTransaction.description === "string"
            ? rawTransaction.description.trim()
            : "",
      };
    })
    .filter((transaction): transaction is ExtractedTransaction =>
      Boolean(transaction),
    );

  return {
    transactions,
    source_type: transactions.length > 0 ? sourceType : "unknown",
  };
}

const transactionExtractionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["transactions", "source_type"],
  properties: {
    transactions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "amount", "date", "category", "description"],
        properties: {
          title: {
            type: "string",
            description: "Merchant or payee name.",
          },
          amount: {
            type: "number",
            description: "Positive transaction amount with no currency symbol.",
          },
          date: {
            anyOf: [
              {
                type: "string",
                description: "Transaction date in YYYY-MM-DD format.",
              },
              { type: "null" },
            ],
          },
          category: {
            type: "string",
            enum: allowedCategories,
          },
          description: {
            type: "string",
            description:
              "Extra visible detail, including refund or credit notes when applicable.",
          },
        },
      },
    },
    source_type: {
      type: "string",
      enum: [
        "receipt",
        "bank_statement",
        "transaction_screenshot",
        "unknown",
      ],
    },
  },
} as const;

router.post("/", async (req, res) => {
  try {
    await uploadReceipt(req, res);

    if (!req.file) {
      return res.status(400).json({
        error: "No image uploaded",
      });
    }

    const mimeType = req.file.mimetype;

    if (mimeType === "image/gif" && (await isAnimatedGif(req.file.buffer))) {
      return res.status(400).json({
        error: "Animated GIFs are not supported",
      });
    }

    const openai = createOpenAIClient();
    const base64Image = req.file.buffer.toString("base64");

    const prompt = [
      "You are a financial data extraction assistant.",
      "Analyze this image, which may be a receipt, bank statement, or transaction screenshot from a bank, credit card, payment app, or store.",
      "",
      "Extract every clearly visible individual purchase or transaction.",
      "",
      "Rules:",
      "- Do not guess amounts, dates, merchants, or payees.",
      "- Amounts must be positive numbers with no currency symbols.",
      "- If a transaction is a refund or credit, include it only if clearly visible and note that in description.",
      "- Skip bank fees such as overdraft fees or monthly service fees unless they clearly look like real purchases.",
      "- Use the merchant or payee name as title, not a generic label.",
      "- Use null for date when no transaction date is clearly visible.",
      "- If no readable transactions exist, return an empty transactions array and source_type unknown.",
    ].join("\n");

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "transaction_extraction",
          strict: true,
          schema: transactionExtractionSchema,
        },
      },
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
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1200,
    });

    const content = response.choices[0].message.content || "{}";

    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(500).json({
        error: "Failed to parse OpenAI response",
      });
    }

    res.json(normalizeExtraction(parsed));
  } catch (error) {
    console.error("OpenAI OCR error:", error);

    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        error:
          error.code === "LIMIT_FILE_SIZE"
            ? "Image must be 10MB or smaller"
            : "Invalid image upload",
      });
    }

    if (
      error instanceof Error &&
      error.message === "Unsupported file type"
    ) {
      return res.status(400).json({
        error:
          "Unsupported file type. Please upload a PNG, JPEG, WEBP, or GIF image.",
      });
    }

    if (
      error instanceof Error &&
      error.message === "Invalid image file"
    ) {
      return res.status(400).json({
        error: "Invalid image file",
      });
    }

    if (
      error instanceof Error &&
      error.message === "OPENAI_API_KEY is not configured"
    ) {
      return res.status(500).json({
        error: "OpenAI API key is not configured",
      });
    }

    res.status(500).json({
      error: "Failed to process image",
    });
  }
});

export default router;
