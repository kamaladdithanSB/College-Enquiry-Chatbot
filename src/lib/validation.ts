import { z } from "zod";

export const institutionUpsertSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  aliases: z.array(z.string().min(1)).default([]),
  campusCity: z.string().optional().nullable(),
  campusCountry: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  tuitionUsd: z.number().int().nonnegative(),
  housingUsd: z.number().int().nonnegative(),
  miscUsd: z.number().int().nonnegative(),
  feeSummary: z.string().min(10),
  deadlineSummary: z.string().min(10),
  applicationDeadline: z.string().datetime().optional().nullable(),
  scholarshipDeadline: z.string().datetime().optional().nullable(),
  sourceLabel: z.string().min(2),
  sourceUrl: z.string().url(),
  lastVerifiedAt: z.string().datetime(),
});

export const teamMemberInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});
