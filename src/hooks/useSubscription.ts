import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Subscription {
  plan: string;
  expiry_date: string | null;
  status: string;
}

const PLAN_LIMITS: Record<string, { messages: number; images: number }> = {
  free: { messages: 10, images: 2 },
  basic: { messages: 30, images: 5 },
  pro: { messages: 120, images: 25 },
  premium: { messages: 500, images: 80 },
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState({ messages: 0, images: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const { data: sub } = await supabase
      .from("subscriptions" as any)
      .select("plan, expiry_date, status")
      .eq("user_id", user.id)
      .single();
    
    if (sub) {
      const s = sub as any;
      // Check expiry
      if (s.expiry_date && new Date(s.expiry_date) < new Date() && s.plan !== "free") {
        await supabase.from("subscriptions" as any)
          .update({ plan: "free", status: "expired" } as any)
          .eq("user_id", user.id);
        setSubscription({ plan: "free", expiry_date: null, status: "expired" });
      } else {
        setSubscription(s);
      }
    }

    const today = new Date().toISOString().split("T")[0];
    const { data: usageData } = await supabase
      .from("daily_usage" as any)
      .select("messages_used, images_used")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .single();

    if (usageData) {
      const u = usageData as any;
      setUsage({ messages: u.messages_used, images: u.images_used });
    }
    setLoading(false);
  };

  const incrementUsage = async (type: "messages" | "images") => {
    if (!user) return true; // guests pass through
    const plan = subscription?.plan || "free";
    const limits = PLAN_LIMITS[plan];
    const current = type === "messages" ? usage.messages : usage.images;

    if (current >= limits[type]) return false;

    const today = new Date().toISOString().split("T")[0];
    const field = type === "messages" ? "messages_used" : "images_used";

    const { data: existing } = await supabase
      .from("daily_usage" as any)
      .select("id")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .single();

    if (existing) {
      await supabase.from("daily_usage" as any)
        .update({ [field]: current + 1 } as any)
        .eq("user_id", user.id)
        .eq("usage_date", today);
    } else {
      await supabase.from("daily_usage" as any).insert({
        user_id: user.id,
        usage_date: today,
        [field]: 1,
      } as any);
    }

    setUsage((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    return true;
  };

  const plan = subscription?.plan || "free";
  const limits = PLAN_LIMITS[plan];

  return {
    plan,
    limits,
    usage,
    subscription,
    loading,
    incrementUsage,
    refresh: loadData,
  };
};
