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
    institution: "IIT Madras",
    aliases: ["iitm", "iit madras", "indian institute of technology madras"],
    feesSummary:
      "Estimated annual TCOA is INR 310,000 including tuition, hostel, mess, and campus services.",
    feesTcoaUSD: 310000,
    deadlineSummary:
      "UG admissions are through JoSAA counselling after JEE Advanced; counselling rounds typically run June to July.",
    sourceLabel: "IIT Madras Admissions",
    sourceUrl: "https://www.iitm.ac.in/academics/admissions",
    lastVerified: "2026-04-20T10:30:00Z",
  },
  {
    institution: "Anna University, Chennai",
    aliases: ["anna university", "au chennai", "anna univ"],
    feesSummary:
      "Estimated annual TCOA is INR 160,000 including tuition, hostel, exam fees, and academic expenses.",
    feesTcoaUSD: 160000,
    deadlineSummary:
      "TNEA counselling timelines for UG admissions are usually published between May and July on the official portal.",
    sourceLabel: "Anna University Admissions",
    sourceUrl: "https://www.annauniv.edu/",
    lastVerified: "2026-04-19T09:00:00Z",
  },
  {
    institution: "SRM Institute of Science and Technology",
    aliases: ["srm", "srmist", "srm university chennai"],
    feesSummary:
      "Estimated annual TCOA is INR 450,000 including tuition, hostel, mess, and academic charges.",
    feesTcoaUSD: 450000,
    deadlineSummary:
      "SRMJEEE application windows are announced in phases; check portal updates from November to April.",
    sourceLabel: "SRM Admissions",
    sourceUrl: "https://www.srmist.edu.in/admissions/",
    lastVerified: "2026-04-18T08:45:00Z",
  },
  {
    institution: "VIT Vellore",
    aliases: ["vit", "vit vellore", "vellore institute of technology"],
    feesSummary:
      "Estimated annual TCOA is INR 360,000 including tuition, hostel, mess, and lab-related expenses.",
    feesTcoaUSD: 360000,
    deadlineSummary:
      "VITEEE registration and counselling dates are generally published between November and June.",
    sourceLabel: "VIT Admissions",
    sourceUrl: "https://viteee.vit.ac.in/",
    lastVerified: "2026-04-17T12:10:00Z",
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

function hasLegacyDemoInstitutions(rows: Institution[]) {
  const legacyNames = new Set([
    "Northlake University",
    "Riverton Institute of Technology",
    "Crescent City College",
    "Eastbridge School of Business",
  ]);

  return rows.some((row) => legacyNames.has(row.name));
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

    if (hasLegacyDemoInstitutions(rows)) {
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
