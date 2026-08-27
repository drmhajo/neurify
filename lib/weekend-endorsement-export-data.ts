import * as XLSX from "xlsx";
import type { WeekendEndorsementReport } from "./weekend-endorsement";

export type WeekendEndorsementExportLanguage = "ar" | "en";

function safeFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "all-consultants";
}

function scopeLabel(report: WeekendEndorsementReport, language: WeekendEndorsementExportLanguage) {
  if (report.consultantFilter) return report.consultantFilter;
  return language === "en" ? "All consultants" : "جميع الاستشاريين";
}

export function weekendEndorsementExportFileName(report: WeekendEndorsementReport, extension: "pdf" | "xlsx") {
  const date = report.generatedAt.slice(0, 10) || "weekend";
  return `ksmc-neurosurgery-weekend-endorsement-${safeFilePart(report.consultantFilter ?? "all-consultants")}-${date}.${extension}`;
}

export function weekendEndorsementExcelRows(report: WeekendEndorsementReport, language: WeekendEndorsementExportLanguage) {
  const english = language === "en";
  return {
    summary: [
      [english ? "KSMC Neurosurgery Department" : "قسم جراحة المخ والأعصاب — مدينة الملك سعود الطبية"],
      ["Weekend Endorsement"],
      [english ? "Scope" : "نطاق التقرير", scopeLabel(report, language)],
      [english ? "Prepared by" : "أعدّه", report.generatedBy],
      [english ? "Generated" : "وقت الإنشاء", new Date(report.generatedAt).toLocaleString()],
      [english ? "Inpatients" : "المرضى المنومون", report.entries.length],
    ],
    plans: [
      ["#", english ? "Patient name" : "اسم المريض", english ? "MRN" : "رقم الملف", english ? "Ward" : "الجناح", english ? "Bed" : "السرير", english ? "Diagnosis" : "التشخيص", english ? "Treating consultant" : "الاستشاري المعالج", english ? "Weekend plan" : "خطة نهاية الأسبوع"],
      ...report.entries.map((entry, index) => [index + 1, entry.patientName, entry.fileNumber, entry.ward, entry.bed, entry.diagnosis, entry.consultant, entry.weekendPlan]),
    ],
  };
}

export function createWeekendEndorsementWorkbook(report: WeekendEndorsementReport, language: WeekendEndorsementExportLanguage) {
  const rows = weekendEndorsementExcelRows(report, language);
  const workbook = XLSX.utils.book_new();
  const summary = XLSX.utils.aoa_to_sheet(rows.summary);
  const plans = XLSX.utils.aoa_to_sheet(rows.plans);
  summary["!cols"] = [{ wch: 26 }, { wch: 34 }];
  plans["!cols"] = [{ wch: 5 }, { wch: 28 }, { wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 30 }, { wch: 25 }, { wch: 65 }];
  XLSX.utils.book_append_sheet(workbook, summary, language === "en" ? "Summary" : "الملخص");
  XLSX.utils.book_append_sheet(workbook, plans, language === "en" ? "Inpatient plans" : "خطط المنومين");
  return workbook;
}
