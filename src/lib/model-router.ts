export interface ModelInfo {
  id: string;
  label: string;
  description: string;
  systemPrompt: string;
}

export const models: Record<string, ModelInfo> = {
  deepseek: {
    id: "deepseek",
    label: "DeepSeek V3.2",
    description: "Advanced reasoning & research",
    systemPrompt:
      "You are LUMI operating in deep research mode. Provide thorough, well-reasoned, analytical answers. Break down complex topics step by step. Cite reasoning. Use markdown formatting.",
  },
  qwen: {
    id: "qwen",
    label: "Qwen3-Coder 480B",
    description: "Coding, websites & apps",
    systemPrompt:
      "You are LUMI operating in coding mode. You are an expert programmer. Write clean, well-commented code. Support HTML, CSS, JavaScript, Python, Java, C++, React, and Flutter. Always use code blocks with syntax highlighting.",
  },
  glm: {
    id: "glm",
    label: "GLM-5",
    description: "Multilingual chat",
    systemPrompt:
      "You are LUMI operating in multilingual conversation mode. You are fluent in Hindi, Marathi, Urdu, and English. Reply in the same language the user writes in. Be warm, natural, and conversational.",
  },
  gemma: {
    id: "gemma",
    label: "Gemma 4 27B",
    description: "Image understanding & vision",
    systemPrompt:
      "You are LUMI operating in vision mode. Analyze images in detail. Describe what you see, extract text, identify objects, and answer questions about uploaded images.",
  },
  flux: {
    id: "flux",
    label: "Flux.1 Kontext Pro",
    description: "Image generation & editing",
    systemPrompt:
      "You are LUMI operating in image generation mode. Help users craft detailed image prompts. Suggest styles, compositions, and artistic directions.",
  },
  whisper: {
    id: "whisper",
    label: "Whisper Large V3",
    description: "Speech recognition",
    systemPrompt: "You are LUMI processing voice input via Whisper Large V3.",
  },
  cosyvoice: {
    id: "cosyvoice",
    label: "CosyVoice 2",
    description: "Realistic voice output",
    systemPrompt: "You are LUMI generating voice responses via CosyVoice 2.",
  },
  llama: {
    id: "llama",
    label: "Llama 4 Maverick",
    description: "Fast lightweight answers",
    systemPrompt:
      "You are LUMI operating in fast mode. Give concise, direct, and quick answers. Be brief but helpful.",
  },
};

const routingRules: { pattern: RegExp; modelId: string }[] = [
  { pattern: /\b(code|coding|program|debug|function|class|import|export|html|css|javascript|python|java|c\+\+|react|flutter|api|endpoint|component|build.*(app|website|page|site)|fix.*(bug|error|code)|write.*(code|script|function))\b/i, modelId: "qwen" },
  { pattern: /\b(generate.*(image|picture|photo|art|illustration)|create.*(image|picture|logo|icon|poster)|draw|paint|design.*(image|logo|banner)|image.*(generat|creat))\b/i, modelId: "flux" },
  { pattern: /\b(analyze.*(image|photo|picture)|describe.*(image|photo)|what.*image|upload.*(image|photo)|look.*at.*this|ocr|read.*text.*image)\b/i, modelId: "gemma" },
  { pattern: /\b(research|analyze|explain.*detail|compare|evaluate|thesis|academic|scientific|study|investigate|deep.*dive|thorough|comprehensive)\b/i, modelId: "deepseek" },
  { pattern: /[\u0900-\u097F]|[\u0600-\u06FF]|\b(hindi|marathi|urdu|namaste|kaise|kya|aap|mujhe|batao|bolo)\b/i, modelId: "glm" },
  { pattern: /\b(voice|speak|listen|microphone|audio|speech)\b/i, modelId: "whisper" },
];

export function detectModel(input: string): ModelInfo {
  for (const rule of routingRules) {
    if (rule.pattern.test(input)) {
      return models[rule.modelId];
    }
  }
  return models.llama;
}

export const fusionModels = [models.deepseek, models.qwen, models.glm];
