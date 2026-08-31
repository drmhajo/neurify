import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { getReportPrintAssets } from "@/lib/report-print-theme";
import { createReportPrintCss } from "@/lib/report-print-styles";
import { saveReportUriToDevice } from "@/lib/report-direct-download";
import { MEDICAL_REPORT_SECTION_KEYS, medicalReportSectionLabels, type MedicalReportDraft } from "@/shared/medical-report-draft";

function escapeHtml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
function asParagraphs(value: string) { return escapeHtml(value).replace(/\n/g, "<br />"); }

export async function exportApprovedMedicalReport(input: { patient: { fullName: string; fileNumber: string; age: number | null; diagnosis: string; ward?: string; bed?: string }; draft: MedicalReportDraft; language: "ar" | "en"; approvedBy: string }) {
  const assets = await getReportPrintAssets();
  const labels = medicalReportSectionLabels(input.language);
  const arabic = input.language === "ar";
  const date = new Intl.DateTimeFormat(arabic ? "ar-SA" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" }).format(new Date());
  const sections = MEDICAL_REPORT_SECTION_KEYS.map((key) => `<section class="clinical-section"><div class="section">${escapeHtml(labels[key])}</div><div class="clinical-body">${asParagraphs(input.draft[key])}</div></section>`).join("");
  const patientRows = [
    [arabic ? "اسم المريض" : "Patient name", input.patient.fullName],
    [arabic ? "رقم الملف" : "Medical record number", input.patient.fileNumber],
    [arabic ? "العمر" : "Age", input.patient.age === null ? "—" : `${input.patient.age}`],
    [arabic ? "الجناح / السرير" : "Ward / bed", [input.patient.ward, input.patient.bed].filter(Boolean).join(" / ") || "—"],
    [arabic ? "التشخيص الموثق" : "Documented diagnosis", input.patient.diagnosis || "—"],
  ].map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join("");
  const html = `<!doctype html><html dir="${arabic ? "rtl" : "ltr"}"><head><meta charset="utf-8" /><style>${createReportPrintCss({ language: input.language, fontCss: assets.fontCss })}.clinical-section{break-inside:avoid;margin-top:14px}.clinical-body{border:1px solid #E2E4EF;border-top:0;border-radius:0 0 10px 10px;padding:11px 12px;color:#29364B;min-height:44px;background:#fff;white-space:normal}.draft-notice{margin:12px 0;padding:9px 11px;border:1px solid #D8DCFA;border-radius:10px;background:#EEF0FF;color:#4956A6;font-size:9px;font-weight:700}.clinical-footer{margin-top:18px;padding-top:9px;border-top:1px solid #E2E4EF;color:#6D778C;font-size:8.5px}</style></head><body><main class="print-page"><header class="official-header"><img src="${assets.logoSrc}" class="official-logo" /><div class="official-identity"><p class="official-hospital">${arabic ? "مدينة الملك سعود الطبية" : "King Saud Medical City"}</p><h1 class="official-department">${arabic ? "قسم جراحة المخ والأعصاب" : "Neurosurgery Department"}</h1></div><div class="official-report"><strong>${arabic ? "تقرير طبي" : "Medical Report"}</strong><span>Neurify · ${date}</span></div></header><div class="report-intro"><div><h2 class="report-title">${arabic ? "مسودة تقرير طبي معتمدة" : "Approved Medical Report Draft"}</h2><p class="report-subtitle">${arabic ? "تمت مراجعة المحتوى واعتماده من الطبيب قبل التصدير." : "Content reviewed and approved by a clinician before export."}</p></div><span class="report-kicker">${arabic ? "للاستخدام السريري بعد المراجعة" : "Clinician reviewed"}</span></div><table class="head"><tbody>${patientRows}</tbody></table><div class="draft-notice">${arabic ? "تنبيه: هذه الوثيقة مولدة كمساعدة في التوثيق من البيانات المسجلة في الملف، وقد راجعها المستخدم المعتمد قبل التصدير." : "Notice: This document was AI-assisted from documented file data and reviewed by the approved user before export."}</div>${sections}<footer class="clinical-footer">${arabic ? "اعتمد بواسطة: " : "Approved by: "}${escapeHtml(input.approvedBy)} · Neurify</footer></main></body></html>`;
  const safeRecord = input.patient.fileNumber.replace(/[^a-z0-9_-]/gi, "") || "patient";
  const fileName = `neurify-medical-report-${safeRecord}-${new Date().toISOString().slice(0, 10)}.pdf`;
  if (Platform.OS === "web") { const blob = new Blob([html], { type: "text/html" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = fileName.replace(/\.pdf$/, ".html"); anchor.click(); URL.revokeObjectURL(url); return "downloaded" as const; }
  const result = await Print.printToFileAsync({ html });
  if (Platform.OS === "android") return saveReportUriToDevice({ uri: result.uri, fileName, mimeType: "application/pdf" });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: "application/pdf", dialogTitle: fileName, UTI: ".pdf" });
  return "shared" as const;
}
