import { describe, expect, it } from "vitest";
import { normalizeFileNumber, searchActivePatientFiles } from "../lib/patient-file-search";
import type { DepartmentData } from "../lib/department-model";

const data = { users: [], reports: [], shifts: [], surgeries: [], weeklyAssignments: [], scheduleDocuments: [], notifications: [], shiftReports: [], teams: [{ id: "team-a", name: "Team A", shortName: "A", color: "#000", lead: "Lead", memberIds: [], consultations: [], dischargedCases: [], cases: [{ id: "case-1", code: "KSMC-001234", fileNumber: "KSMC-001234", fullName: "Search Test", age: 42, medicalHistory: "History", clinicalTests: "Tests", diagnosis: "Diagnosis", admittedSince: "Today", admittedAt: "2026-01-01", status: "منوّم" as const, imaging: [], messages: [] }] }] } satisfies DepartmentData;

describe("البحث برقم الملف", () => {
  it("يطبع رقم الملف ليقبل المسافات والشرطات", () => {
    expect(normalizeFileNumber(" ksmc - 001234 ")).toBe("KSMC001234");
  });

  it("يعثر على الحالات النشطة فقط برقم ملف كامل أو جزئي", () => {
    expect(searchActivePatientFiles(data, "001234")).toHaveLength(1);
    expect(searchActivePatientFiles(data, "ksmc-001234")[0]).toMatchObject({ id: "case-1", teamId: "team-a" });
    expect(searchActivePatientFiles(data, "not-found")).toEqual([]);
  });
});
