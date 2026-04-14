import type { Institution } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { VerificationSource } from "@/types/chat";

const freshnessDays = 7;
const freshnessMs = freshnessDays * 24 * 60 * 60 * 1000;

interface InstitutionFacts {
  institution: string;
  aliases: string[];
  feesSummary: string;
  feesTcoaUSD: number;
  deadlineSummary: string;
  sourceLabel: string;
  sourceUrl: string;
  lastVerified: string;
}

const seedFacts: InstitutionFacts[] = [
  {
    institution: "Northlake University",
    aliases: ["northlake", "north lake", "nlu"],
    feesSummary:
      "Estimated annual TCOA is USD 38,200 including tuition, housing, meal plan, and mandatory student services.",
    feesTcoaUSD: 38200,
    deadlineSummary:
      "Priority fall intake deadline: January 15. Final deadline: March 30.",
    sourceLabel: "Northlake Admissions & Financial Aid",
    sourceUrl: "https://example.edu/northlake/admissions",
    lastVerified: "2026-04-10T14:30:00Z",
  },
  {
    institution: "Riverton Institute of Technology",
    aliases: ["riverton", "ritech", "rit"],
    feesSummary:
      "Estimated annual TCOA is USD 34,900 with tuition, on-campus housing, meals, and technology fees.",
    feesTcoaUSD: 34900,
    deadlineSummary:
      "Early action deadline: December 1. Regular decision deadline: February 14.",
    sourceLabel: "Riverton Student Finance",
    sourceUrl: "https://example.edu/riverton/finance",
    lastVerified: "2026-04-11T09:15:00Z",
  },
  {
    institution: "Crescent City College",
    aliases: ["crescent", "ccc", "crescent city"],
    feesSummary:
      "Estimated annual TCOA is USD 29,400 including tuition, accommodation, books, and transit pass.",
    feesTcoaUSD: 29400,
    deadlineSummary:
      "Main fall deadline: February 28. Scholarship consideration deadline: January 20.",
    sourceLabel: "Crescent Enrollment Office",
    sourceUrl: "https://example.edu/crescent/enrollment",
    lastVerified: "2026-04-12T16:05:00Z",
  },
  {
    institution: "Eastbridge School of Business",
    aliases: ["eastbridge", "esb", "east bridge"],
    feesSummary:
      "Estimated annual TCOA is USD 41,600 including tuition, residence, and experiential learning fees.",
    feesTcoaUSD: 41600,
    deadlineSummary:
      "Round 1 deadline: November 30. Round 2 deadline: January 31. Final round: April 10.",
    sourceLabel: "Eastbridge MBA Admissions",
    sourceUrl: "https://example.edu/eastbridge/mba",
    lastVerified: "2026-04-09T11:45:00Z",
  },
];

export interface InstitutionRow {
  id: string;
  institution: string;
  aliases: string[];
  tcoaUSD: number;
  feesSummary: string;
  deadlineSummary: string;
  sourceLabel: string;
  sourceUrl: string;
  lastVerified: string;
  isStale: boolean;
}

function isStale(lastVerifiedIso: string) {
  return Date.now() - new Date(lastVerifiedIso).getTime() > freshnessMs;
}

function fromDb(item: Institution): InstitutionRow {
  const lastVerified = item.lastVerifiedAt.toISOString();
  return {
    id: item.id,
    institution: item.name,
    aliases: item.aliases,
    tcoaUSD: item.tcoaUsd,
    feesSummary: item.feeSummary,
    deadlineSummary: item.deadlineSummary,
    sourceLabel: item.sourceLabel,
    sourceUrl: item.sourceUrl,
    lastVerified,
    isStale: isStale(lastVerified),
  };
}

function fromSeed(item: InstitutionFacts): InstitutionRow {
  return {
    id: item.institution,
    institution: item.institution,
    aliases: item.aliases,
    tcoaUSD: item.feesTcoaUSD,
    feesSummary: item.feesSummary,
    deadlineSummary: item.deadlineSummary,
    sourceLabel: item.sourceLabel,
    sourceUrl: item.sourceUrl,
    lastVerified: item.lastVerified,
    isStale: isStale(item.lastVerified),
  };
}

export async function getInstitutionRows(teamId?: string): Promise<InstitutionRow[]> {
  if (!process.env.DATABASE_URL) {
    return seedFacts.map(fromSeed);
  }

  try {
    const rows = await prisma.institution.findMany({
      where: teamId ? { teamId } : undefined,
      orderBy: { name: "asc" },
    });

    if (!rows.length) {
      return seedFacts.map(fromSeed);
    }

    return rows.map(fromDb);
  } catch {
    return seedFacts.map(fromSeed);
  }
}

export async function getVerificationSourcesByTopic(
  topic: "fees" | "deadlines",
  institutions?: string[],
  teamId?: string,
): Promise<VerificationSource[]> {
  const normalized = (institutions ?? []).map((item) => item.toLowerCase().trim());
  const facts = await getInstitutionRows(teamId);

  const matches = facts.filter((fact) => {
    if (!normalized.length) {
      return true;
    }

    return normalized.some(
      (inst) =>
        fact.institution.toLowerCase().includes(inst) ||
        fact.aliases.some((alias) => alias.includes(inst) || inst.includes(alias)),
    );
  });

  return matches.map((fact) => ({
    institution: fact.institution,
    topic,
    sourceLabel: fact.sourceLabel,
    sourceUrl: fact.sourceUrl,
    lastVerified: fact.lastVerified,
    isStale: fact.isStale,
  }));
}
