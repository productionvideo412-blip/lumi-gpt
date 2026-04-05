import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Upload, CheckCircle, AlertCircle, CreditCard, QrCode } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import qrCodeImage from "@/assets/upi-qr-code.png";

const UPI_ID = "eshant12@fam";

const Payment = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const plan = params.get("plan") || "basic";
  const amount = parseInt(params.get("amount") || "99");

  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const copyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast.success("UPI ID copied!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in first"); return; }
    if (transactionId.length < 12 || transactionId.length > 20) {
      toast.error("Transaction ID must be 12-20 characters");
      return;
    }

    setLoading(true);
    try {
      let screenshotUrl: string | null = null;
      if (screenshot) {
        const ext = screenshot.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("payment-screenshots")
          .upload(path, screenshot);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage
          .from("payment-screenshots")
          .getPublicUrl(path);
        screenshotUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("payments").insert({
        user_id: user.id,
        plan,
        amount,
        transaction_id: transactionId,
        screenshot_url: screenshotUrl,
      });

      if (error) {
        if (error.message.includes("duplicate")) {
          toast.error("This Transaction ID has already been used");
        } else throw error;
        return;
      }

      setSubmitted(true);
      toast.success("Payment submitted! Activation within 30 minutes.");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit payment");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="px-4 pt-4 pb-24 flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-4">
          <CheckCircle className="w-16 h-16 text-lumi-green" />
        </motion.div>
        <h2 className="font-handwritten text-xl text-foreground mb-2">Payment Submitted</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Your {plan.charAt(0).toUpperCase() + plan.slice(1)} plan will be activated within 30 minutes after verification.
        </p>
        <button onClick={() => navigate("/")} className="px-6 py-3 rounded-2xl bg-accent text-accent-foreground font-medium text-sm">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-2xl glass hover:bg-primary/20 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-handwritten text-xl text-foreground">Complete Payment</h1>
      </div>

      {/* Plan Summary */}
      <div className="glass rounded-3xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-accent" />
            <div>
              <p className="font-medium text-sm text-foreground">{plan.charAt(0).toUpperCase() + plan.slice(1)} Plan</p>
              <p className="text-[10px] text-muted-foreground">Monthly subscription</p>
            </div>
          </div>
          <span className="font-handwritten text-xl font-bold text-foreground">&#8377;{amount}</span>
        </div>
      </div>

      {/* UPI Details */}
      <div className="glass rounded-3xl p-4 mb-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Pay via UPI</h3>
        
        {/* UPI ID */}
        <div className="flex items-center justify-between glass rounded-2xl px-4 py-3 mb-3">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">UPI ID</p>
            <span className="text-sm font-mono text-foreground font-semibold">{UPI_ID}</span>
          </div>
          <button onClick={copyUPI} className="p-2 rounded-xl bg-accent/20 hover:bg-accent/30 transition-colors">
            <Copy className="w-4 h-4 text-accent" />
          </button>
        </div>

        {/* QR Code Toggle */}
        <button
          onClick={() => setShowQR(!showQR)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl glass hover:bg-primary/10 transition-colors mb-3"
        >
          <QrCode className="w-4 h-4 text-accent" />
          <span className="text-xs font-medium text-foreground">{showQR ? "Hide QR Code" : "Show QR Code"}</span>
        </button>

        {/* QR Code Image */}
        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex justify-center mb-3"
          >
            <img
              src={qrCodeImage}
              alt="UPI QR Code - Scan to Pay"
              className="w-56 h-56 rounded-2xl object-contain"
            />
          </motion.div>
        )}

        {/* Steps */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-foreground flex-shrink-0">1</span> Pay &#8377;{amount} using any UPI app (GPay, PhonePe, Paytm)</p>
          <p className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-foreground flex-shrink-0">2</span> Enter the Transaction ID below</p>
          <p className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-foreground flex-shrink-0">3</span> Upload screenshot (optional)</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="glass rounded-3xl p-4">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Transaction ID *</label>
          <input
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Enter 12-20 character transaction ID"
            required
            minLength={12}
            maxLength={20}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-2 border-b border-border/30 focus:border-accent transition-colors"
          />
        </div>

        <div className="glass rounded-3xl p-4">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Payment Screenshot (optional)</label>
          <label className="flex items-center gap-3 cursor-pointer py-2">
            <Upload className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-foreground">
              {screenshot ? screenshot.name : "Tap to upload"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div className="flex items-center gap-2 px-2">
          <AlertCircle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <p className="text-[10px] text-muted-foreground">Activation within 30 minutes after verification</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-3xl bg-accent text-accent-foreground font-handwritten text-lg font-semibold transition-all disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Payment"}
        </motion.button>
      </form>
    </div>
  );
};

export default Payment;
