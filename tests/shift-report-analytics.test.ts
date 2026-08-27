import { describe, expect, it } from "vitest";
import type { DailyShiftReport } from "../lib/department-model";
import { availableReportMonths, buildMonthlyShiftReportAnalytics } from "../lib/shift-report-analytics";

function report(id: string, date: string, consultations: number, admissions: number, emergencySurgeries: number): DailyShiftReport {
  return { id, reportDate: date, generatedAt: "2026-08-01T04:20:00.000Z", generatedBy: "Demo", shiftStartAt: "2026-08-01T04:30:00.000Z", shiftEndAt: "2026-08-02T04:20:00.000Z", onCall: { first: "A", second: "B", third: "C" }, consultations: [], admissions: [], emergencySurgeries: [], statistics: { consultations, requiringFollowUp: 1, admissions, emergencySurgeries } };
}

describe("لوحة معلومات تقارير المناوبة", () => {
  const reports = [report("a", "2026-08-25", 4, 2, 1), report("b", "2026-08-26", 3, 1, 0), report("c", "2026-07-31", 5, 0, 2)];
  it("يعرض الأشهر المتاحة بترتيب الأحدث", () => expect(availableReportMonths(reports)).toEqual(["2026-08", "2026-07"]));
  it("يجمع مؤشرات الشهر ويحتفظ باتجاه يومي مرتب", () => {
    const analytics = buildMonthlyShiftReportAnalytics(reports, "2026-08");
    expect(analytics).toMatchObject({ reportCount: 2, consultations: 7, admissions: 3, emergencySurgeries: 1, totalCases: 11 });
    expect(analytics.daily.map((day) => day.date)).toEqual(["2026-08-25", "2026-08-26"]);
  });
});
