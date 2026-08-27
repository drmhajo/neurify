import type { DailyShiftReport } from "./department-model";

export function filterShiftReports(reports: DailyShiftReport[], input: { date?: string; doctor?: string | null }) {
  const date = input.date?.trim() ?? "";
  const doctor = input.doctor?.trim() ?? "";
  return reports.filter((report) => (!date || report.reportDate.includes(date)) && (!doctor || report.generatedBy === doctor));
}
