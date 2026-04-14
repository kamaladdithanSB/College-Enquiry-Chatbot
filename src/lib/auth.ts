import { PrismaAdapter } from "@auth/prisma-adapter";
import type { TeamRole } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "@/lib/prisma";

function normalizeEmailList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

async function ensureTeamMembership(userId: string, email?: string | null) {
  const defaultTeamName = process.env.DEFAULT_TEAM_NAME ?? "Veda Ops";
  const defaultTeamSlug =
    process.env.DEFAULT_TEAM_SLUG ?? defaultTeamName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const team = await prisma.team.upsert({
    where: { slug: defaultTeamSlug },
    update: {},
    create: { name: defaultTeamName, slug: defaultTeamSlug },
  });

  const existingMember = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId: team.id,
      },
    },
  });

  if (existingMember) {
    return;
  }

  const adminEmails = normalizeEmailList(process.env.TEAM_ADMIN_EMAILS);
  const normalizedEmail = (email ?? "").toLowerCase();

  const teamMemberCount = await prisma.teamMember.count({
    where: { teamId: team.id, status: "ACTIVE" },
  });

  let role: TeamRole = "EDITOR";
  if (teamMemberCount === 0) {
    role = "OWNER";
  } else if (adminEmails.includes(normalizedEmail)) {
    role = "ADMIN";
  }

  await prisma.teamMember.create({
    data: {
      userId,
      teamId: team.id,
      role,
      status: "ACTIVE",
    },
  });
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.id) {
        return false;
      }

      await ensureTeamMembership(user.id, user.email);
      return true;
    },
    async session({ session, user }) {
      const activeMembership = await prisma.teamMember.findFirst({
        where: {
          userId: user.id,
          status: "ACTIVE",
        },
        orderBy: { createdAt: "asc" },
      });

      if (session.user) {
        session.user.id = user.id;
        session.user.role = activeMembership?.role;
        session.user.teamId = activeMembership?.teamId;
      }

      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
};
