"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { calculateEfficiencyGain } from "@/lib/efficiency";
import type { ChatMessage, ChatResponsePayload } from "@/types/chat";

import { VibePulse } from "./vibe-pulse";
import { WeeklyImpactToast } from "./weekly-impact-toast";

interface NebulaChatProps {
  onProcessingChange: (state: "thinking" | "ready") => void;
}

interface UIMessage extends ChatMessage {
  id: string;
  verification?: ChatResponsePayload["verification"];
}

const starterPrompts = [
  "✨ Compare Fees",
  "📅 Track Deadlines",
  "🎓 Find My Fit",
];

export function NebulaChat({ onProcessingChange }: NebulaChatProps) {
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Clarity for your future. Ask me about fees, campuses, deadlines, and ROI without the noise.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [impact, setImpact] = useState({ manualHours: 6, vedaHours: 2.1, gainPercentage: 65 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const efficiencyGain = useMemo(
    () => calculateEfficiencyGain(impact.manualHours, impact.vedaHours),
    [impact.manualHours, impact.vedaHours],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    onProcessingChange(isLoading ? "thinking" : "ready");
  }, [isLoading, onProcessingChange]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage: UIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const payloadMessages: ChatMessage[] = [...messages, userMessage].map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      const data = (await response.json()) as ChatResponsePayload;

      if (!response.ok && response.status === 429) {
        setMessages((previous) => [
          ...previous,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.reply,
          },
        ]);
        return;
      }

      const assistantMessage: UIMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        verification: data.verification,
      };

      setMessages((previous) => [...previous, assistantMessage]);
      if (data.efficiency) {
        setImpact(data.efficiency);
      }
      setShowImpact(true);
      window.setTimeout(() => setShowImpact(false), 4200);
    } catch {
      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "I hit a connection issue while reaching the verification service. Please retry in a few seconds.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSend(input);
  };

  return (
    <section className="glass-zen relative mx-auto w-full max-w-3xl overflow-hidden rounded-[2.4rem] p-4 sm:p-6">
      <VibePulse state={isLoading ? "thinking" : "ready"} />
      <div className="relative z-10">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.33em] text-[#6e8e82]">Veda AI</p>
        <h1 className="mt-4 text-center font-heading text-5xl leading-[0.98] text-[#1f2b26] sm:text-7xl">
          Your College
          <br />
          Companion
        </h1>
        <p className="mx-auto mt-7 max-w-xl text-center text-lg leading-9 text-[#395349] sm:text-[2rem] sm:leading-[3rem]">
          Clarity for your future. Ask Veda about fees, campuses, and deadlines without the noise.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              aria-label={prompt}
              onClick={() => void handleSend(prompt)}
              className="min-h-11 rounded-full border border-white/45 bg-white/50 px-6 text-lg text-[#344f45] shadow-[0_8px_24px_rgba(40,56,50,0.16)] transition hover:-translate-y-0.5 hover:bg-white/62"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div
          ref={scrollRef}
          className="mt-8 max-h-[22rem] space-y-3 overflow-y-auto rounded-2xl border border-white/35 bg-white/25 p-4"
        >
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.article
                key={message.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className={
                  message.role === "assistant"
                    ? "rounded-2xl border border-white/35 bg-white/56 p-3"
                    : "ml-auto max-w-[85%] rounded-2xl bg-[#2d5c4b] p-3 text-white"
                }
              >
                <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                {message.verification && message.verification.length > 0 ? (
                  <div className="mt-3 rounded-xl border border-[#bddacc] bg-[#f7fffb]/75 p-3 text-xs text-[#244537]">
                    {message.verification.map((item) => (
                      <p key={`${item.institution}-${item.topic}-${item.sourceUrl}`} className="mt-1 first:mt-0">
                        {item.institution} {item.topic}: last_verified={" "}
                        {new Date(item.lastVerified).toISOString()} |{" "}
                        <a
                          href={item.sourceUrl}
                          className="inline-flex min-h-11 items-center font-medium underline underline-offset-2"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.sourceLabel}
                        </a>
                      </p>
                    ))}
                  </div>
                ) : null}
              </motion.article>
            ))}
          </AnimatePresence>

          {isLoading ? (
            <motion.p
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="text-sm text-[#315346]"
            >
              Veda is verifying sources...
            </motion.p>
          ) : null}
        </div>

        <form onSubmit={onSubmit} className="mt-4 flex gap-2 sm:gap-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Inquire with Veda..."
            aria-label="Ask Veda"
            className="min-h-11 flex-1 rounded-full border border-white/45 bg-white/56 px-4 text-sm text-[#17352a] outline-none placeholder:text-[#5f7a70] focus:border-[#7dab9b]"
          />
          <button
            type="submit"
            disabled={isLoading}
            aria-label="Send message"
            className="min-h-11 min-w-11 rounded-full bg-[#2a5f4e] px-5 text-sm font-semibold text-white transition hover:bg-[#234f41] disabled:opacity-60"
          >
            Send
          </button>
        </form>
      </div>

      <WeeklyImpactToast
        show={showImpact}
        gain={efficiencyGain}
        savedHours={impact.manualHours - impact.vedaHours}
      />
    </section>
  );
}
