import { motion } from "framer-motion";
import { MessageCircle, Image, Wand2, Code, FileText, Mic, Globe, Search, Sparkles, TrendingUp, Lightbulb } from "lucide-react";
import LumiSun from "@/components/LumiSun";
import SideDrawer from "@/components/SideDrawer";
import { useNavigate } from "react-router-dom";

const quickActions = [
  { icon: MessageCircle, label: "Chat", color: "bg-primary/30", path: "/chat" },
  { icon: Image, label: "Create Image", color: "bg-lumi-lavender/50", path: "/create" },
  { icon: Wand2, label: "Edit Image", color: "bg-accent/20", path: "/create" },
  { icon: Code, label: "Generate Code", color: "bg-lumi-green/20", path: "/create" },
  { icon: FileText, label: "Analyze PDF", color: "bg-primary/20", path: "/chat" },
  { icon: Mic, label: "Voice Chat", color: "bg-lumi-lavender/40", path: "/voice" },
  { icon: Globe, label: "Build Website", color: "bg-lumi-sky", path: "/create" },
  { icon: Search, label: "Research", color: "bg-accent/30", path: "/chat" },
];

const trendingPrompts = [
  "Write a poem about the ocean",
  "Create a logo for my startup",
  "Explain quantum computing simply",
  "Build a landing page for my app",
  "Generate a realistic portrait",
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <SideDrawer />
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-xs font-medium text-muted-foreground">Online</span>
        </div>
      </div>

      {/* Welcome */}
      <motion.div
        className="flex flex-col items-center text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <LumiSun size={90} />
        <h1 className="font-handwritten text-3xl mt-4 text-foreground">Hello, I'm LUMI</h1>
        <p className="text-sm text-muted-foreground mt-1">Bright Intelligence, Beautifully Simple</p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <button
          onClick={() => navigate("/chat")}
          className="w-full glass rounded-3xl px-5 py-4 flex items-center gap-3 hover:bg-primary/10 transition-colors glow-primary"
        >
          <Search className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Ask LUMI anything...</span>
          <Mic className="w-4 h-4 text-muted-foreground ml-auto" />
        </button>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={container} initial="hidden" animate="show">
        <h2 className="font-handwritten text-lg mb-3 text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3 mb-8">
          {quickActions.map((action) => (
            <motion.button
              key={action.label}
              variants={item}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-3 rounded-3xl glass hover:scale-105 transition-transform"
            >
              <div className={`w-11 h-11 rounded-2xl ${action.color} flex items-center justify-center`}>
                <action.icon className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-[10px] font-medium text-foreground leading-tight text-center">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Trending */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-accent" />
          <h2 className="font-handwritten text-lg text-foreground">Trending Prompts</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-none">
          {trendingPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => navigate("/chat")}
              className="flex-shrink-0 glass rounded-3xl px-4 py-3 text-xs font-medium text-foreground hover:bg-primary/10 transition-colors max-w-[200px]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </motion.div>

      {/* AI Suggestions */}
      <motion.div
        className="mt-6 mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-accent" />
          <h2 className="font-handwritten text-lg text-foreground">LUMI Suggests</h2>
        </div>
        <div className="space-y-3">
          {["Plan your week with AI assistance", "Create a stunning profile picture", "Learn a new language today"].map((s, i) => (
            <button
              key={i}
              onClick={() => navigate("/chat")}
              className="w-full glass rounded-2xl px-4 py-3 text-left text-sm text-foreground hover:bg-primary/10 transition-colors flex items-center gap-3"
            >
              <Lightbulb className="w-4 h-4 text-accent flex-shrink-0" />
              {s}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
