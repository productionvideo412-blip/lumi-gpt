import { useState } from "react";
import { ChevronDown, Sparkles, Brain, Eye, Image, Mic, Zap } from "lucide-react";
import { models, type ModelInfo } from "@/lib/model-router";
import { motion, AnimatePresence } from "framer-motion";

const modelIcons: Record<string, any> = {
  llama70b: Brain,
  mixtral: Zap,
  llama8b: Zap,
  gemma: Eye,
  stablediffusion: Image,
  dreamshaper: Image,
  sdxlturbo: Image,
  deepfloyd: Image,
  realesrgan: Image,
  whisper: Mic,
};

const selectableModels = Object.values(models).filter(
  (m) => !["whisper"].includes(m.id)
);

interface ModelSelectorProps {
  currentModel: ModelInfo | null;
  autoRouting: boolean;
  onSelect: (model: ModelInfo | null) => void;
}

const ModelSelector = ({ currentModel, autoRouting, onSelect }: ModelSelectorProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl glass text-xs font-medium text-foreground hover:bg-primary/15 transition-colors"
      >
        {autoRouting ? (
          <><Sparkles className="w-3 h-3" /> Auto</>
        ) : (
          <>
            {(() => { const Icon = modelIcons[currentModel?.id || ""] || Sparkles; return <Icon className="w-3 h-3" />; })()}
            {currentModel?.label}
          </>
        )}
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1.5 right-0 w-56 glass-strong rounded-2xl border border-border/50 shadow-lg z-50 overflow-hidden"
          >
            <button
              onClick={() => { onSelect(null); setOpen(false); }}
              className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-left transition-colors ${autoRouting ? "bg-primary/15 text-foreground" : "text-foreground hover:bg-primary/10"}`}
            >
              <Sparkles className="w-4 h-4 text-accent" />
              <div>
                <p className="font-medium">Auto-routing</p>
                <p className="text-[10px] text-muted-foreground">LUMI picks the best engine</p>
              </div>
            </button>
            <div className="h-px bg-border/50" />
            {selectableModels.map((m) => {
              const Icon = modelIcons[m.id] || Sparkles;
              return (
                <button
                  key={m.id}
                  onClick={() => { onSelect(m); setOpen(false); }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-left transition-colors ${!autoRouting && currentModel?.id === m.id ? "bg-primary/15" : "hover:bg-primary/10"}`}
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{m.label}</p>
                    <p className="text-[10px] text-muted-foreground">{m.description}</p>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModelSelector;
