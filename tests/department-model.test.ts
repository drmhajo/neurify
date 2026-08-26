import { describe, expect, it } from "vitest";
import { createInitialDepartmentData, getDashboardSummary, getNextReportStatus } from "../lib/department-model";

describe("نموذج بيانات قسم جراحة المخ والأعصاب", () => {
  it("يهيئ بيانات عرض متماسكة للوحة اليوم", () => {
    const data = createInitialDepartmentData();
    const summary = getDashboardSummary(data);

    expect(data.teams).toHaveLength(3);
    expect(summary.openReports).toBe(2);
    expect(summary.surgeriesToday).toBe(3);
    expect(summary.admittedCases).toBe(3);
  });

  it("يتدرج طلب التقرير من جديد إلى قيد الإعداد ثم مكتمل", () => {
    expect(getNextReportStatus("جديد")).toBe("قيد الإعداد");
    expect(getNextReportStatus("قيد الإعداد")).toBe("مكتمل");
    expect(getNextReportStatus("مكتمل")).toBe("مكتمل");
  });
});
