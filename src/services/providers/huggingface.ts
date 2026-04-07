const HF_IMAGE_MODELS = {
  "stabilityai/stable-diffusion-xl-base-1.0": "Stable Diffusion XL",
  "black-forest-labs/FLUX.1-schnell": "FLUX Schnell",
  "Lykon/dreamshaper-xl-lightning": "DreamShaper XL",
};

export const HF_IMAGE_MODEL_LIST = Object.entries(HF_IMAGE_MODELS).map(([id, label]) => ({ id, label }));

export async function generateImageHF({
  apiKey,
  model,
  prompt,
  negativePrompt,
}: {
  apiKey: string;
  model: string;
  prompt: string;
  negativePrompt?: string;
}): Promise<string> {
  const resp = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        negative_prompt: negativePrompt || "",
      },
    }),
  });

  if (!resp.ok) {
    const status = resp.status;
    const body = await resp.text().catch(() => "");
    throw new Error(`HuggingFace error ${status}: ${body}`);
  }

  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}

export { HF_IMAGE_MODELS };
