import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazy initialize Gemini client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with increased limit for datasets
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API end points should be placed before Vite middleware

  // 1. Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 2. Generate written analytical summary
  app.post("/api/ai/insights", async (req, res) => {
    try {
      const { datasetName, columns, summaryStats, sampleRows, rowCount } = req.body;
      const ai = getGeminiClient();

      const prompt = `Analyze this dataset called "${datasetName || "Uploaded Dataset"}".
It contains ${rowCount} rows and the following columns: ${JSON.stringify(columns)}.
Here are pre-calculated column summary statistics:
${JSON.stringify(summaryStats, null, 2)}

Here is a sample of the first few rows:
${JSON.stringify(sampleRows, null, 2)}

Provide a highly professional and practical analytical summary of this dataset.
You must return your answer in valid JSON format only, conforming to this schema:
{
  "executiveSummary": "A crisp high-level summary paragraph of the dataset details, its size, focus, and overall health.",
  "trends": ["Key trend 1 with clear details", "Key trend 2 with clear details", ...],
  "anomalies": ["Suspicious item, duplicate, potential entry error, or major outlier with description", ...],
  "topPerformers": ["Top-performing category, product, or client with corresponding metrics", ...],
  "recommendations": ["Actionable corporate or strategic recommendation 1", "Actionable Corporate or strategic recommendation 2", ...]
}

Make sure your insights are fully aligned and customized to the visible labels and metrics from the provided structured data. Do not use generic explanations. Refuse to write generic intro/outro phrases, output only the parsed JSON string matching the specified schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: { type: Type.STRING },
              trends: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of key trends pointing to columns and value patterns",
              },
              anomalies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of outliers, empty fields or anomalies noticed in the sample/stats",
              },
              topPerformers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Identified leaders in counts, sums, or key categories",
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "At least 3 practical suggestions backed up by column figures",
              },
            },
            required: ["executiveSummary", "trends", "anomalies", "topPerformers", "recommendations"],
          },
        },
      });

      const text = response.text;
      res.json(JSON.parse(text || "{}"));
    } catch (error: any) {
      console.error("Insights Generation Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate analytical insights" });
    }
  });

  // 3. AI Chat Query API
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { datasetName, columns, summaryStats, sampleRows, rowCount, messages } = req.body;
      const ai = getGeminiClient();

      const systemInstruction = `You are SheetSense AI, an advanced, highly specialized web-based data analyst chatbot.
The user is inquiring about their dataset called "${datasetName || "Uploaded Dataset"}".
The dataset totals ${rowCount} rows with columns: ${JSON.stringify(columns)}.
Here are pre-calculated column statistics (min, max, totals, averages, distinct count as applicable):
${JSON.stringify(summaryStats, null, 2)}

Sample data (first several rows):
${JSON.stringify(sampleRows, null, 2)}

Guidelines:
- Answer the user's questions specifically and factually, referencing figures directly when applicable.
- Respond with clear, beautifully formatted Markdown (bold names, custom bullet points, and neat visual tables).
- Maintain an encouraging, analytics-focused professional persona.
- If answering a question requires complex logic outside the given facts or data, state that you are making an estimate based on the top rows/statistics or suggest how they can alter their spreadsheet context.
- Keep comments direct and user-friendly. No promotional fluff or clinical details.`;

      const contents: any[] = [];
      for (const msg of messages) {
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Chat API Error:", error);
      res.status(500).json({ error: error.message || "Failed to interact with Gemini API" });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
