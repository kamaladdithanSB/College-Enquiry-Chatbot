import { getInstitutionRows, getVerificationSourcesByTopic } from "@/lib/knowledge-base";
import type { ChatMessage, VerificationSource } from "@/types/chat";

interface RetrievalResult {
  context: string;
  verification: VerificationSource[];
  requiresVerification: boolean;
}

const feesPattern = /fee|fees|tuition|cost|tcoa|afford|price|expense/i;
const deadlinePattern = /deadline|intake|application date|last date|due date/i;

export async function buildRetrievalContext(
  messages: ChatMessage[],
  teamId?: string,
): Promise<RetrievalResult> {
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user")?.content;

  const query = latestUserMessage ?? "";
  const lowerQuery = query.toLowerCase();

  const asksFees = feesPattern.test(query);
  const asksDeadlines = deadlinePattern.test(query);
  const requiresVerification = asksFees || asksDeadlines;

  const institutionFacts = await getInstitutionRows(teamId);

  const relevantInstitutions = institutionFacts.filter((fact) => {
    const institutionMatch = lowerQuery.includes(fact.institution.toLowerCase());
    const aliasMatch = fact.aliases.some((alias) => lowerQuery.includes(alias.toLowerCase()));

    return institutionMatch || aliasMatch;
  });

  const institutions =
    relevantInstitutions.length > 0 ? relevantInstitutions : institutionFacts.slice(0, 3);

  const contextBlocks = institutions.map((fact) => {
    return [
      `Institution: ${fact.institution}`,
      `Fees: ${fact.feesSummary}`,
      `Deadlines: ${fact.deadlineSummary}`,
      `Source: ${fact.sourceLabel} (${fact.sourceUrl})`,
      `Last verified: ${fact.lastVerified}`,
      `Freshness: ${fact.isStale ? "stale" : "fresh"}`,
    ].join("\n");
  });

  const verification: VerificationSource[] = [];
  if (asksFees) {
    verification.push(
      ...(await getVerificationSourcesByTopic(
        "fees",
        institutions.map((item) => item.institution),
        teamId,
      )),
    );
  }
  if (asksDeadlines) {
    verification.push(
      ...(await getVerificationSourcesByTopic(
        "deadlines",
        institutions.map((item) => item.institution),
        teamId,
      )),
    );
  }

  return {
    context: contextBlocks.join("\n\n"),
    verification,
    requiresVerification,
  };
}
