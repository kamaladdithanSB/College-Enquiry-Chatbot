import { NextResponse } from "next/server";

import { canManageTeam, requireActiveUser } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { teamMemberInviteSchema } from "@/lib/validation";

export async function GET() {
  try {
    const { membership } = await requireActiveUser();

    const members = await prisma.teamMember.findMany({
      where: { teamId: membership.teamId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ members });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { membership } = await requireActiveUser();

    if (!canManageTeam(membership.role)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const parsed = teamMemberInviteSchema.parse(await request.json());

    const user = await prisma.user.upsert({
      where: { email: parsed.email },
      update: {},
      create: { email: parsed.email, name: parsed.email.split("@")[0] },
    });

    const member = await prisma.teamMember.upsert({
      where: {
        userId_teamId: {
          userId: user.id,
          teamId: membership.teamId,
        },
      },
      update: {
        role: parsed.role,
        status: "ACTIVE",
      },
      create: {
        userId: user.id,
        teamId: membership.teamId,
        role: parsed.role,
        status: "ACTIVE",
      },
      include: { user: true },
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAILED";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
