const OPENROUTER_CHAT_MODELS = {
  "deepseek/deepseek-chat-v3-0324:free": "DeepSeek V3 (Free)",
  "qwen/qwen2.5-72b-instruct:free": "Qwen 2.5 72B (Free)",
};

const OPENROUTER_CODE_MODELS = {
  "deepseek/deepseek-coder": "DeepSeek Coder V2",
  "qwen/qwen2.5-coder": "Qwen 2.5 Coder",
};

export const OPENROUTER_CHAT_MODEL_LIST = Object.entries(OPENROUTER_CHAT_MODELS).map(([id, label]) => ({ id, label }));
export const OPENROUTER_CODE_MODEL_LIST = Object.entries(OPENROUTER_CODE_MODELS).map(([id, label]) => ({ id, label }));

export async function callOpenRouter({
  apiKey,
  model,
  messages,
  systemPrompt,
  stream = true,
}: {
  apiKey: string;
  model: string;
  messages: { role: string; content: string }[];
  systemPrompt: string;
  stream?: boolean;
}) {
  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "LUMI GPT",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream,
    }),
  });

  if (!resp.ok) {
    const status = resp.status;
    const body = await resp.text().catch(() => "");
    throw new Error(`OpenRouter error ${status}: ${body}`);
  }

  return resp;
}

export { OPENROUTER_CHAT_MODELS, OPENROUTER_CODE_MODELS };
