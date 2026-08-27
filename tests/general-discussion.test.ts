import { describe, expect, it } from "vitest";
import { createGeneralDiscussionMessage } from "../lib/department-model";

describe("general department discussions", () => {
  it("creates a trimmed message that remains separate from any patient record", () => {
    const message = createGeneralDiscussionMessage({ id: "g-1", text: "  اجتماع التنسيق الساعة 08:00  ", senderId: "u-1", senderName: "Dr. Sami", sentAt: "الآن" });
    expect(message).toEqual({ id: "g-1", text: "اجتماع التنسيق الساعة 08:00", senderId: "u-1", senderName: "Dr. Sami", sentAt: "الآن" });
  });
});
