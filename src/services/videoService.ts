import { generateVideoReplicate, REPLICATE_VIDEO_MODEL_LIST } from "@/services/providers/replicate";
import { resolveApiKey } from "@/services/apiKeys";

export interface VideoOptions {
  prompt: string;
  image?: string;
  model?: string;
}

export async function generateVideo(options: VideoOptions): Promise<string> {
  const apiKey = await resolveApiKey("replicate");
  if (!apiKey) throw new Error("No Replicate API key configured. Set it in Settings or ask your admin.");

  const model = options.model || "lucataco/animate-diff";
  return generateVideoReplicate({
    apiKey,
    model,
    prompt: options.prompt,
    image: options.image,
  });
}

export { REPLICATE_VIDEO_MODEL_LIST };
