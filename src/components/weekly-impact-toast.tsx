"use client";

import { AnimatePresence, motion } from "framer-motion";

interface WeeklyImpactToastProps {
  show: boolean;
  gain: number;
  savedHours: number;
}

export function WeeklyImpactToast({ show, gain, savedHours }: WeeklyImpactToastProps) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.aside
          role="status"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="fixed bottom-6 right-4 z-40 w-[min(94vw,24rem)] rounded-[1.2rem] border border-white/30 bg-white/18 p-4 shadow-[0_20px_70px_rgba(38,71,60,0.24)] backdrop-blur-[20px] sm:right-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5b7f74]">Weekly Impact</p>
          <p className="mt-2 text-sm text-[#133126]">
            Efficiency Gain: <span className="font-semibold">{gain}%</span> and about{" "}
            <span className="font-semibold">{savedHours.toFixed(1)} hrs</span> saved this week.
          </p>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
