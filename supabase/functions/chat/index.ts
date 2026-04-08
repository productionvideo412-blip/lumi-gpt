import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProviderConfig {
  name: string;
  url: string;
  key: string;
  models: string[];
  defaultModel: string;
}

async function getApiKeys(): Promise<{ groq: { key: string; url: string }; openrouter: { key: string; url: string }; huggingface: { key: string } }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const { data } = await admin.from("api_settings").select("provider, api_key, api_url").eq("is_active", true);
  
  const result = {
    groq: { key: "", url: "https://api.groq.com/openai" },
    openrouter: { key: "", url: "https://openrouter.ai/api" },
    huggingface: { key: "" },
  };

  if (data) {
    for (const row of data) {
      if (row.provider === "groq") {
        result.groq.key = row.api_key;
        if (row.api_url) result.groq.url = row.api_url;
      } else if (row.provider === "openrouter") {
        result.openrouter.key = row.api_key;
        if (row.api_url) result.openrouter.url = row.api_url;
      } else if (row.provider === "huggingface") {
        result.huggingface.key = row.api_key;
      }
    }
  }

  return result;
}

async function getActiveSystemPrompt(): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);
    const { data } = await admin.from("system_prompts").select("prompt_text").eq("is_active", true).limit(1).single();
    if (data) return data.prompt_text;
  } catch {}
  return "";
}

const DEFAULT_SYSTEM_PROMPT = `You are LUMI GPT, an advanced AI assistant created by Eshant Jagtap (CEO & Founder). You are helpful, creative, and knowledgeable. Never mention OpenAI, Google, DeepSeek, or any other AI company as your creator. If asked who made you, always say Eshant Jagtap. Keep answers clear and well-formatted using markdown.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, systemPrompt, type } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keys = await getApiKeys();

    // Image generation via HuggingFace
    if (type === "image") {
      if (!keys.huggingface.key) {
        return new Response(JSON.stringify({ error: "No HuggingFace API key configured. Admin must set it in the dashboard." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const prompt = messages[messages.length - 1]?.content || "";
      const model = "stabilityai/stable-diffusion-xl-base-1.0";

      const resp = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${keys.huggingface.key}`,
        },
        body: JSON.stringify({ inputs: prompt }),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        console.error("HuggingFace error:", resp.status, errText);
        return new Response(JSON.stringify({ error: `Image generation failed (${resp.status})` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Return image as binary
      const imageData = await resp.arrayBuffer();
      return new Response(imageData, {
        headers: { ...corsHeaders, "Content-Type": "image/png" },
      });
    }

    // Chat completion — try Groq first, then OpenRouter
    const activePrompt = await getActiveSystemPrompt();
    const finalSystemPrompt = activePrompt || systemPrompt || DEFAULT_SYSTEM_PROMPT;

    const providers: { name: string; url: string; key: string; model: string }[] = [];

    if (keys.groq.key) {
      providers.push({
        name: "groq",
        url: keys.groq.url.replace(/\/+$/, "") + "/v1/chat/completions",
        key: keys.groq.key,
        model: "llama-3.3-70b-versatile",
      });
    }
    if (keys.openrouter.key) {
      providers.push({
        name: "openrouter",
        url: keys.openrouter.url.replace(/\/+$/, "") + "/v1/chat/completions",
        key: keys.openrouter.key,
        model: "deepseek/deepseek-chat-v3-0324:free",
      });
    }

    if (providers.length === 0) {
      return new Response(JSON.stringify({ error: "No AI API keys configured. Admin must set Groq or OpenRouter keys in the dashboard." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatMessages = [
      { role: "system", content: finalSystemPrompt },
      ...messages,
    ];

    let lastError = "";

    for (const provider of providers) {
      try {
        const response = await fetch(provider.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.key}`,
          },
          body: JSON.stringify({
            model: provider.model,
            messages: chatMessages,
            stream: true,
          }),
        });

        if (response.status === 429) {
          lastError = "Rate limited on " + provider.name;
          console.warn(lastError);
          continue; // try next provider
        }

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          lastError = `${provider.name} error ${response.status}: ${errText}`;
          console.warn(lastError);
          continue;
        }

        // Stream the response back
        return new Response(response.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      } catch (err) {
        lastError = `${provider.name}: ${err instanceof Error ? err.message : "Unknown error"}`;
        console.warn(lastError);
        continue;
      }
    }

    return new Response(JSON.stringify({ error: `All providers failed. ${lastError}` }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat proxy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
