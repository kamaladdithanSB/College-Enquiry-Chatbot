import { NextResponse } from "next/server";

import { canWrite, requireActiveUser } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { institutionUpsertSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { membership, session } = await requireActiveUser();
    if (!canWrite(membership.role)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = await params;
    const parsed = institutionUpsertSchema.parse(await request.json());

    const updated = await prisma.institution.updateMany({
      where: { id, teamId: membership.teamId },
      data: {
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

    if (updated.count === 0) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const institution = await prisma.institution.findFirst({
      where: { id, teamId: membership.teamId },
    });

    if (!institution) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    await prisma.verificationLog.create({
      data: {
        teamId: membership.teamId,
        institutionId: institution.id,
        verifierId: session.user.id,
        sourceUrlSnapshot: institution.sourceUrl,
        lastVerifiedAt: institution.lastVerifiedAt,
        note: "Updated via admin panel",
      },
    });

    return NextResponse.json({ institution });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { membership } = await requireActiveUser();
    if (!canWrite(membership.role)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = await params;

    const deleted = await prisma.institution.deleteMany({
      where: { id, teamId: membership.teamId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
