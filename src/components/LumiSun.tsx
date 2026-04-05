import { motion } from "framer-motion";

interface LumiSunProps {
  size?: number;
  className?: string;
}

const LumiSun = ({ size = 80, className = "" }: LumiSunProps) => {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Rays */}
        {[...Array(8)].map((_, i) => (
          <motion.line
            key={i}
            x1="50" y1="10" x2="50" y2="2"
            stroke="hsl(48 90% 63%)"
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${i * 45} 50 50)`}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
        {/* Sun body */}
        <circle cx="50" cy="50" r="28" fill="hsl(48 90% 70%)" />
        <circle cx="50" cy="50" r="24" fill="hsl(48 90% 75%)" />
        {/* Blush */}
        <circle cx="37" cy="55" r="5" fill="hsl(15 80% 85%)" opacity="0.6" />
        <circle cx="63" cy="55" r="5" fill="hsl(15 80% 85%)" opacity="0.6" />
        {/* Eyes */}
        <circle cx="42" cy="47" r="3" fill="hsl(24 55% 25%)" />
        <circle cx="58" cy="47" r="3" fill="hsl(24 55% 25%)" />
        <circle cx="43" cy="46" r="1" fill="white" />
        <circle cx="59" cy="46" r="1" fill="white" />
        {/* Smile */}
        <path d="M 42 56 Q 50 64 58 56" stroke="hsl(24 55% 25%)" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
};

export default LumiSun;
