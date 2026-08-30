import * as XLSX from "xlsx";
import type { OpdOperationWaitingEntry } from "./department-model";
import { createOfficialReportHeaderHtml } from "./report-branding";
import { formatRiyadhDateTime } from "./riyadh-time";
import { opdPriorityLabel, opdStatusLabel } from "./opd-operation-waitlist";

export type OpdWaitlistExportLanguage = "ar" | "en";
export type OpdWaitlistFilters = { priority?: OpdOperationWaitingEntry["priority"]; status?: OpdOperationWaitingEntry["status"] };
export type OpdWaitlistReport = OpdWaitlistFilters & { entries: OpdOperationWaitingEntry[]; generatedAt: string; generatedBy: string };

export function filterOpdWaitlist(entries: OpdOperationWaitingEntry[], filters: OpdWaitlistFilters) {
  return entries.filter((entry) => (!filters.priority || entry.priority === filters.priority) && (!filters.status || entry.status === filters.status));
}

export function buildOpdWaitlistReport(entries: OpdOperationWaitingEntry[], generatedBy: string, filters: OpdWaitlistFilters): OpdWaitlistReport {
  return { entries: filterOpdWaitlist(entries, filters), generatedAt: new Date().toISOString(), generatedBy, ...filters };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export function opdWaitlistScopeLabel(report: OpdWaitlistReport, language: OpdWaitlistExportLanguage) {
  const priority = report.priority ? opdPriorityLabel(report.priority, language) : language === "en" ? "All priorities" : "كل الأولويات";
  const status = report.status ? opdStatusLabel(report.status, language) : language === "en" ? "All statuses" : "كل الحالات";
  return language === "en" ? `Priority: ${priority} · Status: ${status}` : `الأولوية: ${priority} · الحالة: ${status}`;
}

function safeFilePart(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "all";
}

export function opdWaitlistExportFileName(report: OpdWaitlistReport, extension: "pdf" | "xlsx") {
  const date = report.generatedAt.slice(0, 10) || "opd";
  const priority = report.priority === "عاجل" ? "urgent" : report.priority === "قريب" ? "soon" : report.priority === "روتيني" ? "routine" : "all-priorities";
  const status = report.status === "بانتظار مراجعة" ? "pending-review" : report.status === "معتمد" ? "approved" : report.status === "مجدول" ? "scheduled" : report.status === "مكتمل" ? "complete" : report.status === "ملغى" ? "cancelled" : "all-statuses";
  return `ksmc-neurosurgery-opd-operation-waiting-list-${safeFilePart(`${priority}-${status}`)}-${date}.${extension}`;
}

export function opdWaitlistExcelRows(report: OpdWaitlistReport, language: OpdWaitlistExportLanguage) {
  const english = language === "en";
  return {
    summary: [[english ? "KSMC Neurosurgery Department" : "قسم جراحة المخ والأعصاب — مدينة الملك سعود الطبية"], [english ? "OPD operation waiting list" : "قائمة انتظار عمليات العيادات"], [english ? "Scope" : "نطاق القائمة", opdWaitlistScopeLabel(report, language)], [english ? "Prepared by" : "أعدّه", report.generatedBy], [english ? "Generated (Riyadh)" : "وقت الإنشاء (الرياض)", formatRiyadhDateTime(report.generatedAt, english ? "en" : "ar")], [english ? "Requests" : "الطلبات", report.entries.length]],
    entries: [["#", english ? "Patient name" : "اسم المريض", english ? "MRN" : "رقم الملف", english ? "Diagnosis" : "التشخيص", english ? "Procedure" : "نوع العملية", english ? "Requesting clinician" : "الطبيب طالب العملية", english ? "Target date" : "الموعد المتوقع", english ? "Priority" : "الأولوية", english ? "Status" : "الحالة", english ? "Notes" : "ملاحظات"], ...report.entries.map((entry, index) => [index + 1, entry.patientName, entry.fileNumber, entry.diagnosis || "—", entry.procedure, entry.requestedBy, entry.plannedDate || "—", opdPriorityLabel(entry.priority, language), opdStatusLabel(entry.status, language), entry.notes || "—"])],
  };
}

export function createOpdWaitlistWorkbook(report: OpdWaitlistReport, language: OpdWaitlistExportLanguage) {
  const rows = opdWaitlistExcelRows(report, language);
  const workbook = XLSX.utils.book_new();
  const summary = XLSX.utils.aoa_to_sheet(rows.summary);
  const entries = XLSX.utils.aoa_to_sheet(rows.entries);
  summary["!cols"] = [{ wch: 28 }, { wch: 44 }];
  entries["!cols"] = [{ wch: 5 }, { wch: 28 }, { wch: 18 }, { wch: 30 }, { wch: 32 }, { wch: 25 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 44 }];
  XLSX.utils.book_append_sheet(workbook, summary, language === "en" ? "Summary" : "الملخص");
  XLSX.utils.book_append_sheet(workbook, entries, language === "en" ? "OPD wait list" : "قائمة انتظار العيادة");
  return workbook;
}

export function createOpdWaitlistHtml(report: OpdWaitlistReport, language: OpdWaitlistExportLanguage) {
  const english = language === "en";
  const rows = report.entries.map((entry, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(entry.patientName)}</td><td>${escapeHtml(entry.fileNumber)}</td><td>${escapeHtml(entry.diagnosis || "—")}</td><td>${escapeHtml(entry.procedure)}</td><td>${escapeHtml(entry.requestedBy)}</td><td>${escapeHtml(entry.plannedDate || "—")}</td><td>${escapeHtml(opdPriorityLabel(entry.priority, language))}</td><td>${escapeHtml(opdStatusLabel(entry.status, language))}</td><td>${escapeHtml(entry.notes || "—").replace(/\n/g, "<br />")}</td></tr>`).join("") || `<tr><td colspan="10" class="empty">${english ? "No OPD operation requests match the selected filters." : "لا توجد طلبات عمليات عيادات تطابق الفلاتر المحددة."}</td></tr>`;
  const scope = opdWaitlistScopeLabel(report, language);
  const header = createOfficialReportHeaderHtml({ title: english ? "OPD operation waiting list" : "قائمة انتظار عمليات العيادات", subtitle: `${scope} · ${formatRiyadhDateTime(report.generatedAt, english ? "en" : "ar")}` });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,"Noto Naskh Arabic",sans-serif;color:#123D63;margin:0;font-size:8.5px;line-height:1.4}.official-header{display:flex;align-items:center;gap:11px;border-bottom:3px solid #08766D;padding:0 0 12px;margin-bottom:16px}.official-logo{width:60px;height:60px;object-fit:contain}.official-identity{flex:1}.official-hospital{font-size:10px;font-weight:700;color:#08766D;margin:0}.official-department{font-size:15px;line-height:1.28;color:#123D63;margin:3px 0 0}.official-hospital span,.official-department span{display:block;direction:ltr}.official-report{min-width:132px;text-align:right;border-left:1px solid #D8E4EF;padding-left:10px}.official-report strong{display:block;font-size:11px}.official-report span{display:block;color:#5F738A;font-size:9px;margin-top:3px}h1{font-size:16px;margin:0 0 4px}p{margin:0;color:#526A7B}table{border-collapse:collapse;width:100%;margin-top:18px}th,td{border:1px solid #C9DBE8;padding:5px;text-align:left;vertical-align:top}th{background:#E7F0F7;color:#123D63;font-weight:700}.empty{text-align:center;color:#526A7B;padding:18px}.meta{border-top:1px solid #D8E4EF;margin-top:18px;padding-top:8px;font-size:9px}</style></head><body>${header}<h1>${english ? "OPD operation waiting list" : "قائمة انتظار عمليات العيادات"}</h1><p>${escapeHtml(scope)} · ${report.entries.length} ${english ? "request" : "طلب"}</p><table><thead><tr><th>#</th><th>${english ? "Patient name" : "اسم المريض"}</th><th>MRN</th><th>${english ? "Diagnosis" : "التشخيص"}</th><th>${english ? "Procedure" : "نوع العملية"}</th><th>${english ? "Requesting clinician" : "الطبيب طالب العملية"}</th><th>${english ? "Target date" : "الموعد المتوقع"}</th><th>${english ? "Priority" : "الأولوية"}</th><th>${english ? "Status" : "الحالة"}</th><th>${english ? "Notes" : "ملاحظات"}</th></tr></thead><tbody>${rows}</tbody></table><p class="meta">${english ? "Prepared by" : "أعدّه"} ${escapeHtml(report.generatedBy)} · ${escapeHtml(formatRiyadhDateTime(report.generatedAt, english ? "en" : "ar"))} (${english ? "Riyadh" : "الرياض"})</p></body></html>`;
}
