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

  it("يظهر التدخل الجراحي المختار في الاستشارة ضمن قسم العمليات الإسعافية", () => {
    const data = createInitialDepartmentData();
    data.teams[0].consultations[0].patient = { code: "NS-OR", fileNumber: "110000000002", fullName: "Demo", age: 42, medicalHistory: "", clinicalTests: "", diagnosis: "Acute hydrocephalus", surgeryType: "External ventricular drain" };
    data.teams[0].consultations[0].createdAt = "2026-08-25T08:00:00.000+03:00";
    const report = buildDailyShiftReport(data, "Admin", new Date("2026-08-25T10:00:00+03:00"));
    expect(report.emergencySurgeries).toContainEqual(expect.objectContaining({ mrn: "110000000002", diagnosis: "Acute hydrocephalus", surgery: "External ventricular drain" }));
  });

  it("يعتمد أعضاء فريق المناوبة المختارين من المستخدمين النشطين عند إنشاء التقرير", () => {
    const data = createInitialDepartmentData();
    data.users = data.users.map((user) => ["u-roster-sami", "u-roster-maryam", "u-roster-babar"].includes(user.id) ? { ...user, active: true } : user);
    data.shiftReportPreferences = { firstOnCallUserId: "u-roster-sami", secondOnCallUserId: "u-roster-maryam", thirdOnCallUserId: "u-roster-babar" };
    const report = buildDailyShiftReport(data, "Admin", new Date("2026-08-25T10:00:00+03:00"));
    expect(report.onCall.first).toBe("Sami");
    expect(report.onCall.second).toBe("Maryam");
    expect(report.onCall.third).toBe("Babar");
  });
});
