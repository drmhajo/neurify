import { describe, expect, it } from "vitest";
import { createTeamPushPayload, isExpoPushToken } from "../server/push";

describe("إرسال إشعارات الفرق العلاجية", () => {
  it("يتحقق من صيغة رمز Expo قبل الإرسال", () => {
    expect(isExpoPushToken("ExponentPushToken[abc-123]")).toBe(true);
    expect(isExpoPushToken("invalid-token")).toBe(false);
  });

  it("ينشئ حمولة خالية من تفاصيل المرضى مع رابط غرفة الفريق", () => {
    const payload = createTeamPushPayload({
      token: "ExponentPushToken[abc-123]",
      teamId: "t1",
      type: "admitted_case",
      title: "حالة منوّمة جديدة في غرفة الفريق",
      body: "تمت إضافة حالة منوّمة جديدة. افتح غرفة الفريق للمتابعة.",
    });

    expect(payload.data).toEqual({ teamId: "t1", type: "admitted_case" });
    expect(payload.body).not.toContain("NS-");
    expect(payload.priority).toBe("high");
  });
});
