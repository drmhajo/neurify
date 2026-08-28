import { describe, expect, it } from "vitest";
import { createInitialDepartmentData } from "../lib/department-model";
import { buildDailyShiftReport, getShiftWindow, getShiftWindowForReportDate } from "../lib/shift-endorsement";

describe("تقرير المناوبة اليومي", () => {
  it("يعرف فترة تبدأ 07:30 وتنتهي 07:30 في اليوم التالي", () => {
    const window = getShiftWindow(new Date("2026-08-25T10:00:00+03:00"));
    expect(new Date(window.startAt).toLocaleTimeString("en-GB", { timeZone: "Asia/Riyadh", hour: "2-digit", minute: "2-digit", hour12: false })).toBe("07:30");
    expect(new Date(window.startAt).getMinutes()).toBe(30);
    expect(new Date(window.endAt).toLocaleTimeString("en-GB", { timeZone: "Asia/Riyadh", hour: "2-digit", minute: "2-digit", hour12: false })).toBe("07:30");
  });

  it("يبني تقرير يوم مناوبة مختار ويشمل البداية ويستثني 07:30 لليوم التالي", () => {
    const data = createInitialDepartmentData();
    data.teams[0].consultations = [
      { ...data.teams[0].consultations[0], id: "inside", createdAt: "2026-08-25T07:30:00+03:00", patient: { code: "IN", fileNumber: "IN-1", fullName: "Inside", age: 40, medicalHistory: "", clinicalTests: "", diagnosis: "In window" } },
      { ...data.teams[0].consultations[0], id: "next", createdAt: "2026-08-26T07:30:00+03:00", patient: { code: "OUT", fileNumber: "OUT-1", fullName: "Outside", age: 40, medicalHistory: "", clinicalTests: "", diagnosis: "Outside window" } },
    ];
    const selected = getShiftWindowForReportDate("2026-08-25");
    expect(selected?.reportDate).toBe("2026-08-25");
    const report = buildDailyShiftReport(data, "Admin", new Date("2026-08-28T10:00:00+03:00"), "2026-08-25");
    expect(report.reportDate).toBe("2026-08-25");
    expect(report.consultations.map((item) => item.mrn)).toContain("IN-1");
    expect(report.consultations.map((item) => item.mrn)).not.toContain("OUT-1");
  });

  it("يبني أقسام الاستشارات والتنويم والإحصاءات من بيانات القسم", () => {
    const data = createInitialDepartmentData();
    data.teams[0].consultations[0].patient = { code: "NS-9000", fileNumber: "110000000001", fullName: "Demo", age: 42, medicalHistory: "", clinicalTests: "", diagnosis: "Demo diagnosis", clinicalDecision: "Follow-up" };
    data.teams[0].consultations[0].createdAt = "2026-08-25T08:00:00.000+03:00";
    data.teams[0].cases[0].admittedAt = "2026-08-25T08:00:00.000+03:00";
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
    data.users = data.users.map((user) => ["u-roster-omer", "u-roster-shoaib", "u-roster-sami"].includes(user.id) ? { ...user, active: true } : user);
    data.shiftReportPreferences = { firstOnCallUserId: "u-roster-omer", secondOnCallUserId: "u-roster-shoaib", thirdOnCallUserId: "u-roster-sami" };
    const report = buildDailyShiftReport(data, "Admin", new Date("2026-08-25T10:00:00+03:00"));
    expect(report.onCall.first).toBe("Omer");
    expect(report.onCall.second).toBe("Shoaib");
    expect(report.onCall.third).toBe("Sami");
  });
});
