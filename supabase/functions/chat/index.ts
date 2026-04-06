import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, systemPrompt } = await req.json();
    const OPEN_SOURCE_API_URL = Deno.env.get("OPEN_SOURCE_API_URL");
    if (!OPEN_SOURCE_API_URL) throw new Error("OPEN_SOURCE_API_URL is not configured");

    const OPEN_SOURCE_API_KEY = Deno.env.get("OPEN_SOURCE_API_KEY");
    const OPEN_SOURCE_CHAT_MODEL = Deno.env.get("OPEN_SOURCE_CHAT_MODEL") ?? "llama-3-70b";
    const OPEN_SOURCE_IMAGE_MODEL = Deno.env.get("OPEN_SOURCE_IMAGE_MODEL") ?? OPEN_SOURCE_CHAT_MODEL;

    const defaultSystem =
      "You are LUMI GPT, an advanced AI assistant created by Eshant Jagtap (CEO & Founder). You are helpful, creative, and knowledgeable. Never mention OpenAI, Google, DeepSeek, or any other AI company as your creator. If asked who made you, always say Eshant Jagtap. Use emojis occasionally. Keep answers clear and well-formatted using markdown.";

    const hasImages = messages.some((m: any) => Array.isArray(m.content) && m.content.some((c: any) => c.type === "image_url"));
    const model = hasImages ? OPEN_SOURCE_IMAGE_MODEL : OPEN_SOURCE_CHAT_MODEL;

    const response = await fetch(`${normalizeUrl(OPEN_SOURCE_API_URL)}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(OPEN_SOURCE_API_KEY ? { Authorization: `Bearer ${OPEN_SOURCE_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt || defaultSystem }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Open source model error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
