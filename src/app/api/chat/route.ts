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
  return "I can help with fees, deadlines, campus culture, placements, and ROI for Indian colleges. Ask me about up to three colleges and I will structure the details for quick decisions.";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function generateLocalReply(prompt: string, context: Awaited<ReturnType<typeof buildRetrievalContext>>) {
  const normalized = prompt.toLowerCase();
  const institutions = context.context
    .split("\n\n")
    .map((block) => block.split("\n").find((line) => line.startsWith("Institution: "))?.replace("Institution: ", ""))
    .filter((item): item is string => Boolean(item));

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(normalized)) {
    return "Hello. Ask me about college fees, deadlines, or compare institutions and I’ll give you a structured answer.";
  }

  if (/(top|best|rank|ranking).*(university|universities|college|colleges)/.test(normalized)) {
    if (/chennai/.test(normalized)) {
      return [
        "Top colleges commonly shortlisted in Chennai include:",
        "1. IIT Madras",
        "2. Anna University, Chennai",
        "3. SRM Institute of Science and Technology",
        "4. Sathyabama Institute of Science and Technology",
        "5. Vel Tech Rangarajan Dr. Sagunthala R&D Institute",
        "If you share your course and budget, I can rank these for your exact profile.",
      ].join("\n");
    }

    if (/bangalore|bengaluru/.test(normalized)) {
      return [
        "Top colleges commonly shortlisted in Bengaluru include:",
        "1. IISc Bengaluru",
        "2. RV College of Engineering",
        "3. BMS College of Engineering",
        "4. PES University",
        "5. MS Ramaiah Institute of Technology",
        "Share your branch and budget and I’ll build a fit-based shortlist.",
      ].join("\n");
    }

    if (/delhi|new delhi/.test(normalized)) {
      return [
        "Top colleges commonly shortlisted in Delhi include:",
        "1. IIT Delhi",
        "2. Delhi Technological University (DTU)",
        "3. Netaji Subhas University of Technology (NSUT)",
        "4. IIIT Delhi",
        "5. Jamia Millia Islamia",
        "If you want, I can rank these by affordability or placement alignment.",
      ].join("\n");
    }

    if (institutions.length > 0) {
      const ranked = [...context.context.split("\n\n")]
        .map((block) => {
          const name = block.split("\n").find((line) => line.startsWith("Institution: "))?.replace("Institution: ", "");
          const feesLine = block.split("\n").find((line) => line.startsWith("Fees: ")) ?? "";
          const deadlineLine = block.split("\n").find((line) => line.startsWith("Deadlines: ")) ?? "";
          const feeMatch = feesLine.match(/(?:INR|USD)\s([0-9,]+)/i) ?? feesLine.match(/([0-9,]+)/);
          return {
            name,
            fee: feeMatch ? Number(feeMatch[1].replace(/,/g, "")) : Number.POSITIVE_INFINITY,
            deadlineLine,
          };
        })
        .filter((item) => Boolean(item.name))
        .sort((left, right) => left.fee - right.fee)
        .slice(0, 5);

      const summary = ranked
        .map((item, index) => `${index + 1}. ${item.name} - ${item.fee === Number.POSITIVE_INFINITY ? "verified details pending" : formatCurrency(item.fee)}`)
        .join("\n");

      return [
        "I do not have a verified public ranking for that city in the current knowledge base, but these are the nearest verified institutions I can compare:",
        summary,
        "If you want, I can rank them by cost, deadlines, or fit once you share the exact universities you care about.",
      ].join("\n");
    }

    return "I do not have a verified ranking dataset for that location in the current knowledge base. If you name the universities, I can compare fees, deadlines, and fit side by side.";
  }

  if (/fee|fees|tuition|cost|tcoa|price|expense/.test(normalized)) {
    const lines = context.context
      .split("\n\n")
      .map((block) => {
        const name = block.split("\n").find((line) => line.startsWith("Institution: "))?.replace("Institution: ", "") ?? "Unknown institution";
        const fees = block.split("\n").find((line) => line.startsWith("Fees: "))?.replace("Fees: ", "") ?? "No verified fee data available.";
        return `- ${name}: ${fees}`;
      })
      .join("\n");

    return [
      "Here are the verified fee details I can find right now:",
      lines,
      "If you want a direct comparison, send up to three institution names and I’ll summarize them clearly.",
    ].join("\n");
  }

  if (/deadline|intake|application|scholarship/.test(normalized)) {
    const lines = context.context
      .split("\n\n")
      .map((block) => {
        const name = block.split("\n").find((line) => line.startsWith("Institution: "))?.replace("Institution: ", "") ?? "Unknown institution";
        const deadlines = block.split("\n").find((line) => line.startsWith("Deadlines: "))?.replace("Deadlines: ", "") ?? "No verified deadline data available.";
        return `- ${name}: ${deadlines}`;
      })
      .join("\n");

    return [
      "Here are the verified deadlines I can find right now:",
      lines,
      "If you want, I can also turn these into a shortlist based on urgency and affordability.",
    ].join("\n");
  }

  if (/compare|vs|versus|shortlist|fit|recommend/.test(normalized)) {
    return [
      "I can compare institutions by fees, deadlines, and source freshness.",
      "Send up to three college names and I’ll return a concise side-by-side summary.",
    ].join(" ");
  }

  return [
    fallbackReply(),
    "You can ask me things like: 'compare fees for IIT Madras and Anna University', 'what are the deadlines?', or 'help me shortlist by budget'.",
  ].join(" ");
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? "anonymous";

    const dayStamp = new Date().toISOString().slice(0, 10);
    const quotaKey = `quota:${userId}:${dayStamp}`;
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

    const cacheKey = `chat:${session?.user?.teamId ?? "default"}:${latestPrompt.toLowerCase().trim()}`;
    const cached = await cacheGet<ChatResponsePayload>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const retrieval = await buildRetrievalContext(messages, session?.user?.teamId);
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

    let text = generateLocalReply(latestPrompt, retrieval);

    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: process.env.MCP_OPENAI_BASE_URL,
        });

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

        text = completion.choices[0]?.message?.content?.trim() || text;
      } catch {
        text = generateLocalReply(latestPrompt, retrieval);
      }
    } else {
      text = generateLocalReply(latestPrompt, retrieval);
    }

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
