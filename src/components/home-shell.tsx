"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { NebulaChat } from "@/components/nebula-chat";
import { ShortlistPanel } from "@/components/shortlist-panel";
import type { InstitutionRow } from "@/lib/knowledge-base";

const LazyMeshBackground = dynamic(
  () => import("@/components/mesh-background").then((module) => module.MeshBackground),
  { ssr: false },
);

interface HomeShellProps {
  institutions: InstitutionRow[];
}

export function HomeShell({ institutions }: HomeShellProps) {
  const [state, setState] = useState<"thinking" | "ready">("ready");

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-28 pt-6 sm:px-8 sm:pb-10 sm:pt-10">
      <LazyMeshBackground />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between rounded-[1.6rem] border border-white/35 bg-white/24 px-4 py-3 backdrop-blur-[20px] sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2d5f4e] text-2xl text-white">⌄</div>
          <div>
            <p className="font-heading text-3xl leading-none text-[#244137] sm:text-4xl">Veda AI</p>
            <p className="text-xs uppercase tracking-[0.18em] text-[#54786b]">Premium College Enquiry Companion</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-full border border-white/35 bg-white/38 px-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e9f3ef] text-lg">🧑🏻‍🎓</div>
          <div className="hidden sm:block">
            <p className="text-xs uppercase tracking-[0.15em] text-[#5b7d72]">Status</p>
            <p className="text-sm font-semibold text-[#27483d]">{state === "thinking" ? "Verifying" : "Ready"}</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto mt-8 flex w-full max-w-6xl flex-col gap-6">
        <NebulaChat onProcessingChange={setState} />
        <ShortlistPanel institutions={institutions} />
      </main>

      <nav className="fixed bottom-3 left-1/2 z-40 flex w-[min(95vw,34rem)] -translate-x-1/2 items-center justify-between rounded-full border border-white/35 bg-white/25 px-5 py-2 backdrop-blur-[20px] sm:hidden">
        <button aria-label="Open pulse" className="min-h-11 min-w-11 rounded-full bg-[#b7ddd0] text-xl">✦</button>
        <button aria-label="Switch mode" className="min-h-11 min-w-11 rounded-full text-xl text-[#5a7468]">⇄</button>
        <button aria-label="Saved shortlist" className="min-h-11 min-w-11 rounded-full text-xl text-[#5a7468]">🔖</button>
        <button aria-label="Profile" className="min-h-11 min-w-11 rounded-full text-xl text-[#5a7468]">🪪</button>
      </nav>
    </div>
  );
}
