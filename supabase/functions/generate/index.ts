import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    const { prompt, type } = await req.json();
    const OPEN_SOURCE_API_URL = Deno.env.get("OPEN_SOURCE_API_URL");
    if (!OPEN_SOURCE_API_URL) throw new Error("OPEN_SOURCE_API_URL is not configured");

    const OPEN_SOURCE_API_KEY = Deno.env.get("OPEN_SOURCE_API_KEY");
    const OPEN_SOURCE_CHAT_MODEL = Deno.env.get("OPEN_SOURCE_CHAT_MODEL") ?? "llama-3-70b";
    const OPEN_SOURCE_IMAGE_MODEL = Deno.env.get("OPEN_SOURCE_IMAGE_MODEL") ?? "stable-diffusion-xl";

    if (!prompt || typeof prompt !== "string" || prompt.length > 2000) {
      return new Response(JSON.stringify({ error: "Invalid prompt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let isFreePlan = true;
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("plan, status, expiry_date")
          .eq("user_id", user.id)
          .single();
        if (sub && sub.plan !== "free" && sub.status === "active") {
          const expiry = sub.expiry_date ? new Date(sub.expiry_date) : null;
          if (!expiry || expiry > new Date()) {
            isFreePlan = false;
          }
        }
      }
    }

    let activeSystemPrompt = "";
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const adminClient = createClient(supabaseUrl, serviceKey);
      const { data: promptData } = await adminClient
        .from("system_prompts")
        .select("prompt_text")
        .eq("is_active", true)
        .limit(1)
        .single();
      if (promptData) activeSystemPrompt = promptData.prompt_text;
    } catch {}

    const systemPrompts: Record<string, string> = {
      video: "You are LUMI GPT, a creative AI created by Eshant Jagtap. Generate a detailed video script/storyboard. Never mention OpenAI, Google, or DeepSeek.",
      music: "You are LUMI GPT, a music composition AI created by Eshant Jagtap. Generate detailed music composition notes. Never mention OpenAI, Google, or DeepSeek.",
      website: "You are LUMI GPT, a web developer AI created by Eshant Jagtap. Generate complete HTML/CSS code. Never mention OpenAI, Google, or DeepSeek.",
      app: "You are LUMI GPT, an app designer AI created by Eshant Jagtap. Generate detailed app design specifications. Never mention OpenAI, Google, or DeepSeek.",
      edit: "You are LUMI GPT, an image editing AI created by Eshant Jagtap. Describe editing steps needed. Never mention OpenAI, Google, or DeepSeek.",
    };

    if (type === "image") {
      // Use local Stable Diffusion API
      const LOCAL_IMAGE_API_URL = Deno.env.get("LOCAL_IMAGE_API_URL") ?? "http://localhost:8001";
      
      try {
        const response = await fetch(`${normalizeUrl(LOCAL_IMAGE_API_URL)}/generate-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt,
            negative_prompt: "",
            num_inference_steps: 30,
            guidance_scale: 7.5,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error("Local image generation error:", response.status, errData);
          return new Response(JSON.stringify({ error: "Image generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const data = await response.json();
        const localImagePath = data?.image_path;
        
        // Return the image path for the frontend to fetch
        return new Response(JSON.stringify({ 
          imageUrl: `${normalizeUrl(LOCAL_IMAGE_API_URL)}${localImagePath}`,
          text: data.filename || "",
          watermark: false
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error calling local image API:", error);
        return new Response(JSON.stringify({ error: "Failed to connect to image generation service" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const finalSystemPrompt = activeSystemPrompt
      ? activeSystemPrompt + "\n\n" + (systemPrompts[type] || systemPrompts.video)
      : systemPrompts[type] || systemPrompts.video;

    const response = await fetch(`${normalizeUrl(OPEN_SOURCE_API_URL)}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(OPEN_SOURCE_API_KEY ? { Authorization: `Bearer ${OPEN_SOURCE_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: OPEN_SOURCE_CHAT_MODEL,
        messages: [
          { role: "system", content: finalSystemPrompt },
          { role: "user", content: prompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const text = await response.text();
      console.error("Text generation error:", response.status, text);
      return new Response(JSON.stringify({ error: "Generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
