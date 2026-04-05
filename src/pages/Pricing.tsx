import { motion } from "framer-motion";
import { Check, Star, Zap, Crown, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 99,
    icon: Star,
    color: "bg-primary/20",
    features: [
      "30 AI messages per day",
      "5 image generations per day",
      "Standard response speed",
      "Standard AI model",
      "No ads",
    ],
    audience: "Students & light users",
  },
  {
    id: "pro",
    name: "Pro",
    price: 199,
    icon: Zap,
    color: "bg-accent/20",
    popular: true,
    features: [
      "120 AI messages per day",
      "25 image generations per day",
      "Faster response speed",
      "Better AI model",
      "Priority processing",
      "Early access to new features",
    ],
    audience: "Daily users & content creators",
  },
  {
    id: "premium",
    name: "Premium",
    price: 499,
    icon: Crown,
    color: "bg-lumi-lavender/50",
    features: [
      "Unlimited messages (500/day fair use)",
      "80 image generations per day",
      "Fastest response speed",
      "Best AI model available",
      "No feature restrictions",
      "Priority support",
    ],
    audience: "Power users & businesses",
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-2xl glass hover:bg-primary/20 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-handwritten text-xl text-foreground">Choose Your Plan</h1>
      </div>

      <p className="text-sm text-muted-foreground mb-6 text-center">
        Unlock the full power of LUMI GPT
      </p>

      <div className="space-y-4">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass rounded-3xl p-5 relative ${plan.popular ? "ring-2 ring-accent" : ""}`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold">
                Most Popular
              </span>
            )}

            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-2xl ${plan.color} flex items-center justify-center`}>
                <plan.icon className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h3 className="font-handwritten text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="text-[10px] text-muted-foreground">{plan.audience}</p>
              </div>
              <div className="ml-auto text-right">
                <span className="font-handwritten text-2xl font-bold text-foreground">&#8377;{plan.price}</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-lumi-green flex-shrink-0" />
                  <span className="text-xs text-foreground">{f}</span>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (!user) {
                  navigate("/");
                  return;
                }
                navigate(`/payment?plan=${plan.id}&amount=${plan.price}`);
              }}
              className={`w-full py-3 rounded-2xl font-medium text-sm transition-all ${
                plan.popular
                  ? "bg-accent text-accent-foreground"
                  : "glass border border-border/50 text-foreground hover:bg-primary/20"
              }`}
            >
              Upgrade Now
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
