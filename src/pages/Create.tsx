import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Wand2, Video, Music, Globe, Smartphone, Sparkles, ArrowLeft, Download, Loader2, Flower2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import SideDrawer from "@/components/SideDrawer";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const categories = [
  { icon: Image, label: "Image Generator", desc: "Create stunning images from text", color: "bg-accent/20", type: "image" },
  { icon: Wand2, label: "Image Editor", desc: "Edit, enhance and transform images", color: "bg-lumi-lavender/50", type: "edit" },
  { icon: Video, label: "Video Generator", desc: "Generate video scripts & storyboards", color: "bg-primary/30", type: "video" },
  { icon: Music, label: "Music Generator", desc: "Compose music and sound effects", color: "bg-lumi-green/20", type: "music" },
  { icon: Globe, label: "Website Builder", desc: "Build websites from descriptions", color: "bg-primary/20", type: "website" },
  { icon: Smartphone, label: "App Builder", desc: "Design and prototype mobile apps", color: "bg-accent/30", type: "app" },
];

const styles = ["None", "Realistic", "Anime", "3D", "Cyberpunk", "Fantasy", "Indian", "Cartoon", "Ghibli", "Dark", "Cinematic", "Watercolor"];
const ratios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

const Create = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<typeof categories[0] | null>(null);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("None");
  const [ratio, setRatio] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imageUrl?: string; text?: string; watermark?: boolean } | null>(null);
  const [streamedText, setStreamedText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || !selected) return;
    setLoading(true);
    setResult(null);
    setStreamedText("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const fullPrompt = selected.type === "image"
        ? style === "None" ? prompt : `${prompt}. Style: ${style}. Aspect ratio: ${ratio}.`
        : prompt;

      if (selected.type === "image") {
        const imageUrl = await generateImage({ prompt: fullPrompt });
        setResult({ imageUrl, text: "", watermark: true });
      } else {
        // Fetch active system prompt
        let systemPrompt = "";
        const systemPrompts: Record<string, string> = {
          video: "You are LUMI GPT, a creative AI created by Eshant Jagtap. Generate a detailed video script/storyboard. Never mention OpenAI, Google, or DeepSeek.",
          music: "You are LUMI GPT, a music composition AI created by Eshant Jagtap. Generate detailed music composition notes. Never mention OpenAI, Google, or DeepSeek.",
          website: "You are LUMI GPT, a web developer AI created by Eshant Jagtap. Generate complete HTML/CSS code. Never mention OpenAI, Google, or DeepSeek.",
          app: "You are LUMI GPT, an app designer AI created by Eshant Jagtap. Generate detailed app design specifications. Never mention OpenAI, Google, or DeepSeek.",
          edit: "You are LUMI GPT, an image editing AI created by Eshant Jagtap. Describe editing steps needed. Never mention OpenAI, Google, or DeepSeek.",
        };

        try {
          const { data: promptData } = await supabase
            .from("system_prompts")
            .select("prompt_text")
            .eq("is_active", true)
            .limit(1)
            .single();
          if (promptData) systemPrompt = promptData.prompt_text + "\n\n";
        } catch {}

        systemPrompt += systemPrompts[selected.type] || systemPrompts.video;

        let fullText = "";
        await sendChatMessage({
          messages: [{ role: "user", content: fullPrompt }],
          systemPrompt,
          signal: controller.signal,
          onDelta: (text) => {
            fullText += text;
            setStreamedText(fullText);
          },
          onDone: () => {
            setResult({ text: fullText });
          },
        });
      }
      toast.success("Generation complete!");
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error(err.message || "Generation failed");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const downloadImage = () => {
    if (!result?.imageUrl) return;
    const a = document.createElement("a");
    a.href = result.imageUrl;
    a.download = `lumi-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <SideDrawer />
        <h1 className="font-handwritten text-xl text-foreground">Create</h1>
        <Sparkles className="w-5 h-5 text-accent" />
      </div>

      {!selected ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => { setSelected(cat); setResult(null); setStreamedText(""); }}
              className="glass rounded-3xl p-4 text-left hover:scale-[1.02] transition-transform"
            >
              <div className={`w-12 h-12 rounded-2xl ${cat.color} flex items-center justify-center mb-3`}>
                <cat.icon className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="font-handwritten text-sm font-semibold text-foreground">{cat.label}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">{cat.desc}</p>
            </motion.button>
          ))}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => { setSelected(null); setResult(null); setStreamedText(""); }} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to categories
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-2xl ${selected.color} flex items-center justify-center`}>
              <selected.icon className="w-5 h-5 text-foreground" />
            </div>
            <h2 className="font-handwritten text-xl text-foreground">{selected.label}</h2>
          </div>

          {/* Prompt */}
          <div className="glass rounded-3xl p-4 mb-4">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Describe what you want</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A sunflower field at golden hour with butterflies..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[80px]"
            />
          </div>

          {/* Styles for image */}
          {selected.type === "image" && (
            <>
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Style</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {styles.map((s) => (
                    <button key={s} onClick={() => setStyle(s)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-2xl text-xs font-medium transition-colors ${style === s ? "bg-accent text-accent-foreground" : "glass text-foreground"}`}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Aspect Ratio</label>
                <div className="flex gap-2">
                  {ratios.map((r) => (
                    <button key={r} onClick={() => setRatio(r)}
                      className={`px-3 py-1.5 rounded-2xl text-xs font-medium transition-colors ${ratio === r ? "bg-primary text-primary-foreground" : "glass text-foreground"}`}
                    >{r}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={loading ? () => abortRef.current?.abort() : handleGenerate}
            disabled={!prompt.trim()}
            className="w-full py-4 rounded-3xl bg-accent text-accent-foreground font-handwritten text-lg font-semibold glow-accent transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating... (tap to cancel)
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate with LUMI
              </>
            )}
          </motion.button>

          {/* Result */}
          <AnimatePresence>
            {(result?.imageUrl || result?.text || streamedText) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                {result?.imageUrl && (
                  <div className="glass rounded-3xl overflow-hidden mb-4 relative">
                    <img src={result.imageUrl} alt="Generated" className="w-full" />
                    {result.watermark && (
                      <div className="absolute bottom-3 right-3 pointer-events-none">
                        <div className="flex items-center gap-1 bg-background/40 backdrop-blur-sm px-2 py-1 rounded-xl">
                          <Flower2 className="w-3.5 h-3.5 text-accent" />
                          <span className="text-foreground/60 font-handwritten text-[11px] font-semibold">LUMI GPT</span>
                        </div>
                      </div>
                    )}
                    <div className="p-3 flex items-center justify-between">
                      {result.watermark && (
                        <button
                          onClick={() => navigate("/pricing")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-accent/20 text-xs font-medium text-foreground hover:bg-accent/30 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Remove watermark
                        </button>
                      )}
                      <button onClick={downloadImage} className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl glass text-xs font-medium text-foreground hover:bg-primary/20 transition-colors ml-auto">
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  </div>
                )}
                {(result?.text || streamedText) && (
                  <div className="glass rounded-3xl p-4">
                    <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-pre:bg-muted prose-pre:rounded-xl">
                      <ReactMarkdown>{result?.text || streamedText}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default Create;
