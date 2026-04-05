import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Plus, Trash2, User, Heart, Star, StickyNote, ToggleLeft, ToggleRight } from "lucide-react";
import SideDrawer from "@/components/SideDrawer";

interface MemoryItem {
  id: string;
  category: "name" | "interest" | "topic" | "note";
  content: string;
}

const categoryConfig = {
  name: { icon: User, label: "Name", color: "bg-primary/30" },
  interest: { icon: Heart, label: "Interest", color: "bg-accent/20" },
  topic: { icon: Star, label: "Favorite Topic", color: "bg-lumi-lavender/50" },
  note: { icon: StickyNote, label: "Note", color: "bg-lumi-green/20" },
};

const defaultMemories: MemoryItem[] = [
  { id: "1", category: "name", content: "LUMI User" },
  { id: "2", category: "interest", content: "AI & Machine Learning" },
  { id: "3", category: "topic", content: "Creative Writing" },
  { id: "4", category: "note", content: "Prefers concise answers" },
];

const Memory = () => {
  const [memories, setMemories] = useState<MemoryItem[]>(defaultMemories);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryItem["category"]>("note");
  const [showAdd, setShowAdd] = useState(false);

  const addMemory = () => {
    if (!newContent.trim()) return;
    setMemories((prev) => [
      ...prev,
      { id: Date.now().toString(), category: newCategory, content: newContent.trim() },
    ]);
    setNewContent("");
    setShowAdd(false);
  };

  const deleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="flex items-center justify-between mb-6">
        <SideDrawer />
        <h1 className="font-handwritten text-xl text-foreground">Memory</h1>
        <Brain className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-4 mb-6 flex items-center justify-between"
      >
        <div>
          <p className="text-sm font-medium text-foreground">Memory System</p>
          <p className="text-[11px] text-muted-foreground">LUMI remembers your preferences</p>
        </div>
        <button onClick={() => setMemoryEnabled(!memoryEnabled)}>
          {memoryEnabled ? (
            <ToggleRight className="w-8 h-8 text-accent" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-muted-foreground" />
          )}
        </button>
      </motion.div>

      {/* Memories list */}
      <div className="space-y-2 mb-6">
        <AnimatePresence>
          {memories.map((mem) => {
            const cfg = categoryConfig[mem.category];
            return (
              <motion.div
                key={mem.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className="glass rounded-2xl px-4 py-3 flex items-center gap-3"
              >
                <div className={`w-9 h-9 rounded-xl ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                  <cfg.icon className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">{cfg.label}</p>
                  <p className="text-sm text-foreground truncate">{mem.content}</p>
                </div>
                <button
                  onClick={() => deleteMemory(mem.id)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add new memory */}
      {showAdd ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-4 space-y-3"
        >
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(categoryConfig) as MemoryItem["category"][]).map((cat) => (
              <button
                key={cat}
                onClick={() => setNewCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-2xl text-xs font-medium transition-colors ${
                  newCategory === cat ? "bg-accent text-accent-foreground" : "glass text-foreground"
                }`}
              >
                {categoryConfig[cat].label}
              </button>
            ))}
          </div>
          <input
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMemory()}
            placeholder="Enter memory..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={addMemory}
              className="flex-1 py-2 rounded-2xl bg-accent text-accent-foreground text-sm font-medium"
            >
              Save
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-2xl glass text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAdd(true)}
          className="w-full py-3 rounded-3xl glass flex items-center justify-center gap-2 text-sm font-medium text-foreground hover:bg-primary/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Memory
        </motion.button>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 glass rounded-3xl p-4 text-center"
      >
        <p className="text-xs text-muted-foreground">🌻 LUMI uses memories to personalize your experience</p>
      </motion.div>
    </div>
  );
};

export default Memory;
