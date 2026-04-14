export type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface VerificationSource {
  institution: string;
  topic: "fees" | "deadlines";
  sourceLabel: string;
  sourceUrl: string;
  lastVerified: string;
  isStale?: boolean;
}

export interface EfficiencySnapshot {
  manualHours: number;
  vedaHours: number;
  gainPercentage: number;
}

export interface ChatResponsePayload {
  reply: string;
  status: "ready" | "thinking";
  verification: VerificationSource[];
  verificationWarning?: string;
  efficiency?: EfficiencySnapshot;
}
