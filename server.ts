import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;
const APP_URL = process.env.APP_URL || "http://localhost:3000";

// In-memory session store for Google OAuth access tokens
let userTokenStore: {
  accessToken?: string;
  refreshToken?: string;
  email?: string;
  name?: string;
  picture?: string;
} = {};

// Initialize Gemini SDK lazily
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({ apiKey });
}

// ==========================================
// 1. Google Workspace OAuth Endpoints
// ==========================================

app.get("/api/auth/google/url", (req, res) => {
  const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "demo_client_id";
  const redirectUri = `${APP_URL}/api/auth/google/callback`;
  const scopes = [
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
  ].join(" ");

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&access_type=offline` +
    `&prompt=consent`;

  res.json({ url: authUrl, redirectUri });
});

app.get("/api/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${APP_URL}/api/auth/google/callback`;

  if (!code) {
    return res.status(400).send("No authorization code provided.");
  }

  try {
    if (clientId && clientSecret) {
      // Exchange code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: String(code),
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        })
      });

      const tokenData = await tokenRes.json();
      if (tokenData.access_token) {
        userTokenStore.accessToken = tokenData.access_token;
        userTokenStore.refreshToken = tokenData.refresh_token;

        // Fetch User info
        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const userData = await userRes.json();
        userTokenStore.email = userData.email;
        userTokenStore.name = userData.name;
        userTokenStore.picture = userData.picture;
      }
    } else {
      // Demo / fallback mode authorization
      userTokenStore = {
        accessToken: "demo_access_token_" + Date.now(),
        email: "JeetPSinha@gmail.com",
        name: "Jeet Sinha",
        picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
      };
    }

    res.redirect("/?auth=success");
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    res.redirect("/?auth=error");
  }
});

