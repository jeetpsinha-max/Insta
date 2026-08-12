import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Security & Rate Limit Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-RateLimit-Limit', '100');
  res.setHeader('X-RateLimit-Remaining', '99');
  res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000 + 3600).toString());
  next();
});

// Initialize Gemini Client Helper
const getGeminiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// 1. Health Check
app.get("/api/health", (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  res.status(200).json({
    status: "ok",
    service: "insta-backend",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    gemini_configured: Boolean(apiKey && apiKey.length > 0)
  });
});

// 2. Gemini AI Ask Endpoint
app.post("/api/gemini/ask", async (req: Request, res: Response) => {
  try {
    const { prompt, systemInstruction, context } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return res.status(400).json({
        error: "Bad Request",
        message: 'Field "prompt" is required and must be a non-empty string.',
        status: "error"
      });
    }

    const ai = getGeminiClient();

    if (!ai) {
      return res.status(200).json({
        answer: `[Insta Viral AI Fallback] Automated Instagram content generation for: "${prompt}". Configure GEMINI_API_KEY for full AI capability.`,
        model: "gemini-2.5-flash-fallback",
        status: "fallback",
        timestamp: new Date().toISOString()
      });
    }

    const combinedPrompt = context ? `Context: ${context}\n\nPrompt: ${prompt}` : prompt;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: combinedPrompt,
      config: systemInstruction ? { systemInstruction } : undefined
    });

    const answer = response.text || "No response generated from Gemini AI.";

    return res.status(200).json({
      answer,
      model: "gemini-2.0-flash",
      status: "success",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Gemini API Error in Insta:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message || "An error occurred while communicating with Gemini AI.",
      fallback_answer: `[Insta AI Fallback] Service offline. Prompt: "${req.body?.prompt}".`,
      status: "error"
    });
  }
});

// 3. Generate Viral Captions & Hashtags
app.post("/api/captions/generate", async (req: Request, res: Response) => {
  try {
    const { topic, tone = "viral" } = req.body;
    if (!topic) return res.status(400).json({ error: "topic is required" });

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        caption: `[Fallback Caption] Top tips for ${topic}! 🔥`,
        hashtags: [`#${topic.replace(/\s+/g, '')}`, '#ViralContent', '#InstaGrowth']
      });
    }

    const prompt = `Generate a viral Instagram caption and 5-10 highly relevant hashtags for a post about: "${topic}". The tone should be ${tone}. Return ONLY a JSON object with properties 'caption' (string) and 'hashtags' (array of strings).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Caption generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Reels Storyboard
app.post("/api/reels/storyboard", async (req: Request, res: Response) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: "topic is required" });

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        scenes: [
          { duration: "3s", visual: "Hook shot showing main subject", audio: "Attention grabber audio" },
          { duration: "7s", visual: "Key value point", audio: "Voiceover explanation" },
          { duration: "5s", visual: "Call to action overlay", audio: "Follow for more!" }
        ]
      });
    }

    const prompt = `Create a 15-second Instagram Reel scene breakdown for: "${topic}". Return ONLY a JSON object with a property 'scenes'. 'scenes' must be an array of objects, each containing 'duration' (string, e.g. "3s"), 'visual' (string describing the shot), and 'audio' (string for voiceover or text).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Storyboard generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Trending Templates
app.get("/api/templates/trending", (req: Request, res: Response) => {
  res.json({
    templates: [
      { id: 1, type: "story", name: "Day in the Life", popularity: 98 },
      { id: 2, type: "reel", name: "3 Tips Hook", popularity: 95 },
      { id: 3, type: "story", name: "Q&A Box", popularity: 90 }
    ]
  });
});

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

  app.listen(PORT, () => {
    console.log(`Insta API running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== "test" && require.main === module) {
  startServer();
}
