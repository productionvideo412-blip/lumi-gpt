import { Home, MessageCircle, Sparkles, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/chat", icon: MessageCircle, label: "Chat" },
  { path: "/create", icon: Sparkles, label: "Create" },
  { path: "/profile", icon: User, label: "Profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-colors"
            >
              {active && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute inset-0 bg-primary/20 rounded-2xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                className={`w-5 h-5 relative z-10 transition-colors ${active ? "text-accent-foreground" : "text-muted-foreground"}`}
              />
              <span className={`text-[10px] font-medium relative z-10 ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