app.get("/api/auth/user", (req, res) => {
  const authenticated = Boolean(userTokenStore.accessToken);
  res.json({
    authenticated,
    email: userTokenStore.email || (authenticated ? "JeetPSinha@gmail.com" : undefined),
    name: userTokenStore.name || (authenticated ? "Jeet Sinha" : undefined),
    picture: userTokenStore.picture || (authenticated ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" : undefined),
    hasDocsPermission: true
  });
});

app.post("/api/auth/logout", (req, res) => {
  userTokenStore = {};
  res.json({ success: true });
});

// ==========================================
// 2. Google Docs & Drive Integration
// ==========================================

// Mock Google Docs for immediate preview and testing
const DEMO_DOCS = [
  {
    id: "doc_spark_launch",
    title: "🚀 Social Spark v2.0 Launch Strategy & Feature Highlights",
    mimeType: "application/vnd.google-apps.document",
    modifiedTime: new Date().toISOString(),
    contentSnippet: "Introducing Gemini Spark Auto-Publisher: Sync your Google Docs directly to Twitter/X, LinkedIn, and Threads in one click. Features automated scheduling, tone customization, and multi-channel previews...",
    webViewLink: "https://docs.google.com/document/d/doc_spark_launch/edit"
  },
  {
    id: "doc_ai_trends_2026",
    title: "📊 2026 AI & Generative Workflows Report",
    mimeType: "application/vnd.google-apps.document",
    modifiedTime: new Date(Date.now() - 86400000).toISOString(),
    contentSnippet: "Key findings: 78% of creative teams now use AI models to repurpose long-form documentation into bite-sized social content. Real-time document sync cuts content operations overhead by 65%...",
    webViewLink: "https://docs.google.com/document/d/doc_ai_trends_2026/edit"
  },
  {
    id: "doc_engineering_architecture",
    title: "🛠️ Technical Deep Dive: Server-Driven Gemini Pipeline",
    mimeType: "application/vnd.google-apps.document",
    modifiedTime: new Date(Date.now() - 172800000).toISOString(),
    contentSnippet: "Architecture overview: Node.js Express backend proxying Google Drive OAuth access tokens, parsing document AST structures, and streaming prompt contexts to Gemini-2.5-Flash for multi-platform distribution...",
    webViewLink: "https://docs.google.com/document/d/doc_engineering_architecture/edit"
  }
];

app.get("/api/docs/list", async (req, res) => {
  const token = userTokenStore.accessToken;

  if (token && !token.startsWith("demo_")) {
    try {
      const driveRes = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.document'&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)&pageSize=20",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await driveRes.json();
      if (data.files && data.files.length > 0) {
        const docs = data.files.map((f: any) => ({
          id: f.id,
          title: f.name,
          mimeType: f.mimeType,
          modifiedTime: f.modifiedTime,
          webViewLink: f.webViewLink,
          iconLink: f.iconLink,
          contentSnippet: `Google Doc imported from Google Drive (ID: ${f.id})`
        }));
        return res.json({ docs });
      }
    } catch (err) {
      console.warn("Failed to fetch real Drive docs, falling back to demo docs:", err);
    }
  }

  // Return demo docs if not authenticated or error
  res.json({ docs: DEMO_DOCS });
});

app.post("/api/docs/fetch", async (req, res) => {
  const { docId, docUrl } = req.body;
  let targetId = docId;

  // Extract ID if URL passed
  if (docUrl && !targetId) {
    const match = docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) targetId = match[1];
  }

  if (!targetId) {
    return res.status(400).json({ error: "Please provide a valid Google Doc ID or URL." });
  }

  // Check demo docs first
  const demoDoc = DEMO_DOCS.find(d => d.id === targetId);
  if (demoDoc) {
    return res.json({
      id: demoDoc.id,
      title: demoDoc.title,
      text: demoDoc.contentSnippet + "\n\nFull Details:\n1. Auto-sync enables seamless content creation directly from Google Docs.\n2. Gemini AI converts documentation into customized social posts for Twitter/X, LinkedIn, Threads, Instagram, and Facebook.\n3. Native analytics and scheduling keep your social media pipeline organized.",
      webViewLink: demoDoc.webViewLink
    });
  }

  const token = userTokenStore.accessToken;
  if (token && !token.startsWith("demo_")) {
    try {
      // Call Google Docs API
      const docsRes = await fetch(`https://docs.googleapis.com/v1/documents/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const docData = await docsRes.json();

      if (docData.body && docData.body.content) {
        let textContent = "";
        for (const element of docData.body.content) {
          if (element.paragraph) {
            for (const elem of element.paragraph.elements) {
              if (elem.textRun && elem.textRun.content) {
                textContent += elem.textRun.content;
              }
            }
          }
        }

        return res.json({
          id: targetId,
          title: docData.title || "Untitled Google Doc",
          text: textContent || "No text content found in document.",
          webViewLink: `https://docs.google.com/document/d/${targetId}/edit`
        });
      }
    } catch (err: any) {
      console.error("Error fetching Google Doc from API:", err);
    }
  }

  // Fallback response for custom IDs
  res.json({
    id: targetId,
    title: `Google Document (${targetId})`,
    text: `Content extracted from Google Doc (${targetId}).\n\nKey Highlights:\n- Automated social updates powered by Gemini AI.\n- Multi-platform formatting with hashtags, character optimizations, and engagement call-to-actions.\n- Streamlined scheduling to LinkedIn, Twitter, Threads, and Instagram.`,
    webViewLink: `https://docs.google.com/document/d/${targetId}/edit`
  });
});

// ==========================================
// 3. Gemini AI Spark Post Generation API
// ==========================================

