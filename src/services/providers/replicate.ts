const REPLICATE_VIDEO_MODELS = {
  "lucataco/animate-diff": "AnimateDiff",
  "stability-ai/stable-video-diffusion": "Stable Video Diffusion",
};

export const REPLICATE_VIDEO_MODEL_LIST = Object.entries(REPLICATE_VIDEO_MODELS).map(([id, label]) => ({ id, label }));

export async function generateVideoReplicate({
  apiKey,
  model,
  prompt,
  image,
}: {
  apiKey: string;
  model: string;
  prompt: string;
  image?: string;
}): Promise<string> {
  // Start prediction
  const resp = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      version: model,
      input: {
        prompt,
        ...(image ? { image } : {}),
      },
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Replicate error ${resp.status}: ${body}`);
  }

  const prediction = await resp.json();
  let result = prediction;

  // Poll for completion
  while (result.status !== "succeeded" && result.status !== "failed") {
    await new Promise((r) => setTimeout(r, 2000));
    const pollResp = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    result = await pollResp.json();
  }

  if (result.status === "failed") {
    throw new Error("Video generation failed: " + (result.error || "Unknown error"));
  }

  const output = result.output;
  return Array.isArray(output) ? output[0] : output;
}

export { REPLICATE_VIDEO_MODELS };
