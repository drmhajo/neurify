import * as XLSX from "xlsx";
import type { MonthlyShiftReportAnalytics } from "./shift-report-analytics";
import { monthLabel } from "./shift-report-analytics";
import { createOfficialReportHeaderHtml } from "./report-branding";

export type DashboardExportLanguage = "ar" | "en";

type ExportLabels = {
  department: string;
  title: string;
  source: string;
  month: string;
  archivedReports: string;
  consultations: string;
  admissions: string;
  emergencySurgeries: string;
  followUp: string;
  totalCases: string;
  dailyBreakdown: string;
  date: string;
};

function labels(language: DashboardExportLanguage): ExportLabels {
  return language === "en"
    ? { department: "KSMC Neurosurgery Department", title: "Monthly On-call Dashboard", source: "Source: archived on-call endorsement reports", month: "Month", archivedReports: "Archived reports", consultations: "Consultations", admissions: "Admissions", emergencySurgeries: "Emergency surgeries", followUp: "Cases requiring follow-up", totalCases: "Total cases", dailyBreakdown: "Daily breakdown", date: "Date" }
    : { department: "قسم جراحة المخ والأعصاب — مدينة الملك سعود الطبية", title: "لوحة معلومات المناوبات الشهرية", source: "المصدر: تقارير تسليم المناوبات المؤرشفة", month: "الشهر", archivedReports: "التقارير المؤرشفة", consultations: "الاستشارات", admissions: "التنويم", emergencySurgeries: "العمليات الإسعافية", followUp: "حالات تحتاج متابعة", totalCases: "إجمالي الحالات", dailyBreakdown: "التفصيل اليومي", date: "التاريخ" };
}

function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export function dashboardExportFileName(month: string, extension: "pdf" | "xlsx") {
  return `ksmc-neurosurgery-monthly-dashboard-${month}.${extension}`;
}

export function dashboardExcelRows(analytics: MonthlyShiftReportAnalytics, language: DashboardExportLanguage) {
  const copy = labels(language);
  return {
    summary: [
      [copy.department],
      [copy.title],
      [copy.month, monthLabel(analytics.month, language)],
      [copy.archivedReports, analytics.reportCount],
      [copy.consultations, analytics.consultations],
      [copy.admissions, analytics.admissions],
      [copy.emergencySurgeries, analytics.emergencySurgeries],
      [copy.followUp, analytics.requiringFollowUp],
      [copy.totalCases, analytics.totalCases],
      [],
      [copy.source],
    ],
    daily: [
      [copy.date, copy.consultations, copy.admissions, copy.emergencySurgeries, copy.totalCases],
      ...analytics.daily.map((day) => [day.date, day.consultations, day.admissions, day.emergencySurgeries, day.totalCases]),
    ],
  };
}

export function createDashboardWorkbook(analytics: MonthlyShiftReportAnalytics, language: DashboardExportLanguage) {
  const rows = dashboardExcelRows(analytics, language);
  const workbook = XLSX.utils.book_new();
  const summary = XLSX.utils.aoa_to_sheet(rows.summary);
  const daily = XLSX.utils.aoa_to_sheet(rows.daily);
  summary["!cols"] = [{ wch: 30 }, { wch: 27 }];
  daily["!cols"] = [{ wch: 16 }, { wch: 17 }, { wch: 14 }, { wch: 22 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, summary, language === "en" ? "Monthly summary" : "الملخص الشهري");
  XLSX.utils.book_append_sheet(workbook, daily, language === "en" ? "Daily breakdown" : "التفصيل اليومي");
  return workbook;
}

export function createMonthlyDashboardHtml(analytics: MonthlyShiftReportAnalytics, language: DashboardExportLanguage) {
  const copy = labels(language);
  const isRTL = language === "ar";
  const header = createOfficialReportHeaderHtml({ title: copy.title, subtitle: `${copy.month} · ${monthLabel(analytics.month, language)}`, language });
  const metrics = [
    [copy.archivedReports, analytics.reportCount],
    [copy.consultations, analytics.consultations],
    [copy.admissions, analytics.admissions],
    [copy.emergencySurgeries, analytics.emergencySurgeries],
    [copy.followUp, analytics.requiringFollowUp],
    [copy.totalCases, analytics.totalCases],
  ];
  const metricHtml = metrics.map(([label, value]) => `<section class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></section>`).join("");
  const rows = analytics.daily.map((day) => `<tr><td>${escapeHtml(day.date)}</td><td>${day.consultations}</td><td>${day.admissions}</td><td>${day.emergencySurgeries}</td><td>${day.totalCases}</td></tr>`).join("");
  return `<!doctype html><html dir="${isRTL ? "rtl" : "ltr"}" lang="${language}"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapeHtml(copy.title)} — ${escapeHtml(analytics.month)}</title><style>@page{size:A4;margin:15mm}*{box-sizing:border-box}body{font-family:Arial,"Noto Naskh Arabic",sans-serif;color:#123D63;margin:0;font-size:12px;line-height:1.45}.official-header{display:flex;align-items:center;gap:11px;border-bottom:3px solid #08766D;padding:0 0 12px;margin-bottom:16px}.official-logo{width:62px;height:62px;object-fit:contain}.official-identity{flex:1}.official-hospital{font-size:10px;font-weight:700;color:#08766D;margin:0}.official-department{font-size:15px;line-height:1.28;color:#123D63;margin:3px 0 0}.official-hospital span,.official-department span{display:block;direction:ltr}.official-report{min-width:130px;text-align:${isRTL ? "left" : "right"};border-${isRTL ? "right" : "left"}:1px solid #D8E4EF;padding-${isRTL ? "right" : "left"}:10px}.official-report strong{display:block;font-size:11px}.official-report span{display:block;color:#5F738A;font-size:9px;margin-top:3px}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0}.metric{background:#F3F7FB;border:1px solid #D8E4EF;border-radius:8px;padding:10px;min-height:58px}.metric span{display:block;color:#5F738A;font-size:10px}.metric strong{display:block;color:#123D63;font-size:20px;margin-top:3px}h2{font-size:15px;margin:20px 0 8px;color:#123D63}table{border-collapse:collapse;width:100%}th{background:#123D63;color:#fff;font-weight:700}th,td{border:1px solid #D8E4EF;padding:8px;text-align:${isRTL ? "right" : "left"}}tbody tr:nth-child(even){background:#F8FBFD}.footer{color:#5F738A;border-top:1px solid #D8E4EF;margin-top:18px;padding-top:8px;font-size:10px}</style></head><body>${header}<main><p class="footer">${escapeHtml(copy.source)}</p><div class="metrics">${metricHtml}</div><h2>${escapeHtml(copy.dailyBreakdown)}</h2><table><thead><tr><th>${escapeHtml(copy.date)}</th><th>${escapeHtml(copy.consultations)}</th><th>${escapeHtml(copy.admissions)}</th><th>${escapeHtml(copy.emergencySurgeries)}</th><th>${escapeHtml(copy.totalCases)}</th></tr></thead><tbody>${rows}</tbody></table></main><footer class="footer">${escapeHtml(copy.source)}</footer></body></html>`;
}
