import { describe, expect, it } from "vitest";
import { createGeneralAnnouncement, validateGeneralAnnouncement } from "../lib/general-announcement";

describe("الإشعار العام", () => {
  it("ينشئ إشعاراً عاماً لمستخدمين محددين دون تكرار", () => {
    const announcement = createGeneralAnnouncement({ id: "n-general-1", title: "تحديث القسم", message: "يبدأ الاجتماع الساعة 13:00.", recipientIds: ["u-1", "u-2", "u-1"] });
    expect(announcement.type).toBe("general_announcement");
    expect(announcement.teamId).toBe("department");
    expect(announcement.recipientIds).toEqual(["u-1", "u-2"]);
  });

  it("يرفض العنوان أو النص الفارغ أو المتجاوز للحد", () => {
    expect(validateGeneralAnnouncement({ title: "", message: "رسالة" }).ok).toBe(false);
    expect(validateGeneralAnnouncement({ title: "ع".repeat(81), message: "رسالة" }).ok).toBe(false);
  });
});
