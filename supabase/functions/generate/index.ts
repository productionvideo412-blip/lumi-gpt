import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function addSunflowerWatermark(base64Image: string): string {
  // We'll add a text-based watermark indicator that the client will overlay
  // The actual watermark is handled client-side since we can't use Canvas in Deno easily
  return base64Image;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!prompt || typeof prompt !== "string" || prompt.length > 2000) {
      return new Response(JSON.stringify({ error: "Invalid prompt" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check user subscription for watermark
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

    // Fetch active system prompt
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

    // For image generation
    if (type === "image") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await response.text();
        console.error("Image gen error:", response.status, t);
        return new Response(JSON.stringify({ error: "Image generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      const text = data.choices?.[0]?.message?.content || "";

      return new Response(JSON.stringify({ imageUrl, text, watermark: isFreePlan }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For text generation
    const systemPrompts: Record<string, string> = {
      video: "You are LUMI GPT, a creative AI created by Eshant Jagtap. Generate a detailed video script/storyboard. Never mention OpenAI, Google, or DeepSeek.",
      music: "You are LUMI GPT, a music composition AI created by Eshant Jagtap. Generate detailed music composition notes. Never mention OpenAI, Google, or DeepSeek.",
      website: "You are LUMI GPT, a web developer AI created by Eshant Jagtap. Generate complete HTML/CSS code. Never mention OpenAI, Google, or DeepSeek.",
      app: "You are LUMI GPT, an app designer AI created by Eshant Jagtap. Generate detailed app design specifications. Never mention OpenAI, Google, or DeepSeek.",
      edit: "You are LUMI GPT, an image editing AI created by Eshant Jagtap. Describe editing steps needed. Never mention OpenAI, Google, or DeepSeek.",
    };

    const finalSystemPrompt = activeSystemPrompt
      ? activeSystemPrompt + "\n\n" + (systemPrompts[type] || systemPrompts.video)
      : systemPrompts[type] || systemPrompts.video;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
      return new Response(JSON.stringify({ error: "Generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
