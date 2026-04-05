import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Users, CreditCard, Clock, Check, X, Filter, ArrowLeft, Eye, Brain } from "lucide-react";
import SystemPromptManager from "@/components/SystemPromptManager";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Payment {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  transaction_id: string;
  screenshot_url: string | null;
  status: string;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<string>("pending");
  const [stats, setStats] = useState({ totalUsers: 0, activeSubs: 0, pendingPayments: 0, revenue: 0 });
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  useEffect(() => {
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from("user_roles" as any).select("role").eq("user_id", user.id).eq("role", "admin");
    const admin = (data as any[])?.length > 0;
    setIsAdmin(admin);
    if (admin) {
      loadData();
    }
    setLoading(false);
  };

  const loadData = async () => {
    // Load payments
    const { data: paymentsData } = await supabase
      .from("payments" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (paymentsData) setPayments(paymentsData as any);

    // Load stats
    const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    const { data: subsData } = await supabase.from("subscriptions" as any).select("plan");
    const activeSubs = (subsData as any[])?.filter((s: any) => s.plan !== "free").length || 0;
    const pending = (paymentsData as any[])?.filter((p: any) => p.status === "pending").length || 0;
    const revenue = (paymentsData as any[])?.filter((p: any) => p.status === "approved").reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

    setStats({ totalUsers: userCount || 0, activeSubs, pendingPayments: pending, revenue });
  };

  const handleAction = async (paymentId: string, action: "approved" | "rejected") => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;

    // Update payment status
    await supabase.from("payments" as any).update({
      status: action,
      reviewed_by: user!.id,
      reviewed_at: new Date().toISOString(),
    } as any).eq("id", paymentId);

    if (action === "approved") {
      const now = new Date();
      const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      await supabase.from("subscriptions" as any).update({
        plan: payment.plan,
        start_date: now.toISOString(),
        expiry_date: expiry.toISOString(),
        status: "active",
      } as any).eq("user_id", payment.user_id);

      toast.success(`${payment.plan} plan activated for user`);
    } else {
      toast.info("Payment rejected");
    }

    loadData();
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Loading...</p></div>;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Shield className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="font-handwritten text-xl text-foreground mb-2">Admin Access Required</h2>
        <p className="text-sm text-muted-foreground text-center">You don't have permission to access this page.</p>
        <button onClick={() => navigate("/")} className="mt-4 px-6 py-3 rounded-2xl bg-accent text-accent-foreground text-sm font-medium">Go Home</button>
      </div>
    );
  }

  const filtered = payments.filter((p) => filter === "all" || p.status === filter);

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-2xl glass hover:bg-primary/20 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-handwritten text-xl text-foreground">Admin Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users },
          { label: "Active Subs", value: stats.activeSubs, icon: CreditCard },
          { label: "Pending", value: stats.pendingPayments, icon: Clock },
          { label: "Revenue", value: `₹${stats.revenue}`, icon: CreditCard },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
            <p className="font-handwritten text-lg font-semibold text-foreground">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        {["pending", "approved", "rejected", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-medium transition-colors flex-shrink-0 ${
              filter === f ? "bg-accent text-accent-foreground" : "glass text-foreground"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Payments List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No {filter} payments</p>
        )}
        {filtered.map((p) => (
          <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-mono text-muted-foreground">{p.transaction_id}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    p.plan === "premium" ? "bg-lumi-lavender/50 text-foreground" :
                    p.plan === "pro" ? "bg-accent/20 text-foreground" :
                    "bg-primary/20 text-foreground"
                  }`}>{p.plan}</span>
                  <span className="text-xs font-semibold text-foreground">₹{p.amount}</span>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                p.status === "pending" ? "bg-accent/30 text-foreground" :
                p.status === "approved" ? "bg-lumi-green/20 text-foreground" :
                "bg-destructive/20 text-destructive"
              }`}>{p.status}</span>
            </div>

            <p className="text-[10px] text-muted-foreground mb-2">
              {new Date(p.created_at).toLocaleString("en-IN")}
            </p>

            <div className="flex items-center gap-2">
              {p.screenshot_url && (
                <button onClick={() => setPreviewImg(p.screenshot_url)} className="p-1.5 rounded-xl glass hover:bg-primary/20 transition-colors">
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
              {p.status === "pending" && (
                <>
                  <button onClick={() => handleAction(p.id, "approved")} className="flex-1 py-2 rounded-xl bg-lumi-green/20 text-foreground text-xs font-medium flex items-center justify-center gap-1 hover:bg-lumi-green/30 transition-colors">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => handleAction(p.id, "rejected")} className="flex-1 py-2 rounded-xl bg-destructive/20 text-destructive text-xs font-medium flex items-center justify-center gap-1 hover:bg-destructive/30 transition-colors">
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Screenshot Preview Modal */}
      {previewImg && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={() => setPreviewImg(null)}>
          <motion.img initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} src={previewImg} alt="Screenshot" className="max-w-full max-h-[80vh] rounded-2xl" />
        </div>
      )}
    </div>
  );
};

export default Admin;
