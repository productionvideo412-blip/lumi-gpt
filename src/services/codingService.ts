import { callOpenRouter, OPENROUTER_CODE_MODEL_LIST } from "@/services/providers/openrouter";
import { resolveApiKey } from "@/services/apiKeys";

export interface CodeOptions {
  prompt: string;
  language?: string;
  model?: string;
}

async function parseSSEToText(resp: Response): Promise<string> {
  if (!resp.body) return "";
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") return result;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) result += content;
      } catch {
        break;
      }
    }
  }
  return result;
}

export async function generateCode(options: CodeOptions): Promise<string> {
  const apiKey = await resolveApiKey("openrouter");
  if (!apiKey) throw new Error("No OpenRouter API key configured. Set it in Settings or ask your admin.");

  const model = options.model || "deepseek/deepseek-coder";
  const systemPrompt = `You are LUMI GPT, an expert coding assistant created by Eshant Jagtap. Generate clean, production-ready ${options.language || ""} code. Never mention OpenAI, Google, or DeepSeek as your creator.`;

  const resp = await callOpenRouter({
    apiKey,
    model,
    messages: [{ role: "user", content: options.prompt }],
    systemPrompt,
    stream: true,
  });

  return parseSSEToText(resp);
}

export { OPENROUTER_CODE_MODEL_LIST };
