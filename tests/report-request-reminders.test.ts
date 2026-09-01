import { describe, expect, it } from "vitest";
import type { DepartmentData, MedicalReport } from "../lib/department-model";
import {
  canCompleteReportNotification,
  createReportRequestNotification,
  findTreatingTeam,
  isReportReminderDue,
  prepareDailyReportReminders,
  resolveReportRecipientIds,
} from "../lib/report-request-notifications";

const createdAt = "2026-09-01T06:00:00.000Z";

function report(overrides: Partial<MedicalReport> = {}): MedicalReport {
  return {
    id: "report-1",
    patientCode: "MRN-100",
    title: "Discharge report",
    priority: "عادي",
    status: "جديد",
    requester: "Coordinator",
    createdAt: "Now",
    createdAtIso: createdAt,
    dueAt: "Within 24 hours",
    teamId: "team-1",
    recipientIds: ["remote-consultant", "remote-member"],
    ...overrides,
  };
}

function data(overrides: Partial<DepartmentData> = {}): DepartmentData {
  return {
    users: [
      { id: "remote-consultant", username: "consultant", name: "Dr. Amal", role: "consultant", jobTitle: "Consultant", teamIds: ["team-1"], active: true, permissions: ["manage_reports"] },
      { id: "remote-member", username: "member", name: "Nurse Noor", role: "team_member", jobTitle: "Team member", teamIds: ["team-1"], active: true, permissions: [] },
      { id: "remote-other", username: "other", name: "Dr. Other", role: "consultant", jobTitle: "Consultant", teamIds: ["team-2"], active: true, permissions: ["manage_reports"] },
    ],
    reports: [report()],
    shifts: [], surgeries: [], weeklyAssignments: [], scheduleDocuments: [],
    teams: [{ id: "team-1", name: "Treating team", shortName: "Team", color: "#075985", lead: "Dr. Amal", memberIds: ["remote-member"], cases: [{ id: "case-1", code: "MRN-100", fileNumber: "MRN-100", fullName: "Private patient", age: null, medicalHistory: "Private history", clinicalTests: "Private findings", diagnosis: "Private diagnosis", admittedSince: "Today", status: "منوّم", imaging: [], messages: [] }], dischargedCases: [], consultations: [] }],
    notifications: [], shiftReports: [],
    ...overrides,
  };
}

describe("report request notifications", () => {
  it("targets only the treating team and linked consultant, without patient content", () => {
    const snapshot = data();
    const team = findTreatingTeam(snapshot, "MRN-100")!;
    const recipients = resolveReportRecipientIds(snapshot, team);
    const notification = createReportRequestNotification({ id: "notice-1", team, recipientIds: recipients, createdAt: "Now" });

    expect(recipients).toEqual(["remote-consultant", "remote-member"]);
    expect(recipients).not.toContain("remote-other");
    expect(notification.message).not.toContain("MRN-100");
    expect(notification.message).not.toContain("Private patient");
    expect(notification.message).not.toContain("Private diagnosis");
  });

  it("starts reminders only at three days and stops after Notify completed", () => {
    const start = new Date(Date.parse(createdAt) + 3 * 24 * 60 * 60 * 1000);
    const pending = report();
    expect(isReportReminderDue(pending, start)).toBe(true);
    expect(isReportReminderDue(pending, new Date(start.getTime() - 1))).toBe(false);
    expect(isReportReminderDue({ ...pending, notifyCompletedAt: start.toISOString() }, start)).toBe(false);
  });

  it("emits no more than one reminder for a report in a Riyadh day and honors Notify completed", () => {
    const now = new Date(Date.parse(createdAt) + 3 * 24 * 60 * 60 * 1000);
    const first = prepareDailyReportReminders(data(), now);
    const second = prepareDailyReportReminders(first.data, now);
    const complete = prepareDailyReportReminders(data({ reports: [report({ notifyCompletedAt: now.toISOString() })] }), now);

    expect(first.reportIds).toEqual(["report-1"]);
    expect(second.reportIds).toEqual([]);
    expect(complete.reportIds).toEqual([]);
  });

  it("permits Notify completed only to a recipient or authorized report manager", () => {
    const pending = report();
    expect(canCompleteReportNotification(pending, "remote-member")).toBe(true);
    expect(canCompleteReportNotification(pending, "remote-other")).toBe(false);
    expect(canCompleteReportNotification(pending, "remote-other", true)).toBe(true);
    expect(canCompleteReportNotification({ ...pending, notifyCompletedAt: createdAt }, "remote-member")).toBe(false);
  });
});
