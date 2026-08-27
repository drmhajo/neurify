import { describe, expect, it } from "vitest";
import type { DailyShiftReport } from "../lib/department-model";
import { filterShiftReports } from "../lib/shift-report-archive";

const report = (id: string, reportDate: string, generatedBy: string): DailyShiftReport => ({ id, reportDate, generatedBy, shiftStartAt: "2026-08-25T04:30:00.000Z", shiftEndAt: "2026-08-26T04:20:00.000Z", generatedAt: "2026-08-26T04:20:00.000Z", onCall: { first: "A", second: "B", third: "C" }, consultations: [], admissions: [], emergencySurgeries: [], statistics: { consultations: 0, requiringFollowUp: 0, admissions: 0, emergencySurgeries: 0 } });

describe("أرشيف تقارير المناوبة", () => {
  const reports = [report("r1", "2026-08-25", "د. نورة"), report("r2", "2026-08-26", "د. عبدالله")];
  it("يصفّي التقرير بتاريخ المناوبة", () => expect(filterShiftReports(reports, { date: "2026-08-26" })).toEqual([reports[1]]));
  it("يصفّي التقرير بالطبيب أو بالشرطين معاً", () => {
    expect(filterShiftReports(reports, { doctor: "د. نورة" })).toEqual([reports[0]]);
    expect(filterShiftReports(reports, { date: "2026-08-26", doctor: "د. نورة" })).toEqual([]);
  });
});
