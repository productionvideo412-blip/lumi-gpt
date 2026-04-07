import { callGroq, GROQ_MODEL_LIST } from "@/services/providers/groq";
import { callOpenRouter, OPENROUTER_CHAT_MODEL_LIST } from "@/services/providers/openrouter";
import { resolveApiKey } from "@/services/apiKeys";

export type ChatProvider = "groq" | "openrouter" | "auto";

export interface ChatOptions {
  messages: { role: string; content: string }[];
  systemPrompt: string;
  provider?: ChatProvider;
  model?: string;
  signal?: AbortSignal;
  onDelta: (text: string) => void;
  onDone: () => void;
}

async function parseSSEStream(resp: Response, onDelta: (text: string) => void) {
  if (!resp.body) return;
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || !line.trim() || !line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") return;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
}

export async function sendChatMessage(options: ChatOptions) {
  const { messages, systemPrompt, provider = "auto", model, signal, onDelta, onDone } = options;

  const providers: ChatProvider[] =
    provider === "auto" ? ["groq", "openrouter"] : [provider];

  for (const p of providers) {
    try {
      const apiKey = await resolveApiKey(p);
      if (!apiKey) {
        if (provider !== "auto") {
          throw new Error(`No API key configured for ${p}. Set it in Settings or ask your admin.`);
        }
        continue;
      }

      let resp: Response;

      if (p === "groq") {
        const defaultModel = model || "llama-3.3-70b-versatile";
        resp = await callGroq({ apiKey, model: defaultModel, messages, systemPrompt, stream: true });
      } else {
        const defaultModel = model || "deepseek/deepseek-chat-v3-0324:free";
        resp = await callOpenRouter({ apiKey, model: defaultModel, messages, systemPrompt, stream: true });
      }

      await parseSSEStream(resp, onDelta);
      onDone();
      return;
    } catch (err: any) {
      console.warn(`Provider ${p} failed:`, err.message);
      // If rate limited (429) and auto mode, try next provider
      if (provider === "auto" && (err.message?.includes("429") || err.message?.includes("rate"))) {
        continue;
      }
      // If not auto mode, or non-rate-limit error on last provider, throw
      if (provider !== "auto" || p === providers[providers.length - 1]) {
        throw err;
      }
    }
  }

  throw new Error("All AI providers failed. Please check your API keys in Settings.");
}

export { GROQ_MODEL_LIST, OPENROUTER_CHAT_MODEL_LIST };
