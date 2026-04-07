import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Mic, Paperclip, Image as ImageIcon, Globe, Brain, RotateCcw, Square, Zap, X, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import LumiSun from "@/components/LumiSun";
import SideDrawer from "@/components/SideDrawer";
import { detectModel, fusionModels, models, type ModelInfo } from "@/lib/model-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendChatMessage } from "@/services/chatService";
import { resolveApiKey } from "@/services/apiKeys";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: ModelInfo;
  imageUrl?: string;
  fusionSources?: { model: ModelInfo; snippet: string }[];
}

const suggestions = [
  "Write a story about a magical forest",
  "Help me debug my React code",
  "Create a business plan",
  "Explain quantum physics simply",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function streamChat({
  messages,
  systemPrompt,
  onDelta,
  onDone,
  signal,
}: {
  messages: { role: string; content: string | any[] }[];
  systemPrompt: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, systemPrompt }),
    signal,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    if (resp.status === 429) toast.error("Rate limited — please wait.");
    else if (resp.status === 402) toast.error("Credits exhausted. Add funds in Settings.");
    else toast.error(err.error || "Failed to get response");
    onDone();
    return;
  }

  if (!resp.body) { onDone(); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || !line.trim() || !line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

const DEFAULT_SYSTEM_PROMPT = `You are LUMI GPT, an advanced AI assistant created by Eshant Jagtap (CEO & Founder). You are helpful, creative, and knowledgeable.

IMPORTANT IDENTITY RULES:
- Your name is LUMI GPT. Never refer to yourself by any other name.
- You were created by Eshant Jagtap, CEO & Founder.
- Never mention OpenAI, Google, DeepSeek, or any other AI company as your creator.
- If asked who made you, always say "Eshant Jagtap".`;

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [fusionMode, setFusionMode] = useState(false);
  const [currentModel, setCurrentModel] = useState<ModelInfo | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [globalSystemPrompt, setGlobalSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSystemPrompt = async () => {
      const { data } = await supabase.from("system_prompts").select("prompt_text").eq("is_active", true).limit(1).single();
      if (data) setGlobalSystemPrompt((data as any).prompt_text);
    };
    fetchSystemPrompt();
  }, []);

  

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const stopGenerating = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsTyping(false);
  };

  const saveMessageToDB = async (convId: string, role: string, content: string, modelLabel?: string) => {
    try {
      await supabase.from("messages").insert({ conversation_id: convId, role, content, model_label: modelLabel });
    } catch (e) {
      console.error("Failed to save message:", e);
    }
  };

  const ensureConversation = async (firstMessage: string): Promise<string | null> => {
    if (conversationId) return conversationId;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    const { data, error } = await supabase.from("conversations").insert({
      user_id: user.id, title, model_id: "auto",
    }).select("id").single();
    if (error || !data) return null;
    setConversationId(data.id);
    return data.id;
  };

  const loadConversation = async (convId: string) => {
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", convId).order("created_at", { ascending: true });
    if (data) {
      setMessages(data.map((m: any) => ({
        id: m.id, role: m.role, content: m.content,
        model: m.model_label ? { id: "", label: m.model_label, description: "", systemPrompt: "" } : undefined,
      })));
      setConversationId(convId);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setCurrentModel(null);
    setPendingImage(null);
  };




  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    const preview = URL.createObjectURL(file);
    setPendingImage({ file, preview });
    setCurrentModel(models.gemma);
    toast.success("Image attached — LUMI will analyze it");
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  };

  const sendMessage = async (overrideInput?: string) => {
    const text = overrideInput ?? input;
    if (!text.trim() && !pendingImage) return;

    const hasImage = !!pendingImage;
    const activeModel = hasImage ? models.gemma : detectModel(text);
    setCurrentModel(activeModel);

    const userMsg: Message = {
      id: Date.now().toString(), role: "user", content: text || "Analyze this image",
      imageUrl: pendingImage?.preview,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const convId = await ensureConversation(text || "Image analysis");
    if (convId) saveMessageToDB(convId, "user", text || "[Image uploaded]");

    let chatHistory: { role: string; content: string | any[] }[];
    if (hasImage) {
      chatHistory = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        {
          role: "user",
          content: text || "Analyze this attached image in detail and describe what you see.",
        },
      ];
      setPendingImage(null);
    } else {
      chatHistory = newMessages.map((m) => ({ role: m.role, content: m.content }));
    }

    if (fusionMode && !hasImage) {
      const fusionResults: { model: ModelInfo; content: string }[] = [];
      for (const model of fusionModels) {
        let content = "";
        await streamChat({
          messages: chatHistory,
          systemPrompt: globalSystemPrompt + "\n\n" + model.systemPrompt + "\n\nKeep your response concise (max 3 paragraphs).",
          onDelta: (chunk) => { content += chunk; },
          onDone: () => {},
          signal: controller.signal,
        });
        fusionResults.push({ model, content });
      }

      const mergePrompt = `You are LUMI in Fusion Mode. Merge these 3 model responses into one best answer with markdown.\n\n${fusionResults.map((r, i) => `Model ${i + 1}: ${r.content}`).join("\n\n")}\n\nAt the end add "---" and show which perspective contributed what.`;

      let mergedContent = "";
      await streamChat({
        messages: [{ role: "user", content: text }],
        systemPrompt: mergePrompt,
        onDelta: (chunk) => {
          mergedContent += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: mergedContent } : m));
            return [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: mergedContent, fusionSources: fusionResults.map((r) => ({ model: r.model, snippet: r.content.slice(0, 100) })) }];
          });
        },
        onDone: () => {},
        signal: controller.signal,
      });
      if (convId) saveMessageToDB(convId, "assistant", mergedContent, "LUMI Fusion");
      setIsTyping(false);
      abortRef.current = null;
      return;
    }

    let assistantContent = "";
    await streamChat({
      messages: chatHistory,
      systemPrompt: globalSystemPrompt + "\n\n" + activeModel.systemPrompt,
      onDelta: (chunk) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
          return [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: assistantContent, model: activeModel }];
        });
      },
      onDone: () => {
        if (convId) saveMessageToDB(convId, "assistant", assistantContent, "LUMI GPT");
        setIsTyping(false);
        abortRef.current = null;
      },
      signal: controller.signal,
    });
  };

  return (
    <div
      className={`flex flex-col h-[calc(100vh-5rem)] ${isDragOver ? "ring-2 ring-accent ring-inset" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 glass-strong border-b border-border/30 z-20">
        <SideDrawer onSelectConversation={loadConversation} onNewChat={startNewChat} />
        <div className="flex items-center gap-2">
          <LumiSun size={28} />
          <div>
            <p className="text-sm font-handwritten font-semibold text-foreground">LUMI GPT</p>
            <p className="text-[9px] text-muted-foreground flex items-center gap-1">
              {fusionMode ? (
                <><Zap className="w-2.5 h-2.5" /> Fusion Mode</>
              ) : (
                <><Sparkles className="w-2.5 h-2.5" /> Ready</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFusionMode(!fusionMode)}
            className={`p-1.5 rounded-xl text-xs transition-colors ${fusionMode ? "bg-accent/40 text-accent-foreground" : "text-muted-foreground"}`}
            title="Fusion Mode"
          >
            <Zap className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/voice")}
            className="p-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Voice Chat"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fusion Banner */}
      <AnimatePresence>
        {fusionMode && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 py-2 bg-accent/10 border-b border-border/30">
              <div className="flex items-center gap-2 text-xs">
                <Zap className="w-3.5 h-3.5 text-accent" />
                <span className="font-medium text-foreground">Fusion Mode Active</span>
                <span className="text-muted-foreground">— 3 engines will analyze your prompt</span>
              </div>
              <div className="flex gap-2 mt-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-foreground flex items-center gap-1"><Brain className="w-2.5 h-2.5" /> Research</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-foreground flex items-center gap-1"><Globe className="w-2.5 h-2.5" /> Code</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-foreground flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> Language</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <div className="glass-strong rounded-3xl p-8 text-center">
              <ImageIcon className="w-12 h-12 text-accent mx-auto mb-3" />
              <p className="text-foreground font-medium">Drop image here</p>
              <p className="text-xs text-muted-foreground mt-1">LUMI will analyze it</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full gap-4">
            <LumiSun size={70} />
            <h2 className="font-handwritten text-xl text-foreground">What can I help with?</h2>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)} className="glass rounded-2xl px-3 py-3 text-xs text-foreground hover:bg-primary/10 transition-colors text-left">{s}</button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> LUMI picks the smartest brain for each task
            </p>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-lg" : "glass rounded-bl-lg"}`}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <LumiSun size={18} />
                    <span className="text-[10px] font-medium text-muted-foreground">LUMI GPT</span>
                  </div>
                )}
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="Uploaded" className="rounded-2xl max-h-48 mb-2 object-cover" />
                )}
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-pre:bg-muted prose-pre:rounded-xl">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                )}
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30 flex-wrap">
                    <button className="text-muted-foreground hover:text-foreground transition-colors"><RotateCcw className="w-3 h-3" /></button>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> LUMI GPT
                    </span>
                    {msg.fusionSources && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent/30 text-accent-foreground flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> Fusion
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <LumiSun size={24} />
            <div className="glass rounded-3xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} className="w-2 h-2 rounded-full bg-accent" />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 rounded-full bg-accent" />
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 rounded-full bg-accent" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Pending Image Preview */}
      <AnimatePresence>
        {pendingImage && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 overflow-hidden">
            <div className="glass rounded-2xl p-2 mb-2 flex items-center gap-2">
              <img src={pendingImage.preview} alt="Preview" className="w-12 h-12 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="text-xs text-foreground font-medium">Image attached</p>
                <p className="text-[10px] text-muted-foreground">LUMI will analyze it</p>
              </div>
              <button onClick={() => setPendingImage(null)} className="p-1 rounded-lg hover:bg-destructive/20 transition-colors">
                <X className="w-4 h-4 text-destructive" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="px-4 py-3 glass-strong border-t border-border/30">
        <div className="flex items-end gap-2 max-w-2xl mx-auto">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImageSelect(f);
              e.target.value = "";
            }}
          />
          <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 glass rounded-2xl px-4 py-3 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Message LUMI..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          {isTyping ? (
            <button onClick={stopGenerating} className="p-2.5 rounded-xl bg-destructive text-destructive-foreground">
              <Square className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() && !pendingImage}
              className="p-2.5 rounded-xl bg-accent text-accent-foreground disabled:opacity-50 transition-all"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
