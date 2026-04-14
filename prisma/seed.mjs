import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const teamSlug = process.env.DEFAULT_TEAM_SLUG ?? "veda-ops";
  const teamName = process.env.DEFAULT_TEAM_NAME ?? "Veda Ops";

  const team = await prisma.team.upsert({
    where: { slug: teamSlug },
    update: {},
    create: { slug: teamSlug, name: teamName },
  });

  const institutions = [
    {
      name: "Northlake University",
      aliases: ["northlake", "north lake", "nlu"],
      tuitionUsd: 27000,
      housingUsd: 8400,
      miscUsd: 2800,
      feeSummary:
        "Estimated annual TCOA is USD 38,200 including tuition, housing, meal plan, and mandatory student services.",
      deadlineSummary:
        "Priority fall intake deadline: January 15. Final deadline: March 30.",
      sourceLabel: "Northlake Admissions & Financial Aid",
      sourceUrl: "https://example.edu/northlake/admissions",
      lastVerifiedAt: new Date("2026-04-10T14:30:00Z"),
    },
    {
      name: "Riverton Institute of Technology",
      aliases: ["riverton", "ritech", "rit"],
      tuitionUsd: 24800,
      housingUsd: 7600,
      miscUsd: 2500,
      feeSummary:
        "Estimated annual TCOA is USD 34,900 with tuition, on-campus housing, meals, and technology fees.",
      deadlineSummary:
        "Early action deadline: December 1. Regular decision deadline: February 14.",
      sourceLabel: "Riverton Student Finance",
      sourceUrl: "https://example.edu/riverton/finance",
      lastVerifiedAt: new Date("2026-04-11T09:15:00Z"),
    },
    {
      name: "Crescent City College",
      aliases: ["crescent", "ccc", "crescent city"],
      tuitionUsd: 20900,
      housingUsd: 5900,
      miscUsd: 2600,
      feeSummary:
        "Estimated annual TCOA is USD 29,400 including tuition, accommodation, books, and transit pass.",
      deadlineSummary:
        "Main fall deadline: February 28. Scholarship consideration deadline: January 20.",
      sourceLabel: "Crescent Enrollment Office",
      sourceUrl: "https://example.edu/crescent/enrollment",
      lastVerifiedAt: new Date("2026-04-12T16:05:00Z"),
    },
  ];

  for (const item of institutions) {
    await prisma.institution.upsert({
      where: {
        teamId_name: {
          teamId: team.id,
          name: item.name,
        },
      },
      update: {
        aliases: item.aliases,
        tuitionUsd: item.tuitionUsd,
        housingUsd: item.housingUsd,
        miscUsd: item.miscUsd,
        tcoaUsd: item.tuitionUsd + item.housingUsd + item.miscUsd,
        feeSummary: item.feeSummary,
        deadlineSummary: item.deadlineSummary,
        sourceLabel: item.sourceLabel,
        sourceUrl: item.sourceUrl,
        lastVerifiedAt: item.lastVerifiedAt,
      },
      create: {
        teamId: team.id,
        name: item.name,
        aliases: item.aliases,
        tuitionUsd: item.tuitionUsd,
        housingUsd: item.housingUsd,
        miscUsd: item.miscUsd,
        tcoaUsd: item.tuitionUsd + item.housingUsd + item.miscUsd,
        feeSummary: item.feeSummary,
        deadlineSummary: item.deadlineSummary,
        sourceLabel: item.sourceLabel,
        sourceUrl: item.sourceUrl,
        lastVerifiedAt: item.lastVerifiedAt,
      },
    });
  }

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
