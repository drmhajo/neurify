import { describe, expect, it } from "vitest";
import { canManageDischargedCases, deleteDischargedCase, updateDischargedCase } from "../lib/discharged-case-admin";
import type { DepartmentData } from "../lib/department-model";

const data = { users: [], reports: [], shifts: [], surgeries: [], weeklyAssignments: [], scheduleDocuments: [], notifications: [], shiftReports: [], teams: [{ id: "team-1", name: "Test", shortName: "T", color: "#000", lead: "Lead", memberIds: [], cases: [], consultations: [], dischargedCases: [{ id: "case-1", code: "MRN-1", fileNumber: "MRN-1", fullName: "Test Patient", age: 50, ward: "Ward A", bed: "12", medicalHistory: "History", clinicalTests: "Tests", diagnosis: "Initial", admittedSince: "Yesterday", admittedAt: "2026-01-01", status: "منوّم" as const, imaging: [], messages: [], dischargedAt: "Today", dischargedBy: "Admin", dischargeReason: "Initial reason" }] }] } satisfies DepartmentData;

describe("إدارة الحالات المؤرشفة", () => {
  it("تقصر تعديل وحذف الحالات المؤرشفة على المشرف", () => {
    expect(canManageDischargedCases("admin")).toBe(true);
    expect(canManageDischargedCases("consultant")).toBe(false);
    expect(canManageDischargedCases("team_member")).toBe(false);
  });

  it("يعدل بيانات الحالة المؤرشفة ويحذفها من الأرشيف فقط", () => {
    const updated = updateDischargedCase(data, "team-1", "case-1", { fullName: "Updated Patient", age: 51, ward: "Ward B", bed: "4", medicalHistory: "Updated history", clinicalTests: "Updated tests", diagnosis: "Updated diagnosis", dischargeReason: "Updated reason" });
    expect(updated.teams[0].dischargedCases?.[0]).toMatchObject({ fullName: "Updated Patient", ward: "Ward B", dischargeReason: "Updated reason" });
    expect(deleteDischargedCase(updated, "team-1", "case-1").teams[0].dischargedCases).toEqual([]);
  });
});
