import { motion } from "framer-motion";

const Cloud = ({ className, delay = 0, duration = 20 }: { className?: string; delay?: number; duration?: number }) => (
  <motion.div
    className={`absolute opacity-30 dark:opacity-10 ${className}`}
    animate={{ x: ["-10%", "10%", "-10%"] }}
    transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
  >
    <svg viewBox="0 0 200 80" className="w-full h-full fill-primary/40">
      <ellipse cx="60" cy="50" rx="50" ry="25" />
      <ellipse cx="100" cy="40" rx="60" ry="30" />
      <ellipse cx="150" cy="50" rx="45" ry="22" />
      <ellipse cx="120" cy="55" rx="40" ry="20" />
    </svg>
  </motion.div>
);

const FloatingClouds = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <Cloud className="top-10 -left-10 w-48 h-20" delay={0} duration={25} />
    <Cloud className="top-32 right-0 w-56 h-24" delay={3} duration={30} />
    <Cloud className="bottom-40 -left-5 w-40 h-16" delay={5} duration={22} />
    <Cloud className="top-1/2 right-10 w-36 h-14" delay={8} duration={28} />
  </div>
);

export default FloatingClouds;
