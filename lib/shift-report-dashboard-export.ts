import * as XLSX from "xlsx";

import { monthLabel, type MonthlyShiftReportAnalytics } from "./shift-report-analytics";
import { createOfficialReportHeaderHtml } from "./report-branding";
import { createReportPrintCss, type ReportPrintAssets } from "./report-print-styles";
import { applyReportWorkbookBranding } from "./report-workbook-branding";

export type DashboardExportLanguage = "ar" | "en";

type ExportLabels = { department: string; title: string; source: string; month: string; archivedReports: string; consultations: string; admissions: string; emergencySurgeries: string; followUp: string; totalCases: string; dailyBreakdown: string; date: string };

function labels(language: DashboardExportLanguage): ExportLabels {
  return language === "en"
    ? { department: "KSMC Neurosurgery Department", title: "Monthly On-call Dashboard", source: "Source: archived on-call endorsement reports", month: "Month", archivedReports: "Archived reports", consultations: "Consultations", admissions: "Admissions", emergencySurgeries: "Emergency surgeries", followUp: "Cases requiring follow-up", totalCases: "Total cases", dailyBreakdown: "Daily breakdown", date: "Date" }
    : { department: "قسم جراحة المخ والأعصاب — مدينة الملك سعود الطبية", title: "لوحة معلومات المناوبات الشهرية", source: "المصدر: تقارير تسليم المناوبات المؤرشفة", month: "الشهر", archivedReports: "التقارير المؤرشفة", consultations: "الاستشارات", admissions: "التنويم", emergencySurgeries: "العمليات الإسعافية", followUp: "حالات تحتاج متابعة", totalCases: "إجمالي الحالات", dailyBreakdown: "التفصيل اليومي", date: "التاريخ" };
}

function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export function dashboardExportFileName(month: string, extension: "pdf" | "xlsx") { return `ksmc-neurosurgery-monthly-dashboard-${month}.${extension}`; }

export function dashboardExcelRows(analytics: MonthlyShiftReportAnalytics, language: DashboardExportLanguage) {
  const copy = labels(language);
  return {
    summary: [[copy.department], [copy.title], [copy.month, monthLabel(analytics.month, language)], [copy.archivedReports, analytics.reportCount], [copy.consultations, analytics.consultations], [copy.admissions, analytics.admissions], [copy.emergencySurgeries, analytics.emergencySurgeries], [copy.followUp, analytics.requiringFollowUp], [copy.totalCases, analytics.totalCases], [], [copy.source]],
    daily: [[copy.date, copy.consultations, copy.admissions, copy.emergencySurgeries, copy.totalCases], ...analytics.daily.map((day) => [day.date, day.consultations, day.admissions, day.emergencySurgeries, day.totalCases])],
  };
}

export function createDashboardWorkbook(analytics: MonthlyShiftReportAnalytics, language: DashboardExportLanguage) {
  const rows = dashboardExcelRows(analytics, language);
  const workbook = XLSX.utils.book_new();
  const summary = XLSX.utils.aoa_to_sheet(rows.summary);
  const daily = XLSX.utils.aoa_to_sheet(rows.daily);
  summary["!cols"] = [{ wch: 30 }, { wch: 27 }];
  daily["!cols"] = [{ wch: 16 }, { wch: 17 }, { wch: 14 }, { wch: 22 }, { wch: 15 }];
  applyReportWorkbookBranding(summary, { language, titleRows: [0, 1] });
  applyReportWorkbookBranding(daily, { language, headerRow: 0, freezeAfterRow: 1 });
  XLSX.utils.book_append_sheet(workbook, summary, language === "en" ? "Monthly summary" : "الملخص الشهري");
  XLSX.utils.book_append_sheet(workbook, daily, language === "en" ? "Daily breakdown" : "التفصيل اليومي");
  return workbook;
}

export function createMonthlyDashboardHtml(analytics: MonthlyShiftReportAnalytics, language: DashboardExportLanguage, assets?: ReportPrintAssets) {
  const copy = labels(language);
  const isRTL = language === "ar";
  const header = createOfficialReportHeaderHtml({ title: copy.title, subtitle: `${copy.month} · ${monthLabel(analytics.month, language)}`, language, logoSrc: assets?.logoSrc });
  const metrics = [[copy.archivedReports, analytics.reportCount], [copy.consultations, analytics.consultations], [copy.admissions, analytics.admissions], [copy.emergencySurgeries, analytics.emergencySurgeries], [copy.followUp, analytics.requiringFollowUp], [copy.totalCases, analytics.totalCases]];
  const metricHtml = metrics.map(([label, value]) => `<section class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></section>`).join("");
  const rows = analytics.daily.map((day) => `<tr><td>${escapeHtml(day.date)}</td><td>${day.consultations}</td><td>${day.admissions}</td><td>${day.emergencySurgeries}</td><td>${day.totalCases}</td></tr>`).join("");
  return `<!doctype html><html dir="${isRTL ? "rtl" : "ltr"}" lang="${language}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(copy.title)} — ${escapeHtml(analytics.month)}</title><style>${createReportPrintCss({ language, fontCss: assets?.fontCss })}</style></head><body><main class="print-page">${header}<section class="report-intro"><div><h1 class="report-title">${escapeHtml(copy.title)}</h1><p class="report-subtitle">${escapeHtml(copy.month)} · ${escapeHtml(monthLabel(analytics.month, language))}</p></div><span class="report-kicker">${isRTL ? "ملخص تشغيلي" : "Operational summary"}</span></section><div class="metric-grid">${metricHtml}</div><h2 class="report-title" style="font-size:14px">${escapeHtml(copy.dailyBreakdown)}</h2><table class="report-table"><thead><tr><th>${escapeHtml(copy.date)}</th><th>${escapeHtml(copy.consultations)}</th><th>${escapeHtml(copy.admissions)}</th><th>${escapeHtml(copy.emergencySurgeries)}</th><th>${escapeHtml(copy.totalCases)}</th></tr></thead><tbody>${rows}</tbody></table><footer class="footer">${escapeHtml(copy.source)}</footer></main></body></html>`;
}
