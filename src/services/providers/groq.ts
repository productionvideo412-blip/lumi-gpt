const GROQ_MODELS = {
  "llama-3.1-8b-instant": "Llama 3.1 8B (Fast)",
  "llama-3.3-70b-versatile": "Llama 3.3 70B (Smart)",
  "deepseek-r1-distill-llama-70b": "DeepSeek R1 70B (Reasoning)",
};

export const GROQ_MODEL_LIST = Object.entries(GROQ_MODELS).map(([id, label]) => ({ id, label }));

export async function callGroq({
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
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
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
    throw new Error(`Groq error ${status}: ${body}`);
  }

  return resp;
}

export { GROQ_MODELS };
