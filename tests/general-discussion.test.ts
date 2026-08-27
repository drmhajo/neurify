import { describe, expect, it } from "vitest";
import { createGeneralDiscussionMessage, getUnreadGeneralDiscussionCount } from "../lib/department-model";

describe("general department discussions", () => {
  it("creates a trimmed message that remains separate from any patient record", () => {
    const message = createGeneralDiscussionMessage({ id: "g-1", text: "  اجتماع التنسيق الساعة 08:00  ", senderId: "u-1", senderName: "Dr. Sami", sentAt: "الآن" });
    expect(message).toEqual({ id: "g-1", text: "اجتماع التنسيق الساعة 08:00", senderId: "u-1", senderName: "Dr. Sami", sentAt: "الآن" });
  });

  it("counts only new messages from other users after the reader's last visit", () => {
    const messages = [
      { id: "g-1", text: "Old", senderId: "u-2", senderName: "Dr. Maryam", sentAt: "الآن", sentAtIso: "2026-08-27T07:00:00.000Z" },
      { id: "g-2", text: "Own", senderId: "u-1", senderName: "Dr. Sami", sentAt: "الآن", sentAtIso: "2026-08-27T08:00:00.000Z" },
      { id: "g-3", text: "New", senderId: "u-2", senderName: "Dr. Maryam", sentAt: "الآن", sentAtIso: "2026-08-27T09:00:00.000Z" },
    ];
    expect(getUnreadGeneralDiscussionCount({ messages, userId: "u-1", lastReadAt: "2026-08-27T08:30:00.000Z" })).toBe(1);
  });
});
