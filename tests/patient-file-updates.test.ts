import { describe, expect, it } from "vitest";
import { hasUnreadPatientUpdate, patientUpdateMarker } from "../lib/patient-file-updates";

describe("مؤشرات تحديث ملف المريض", () => {
  it("يُظهر التحديث للأعضاء الآخرين ولا يعرضه لمن أجرى التعديل", () => {
    const marker = patientUpdateMarker("user-editor", "Team editor");
    expect(marker.lastUpdatedBy).toBe("Team editor");
    expect(hasUnreadPatientUpdate(marker, "user-editor")).toBe(false);
    expect(hasUnreadPatientUpdate(marker, "user-reviewer")).toBe(true);
  });

  it("لا يعرض مؤشراً للملفات غير المعدلة أو بعد تعليم التحديث كمقروء", () => {
    expect(hasUnreadPatientUpdate({}, "user-reviewer")).toBe(false);
    expect(hasUnreadPatientUpdate({ lastUpdatedAt: "2026-08-30T00:00:00.000Z", updateReadByUserIds: ["user-reviewer"] }, "user-reviewer")).toBe(false);
  });
});
