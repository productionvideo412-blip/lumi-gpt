import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Key, Save, Loader2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getLocalApiKeys, setLocalApiKeys } from "@/services/apiKeys";
import { toast } from "sonner";

const providers = [
  { key: "groq", label: "Groq" },
  { key: "openrouter", label: "OpenRouter" },
  { key: "huggingface", label: "Hugging Face" },
  { key: "replicate", label: "Replicate" },
] as const;

const Settings = () => {
  const navigate = useNavigate();
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [savedProvider, setSavedProvider] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const keys = getLocalApiKeys();
    for (const p of providers) {
      if (keys[p.key]) {
        setSavedProvider(p.key);
        setSelectedProvider(p.key);
        setApiKey(keys[p.key]);
        break;
      }
    }
  }, []);

  const handleSave = () => {
    if (!selectedProvider || !apiKey.trim()) {
      toast.error("Please select a provider and enter an API key");
      return;
    }
    setSaving(true);
    // Clear all keys first, then set the chosen one
    const cleared = { groq: "", openrouter: "", huggingface: "", replicate: "" };
    cleared[selectedProvider as keyof typeof cleared] = apiKey.trim();
    setLocalApiKeys(cleared);
    setSavedProvider(selectedProvider);
    setSaving(false);
    toast.success("API key saved locally");
  };

  const handleRemove = () => {
    setLocalApiKeys({ groq: "", openrouter: "", huggingface: "", replicate: "" });
    setApiKey("");
    setSelectedProvider("");
    setSavedProvider(null);
    toast.info("API key removed");
  };

  return (
    <div className="px-4 pt-4 pb-24 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-2xl glass hover:bg-primary/20 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-handwritten text-xl text-foreground">API Settings</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-accent" />
          <h2 className="font-handwritten text-lg text-foreground">Your AI API Key</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Add one API key from any supported AI provider. This key is stored locally on your device only.
        </p>

        {/* Provider selector */}
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Provider</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {providers.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                if (savedProvider && savedProvider !== p.key) {
                  toast.error("Remove your current key first to switch provider");
                  return;
                }
                setSelectedProvider(p.key);
              }}
              className={`px-3 py-1.5 rounded-2xl text-xs font-medium transition-colors ${
                selectedProvider === p.key ? "bg-accent text-accent-foreground" : "glass text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* API Key input */}
        {selectedProvider && (
          <>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              {providers.find((p) => p.key === selectedProvider)?.label} API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key..."
              className="w-full px-3 py-2 rounded-xl glass text-sm text-foreground placeholder:text-muted-foreground outline-none bg-transparent mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl bg-accent text-accent-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Key
              </button>
              {savedProvider && (
                <button
                  onClick={handleRemove}
                  className="py-3 px-4 rounded-2xl glass text-destructive text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Settings;
