import { generateImageHF, HF_IMAGE_MODEL_LIST } from "@/services/providers/huggingface";
import { resolveApiKey } from "@/services/apiKeys";

export interface ImageOptions {
  prompt: string;
  negativePrompt?: string;
  model?: string;
}

export async function generateImage(options: ImageOptions): Promise<string> {
  const apiKey = await resolveApiKey("huggingface");
  if (!apiKey) throw new Error("No HuggingFace API key configured. Set it in Settings or ask your admin.");

  const model = options.model || "stabilityai/stable-diffusion-xl-base-1.0";
  return generateImageHF({
    apiKey,
    model,
    prompt: options.prompt,
    negativePrompt: options.negativePrompt,
  });
}

export { HF_IMAGE_MODEL_LIST };
