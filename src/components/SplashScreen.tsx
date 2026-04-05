import { motion } from "framer-motion";
import LumiSun from "./LumiSun";

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={() => {}}
    >
      {/* Floating clouds */}
      <motion.div
        className="absolute top-20 left-4 opacity-30"
        animate={{ x: [0, 30, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 200 80" className="w-36 h-14 fill-primary/50">
          <ellipse cx="60" cy="50" rx="50" ry="25" />
          <ellipse cx="100" cy="40" rx="60" ry="30" />
          <ellipse cx="150" cy="50" rx="45" ry="22" />
        </svg>
      </motion.div>
      <motion.div
        className="absolute top-40 right-2 opacity-20"
        animate={{ x: [0, -20, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <svg viewBox="0 0 200 80" className="w-44 h-16 fill-primary/40">
          <ellipse cx="60" cy="50" rx="50" ry="25" />
          <ellipse cx="100" cy="40" rx="60" ry="30" />
          <ellipse cx="150" cy="50" rx="45" ry="22" />
        </svg>
      </motion.div>
      <motion.div
        className="absolute bottom-32 left-10 opacity-25"
        animate={{ x: [0, 15, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <svg viewBox="0 0 200 80" className="w-32 h-12 fill-primary/40">
          <ellipse cx="60" cy="50" rx="50" ry="25" />
          <ellipse cx="100" cy="40" rx="60" ry="30" />
        </svg>
      </motion.div>

      {/* Sun mascot */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
      >
        <LumiSun size={120} />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="font-handwritten text-3xl text-foreground mt-6"
      >
        LUMI GPT
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-sm text-muted-foreground mt-2"
      >
        Bright Intelligence, Beautifully Simple ☀️
      </motion.p>

      {/* Sunflower loading */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8"
      >
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="inline-block text-2xl"
        >
          🌻
        </motion.span>
      </motion.div>

      {/* Auto-dismiss */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        onAnimationComplete={onFinish}
      />
    </motion.div>
  );
};

export default SplashScreen;
