import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Save, RotateCcw, Trash2, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const DEFAULT_PROMPT = "You are LUMI GPT, an advanced AI assistant created by Eshant Jagtap. You are helpful, creative, and knowledgeable. You provide clear, accurate, and well-structured responses. You use markdown formatting when appropriate.";

interface SystemPrompt {
  id: string;
  prompt_text: string;
  is_active: boolean;
  created_at: string;
}

const SystemPromptManager = () => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: "restore" | "delete"; id: string } | null>(null);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    const { data } = await supabase
      .from("system_prompts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setPrompts(data as SystemPrompt[]);
      const active = data.find((p: any) => p.is_active);
      if (active) setDraft((active as any).prompt_text);
    }
  };

  const activePrompt = prompts.find((p) => p.is_active);

  const savePrompt = async () => {
    if (!draft.trim()) {
      toast.error("Prompt cannot be empty");
      return;
    }
    if (draft.trim() === activePrompt?.prompt_text) {
      toast.info("No changes to save");
      return;
    }
    setSaving(true);
    // Deactivate all
    await supabase.from("system_prompts").update({ is_active: false } as any).eq("is_active", true);
    // Insert new active
    await supabase.from("system_prompts").insert({
      prompt_text: draft.trim(),
      is_active: true,
      created_by: user?.id,
    } as any);
    toast.success("System prompt saved");
    setSaving(false);
    loadPrompts();
  };

  const restorePrompt = async (id: string) => {
    await supabase.from("system_prompts").update({ is_active: false } as any).eq("is_active", true);
    await supabase.from("system_prompts").update({ is_active: true } as any).eq("id", id);
    toast.success("Prompt restored");
    setConfirmAction(null);
    loadPrompts();
  };

  const deletePrompt = async (id: string) => {
    const prompt = prompts.find((p) => p.id === id);
    if (prompt?.is_active) {
      toast.error("Cannot delete active prompt");
      return;
    }
    await supabase.from("system_prompts").delete().eq("id", id);
    toast.success("Prompt deleted");
    setConfirmAction(null);
    loadPrompts();
  };

  const resetToDefault = async () => {
    setDraft(DEFAULT_PROMPT);
    toast.info("Default prompt loaded — click Save to apply");
  };

  const history = prompts.filter((p) => !p.is_active);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-accent" />
        <h2 className="font-handwritten text-lg text-foreground">AI System Prompt</h2>
      </div>

      {/* Active indicator */}
      {activePrompt && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <CheckCircle className="w-3 h-3 text-lumi-green" />
          <span>Last updated: {new Date(activePrompt.created_at).toLocaleString("en-IN")}</span>
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={6}
        placeholder="Enter system prompt for LUMI..."
        className="w-full glass rounded-2xl p-4 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none bg-transparent border border-border/30 focus:border-accent/50 transition-colors"
      />

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={savePrompt}
          disabled={saving}
          className="flex-1 py-2.5 rounded-2xl bg-accent text-accent-foreground text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving..." : "Save Prompt"}
        </button>
        <button
          onClick={resetToDefault}
          className="px-4 py-2.5 rounded-2xl glass text-foreground text-xs font-medium flex items-center gap-1.5 hover:bg-primary/10 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Default
        </button>
      </div>

      {/* Prompt History */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 mt-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Prompt History</h3>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {history.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-3 border border-border/20"
              >
                <p className="text-xs text-foreground line-clamp-2 mb-2">{p.prompt_text}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(p.created_at).toLocaleString("en-IN")}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setConfirmAction({ type: "restore", id: p.id })}
                      className="px-2.5 py-1 rounded-xl bg-accent/20 text-foreground text-[10px] font-medium hover:bg-accent/30 transition-colors"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: "delete", id: p.id })}
                      className="p-1 rounded-xl hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
            onClick={() => setConfirmAction(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-strong rounded-3xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-accent" />
                <h3 className="font-medium text-foreground">
                  {confirmAction.type === "restore" ? "Restore Prompt?" : "Delete Prompt?"}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                {confirmAction.type === "restore"
                  ? "This will set the selected prompt as the active system prompt."
                  : "This will permanently delete this prompt from history."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2 rounded-xl glass text-foreground text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    confirmAction.type === "restore"
                      ? restorePrompt(confirmAction.id)
                      : deletePrompt(confirmAction.id)
                  }
                  className={`flex-1 py-2 rounded-xl text-xs font-medium ${
                    confirmAction.type === "restore"
                      ? "bg-accent text-accent-foreground"
                      : "bg-destructive text-destructive-foreground"
                  }`}
                >
                  {confirmAction.type === "restore" ? "Restore" : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SystemPromptManager;