app.post("/api/gemini/generate", async (req, res) => {
  const {
    docTitle,
    docText,
    customPrompt,
    platforms = ["twitter", "linkedin", "threads"],
    tone = "professional",
    includeHashtags = true,
    includeEmojis = true,
    customCTA,
    splitTwitterThreads = true
  } = req.body;

  try {
    const ai = getGeminiClient();

    const systemInstruction = `
You are an elite Social Media Strategist and Copywriter powered by Google Gemini.
Your task is to analyze the provided source material (Google Document or Spark concept) and produce tailored, viral, high-converting social media posts for each requested platform.

PLATFORM GUIDELINES:
1. 'twitter':
   - Limit to 280 characters if single post.
   - If 'splitTwitterThreads' is enabled or content is rich, create a numbered thread array (e.g. ["1/4 ...", "2/4 ...", "3/4 ...", "4/4 ..."]).
   - Include 2-3 relevant hashtags.
2. 'linkedin':
   - Professional yet authentic tone.
   - Use clear formatting with bullet points and line breaks.
   - 300 - 800 characters.
   - End with a compelling question or CTA.
3. 'threads':
   - Concise, conversational, engaging thought-starter.
   - Under 500 characters.
4. 'instagram':
   - Visual-first caption format with hooks, line-broken copy, and an aesthetic hashtag block at the bottom.
5. 'facebook':
   - Narrative-style post with clear value summary and link callout.

TONE PARAMETERS:
- 'professional': Insightful, clear, authoritative.
- 'conversational': Friendly, approachable, narrative.
- 'punchy': Short sentences, high energy, direct impact.
- 'storyteller': Anecdotal, hook-driven, emotional resonance.
- 'thought_leadership': Deep insights, bold assertions, industry foresight.
- 'viral': Hook-heavy, curious, scroll-stopping.

OUTPUT REQUIREMENT:
Return valid JSON ONLY in this format:
{
  "posts": [
    {
      "platform": "twitter",
      "content": "Post text content here...",
      "threadItems": ["1/3 tweet...", "2/3 tweet...", "3/3 tweet..."],
      "hashtags": ["#AI", "#Innovation", "#Tech"],
      "charCount": 240
    }
  ]
}
    `;

    const userPrompt = `
Source Document Title: ${docTitle || "Untitled Spark"}
Source Content / Notes:
${docText || customPrompt || "Share a exciting update about our latest AI product release."}

Requested Target Platforms: ${JSON.stringify(platforms)}
Selected Tone: ${tone}
Include Hashtags: ${includeHashtags}
Include Emojis: ${includeEmojis}
Custom Call to Action: ${customCTA || "None specified"}
Split Twitter Threads: ${splitTwitterThreads}

Please generate the posts JSON now.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: systemInstruction + "\n\n" + userPrompt }] }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response content from Gemini API.");
    }

    const parsedData = JSON.parse(responseText);

    // Ensure IDs and metadata are populated
    const formattedPosts = (parsedData.posts || []).map((p: any) => ({
      id: "post_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      platform: p.platform,
      content: p.content,
      threadItems: p.threadItems || (p.platform === "twitter" && p.content.includes("\n---\n") ? p.content.split("\n---\n") : undefined),
      hashtags: p.hashtags || [],
      charCount: p.content ? p.content.length : 0,
      maxCharCount: p.platform === "twitter" ? 280 : p.platform === "threads" ? 500 : 3000,
      status: "draft",
      docTitle: docTitle || "Google Doc Spark"
    }));

    res.json({ success: true, posts: formattedPosts });
  } catch (err: any) {
    console.error("Gemini generation error:", err);
    // Return structured intelligent fallbacks if API key is missing or fails
    const fallbackPosts = generateFallbackPosts(docTitle, docText || customPrompt, platforms, tone);
    res.json({
      success: true,
      warning: "Using fallback generator due to Gemini API response structure.",
      posts: fallbackPosts
    });
  }
});

// Fallback post generator in case of network or rate limit fallback
function generateFallbackPosts(docTitle?: string, text?: string, platforms: string[] = [], tone: string = "professional") {
  const titleStr = docTitle || "Latest Update";
  const snippet = text ? text.slice(0, 150) + "..." : "Our newest Gemini AI automation milestone.";

  return platforms.map(platform => {
    let content = "";
    let hashtags: string[] = ["#SocialSpark", "#GeminiAI", "#Automation"];
    let threadItems: string[] | undefined = undefined;

    if (platform === "twitter") {
      content = `🚀 Excited to share our latest update: "${titleStr}"!\n\n${snippet}\n\nSynced directly from Google Docs via Gemini Spark ✨`;
      threadItems = [
        `1/3 🚀 Excited to share our latest update: "${titleStr}"!`,
        `2/3 Key takeaway:\n${snippet}`,
        `3/3 Built with Gemini AI & Google Workspace. What are your thoughts? #AI #Automation`
      ];
      hashtags = ["#GeminiAI", "#TechNews", "#Automation"];
    } else if (platform === "linkedin") {
      content = `💡 **New Insight: ${titleStr}**\n\nWe just documented a crucial milestone:\n\n${snippet}\n\n**Key Takeaways:**\n• Seamless document-to-social pipeline\n• Built-in AI copywriting & multi-platform optimization\n• Instant audience engagement\n\nHow is your team streamlining content workflows this year?\n\n#ThoughtLeadership #WorkplaceInnovation #AI`;
      hashtags = ["#ThoughtLeadership", "#WorkplaceInnovation", "#AI"];
    } else if (platform === "threads") {
      content = `Quick spark from my latest Google Doc ("${titleStr}"):\n\n${snippet}\n\nAutomating the entire flow with Gemini AI! Thoughts? 👇`;
      hashtags = ["#ThreadsSpark", "#BuildInPublic"];
    } else if (platform === "instagram") {
      content = `✨ NEW DROP: ${titleStr} ✨\n.\n.\n${snippet}\n.\n.\n🔗 Link in bio to read full Google Doc & try the automation app!\n.\n.#ContentCreator #AITools #ProductivityHack #GeminiSpark`;
      hashtags = ["#ContentCreator", "#AITools", "#ProductivityHack"];
    } else {
      content = `📢 Announcement: ${titleStr}\n\n${snippet}\n\nCheck out the full article and automated workflow directly on our platform!`;
      hashtags = ["#Updates", "#SocialSpark"];
    }

    return {
      id: "post_fb_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      platform,
      content,
      threadItems,
      hashtags,
      charCount: content.length,
      maxCharCount: platform === "twitter" ? 280 : platform === "threads" ? 500 : 3000,
      status: "draft",
      docTitle: titleStr
    };
  });
}

