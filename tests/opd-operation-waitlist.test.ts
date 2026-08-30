import { describe, expect, it } from "vitest";
import { canAddOpdOperationWaitingList, canManageOpdOperationWaitingList, findOpdWaitingListPatientLink, isOpdWaitingEntryNew, opdNewEntryLabel, opdPriorityLabel, opdStatusLabel } from "../lib/opd-operation-waitlist";
import type { DepartmentData } from "../lib/department-model";

const data = { teams: [{ id: "t1", cases: [{ id: "c1", code: "MRN-001", fileNumber: "MRN-001" }] }] } as unknown as DepartmentData;

describe("قائمة انتظار عمليات العيادات", () => {
  it("تربط طلب OPD بملف مريض نشط عند تطابق رقم الملف", () => {
    expect(findOpdWaitingListPatientLink(data, "MRN-001")).toEqual({ teamId: "t1", caseId: "c1" });
    expect(findOpdWaitingListPatientLink(data, "unknown")).toBeUndefined();
  });

  it("تسمح بإضافة الطلب للمستخدم المعتمد وتقصر التحديث على إشراف العمليات", () => {
    expect(canManageOpdOperationWaitingList("admin", [])).toBe(true);
    expect(canAddOpdOperationWaitingList("team_member")).toBe(true);
    expect(canManageOpdOperationWaitingList("team_member", ["manage_schedules"])).toBe(false);
    expect(canManageOpdOperationWaitingList("team_member", ["manage_operations"])).toBe(true);
    expect(canManageOpdOperationWaitingList("team_member", [])).toBe(false);
    expect(opdPriorityLabel("عاجل", "en")).toBe("Urgent");
    expect(opdStatusLabel("مجدول", "en")).toBe("Scheduled");
    expect(isOpdWaitingEntryNew({ status: "بانتظار مراجعة" } as never)).toBe(true);
    expect(isOpdWaitingEntryNew({ status: "معتمد" } as never)).toBe(false);
    expect(opdNewEntryLabel("ar")).toBe("جديد · يحتاج مراجعة");
    expect(opdNewEntryLabel("en")).toBe("NEW · Review needed");
  });
});
