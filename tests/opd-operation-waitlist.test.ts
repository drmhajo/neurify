import { describe, expect, it } from "vitest";
import { canManageOpdOperationWaitingList, findOpdWaitingListPatientLink, opdPriorityLabel, opdStatusLabel } from "../lib/opd-operation-waitlist";
import type { DepartmentData } from "../lib/department-model";

const data = { teams: [{ id: "t1", cases: [{ id: "c1", code: "MRN-001", fileNumber: "MRN-001" }] }] } as unknown as DepartmentData;

describe("قائمة انتظار عمليات العيادات", () => {
  it("تربط طلب OPD بملف مريض نشط عند تطابق رقم الملف", () => {
    expect(findOpdWaitingListPatientLink(data, "MRN-001")).toEqual({ teamId: "t1", caseId: "c1" });
    expect(findOpdWaitingListPatientLink(data, "unknown")).toBeUndefined();
  });

  it("تقيّد التعديل بصلاحية إدارة الجداول وتعرض التسميات الثنائية", () => {
    expect(canManageOpdOperationWaitingList("admin", [])).toBe(true);
    expect(canManageOpdOperationWaitingList("team_member", ["manage_schedules"])).toBe(true);
    expect(canManageOpdOperationWaitingList("team_member", [])).toBe(false);
    expect(opdPriorityLabel("عاجل", "en")).toBe("Urgent");
    expect(opdStatusLabel("مجدول", "en")).toBe("Scheduled");
  });
});
