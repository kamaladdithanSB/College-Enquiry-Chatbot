import { TeamRole } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const writeRoles: TeamRole[] = ["OWNER", "ADMIN", "EDITOR"];

export async function requireActiveUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  const member = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "asc" },
  });

  if (!member) {
    throw new Error("NO_TEAM");
  }

  return {
    session,
    membership: member,
  };
}

export function canWrite(role: TeamRole) {
  return writeRoles.includes(role);
}

export function canManageTeam(role: TeamRole) {
  return role === "OWNER" || role === "ADMIN";
}
