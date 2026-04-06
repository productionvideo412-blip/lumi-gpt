export interface ModelInfo {
  id: string;
  label: string;
  description: string;
  systemPrompt: string;
}

export const models: Record<string, ModelInfo> = {
  llama70b: {
    id: "llama70b",
    label: "LLaMA 3 70B",
    description: "Smart chat, reasoning & AI assistant",
    systemPrompt:
      "You are LUMI operating with LLaMA 3 70B. Provide intelligent, well-reasoned responses. Excel at complex reasoning tasks, analytical thinking, and comprehensive explanations. Use markdown formatting.",
  },
  mixtral: {
    id: "mixtral",
    label: "Mixtral 8x7B",
    description: "Speed + intelligence balance",
    systemPrompt:
      "You are LUMI operating with Mixtral 8x7B. Balance speed and quality in your responses. Provide smart, efficient answers without unnecessary verbosity.",
  },
  llama8b: {
    id: "llama8b",
    label: "LLaMA 3 8B",
    description: "Fast response for mobile apps",
    systemPrompt:
      "You are LUMI operating in lightweight mode. Give fast, concise answers optimized for mobile devices. Be brief but helpful.",
  },
  gemma: {
    id: "gemma",
    label: "Gemma 7B",
    description: "Low cost, simple AI features",
    systemPrompt:
      "You are LUMI operating in efficient mode. Provide helpful, straightforward answers. Optimize for cost efficiency while maintaining quality.",
  },
  stablediffusion: {
    id: "stablediffusion",
    label: "Stable Diffusion XL",
    description: "Ultra realistic photos & portraits",
    systemPrompt:
      "You are LUMI operating with Stable Diffusion XL. Help users create ultra-realistic image prompts for photos, portraits, ads, and product images. Suggest detailed descriptions for photorealistic results.",
  },
  dreamshaper: {
    id: "dreamshaper",
    label: "DreamShaper",
    description: "Anime, fantasy & creative artwork",
    systemPrompt:
      "You are LUMI operating with DreamShaper. Help users create creative image prompts for anime, fantasy, and artistic styles. Suggest creative directions and artistic compositions.",
  },
  sdxlturbo: {
    id: "sdxlturbo",
    label: "SDXL Turbo",
    description: "Fast instant preview generation",
    systemPrompt:
      "You are LUMI operating with SDXL Turbo. Generate fast image previews and quick iterations. Optimize for speed while maintaining quality.",
  },
  deepfloyd: {
    id: "deepfloyd",
    label: "DeepFloyd IF",
    description: "Complex prompts & text accuracy",
    systemPrompt:
      "You are LUMI operating with DeepFloyd IF. Help users create detailed prompts with precise text understanding. Excellent for complex and specific image requirements.",
  },
  realesrgan: {
    id: "realesrgan",
    label: "Real-ESRGAN",
    description: "HD upscale, blur removal & enhancement",
    systemPrompt:
      "You are LUMI operating with Real-ESRGAN. Help users enhance, upscale, and improve image quality. Guide them through image enhancement workflows.",
  },
  whisper: {
    id: "whisper",
    label: "Whisper",
    description: "Speech to text conversion",
    systemPrompt: "You are LUMI processing voice input via Whisper for accurate speech-to-text conversion.",
  },
};

const routingRules: { pattern: RegExp; modelId: string }[] = [
  { pattern: /\b(upscal|enhance|improve|quality|blur|denoise|hd|4k|sharpen|better quality)\b/i, modelId: "realesrgan" },
  { pattern: /\b(anime|fantasy|creative|art|illustration|artistic|style|character|fantasy art)\b/i, modelId: "dreamshaper" },
  { pattern: /\b(fast|quick|preview|instant|turbo|speed|real-time)\b/i, modelId: "sdxlturbo" },
  { pattern: /\b(text|complex|prompt|detail|accurate|specific|description)\b/i, modelId: "deepfloyd" },
  { pattern: /\b(photo|portrait|realistic|product|ad|commercial|real-world|photorealistic)\b/i, modelId: "stablediffusion" },
  { pattern: /\b(generate.*(image|picture|photo|art|illustration)|create.*(image|picture|logo|icon|poster)|draw|paint|design.*(image|logo|banner)|image.*(generat|creat))\b/i, modelId: "stablediffusion" },
  { pattern: /\b(voice|speak|listen|microphone|audio|speech)\b/i, modelId: "whisper" },
  { pattern: /\b(fast|quick|speed|mobile|lightweight|efficient)\b/i, modelId: "llama8b" },
  { pattern: /\b(reasoning|explain.*detail|analyze|compare|evaluate|think|complex)\b/i, modelId: "llama70b" },
];

export function detectModel(input: string): ModelInfo {
  for (const rule of routingRules) {
    if (rule.pattern.test(input)) {
      return models[rule.modelId];
    }
  }
  return models.mixtral;
}

export const fusionModels = [models.llama70b, models.mixtral, models.gemma];
