import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { estimateEfficiencyFromPrompt } from "@/lib/efficiency";
import { cacheGet, cacheSet, incrementDailyCounter } from "@/lib/kv";
import { buildRetrievalContext } from "@/lib/retrieval";
import type { ChatMessage, ChatResponsePayload } from "@/types/chat";

const modelName = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const dailyQuestionLimit = 50;

function fallbackReply() {
  return "I can help with tuition, deadlines, campus culture, and ROI. Ask me about up to three colleges and I will structure the details for quick decisions.";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          reply: "Please sign in with Google to ask verified questions.",
          status: "ready",
          verification: [],
        } satisfies ChatResponsePayload,
        { status: 401 },
      );
    }

    const dayStamp = new Date().toISOString().slice(0, 10);
    const quotaKey = `quota:${session.user.id}:${dayStamp}`;
    const usageCount = await incrementDailyCounter(quotaKey);
    if (usageCount > dailyQuestionLimit) {
      return NextResponse.json(
        {
          reply:
            "Daily limit reached (50 questions). Please come back tomorrow or ask an admin to increase quota.",
          status: "ready",
          verification: [],
        } satisfies ChatResponsePayload,
        { status: 429 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          reply:
            "OpenAI key is missing. Add OPENAI_API_KEY in your environment to enable live answers.",
          status: "ready",
          verification: [],
        } satisfies ChatResponsePayload,
        { status: 200 },
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.MCP_OPENAI_BASE_URL,
    });

    const body = (await request.json()) as { messages?: ChatMessage[] };
    const messages = body.messages ?? [];
    const latestPrompt = [...messages].reverse().find((item) => item.role === "user")?.content ?? "";
    const efficiency = estimateEfficiencyFromPrompt(latestPrompt);

    if (!messages.length) {
      return NextResponse.json(
        {
          reply: fallbackReply(),
          status: "ready",
          verification: [],
          efficiency,
        } satisfies ChatResponsePayload,
      );
    }

    const cacheKey = `chat:${session.user.teamId ?? "default"}:${latestPrompt.toLowerCase().trim()}`;
    const cached = await cacheGet<ChatResponsePayload>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const retrieval = await buildRetrievalContext(messages, session.user.teamId);
    const hasStaleSource = retrieval.verification.some((item) => item.isStale);

    const systemPrompt = [
      "You are Veda AI, a premium college enquiry companion.",
      "Answer concisely, with a calm premium tone and practical guidance.",
      "Use retrieval context for factual statements.",
      "Verification-first policy:",
      "- If the user asks about fees, tuition, or deadlines, only provide values supported by retrieval context.",
      "- If context is missing for a requested institution, clearly say verification is pending.",
      "- If any source is stale (>7 days), include 'Verification Warning' and still answer using available data.",
      "- Do not fabricate dates, costs, or links.",
      "Return plain text only.",
      "Retrieved Context:",
      retrieval.context,
    ].join("\n");

    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      temperature: 0.35,
    });

    const text = completion.choices[0]?.message?.content?.trim() || fallbackReply();

    const warning = hasStaleSource
      ? "Verification Warning: some records are older than 7 days. Please confirm with the linked official source."
      : undefined;

    const payload: ChatResponsePayload = {
      reply: warning ? `${text}\n\n${warning}` : text,
      status: "ready",
      verification: retrieval.requiresVerification ? retrieval.verification : [],
      verificationWarning: warning,
      efficiency,
    };

    await cacheSet(cacheKey, payload, 60 * 10);

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      {
        reply:
          "Veda is temporarily unavailable. Please retry in a moment while I refresh the knowledge channel.",
        status: "ready",
        verification: [],
        efficiency: {
          manualHours: 0,
          vedaHours: 0,
          gainPercentage: 0,
        },
      } satisfies ChatResponsePayload,
      { status: 500 },
    );
  }
}
