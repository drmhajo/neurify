import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createInternalDepartmentData, rolePermissionDefaults, type DepartmentData, type DepartmentUser, type MedicalReport } from "../lib/department-model";
import { createReportRequestNotification, isReportReminderDue, prepareDailyReportReminders, recordReportReminderDelivery, resolveReportRecipientIds } from "../lib/report-request-notifications";

function buildData(): DepartmentData {
  const data = createInternalDepartmentData();
  const team = { ...data.teams[0], id: "team-a", lead: "Dr Consultant", memberIds: ["remote-member"], cases: [], dischargedCases: [], consultations: [] };
  const consultant: DepartmentUser = { id: "remote-consultant", username: "consultant", name: "Dr Consultant", role: "consultant", teamIds: ["team-a"], active: true, jobTitle: "Consultant", permissions: rolePermissionDefaults.consultant };
  const member: DepartmentUser = { id: "remote-member", username: "member", name: "Team Member", role: "team_member", teamIds: ["team-a"], active: true, jobTitle: "Resident", permissions: rolePermissionDefaults.team_member };
  const unrelated: DepartmentUser = { id: "remote-other", username: "other", name: "Other Consultant", role: "consultant", teamIds: [], active: true, jobTitle: "Consultant", permissions: rolePermissionDefaults.consultant };
  return { ...data, teams: [team], users: [consultant, member, unrelated], reports: [], notifications: [] };
}

function report(overrides: Partial<MedicalReport> = {}): MedicalReport {
  return { id: "r-safe", patientName: "Training Patient", patientCode: "TRAIN-0001", visitDate: "2026-01-01", title: "طلب تقرير طبي", notes: "Training note", priority: "عادي", status: "جديد", requester: "Requester", createdAt: "الآن", createdAtIso: "2026-01-01T06:00:00.000Z", dueAt: "خلال 24 ساعة", teamId: "team-a", consultantName: "Dr Consultant", recipientIds: ["remote-consultant", "remote-member"], ...overrides };
}

describe("report request notification workflow", () => {
  it("routes only to the chosen treating team consultant and active members", () => {
    const data = buildData();
    expect(resolveReportRecipientIds(data, data.teams[0])).toEqual(["remote-consultant", "remote-member"]);
  });

  it("keeps patient values out of request notification copy", () => {
    const data = buildData();
    const notification = createReportRequestNotification({ id: "n-1", team: data.teams[0], recipientIds: ["remote-consultant"], createdAt: "الآن" });
    expect(`${notification.title} ${notification.message}`).not.toContain("Training Patient");
    expect(`${notification.title} ${notification.message}`).not.toContain("TRAIN-0001");
    expect(notification.recipientIds).toEqual(["remote-consultant"]);
  });

  it("starts only after three days, records one Riyadh-day reminder, and stops on Notify completed", () => {
    const data = buildData();
    data.reports = [report()];
    expect(isReportReminderDue(data.reports[0], new Date("2026-01-04T05:59:59.000Z"))).toBe(false);
    const first = prepareDailyReportReminders(data, new Date("2026-01-04T06:00:00.000Z"));
    expect(first.reportIds).toEqual(["r-safe"]);
    expect(first.data.reports[0].lastReminderDate).toBe("2026-01-04");
    expect(prepareDailyReportReminders(first.data, new Date("2026-01-04T12:00:00.000Z")).reportIds).toEqual([]);
    expect(prepareDailyReportReminders({ ...data, reports: [report({ notifyCompletedAt: "2026-01-03T09:00:00.000Z" })] }, new Date("2026-01-04T06:00:00.000Z")).reportIds).toEqual([]);
  });

  it("records the delivery timestamp and exposes the corresponding monitor fields", () => {
    const data = buildData();
    data.reports = [report()];
    const deliveredAt = new Date("2026-01-04T06:00:00.000Z");
    const updated = recordReportReminderDelivery(data, "r-safe", 2, deliveredAt);
    const monitored = updated.reports[0];
    const monitorScreen = readFileSync("app/report-request-monitor.tsx", "utf8");

    expect(monitored.lastReminderAt).toBe("2026-01-04T06:00:00.000Z");
    expect(monitored.lastReminderStatus).toBe("sent");
    expect(isReportReminderDue(monitored, new Date("2026-01-04T07:00:00.000Z"))).toBe(true);
    expect(monitorScreen).toContain("formatRiyadhDateTime(item.lastReminderAt, language)");
    expect(monitorScreen).toContain("Last reminder: ${lastReminder}");
    expect(monitorScreen).toContain("Last reminder sent");
  });

  it("provides required bilingual form and administrator-monitor controls", () => {
    const requestScreen = readFileSync("app/(tabs)/reports.tsx", "utf8");
    const monitorScreen = readFileSync("app/report-request-monitor.tsx", "utf8");
    expect(requestScreen).toContain("Patient name");
    expect(requestScreen).toContain("اسم المريض");
    expect(requestScreen).toContain("Visit date");
    expect(requestScreen).toContain("Consultant and treating team");
    expect(requestScreen).toContain("Notify completed");
    expect(monitorScreen).toContain("Overdue report requests");
    expect(monitorScreen).toContain("طلبات التقارير المتأخرة");
    expect(monitorScreen).toContain("Last reminder");
  });
});
