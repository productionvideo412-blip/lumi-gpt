import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, History, BookmarkCheck, Brain, Settings, Palette, Crown, HelpCircle, Moon, Sun, Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LumiSun from "./LumiSun";
import ChatHistory, { type Conversation } from "./ChatHistory";
import { supabase } from "@/integrations/supabase/client";

const menuItems = [
  { icon: Mic, label: "Voice Chat", path: "/voice" },
  { icon: Brain, label: "Memory", path: "/memory" },
  { icon: Crown, label: "Pricing", path: "/pricing" },
  { icon: Settings, label: "Settings", path: "/profile" },
  { icon: Palette, label: "Theme", path: "/profile" },
  { icon: HelpCircle, label: "Help", path: "/" },
];

interface SideDrawerProps {
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
}

const SideDrawer = ({ onSelectConversation, onNewChat }: SideDrawerProps) => {
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const navigate = useNavigate();

  const loadConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .select("id, title, model_id, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (data) setConversations(data);
  };

  useEffect(() => {
    if (open) loadConversations();
  }, [open]);

  const toggleTheme = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="p-2 rounded-2xl glass hover:bg-primary/20 transition-colors">
          <Menu className="w-5 h-5 text-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 glass-strong border-r border-border/50 p-0 overflow-y-auto">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <LumiSun size={40} />
            <SheetTitle className="font-handwritten text-xl">LUMI GPT</SheetTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Bright Intelligence, Beautifully Simple</p>
        </SheetHeader>

        {/* Chat History */}
        <div className="px-3 mb-4">
          <ChatHistory
            conversations={conversations}
            onSelect={(id) => {
              onSelectConversation?.(id);
              setOpen(false);
            }}
            onNew={() => {
              onNewChat?.();
              setOpen(false);
            }}
            onDelete={handleDelete}
          />
        </div>

        <div className="h-px bg-border/30 mx-3" />

        <div className="px-3 py-2 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => { navigate(item.path); setOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium text-foreground hover:bg-primary/15 transition-colors"
            >
              <item.icon className="w-4 h-4 text-muted-foreground" />
              {item.label}
            </button>
          ))}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-medium text-foreground hover:bg-primary/15 transition-colors"
          >
            {dark ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SideDrawer;
