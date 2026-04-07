import { sendChatMessage } from "@/services/chatService";

export async function speechToText(audioBlob: Blob): Promise<string> {
  // Uses browser's built-in Web Speech API (already implemented in VoiceChat)
  // This is a placeholder for Whisper API integration if needed
  throw new Error("Use browser SpeechRecognition API for speech-to-text");
}

export async function textToSpeech(text: string, voice?: string): Promise<void> {
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1.1;
  const voices = synth.getVoices();
  const preferred = voice
    ? voices.find((v) => v.name === voice)
    : voices.find((v) => v.lang.startsWith("en") && v.name.includes("Female")) || voices[0];
  if (preferred) utterance.voice = preferred;

  return new Promise((resolve) => {
    utterance.onend = () => resolve();
    synth.speak(utterance);
  });
}

export async function voiceAssistantFlow({
  text,
  systemPrompt,
  onDelta,
}: {
  text: string;
  systemPrompt: string;
  onDelta: (chunk: string) => void;
}): Promise<string> {
  let fullResponse = "";
  await sendChatMessage({
    messages: [{ role: "user", content: text }],
    systemPrompt,
    provider: "auto",
    onDelta: (chunk) => {
      fullResponse += chunk;
      onDelta(chunk);
    },
    onDone: () => {},
  });
  return fullResponse;
}
