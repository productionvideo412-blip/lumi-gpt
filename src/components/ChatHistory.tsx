import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface Conversation {
  id: string;
  title: string;
  model_id?: string;
  updated_at: string;
}

interface ChatHistoryProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

const ChatHistory = ({ conversations, activeId, onSelect, onNew, onDelete }: ChatHistoryProps) => {
  return (
    <div className="space-y-1">
      <button
        onClick={onNew}
        className="flex items-center gap-2 w-full px-4 py-3 rounded-2xl text-sm font-medium text-foreground bg-primary/10 hover:bg-primary/20 transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Chat
      </button>
      <div className="h-px bg-border/30 my-2" />
      <p className="px-4 text-[10px] text-muted-foreground uppercase tracking-wider">Recent</p>
      <AnimatePresence>
        {conversations.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className={`group flex items-center gap-2 w-full px-4 py-2.5 rounded-2xl text-sm transition-colors cursor-pointer ${
              activeId === c.id ? "bg-primary/15 text-foreground" : "text-foreground hover:bg-primary/10"
            }`}
            onClick={() => onSelect(c.id)}
          >
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="truncate flex-1 text-left">{c.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/20 transition-all"
            >
              <Trash2 className="w-3 h-3 text-muted-foreground" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      {conversations.length === 0 && (
        <p className="px-4 py-3 text-xs text-muted-foreground">No conversations yet</p>
      )}
    </div>
  );
};

export default ChatHistory;
