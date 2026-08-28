import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { createDashboardWorkbook, createMonthlyDashboardHtml, dashboardExcelRows, dashboardExportFileName } from "../lib/shift-report-dashboard-export";
import type { MonthlyShiftReportAnalytics } from "../lib/shift-report-analytics";

const analytics: MonthlyShiftReportAnalytics = {
  month: "2026-08",
  reportCount: 2,
  consultations: 7,
  admissions: 3,
  emergencySurgeries: 1,
  requiringFollowUp: 4,
  totalCases: 11,
  daily: [
    { date: "2026-08-01", consultations: 4, admissions: 1, emergencySurgeries: 1, totalCases: 6 },
    { date: "2026-08-02", consultations: 3, admissions: 2, emergencySurgeries: 0, totalCases: 5 },
  ],
};

describe("تصدير لوحة معلومات المناوبات الشهرية", () => {
  it("يبني PDF HTML يتضمن المؤشرات والتفصيل اليومي بالعربية", () => {
    const html = createMonthlyDashboardHtml(analytics, "ar");
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("لوحة معلومات المناوبات الشهرية");
    expect(html).toContain("مدينة الملك سعود الطبية");
    expect(html).toContain("Neurosurgery Department logo");
    expect(html).toContain("2026-08-02");
    expect(html).toContain(">11<");
  });

  it("ينشئ مصنف Excel من ورقتي الملخص والتفصيل اليومي", () => {
    const workbook = createDashboardWorkbook(analytics, "en");
    const rows = dashboardExcelRows(analytics, "en");
    expect(workbook.SheetNames).toEqual(["Monthly summary", "Daily breakdown"]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets["Daily breakdown"], { header: 1 })).toEqual(rows.daily);
    expect(dashboardExportFileName("2026-08", "xlsx")).toBe("ksmc-neurosurgery-monthly-dashboard-2026-08.xlsx");
  });
});
