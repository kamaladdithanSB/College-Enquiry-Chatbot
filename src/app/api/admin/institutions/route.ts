import { NextResponse } from "next/server";

import { canWrite, requireActiveUser } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { institutionUpsertSchema } from "@/lib/validation";

export async function GET() {
  try {
    const { membership } = await requireActiveUser();

    const institutions = await prisma.institution.findMany({
      where: { teamId: membership.teamId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ institutions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { membership, session } = await requireActiveUser();
    if (!canWrite(membership.role)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const parsed = institutionUpsertSchema.parse(await request.json());

    const institution = await prisma.institution.create({
      data: {
        teamId: membership.teamId,
        name: parsed.name,
        aliases: parsed.aliases,
        campusCity: parsed.campusCity,
        campusCountry: parsed.campusCountry,
        website: parsed.website,
        tuitionUsd: parsed.tuitionUsd,
        housingUsd: parsed.housingUsd,
        miscUsd: parsed.miscUsd,
        tcoaUsd: parsed.tuitionUsd + parsed.housingUsd + parsed.miscUsd,
        feeSummary: parsed.feeSummary,
        deadlineSummary: parsed.deadlineSummary,
        applicationDeadline: parsed.applicationDeadline
          ? new Date(parsed.applicationDeadline)
          : null,
        scholarshipDeadline: parsed.scholarshipDeadline
          ? new Date(parsed.scholarshipDeadline)
          : null,
        sourceLabel: parsed.sourceLabel,
        sourceUrl: parsed.sourceUrl,
        lastVerifiedAt: new Date(parsed.lastVerifiedAt),
        verifiedById: session.user.id,
      },
    });

    await prisma.verificationLog.create({
      data: {
        teamId: membership.teamId,
        institutionId: institution.id,
        verifierId: session.user.id,
        sourceUrlSnapshot: institution.sourceUrl,
        lastVerifiedAt: institution.lastVerifiedAt,
        note: "Created via admin panel",
      },
    });

    return NextResponse.json({ institution }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
