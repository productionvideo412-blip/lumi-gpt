import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2, ArrowLeft, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LumiSun from "@/components/LumiSun";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

const WAVEFORM_BARS = 32;
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const DEFAULT_VOICE_PROMPT = "You are LUMI GPT, a friendly AI assistant created by Eshant Jagtap. Never mention OpenAI, Google, or DeepSeek. Respond to voice input concisely (2-3 sentences max) and conversationally. Use simple language suitable for speaking aloud. Do NOT use markdown, code blocks, or special formatting.";

const VoiceChat = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [waveform, setWaveform] = useState<number[]>(Array(WAVEFORM_BARS).fill(4));
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const animateWaveform = useCallback(() => {
    if (analyserRef.current && state === "listening") {
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      const step = Math.floor(data.length / WAVEFORM_BARS);
      const bars = Array.from({ length: WAVEFORM_BARS }, (_, i) =>
        Math.max(4, (data[i * step] / 255) * 60)
      );
      setWaveform(bars);
    } else if (state === "speaking") {
      setWaveform(Array.from({ length: WAVEFORM_BARS }, () => Math.max(4, Math.random() * 40)));
    } else if (state === "processing") {
      setWaveform(Array.from({ length: WAVEFORM_BARS }, (_, i) =>
        Math.max(4, 15 + 10 * Math.sin(Date.now() / 200 + i * 0.3))
      ));
    } else {
      setWaveform(Array(WAVEFORM_BARS).fill(4));
    }
    animRef.current = requestAnimationFrame(animateWaveform);
  }, [state]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(animateWaveform);
    return () => cancelAnimationFrame(animRef.current);
  }, [animateWaveform]);

  const speak = (text: string) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1.1;
    const voices = synth.getVoices();
    const preferred = voices.find(v => v.lang.startsWith("en") && v.name.includes("Female")) || voices[0];
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setState("speaking");
    utterance.onend = () => setState("idle");

    synth.speak(utterance);
  };

  const getAIResponse = async (text: string) => {
    setState("processing");
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: text }],
          systemPrompt: "You are LUMI, a friendly AI assistant responding to voice input. Keep answers concise (2-3 sentences max) and conversational. Use simple language suitable for speaking aloud. Do NOT use markdown, code blocks, or special formatting.",
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error("Failed to get response");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";

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
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullResponse += content;
          } catch {}
        }
      }

      setResponse(fullResponse);
      speak(fullResponse);
    } catch (err) {
      toast.error("Failed to get AI response");
      setState("idle");
    }
  };

  const startListening = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser. Try Chrome.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let finalTranscript = "";

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscript + interim);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          toast.error("Speech recognition error: " + event.error);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

      setState("listening");
      setTranscript("");
      setResponse("");
      toast.info("Listening...");
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    const currentTranscript = transcript;
    if (currentTranscript.trim()) {
      getAIResponse(currentTranscript);
    } else {
      toast.info("No speech detected. Try again.");
      setState("idle");
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setState("idle");
  };

  const stateColors: Record<VoiceState, string> = {
    idle: "text-muted-foreground",
    listening: "text-destructive",
    processing: "text-accent",
    speaking: "text-primary",
  };

  const stateLabels: Record<VoiceState, string> = {
    idle: "Tap to speak",
    listening: "Listening...",
    processing: "Thinking...",
    speaking: "Speaking...",
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-4 py-3 glass-strong border-b border-border/30">
        <button onClick={() => navigate("/chat")} className="p-2 rounded-xl hover:bg-primary/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <LumiSun size={28} />
        <div>
          <p className="text-sm font-handwritten font-semibold text-foreground">Voice Chat</p>
          <p className="text-[9px] text-muted-foreground flex items-center gap-1">
            <Mic className="w-2.5 h-2.5" /> Speech Input
            <Volume2 className="w-2.5 h-2.5 ml-1" /> Voice Output
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <motion.div
          animate={{ scale: state === "listening" ? [1, 1.05, 1] : state === "speaking" ? [1, 1.03, 1] : 1 }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="relative"
        >
          <div
            className={`absolute inset-0 rounded-full blur-3xl transition-all duration-500 ${
              state === "listening" ? "bg-destructive/20" : state === "speaking" ? "bg-primary/20" : "bg-transparent"
            }`}
            style={{ transform: "scale(2)" }}
          />
          <LumiSun size={100} />
        </motion.div>

        <div className="flex items-center justify-center gap-[3px] h-16 w-full max-w-xs">
          {waveform.map((h, i) => (
            <motion.div
              key={i}
              animate={{ height: h }}
              transition={{ duration: 0.08, ease: "easeOut" }}
              className={`w-1.5 rounded-full transition-colors duration-300 ${
                state === "listening" ? "bg-destructive/70"
                  : state === "speaking" ? "bg-primary/70"
                  : state === "processing" ? "bg-accent/50"
                  : "bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>

        <p className={`text-sm font-medium ${stateColors[state]} transition-colors`}>
          {stateLabels[state]}
        </p>

        <AnimatePresence>
          {transcript && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl px-4 py-3 max-w-sm w-full">
              <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Mic className="w-2.5 h-2.5" /> You said:</p>
              <p className="text-sm text-foreground">{transcript}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {response && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl px-4 py-3 max-w-sm w-full">
              <div className="flex items-center gap-1.5 mb-1">
                <LumiSun size={14} />
                <span className="text-[10px] text-muted-foreground">LUMI GPT</span>
                {state === "speaking" && <Volume2 className="w-3 h-3 text-primary ml-auto animate-pulse" />}
              </div>
              <p className="text-sm text-foreground">{response}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-center pb-24 pt-4">
        {state === "listening" ? (
          <button onClick={stopListening} className="w-20 h-20 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center transition-all hover:scale-105 active:scale-95">
            <Square className="w-8 h-8 text-destructive" />
          </button>
        ) : state === "speaking" ? (
          <button onClick={stopSpeaking} className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center transition-all hover:scale-105 active:scale-95">
            <Square className="w-8 h-8 text-primary" />
          </button>
        ) : state === "processing" ? (
          <div className="w-20 h-20 rounded-full glass border-2 border-border/50 flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
              <LumiSun size={32} />
            </motion.div>
          </div>
        ) : (
          <button onClick={startListening} className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center transition-all hover:scale-105 active:scale-95 glow-primary">
            <Mic className="w-8 h-8 text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceChat;
