import type { TeamNotification } from "@/lib/department-model";

export const GENERAL_ANNOUNCEMENT_LIMITS = { title: 80, message: 280 } as const;

export function validateGeneralAnnouncement(input: { title: string; message: string }) {
  const title = input.title.trim();
  const message = input.message.trim();
  if (!title || !message) return { ok: false as const, error: "missing" as const };
  if (title.length > GENERAL_ANNOUNCEMENT_LIMITS.title || message.length > GENERAL_ANNOUNCEMENT_LIMITS.message) return { ok: false as const, error: "too_long" as const };
  return { ok: true as const, title, message };
}

export function createGeneralAnnouncement(input: { id: string; title: string; message: string; recipientIds: string[]; createdAt?: string }): TeamNotification {
  const validated = validateGeneralAnnouncement(input);
  if (!validated.ok) throw new Error("General announcement is invalid.");
  return {
    id: input.id,
    type: "general_announcement",
    teamId: "department",
    teamName: "قسم جراحة المخ والأعصاب",
    title: validated.title,
    message: validated.message,
    createdAt: input.createdAt ?? "الآن",
    recipientIds: [...new Set(input.recipientIds)],
    readByUserIds: [],
  };
}
