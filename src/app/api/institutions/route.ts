import { NextResponse } from "next/server";

import { getInstitutionRows } from "@/lib/knowledge-base";

export async function GET() {
  const institutions = await getInstitutionRows();
  return NextResponse.json({ institutions });
}