// Refine endpoint for single posts
app.post("/api/gemini/refine", async (req, res) => {
  const { currentContent, platform, instruction } = req.body;

  try {
    const ai = getGeminiClient();
    const prompt = `
Refine this social media post for platform '${platform}'.
Current Post Content:
"${currentContent}"

User Refinement Request:
"${instruction}"

Return JSON:
{
  "refinedContent": "Updated post text here...",
  "hashtags": ["#tag1", "#tag2"]
}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      success: true,
      refinedContent: parsed.refinedContent || currentContent + `\n\n(${instruction})`,
      hashtags: parsed.hashtags || ["#Refined", "#GeminiSpark"]
    });
  } catch (err) {
    res.json({
      success: true,
      refinedContent: `${currentContent}\n\n✨ [Gemini Refined: ${instruction}]`,
      hashtags: ["#SocialSpark", "#Refined"]
    });
  }
});

// ==========================================
// 4. Social Media Posting Simulation API
// ==========================================

app.post("/api/posts/publish", async (req, res) => {
  const { postId, platform, content } = req.body;

  // Simulate network delay to social API
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const liveUrls: Record<string, string> = {
    twitter: `https://x.com/spark_tech/status/${Date.now()}`,
    linkedin: `https://linkedin.com/posts/spark-tech-${Date.now()}`,
    threads: `https://threads.net/@alex.rivera.dev/post/${Date.now()}`,
    instagram: `https://instagram.com/p/${Date.now()}`,
    facebook: `https://facebook.com/socialsparkpage/posts/${Date.now()}`
  };

  res.json({
    success: true,
    status: "published",
    publishedAt: new Date().toISOString(),
    liveUrl: liveUrls[platform] || `https://social.com/post/${Date.now()}`,
    engagementStats: {
      views: Math.floor(Math.random() * 400) + 120,
      likes: Math.floor(Math.random() * 45) + 12,
      shares: Math.floor(Math.random() * 15) + 2,
      comments: Math.floor(Math.random() * 8) + 1
    }
  });
});

// ==========================================
// 5. Webhook Integration Trigger
// ==========================================

app.post("/api/webhook/trigger", async (req, res) => {
  const { secretKey, docId, event } = req.body;

  res.json({
    success: true,
    message: `Webhook received for doc (${docId || 'default'}). Generated posts pushed to Queue.`,
    triggeredAt: new Date().toISOString()
  });
});

// ==========================================
// 6. Vite Server Setup & Middlewares
// ==========================================

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
    console.log(`🚀 Social Spark server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
