import type { DailyShiftReport } from "./department-model";

export type ShiftReportDayMetric = {
  date: string;
  consultations: number;
  admissions: number;
  emergencySurgeries: number;
  totalCases: number;
};

export type MonthlyShiftReportAnalytics = {
  month: string;
  reportCount: number;
  consultations: number;
  requiringFollowUp: number;
  admissions: number;
  emergencySurgeries: number;
  totalCases: number;
  daily: ShiftReportDayMetric[];
};

export function availableReportMonths(reports: DailyShiftReport[]) {
  return [...new Set(reports.map((report) => report.reportDate.slice(0, 7)).filter((month) => /^\d{4}-\d{2}$/.test(month)))].sort().reverse();
}

export function buildMonthlyShiftReportAnalytics(reports: DailyShiftReport[], month: string): MonthlyShiftReportAnalytics {
  const inMonth = reports.filter((report) => report.reportDate.startsWith(month));
  const daily = inMonth
    .map((report) => ({ date: report.reportDate, consultations: report.statistics.consultations, admissions: report.statistics.admissions, emergencySurgeries: report.statistics.emergencySurgeries, totalCases: report.statistics.consultations + report.statistics.admissions + report.statistics.emergencySurgeries }))
    .sort((left, right) => left.date.localeCompare(right.date));
  return {
    month,
    reportCount: inMonth.length,
    consultations: inMonth.reduce((sum, report) => sum + report.statistics.consultations, 0),
    requiringFollowUp: inMonth.reduce((sum, report) => sum + report.statistics.requiringFollowUp, 0),
    admissions: inMonth.reduce((sum, report) => sum + report.statistics.admissions, 0),
    emergencySurgeries: inMonth.reduce((sum, report) => sum + report.statistics.emergencySurgeries, 0),
    totalCases: daily.reduce((sum, day) => sum + day.totalCases, 0),
    daily,
  };
}

export function monthLabel(month: string, locale: "ar" | "en") {
  const date = new Date(`${month}-01T12:00:00.000Z`);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { month: "long", year: "numeric", timeZone: "Asia/Riyadh" }).format(date);
}
