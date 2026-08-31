import type { DepartmentData } from "./department-model";
import { createOfficialReportHeaderHtml } from "./report-branding";
import { createReportPrintCss, type ReportPrintAssets } from "./report-print-styles";
import { formatRiyadhDateTime } from "./riyadh-time";
import { canonicalWard } from "./ward-catalog";

export type WeekendEndorsementEntry = { id: string; teamId: string; patientName: string; fileNumber: string; consultant: string; ward: string; bed: string; diagnosis: string; weekendPlan: string; teamName: string };
export type WeekendEndorsementReport = { generatedAt: string; generatedBy: string; consultantFilter?: string; wardFilter?: string; entries: WeekendEndorsementEntry[] };

export function searchWeekendEndorsementEntries(entries: WeekendEndorsementEntry[], query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return normalizedQuery ? entries.filter((entry) => `${entry.patientName} ${entry.fileNumber}`.toLocaleLowerCase().includes(normalizedQuery)) : entries;
}

function normalizeWard(value: string | undefined) { return canonicalWard(value).toLocaleLowerCase(); }

export function buildWeekendEndorsementReport(data: DepartmentData, generatedBy: string, consultantFilter?: string, wardFilter?: string): WeekendEndorsementReport {
  return {
    generatedAt: new Date().toISOString(), generatedBy, consultantFilter, wardFilter,
    entries: data.teams.flatMap((team) => team.cases.filter((patient) => patient.status === "منوّم" && (!consultantFilter || team.lead === consultantFilter) && (!wardFilter || normalizeWard(patient.ward) === normalizeWard(wardFilter))).map((patient) => ({
      id: patient.id, teamId: team.id, patientName: patient.fullName, fileNumber: patient.fileNumber || patient.code, consultant: team.lead, ward: canonicalWard(patient.ward) || "—", bed: patient.bed?.trim() || "—", diagnosis: patient.diagnosis?.trim() || "—", weekendPlan: patient.weekendPlan?.trim() || "Not documented", teamName: team.name,
    }))),
  };
}

export function weekendEndorsementPatientRoute(entry: WeekendEndorsementEntry) { return { teamId: entry.teamId, caseId: entry.id }; }

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character); }

export function createWeekendEndorsementHtml(report: WeekendEndorsementReport, language: "ar" | "en" = "en", assets?: ReportPrintAssets) {
  const english = language === "en";
  const rows = report.entries.map((entry, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(entry.patientName)}</td><td>${escapeHtml(entry.fileNumber)}</td><td>${escapeHtml(entry.ward)}</td><td>${escapeHtml(entry.bed)}</td><td>${escapeHtml(entry.diagnosis)}</td><td>${escapeHtml(entry.consultant)}</td><td>${escapeHtml(entry.weekendPlan).replace(/\n/g, "<br />")}</td></tr>`).join("") || `<tr><td colspan="8" class="empty">${english ? "No inpatients are recorded." : "لا توجد حالات منوّمة مسجلة."}</td></tr>`;
  const scope = [report.consultantFilter ? `${english ? "Treating consultant" : "الاستشاري المعالج"} · ${report.consultantFilter}` : english ? "All treating consultants" : "جميع الاستشاريين المعالجين", report.wardFilter ? `${english ? "Ward" : "الجناح"} · ${report.wardFilter}` : english ? "All wards" : "جميع الأجنحة"].join(" · ");
  const title = english ? "Weekend Endorsement" : "تسليم نهاية الأسبوع";
  const header = createOfficialReportHeaderHtml({ title, subtitle: `${scope} · ${formatRiyadhDateTime(report.generatedAt, language)}`, language, logoSrc: assets?.logoSrc });
  return `<!DOCTYPE html><html lang="${language}" dir="${english ? "ltr" : "rtl"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${createReportPrintCss({ language, landscape: true, fontCss: assets?.fontCss })}.plan{min-width:190px}</style></head><body><main class="print-page">${header}<section class="report-intro"><div><h1 class="report-title">${title}</h1><p class="report-subtitle">${escapeHtml(scope)} · ${report.entries.length} ${english ? `patient${report.entries.length === 1 ? "" : "s"}` : "حالة"}</p></div><span class="report-kicker">${english ? "Inpatient handover" : "تسليم المنومين"}</span></section><table class="report-table"><thead><tr><th>#</th><th>${english ? "Patient name" : "اسم المريض"}</th><th>${english ? "MRN" : "رقم الملف"}</th><th>${english ? "Ward" : "الجناح"}</th><th>${english ? "Bed" : "السرير"}</th><th>${english ? "Diagnosis" : "التشخيص"}</th><th>${english ? "Treating consultant" : "الاستشاري المعالج"}</th><th>${english ? "Weekend plan" : "خطة نهاية الأسبوع"}</th></tr></thead><tbody>${rows}</tbody></table><p class="meta">${english ? "Prepared by" : "أعدّه"} ${escapeHtml(report.generatedBy)} · ${escapeHtml(formatRiyadhDateTime(report.generatedAt, language))} (${english ? "Riyadh" : "الرياض"})</p></main></body></html>`;
}
