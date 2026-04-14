import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const requiredEnv = [
  "OPENAI_API_KEY",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

export async function GET() {
  const missing = requiredEnv.filter((key) => !process.env[key]);

  let db = "not-configured";
  if (process.env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      db = "ok";
    } catch {
      db = "error";
    }
  }

  const ok = missing.length === 0 && db !== "error";

  return NextResponse.json(
    {
      ok,
      timestamp: new Date().toISOString(),
      checks: {
        env: missing.length ? "missing" : "ok",
        database: db,
      },
      missingEnv: missing,
    },
    { status: ok ? 200 : 503 },
  );
}
