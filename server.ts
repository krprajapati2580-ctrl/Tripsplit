import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 20MB limit for base64 images
app.use(express.json({ limit: "20mb" }));

// Initialize Gemini SDK with User-Agent header and environment API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API Routes
app.post("/api/scan-receipt", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image content provided." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured on the server." });
    }

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || "image/jpeg",
      },
    };

    const textPart = {
      text: "Act as a highly accurate data extraction tool. Extract the 'Total Amount' and a short 'Description' of the expense from this receipt. Extract the amount as a number and the description as a brief string (e.g., 'Lunch at Honest Restaurant').",
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: "Instruct the model to act as a highly accurate data extraction tool. It must extract a list of items with their names, prices, and classifications, as well as a short 'Description' for the overall bill (e.g., 'Dinner at Honest Restaurant'). Classify each item as either 'FOOD' (for standard dishes, meals, beverages, or individual grocery/food items) or 'TAX' (for VAT, GST, service charge, tips, surcharge, packaging fee, or discount). The model must be instructed to accurately read the text even if the photo is taken from a skewed pov angle, is a tight macro lens close-up of a crumpled bill, or a macro wide angle shot that captures the entire messy dinner table in the background.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "A short descriptive name of the expense or merchant.",
            },
            items: {
              type: Type.ARRAY,
              description: "The list of individual dishes, items, and tax entries with their prices.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: "The name of the item or tax entry.",
                  },
                  price: {
                    type: Type.NUMBER,
                    description: "The price of the item or tax entry.",
                  },
                  type: {
                    type: Type.STRING,
                    enum: ["FOOD", "TAX"],
                    description: "The type of the item. FOOD for dishes, TAX for taxes/fees.",
                  },
                },
                required: ["name", "price", "type"],
              },
            },
          },
          required: ["description", "items"],
        },
      },
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error("No response text returned from Gemini.");
    }

    const parsed = JSON.parse(textResult);
    res.json({
      success: true,
      description: parsed.description,
      items: parsed.items || [],
    });
  } catch (error: any) {
    console.error("Error scanning receipt:", error);
    res.status(500).json({ error: error.message || "Failed to parse receipt with Gemini." });
  }
});

// Sync User Logins/Signups to Google Sheet Webhook (for free)
app.post("/api/log-user", async (req, res) => {
  try {
    const { name, email, mobile, customWebhookUrl } = req.body;

    const webhookUrl = customWebhookUrl || process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (!webhookUrl) {
      return res.json({
        success: true,
        synced: false,
        message: "Logged locally in browser. No remote Google Sheet webhook is configured."
      });
    }

    const payload = {
      timestamp: new Date().toISOString(),
      name: name || "Anonymous",
      email: email || "N/A",
      mobile: mobile || "N/A",
      source: "TripSplit React Web App"
    };

    // Forward the POST request to the Apps Script URL
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    res.json({
      success: true,
      synced: true,
      message: "Successfully synced with developer's Google Sheet!"
    });
  } catch (error: any) {
    console.error("Error logging user registration to Google Sheet webhook:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to synchronize registration."
    });
  }
});

// Serve Vite App
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
