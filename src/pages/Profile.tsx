import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Bookmark, Crown, Palette, Bell, Languages, Settings, ChevronRight, LogOut, Moon, Sun, HelpCircle, Check, X, Calendar, Save, PartyPopper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SideDrawer from "@/components/SideDrawer";
import LumiSun from "@/components/LumiSun";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
];

type Section = null | "notifications" | "language" | "settings" | "help" | "saved" | "editProfile";

const Profile = () => {
  const navigate = useNavigate();
  const { user, isGuest, signOut } = useAuth();
  const { plan, usage } = useSubscription();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null; birth_date: string | null; age: number | null }>({ display_name: null, avatar_url: null, birth_date: null, age: null });
  const [messageCount, setMessageCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [activeSection, setActiveSection] = useState<Section>(null);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));
  const [selectedLang, setSelectedLang] = useState("en");
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showBirthdayWish, setShowBirthdayWish] = useState(false);

  // Profile edit form state
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, avatar_url, birth_date, age").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data) {
          const d = data as any;
          setProfile({ display_name: d.display_name, avatar_url: d.avatar_url, birth_date: d.birth_date, age: d.age });
          setNameInput(d.display_name || "");
          setEditName(d.display_name || "");
          setEditAge(d.age?.toString() || "");
          setEditBirthDate(d.birth_date || "");
          // Check birthday
          if (d.birth_date) {
            checkBirthday(d.birth_date);
          }
        }
      });
    supabase.from("messages").select("id", { count: "exact", head: true })
      .then(({ count }) => setMessageCount(count || 0));
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      .then(({ count }) => setSessionCount(count || 0));
  }, [user]);

  const checkBirthday = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    if (birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate()) {
      setShowBirthdayWish(true);
    }
  };

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("profile-messages").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
      setMessageCount((prev) => prev + 1);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const displayName = profile.display_name || user?.user_metadata?.display_name || (isGuest ? "Guest User" : "LUMI User");

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
  };

  const saveName = async () => {
    if (!user || !nameInput.trim()) return;
    await supabase.from("profiles").update({ display_name: nameInput.trim() } as any).eq("user_id", user.id);
    setProfile((p) => ({ ...p, display_name: nameInput.trim() }));
    setEditingName(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const updates: any = {};
    if (editName.trim()) updates.display_name = editName.trim();
    if (editAge) updates.age = parseInt(editAge);
    if (editBirthDate) updates.birth_date = editBirthDate;

    const { error } = await supabase.from("profiles").update(updates).eq("user_id", user.id);
    if (error) {
      toast.error("Failed to save profile");
    } else {
      setProfile((p) => ({ ...p, ...updates }));
      setNameInput(editName.trim());
      toast.success("Profile saved successfully!");
      if (editBirthDate) checkBirthday(editBirthDate);
    }
    setSaving(false);
  };

  const stats = [
    { label: "Messages", value: messageCount.toLocaleString() },
    { label: "Images", value: usage.images.toString() },
    { label: "Sessions", value: sessionCount.toString() },
  ];

  if (activeSection) {
    return (
      <div className="px-4 pt-4 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setActiveSection(null)} className="p-2 rounded-2xl glass hover:bg-primary/20 transition-colors">
            <ChevronRight className="w-5 h-5 text-foreground rotate-180" />
          </button>
          <h1 className="font-handwritten text-xl text-foreground">
            {activeSection === "notifications" && "Notifications"}
            {activeSection === "language" && "Language"}
            {activeSection === "settings" && "General Settings"}
            {activeSection === "help" && "Help & Support"}
            {activeSection === "saved" && "Saved Creations"}
            {activeSection === "editProfile" && "Edit Profile"}
          </h1>
        </div>

        {activeSection === "editProfile" && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-4">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Display Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-2 border-b border-border/30 focus:border-accent transition-colors"
              />
            </div>

            <div className="glass rounded-2xl p-4">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Age</label>
              <input
                type="number"
                value={editAge}
                onChange={(e) => setEditAge(e.target.value)}
                placeholder="Enter your age"
                min="1"
                max="150"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-2 border-b border-border/30 focus:border-accent transition-colors"
              />
            </div>

            <div className="glass rounded-2xl p-4">
              <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Birth Date
              </label>
              <input
                type="date"
                value={editBirthDate}
                onChange={(e) => setEditBirthDate(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground outline-none py-2 border-b border-border/30 focus:border-accent transition-colors"
              />
            </div>

            {profile.birth_date && (
              <div className="glass rounded-2xl p-4">
                <p className="text-xs text-muted-foreground">Current birthday: {new Date(profile.birth_date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={saveProfile}
              disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-accent text-accent-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Profile"}
            </motion.button>
          </div>
        )}

        {activeSection === "notifications" && (
          <div className="space-y-3">
            {[
              { label: "Push Notifications", desc: "Get alerts for new features & updates", key: "push" },
              { label: "Plan Expiry Alerts", desc: "Reminder before your plan expires", key: "expiry" },
              { label: "Usage Alerts", desc: "Notify when nearing daily limits", key: "usage" },
            ].map((item) => (
              <div key={item.key} className="glass rounded-2xl px-4 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
                <button onClick={() => setNotifEnabled(!notifEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${notifEnabled ? "bg-accent" : "bg-muted"}`}>
                  <motion.div animate={{ x: notifEnabled ? 20 : 2 }}
                    className="w-5 h-5 rounded-full bg-background absolute top-0.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeSection === "language" && (
          <div className="space-y-2">
            {languages.map((lang) => (
              <button key={lang.code} onClick={() => setSelectedLang(lang.code)}
                className="w-full glass rounded-2xl px-4 py-3.5 flex items-center justify-between hover:bg-primary/10 transition-colors">
                <span className="text-sm font-medium text-foreground">{lang.label}</span>
                {selectedLang === lang.code && <Check className="w-4 h-4 text-accent" />}
              </button>
            ))}
          </div>
        )}

        {activeSection === "settings" && (
          <div className="space-y-3">
            <div className="glass rounded-2xl px-4 py-3.5">
              <p className="text-sm font-medium text-foreground mb-1">Display Name</p>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-foreground outline-none border-b border-border/30 py-1" />
                  <button onClick={saveName} className="p-1.5 rounded-xl bg-accent/20"><Check className="w-4 h-4 text-foreground" /></button>
                  <button onClick={() => setEditingName(false)} className="p-1.5 rounded-xl bg-destructive/20"><X className="w-4 h-4 text-destructive" /></button>
                </div>
              ) : (
                <button onClick={() => setEditingName(true)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{displayName} (tap to edit)</button>
              )}
            </div>
            <div className="glass rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-[10px] text-muted-foreground">Switch between light and dark themes</p>
              </div>
              <button onClick={toggleTheme}
                className={`w-11 h-6 rounded-full transition-colors relative ${isDark ? "bg-accent" : "bg-muted"}`}>
                <motion.div animate={{ x: isDark ? 20 : 2 }}
                  className="w-5 h-5 rounded-full bg-background absolute top-0.5 flex items-center justify-center">
                  {isDark ? <Moon className="w-3 h-3 text-foreground" /> : <Sun className="w-3 h-3 text-foreground" />}
                </motion.div>
              </button>
            </div>
            <div className="glass rounded-2xl px-4 py-3.5">
              <p className="text-sm font-medium text-foreground">Account Email</p>
              <p className="text-xs text-muted-foreground mt-1">{user?.email || "Guest mode"}</p>
            </div>
            <div className="glass rounded-2xl px-4 py-3.5">
              <p className="text-sm font-medium text-foreground">Current Plan</p>
              <p className="text-xs text-muted-foreground mt-1">{plan.charAt(0).toUpperCase() + plan.slice(1)}</p>
            </div>
          </div>
        )}

        {activeSection === "help" && (
          <div className="space-y-3">
            {[
              { q: "Who is the CEO and founder of LUMI GPT?", a: "Eshant Jagtap is the CEO and founder of LUMI GPT." },
              { q: "How do I upgrade my plan?", a: "Go to Profile > Subscription to view and upgrade your plan. Pay via UPI and your plan will be activated within 30 minutes." },
              { q: "What AI models does LUMI use?", a: "LUMI GPT uses advanced AI models to provide the best responses. The system automatically routes your queries to the most suitable model." },
              { q: "How do I use Voice Chat?", a: "Tap the microphone icon in the chat or go to Voice Chat from the menu. Speak your question and LUMI will respond with voice." },
              { q: "Is my data safe?", a: "Yes, all your data is encrypted and stored securely. We never share your personal information with third parties." },
              { q: "How do I contact support?", a: "Email us at officiallovevibe@gmail.com for any queries or support." },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl px-4 py-3.5">
                <p className="text-sm font-medium text-foreground mb-1">{item.q}</p>
                <p className="text-xs text-muted-foreground">{item.a}</p>
              </motion.div>
            ))}
          </div>
        )}

        {activeSection === "saved" && (
          <div className="flex flex-col items-center justify-center py-12">
            <Bookmark className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Your saved creations will appear here</p>
            <button onClick={() => navigate("/create")} className="mt-4 px-4 py-2 rounded-2xl bg-accent text-accent-foreground text-sm font-medium">
              Start Creating
            </button>
          </div>
        )}
      </div>
    );
  }

  const menuItems = [
    { icon: User, label: "Edit Profile", action: () => setActiveSection("editProfile") },
    { icon: Bookmark, label: "Saved Creations", action: () => setActiveSection("saved") },
    { icon: Crown, label: "Subscription", badge: plan.charAt(0).toUpperCase() + plan.slice(1), action: () => navigate("/pricing") },
    { icon: Palette, label: "Theme Settings", action: toggleTheme },
    { icon: Bell, label: "Notifications", action: () => setActiveSection("notifications") },
    { icon: Languages, label: "Language", action: () => setActiveSection("language") },
    { icon: Settings, label: "General Settings", action: () => setActiveSection("settings") },
    { icon: HelpCircle, label: "Help & Support", action: () => setActiveSection("help") },
  ];

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <SideDrawer />
        <h1 className="font-handwritten text-xl text-foreground">Profile</h1>
        <button onClick={() => setActiveSection("settings")} className="p-1.5 rounded-xl hover:bg-primary/10 transition-colors">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Birthday Wish */}
      {showBirthdayWish && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-4 mb-6 border border-accent/30 bg-accent/5"
        >
          <div className="flex items-center gap-3">
            <PartyPopper className="w-8 h-8 text-accent flex-shrink-0" />
            <div>
              <p className="font-handwritten text-base font-semibold text-foreground">Happy Birthday, {displayName}!</p>
              <p className="text-xs text-muted-foreground mt-0.5">LUMI wishes you a wonderful day filled with joy!</p>
            </div>
            <button onClick={() => setShowBirthdayWish(false)} className="p-1 rounded-lg hover:bg-primary/10 ml-auto">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mb-3 relative">
          <User className="w-10 h-10 text-foreground" />
          <div className="absolute -bottom-1 -right-1"><LumiSun size={28} /></div>
        </div>
        <h2 className="font-handwritten text-lg font-semibold text-foreground">{displayName}</h2>
        <p className="text-xs text-muted-foreground">
          {plan !== "free" ? `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan` : "Free Plan"}
        </p>
        {profile.age && (
          <p className="text-[10px] text-muted-foreground mt-0.5">Age: {profile.age}</p>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center">
            <p className="font-handwritten text-lg font-semibold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </motion.div>

      <div className="space-y-2">
        {menuItems.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            onClick={item.action}
            className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-primary/10 transition-colors"
          >
            <item.icon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground flex-1 text-left">{item.label}</span>
            {"badge" in item && item.badge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground font-medium">{item.badge}</span>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        ))}

        {!isGuest && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            onClick={signOut}
            className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5 text-destructive" />
            <span className="text-sm font-medium text-destructive flex-1 text-left">Sign Out</span>
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default Profile;
