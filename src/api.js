// Replace PROXY_URL with your actual Render.com URL after deployment
const PROXY_URL = "https://your-app-name.onrender.com";
const PROXY_SECRET = "your-secret-token"; // Must match PROXY_SECRET env var on Render

export const callAI = async (prompt, maxTokens = 1000) => {
  const res = await fetch(`${PROXY_URL}/api/ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-proxy-secret": PROXY_SECRET,
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error("AI request failed");
  const data = await res.json();
  return data.content?.[0]?.text || "";
};
