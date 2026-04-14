"use client";

import { motion } from "framer-motion";

interface VibePulseProps {
  state: "thinking" | "ready";
}

export function VibePulse({ state }: VibePulseProps) {
  const thinking = state === "thinking";

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden rounded-[2rem]">
      <svg
        className="h-full w-full"
        viewBox="0 0 1200 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="pulseA" cx="30%" cy="30%" r="55%">
            <stop offset="0%" stopColor="rgba(178, 225, 210, 0.50)" />
            <stop offset="100%" stopColor="rgba(178, 225, 210, 0.00)" />
          </radialGradient>
          <radialGradient id="pulseB" cx="70%" cy="60%" r="55%">
            <stop offset="0%" stopColor="rgba(184, 204, 240, 0.44)" />
            <stop offset="100%" stopColor="rgba(184, 204, 240, 0.00)" />
          </radialGradient>
        </defs>

        <motion.circle
          cx="360"
          cy="280"
          r="260"
          fill="url(#pulseA)"
          animate={thinking ? { opacity: [0.42, 0.72, 0.42] } : { opacity: [0.48, 0.56, 0.48] }}
          transition={{ duration: thinking ? 2.8 : 5.2, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.circle
          cx="840"
          cy="620"
          r="280"
          fill="url(#pulseB)"
          animate={thinking ? { opacity: [0.4, 0.7, 0.4] } : { opacity: [0.5, 0.58, 0.5] }}
          transition={{ duration: thinking ? 3.1 : 5.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
