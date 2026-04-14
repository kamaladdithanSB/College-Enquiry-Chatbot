"use client";

import { motion } from "framer-motion";

export function MeshBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-20 top-0 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(190,236,224,0.85),rgba(190,236,224,0))] blur-2xl"
        animate={{ x: [0, 26, 0], y: [0, 14, 0] }}
        transition={{ duration: 16, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="absolute right-[-12rem] top-48 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(193,214,246,0.72),rgba(193,214,246,0))] blur-2xl"
        animate={{ x: [0, -30, 0], y: [0, 18, 0] }}
        transition={{ duration: 19, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-[-10rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(214,245,232,0.7),rgba(214,245,232,0))] blur-2xl"
        animate={{ scale: [1, 1.07, 1] }}
        transition={{ duration: 14, ease: "easeInOut", repeat: Infinity }}
      />
    </div>
  );
}
