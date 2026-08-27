import { describe, expect, it } from "vitest";
import { createInitialDepartmentData } from "../lib/department-model";
import { buildDailyShiftReport, getShiftWindow } from "../lib/shift-endorsement";

describe("تقرير المناوبة اليومي", () => {
  it("يعرف فترة تبدأ 07:30 وتنتهي 07:20 في اليوم التالي", () => {
    const window = getShiftWindow(new Date("2026-08-25T10:00:00+03:00"));
    expect(new Date(window.startAt).toLocaleTimeString("en-GB", { timeZone: "Asia/Riyadh", hour: "2-digit", minute: "2-digit", hour12: false })).toBe("07:30");
    expect(new Date(window.startAt).getMinutes()).toBe(30);
    expect(new Date(window.endAt).toLocaleTimeString("en-GB", { timeZone: "Asia/Riyadh", hour: "2-digit", minute: "2-digit", hour12: false })).toBe("07:20");
  });

  it("يبني أقسام الاستشارات والتنويم والإحصاءات من بيانات القسم", () => {
    const data = createInitialDepartmentData();
    data.teams[0].consultations[0].patient = { code: "NS-9000", fileNumber: "110000000001", fullName: "Demo", age: 42, medicalHistory: "", clinicalTests: "", diagnosis: "Demo diagnosis", clinicalDecision: "Follow-up" };
    const report = buildDailyShiftReport(data, "Admin", new Date("2026-08-25T10:00:00+03:00"));
    expect(report.admissions.length).toBeGreaterThan(0);
    expect(report.consultations[0]).toMatchObject({ mrn: "110000000001", requiresFollowUp: false });
    expect(report.statistics.admissions).toBe(report.admissions.length);
  });

  it("يعتمد أعضاء فريق المناوبة المختارين من المستخدمين النشطين عند إنشاء التقرير", () => {
    const data = createInitialDepartmentData();
    data.shiftReportPreferences = { firstOnCallUserId: "u-1", secondOnCallUserId: "u-3", thirdOnCallUserId: "u-2" };
    const report = buildDailyShiftReport(data, "Admin", new Date("2026-08-25T10:00:00+03:00"));
    expect(report.onCall.first).toBe("د. نورة الحربي");
    expect(report.onCall.second).toBe("د. سارة العتيبي");
    expect(report.onCall.third).toBe("أ. فهد القحطاني");
  });
});
