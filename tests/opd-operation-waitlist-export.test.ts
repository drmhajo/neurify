import { describe, expect, it } from "vitest";
import type { OpdOperationWaitingEntry } from "../lib/department-model";
import { buildOpdWaitlistReport, createOpdWaitlistHtml, createOpdWaitlistWorkbook, filterOpdWaitlist, opdWaitlistExportFileName } from "../lib/opd-operation-waitlist-export-data";

const entries: OpdOperationWaitingEntry[] = [
  { id: "opd-1", patientName: "Patient One", fileNumber: "MRN-01", diagnosis: "Glioma", procedure: "Craniotomy", requestedBy: "Dr A", plannedDate: "2026-09-02", priority: "عاجل", status: "مجدول", notes: "Priority case", createdAt: "2026-08-30T10:00:00Z", updatedAt: "2026-08-30T10:00:00Z", updatedBy: "Dr A" },
  { id: "opd-2", patientName: "Patient Two", fileNumber: "MRN-02", diagnosis: "Hydrocephalus", procedure: "VP shunt", requestedBy: "Dr B", plannedDate: "", priority: "روتيني", status: "بانتظار مراجعة", notes: "", createdAt: "2026-08-30T10:00:00Z", updatedAt: "2026-08-30T10:00:00Z", updatedBy: "Dr B" },
];

describe("تصدير قائمة انتظار عمليات OPD", () => {
  it("يطبق فلتر الأولوية والحالة على القائمة المصدرة", () => {
    expect(filterOpdWaitlist(entries, { priority: "عاجل" })).toHaveLength(1);
    expect(filterOpdWaitlist(entries, { status: "بانتظار مراجعة" })).toEqual([entries[1]]);
    expect(filterOpdWaitlist(entries, { priority: "عاجل", status: "بانتظار مراجعة" })).toEqual([]);
  });

  it("ينشئ PDF وExcel رسميين يذكران نطاق الفلترة", () => {
    const report = buildOpdWaitlistReport(entries, "Authorized user", { priority: "عاجل", status: "مجدول" });
    const html = createOpdWaitlistHtml(report, "en");
    const workbook = createOpdWaitlistWorkbook(report, "en");
    expect(html).toContain("Priority: Urgent · Status: Scheduled");
    expect(html).toContain("Neurify Cairo");
    expect(html).toContain("Operations oversight");
    expect(workbook.SheetNames).toEqual(["Summary", "OPD wait list"]);
    expect(workbook.Sheets.Summary.A1.s?.font?.name).toBe("Cairo");
    expect(workbook.Sheets["OPD wait list"].A1.s?.fill?.fgColor?.rgb).toBe("4956A6");
    expect(opdWaitlistExportFileName(report, "xlsx")).toMatch(/urgent.*xlsx$/);
  });
});
