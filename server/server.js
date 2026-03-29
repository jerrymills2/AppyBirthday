// Appy Birthday — AI Proxy Server
// Deploy this folder to Render.com (free tier)
// Set ANTHROPIC_API_KEY and PROXY_SECRET as environment variables in Render dashboard

const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors({ origin: "*" })); // Tighten to your app domain in production

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const PROXY_SECRET = process.env.PROXY_SECRET || "change-me-in-production";

// Auth middleware — app sends this token in every request header
const auth = (req, res, next) => {
  const token = req.headers["x-proxy-secret"];
  if (token !== PROXY_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Rate limiter — max 30 requests per IP per minute
const rateLimits = new Map();
const rateLimit = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const window = 60_000;
  const limit = 30;

  if (!rateLimits.has(ip)) rateLimits.set(ip, []);
  const timestamps = rateLimits.get(ip).filter((t) => now - t < window);
  timestamps.push(now);
  rateLimits.set(ip, timestamps);

  if (timestamps.length > limit) {
    return res.status(429).json({ error: "Too many requests. Slow down." });
  }
  next();
};

// Main AI endpoint — proxies to Anthropic
app.post("/api/ai", auth, rateLimit, async (req, res) => {
  try {
    const { model, max_tokens, messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-sonnet-4-6",
        max_tokens: Math.min(max_tokens || 1000, 2000),
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", err);
      return res.status(response.status).json({ error: "AI service error" });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Appy Birthday proxy running on port ${PORT}`);
});
