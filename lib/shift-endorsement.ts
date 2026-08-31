import type { DailyShiftReport, DepartmentData } from "./department-model";
import { createOfficialReportHeaderHtml } from "./report-branding";
import { createReportPrintCss, type ReportPrintAssets } from "./report-print-styles";
import { formatRiyadhDateTime, getRiyadhDateKey, RIYADH_TIME_ZONE } from "./riyadh-time";

export const SHIFT_TIME_ZONE = RIYADH_TIME_ZONE;
export const SHIFT_START_HOUR = 7;
export const SHIFT_START_MINUTE = 30;
export const SHIFT_END_HOUR = 7;
export const SHIFT_END_MINUTE = 30;
export type ShiftWindow = { startAt: string; endAt: string; reportDate: string };

export function getShiftWindowForReportDate(reportDate: string): ShiftWindow | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) return null;
  const [year, month, day] = reportDate.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, SHIFT_START_HOUR - 3, SHIFT_START_MINUTE));
  if (start.getUTCFullYear() !== year || start.getUTCMonth() !== month - 1 || start.getUTCDate() !== day) return null;
  return { startAt: start.toISOString(), endAt: new Date(start.getTime() + 24 * 60 * 60 * 1000).toISOString(), reportDate };
}

export function getShiftWindow(now = new Date()): ShiftWindow {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: SHIFT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const todayStart = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), SHIFT_START_HOUR - 3, SHIFT_START_MINUTE));
  return getShiftWindowForReportDate(getRiyadhDateKey(now >= todayStart ? todayStart : new Date(todayStart.getTime() - 24 * 60 * 60 * 1000)))!;
}

export function isShiftClosed(now = new Date()) { return now.getTime() >= new Date(getShiftWindow(now).endAt).getTime(); }

function periodFromLabel(value: string): "AM" | "PM" {
  const match = value.match(/(?:^|\D)([01]?\d|2[0-3]):[0-5]\d/);
  return match && Number(match[1]) >= 12 ? "PM" : /مساء|ليل|pm/i.test(value) ? "PM" : "AM";
}

export function buildDailyShiftReport(data: DepartmentData, generatedBy: string, now = new Date(), selectedReportDate?: string): DailyShiftReport {
  const window = selectedReportDate ? getShiftWindowForReportDate(selectedReportDate) : getShiftWindow(now);
  if (!window) throw new Error("Invalid on-call report date.");
  const startAt = new Date(window.startAt).getTime();
  const endAt = new Date(window.endAt).getTime();
  const happenedWithinShift = (value?: string) => { const timestamp = value ? Date.parse(value) : Number.NaN; return !Number.isNaN(timestamp) && timestamp >= startAt && timestamp < endAt; };
  const onCall = data.shifts.slice(0, 3).map((shift) => shift.clinician);
  const selectedOnCall = (userId?: string) => userId ? data.users.find((user) => user.id === userId && user.active)?.name : undefined;
  const consultations = data.teams.flatMap((team) => team.consultations).filter((consultation) => Boolean(consultation.patient) && happenedWithinShift(consultation.createdAt)).map((consultation) => ({ id: consultation.id, period: periodFromLabel(consultation.time), mrn: consultation.patient!.fileNumber || consultation.patient!.code, age: consultation.patient!.age === null ? "—" : `${consultation.patient!.age} Y`, diagnosis: consultation.patient!.diagnosis, consultingSpecialty: consultation.title, plan: consultation.patient!.clinicalDecision || consultation.subject || "—", requiresFollowUp: consultation.disposition === "follow_up" }));
  const admissions = data.teams.flatMap((team) => team.cases.filter((patient) => patient.status === "منوّم" && happenedWithinShift(patient.admittedAt)).map((patient) => ({ id: patient.id, mrn: patient.fileNumber || patient.code, diagnosis: patient.diagnosis, admissionType: "Unspecified" as const, plan: patient.clinicalDecision || "—", admittingConsultant: team.lead })));
  const recordedEmergencySurgeries = data.surgeries.filter((surgery) => /emergency|urgent|طارئ|إسعاف/i.test(`${surgery.procedure} ${surgery.notes}`) && happenedWithinShift(surgery.recordedAt)).map((surgery) => { const patient = data.teams.flatMap((team) => team.cases).find((item) => item.fileNumber === surgery.patientCode || item.code === surgery.patientCode); return { id: surgery.id, mrn: patient?.fileNumber || surgery.patientCode, diagnosis: patient?.diagnosis || "—", surgery: surgery.procedure }; });
  const selectedSurgicalInterventions = data.teams.flatMap((team) => team.consultations.filter((consultation) => Boolean(consultation.patient?.surgeryType) && happenedWithinShift(consultation.createdAt)).map((consultation) => ({ id: `consultation-${consultation.id}`, mrn: consultation.patient!.fileNumber || consultation.patient!.code, diagnosis: consultation.patient!.diagnosis || "—", surgery: consultation.patient!.surgeryType! })));
  const emergencySurgeries = [...selectedSurgicalInterventions, ...recordedEmergencySurgeries].filter((item, index, items) => items.findIndex((candidate) => candidate.mrn === item.mrn && candidate.surgery === item.surgery) === index);
  return { id: `shift-${window.reportDate}`, reportDate: window.reportDate, shiftStartAt: window.startAt, shiftEndAt: window.endAt, generatedAt: now.toISOString(), generatedBy, onCall: { first: selectedOnCall(data.shiftReportPreferences?.firstOnCallUserId) || onCall[0] || "—", second: selectedOnCall(data.shiftReportPreferences?.secondOnCallUserId) || onCall[1] || "—", third: selectedOnCall(data.shiftReportPreferences?.thirdOnCallUserId) || onCall[2] || "—" }, consultations, admissions, emergencySurgeries, statistics: { consultations: consultations.length, requiringFollowUp: consultations.filter((item) => item.requiresFollowUp).length, admissions: admissions.length, emergencySurgeries: emergencySurgeries.length } };
}

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character); }
function cells(values: string[]) { return `<tr>${values.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`; }

/** Creates the daily endorsement PDF with the Neurify V2 formal print treatment. */
export function createShiftReportHtml(report: DailyShiftReport, assets?: ReportPrintAssets) {
  const consultationRows = report.consultations.map((item) => cells([item.period, item.mrn, item.age, item.diagnosis, item.consultingSpecialty, item.plan, item.requiresFollowUp ? "YES" : "NO"])).join("") || cells(["—", "—", "—", "No consultations recorded", "—", "—", "—"]);
  const admissionRows = report.admissions.map((item) => cells([item.mrn, item.diagnosis, item.admissionType, item.plan, item.admittingConsultant])).join("") || cells(["—", "—", "—", "—", "—"]);
  const emergencyRows = report.emergencySurgeries.map((item) => cells([item.mrn, item.diagnosis, item.surgery])).join("") || cells(["—", "—", "No emergency surgeries recorded"]);
  const header = createOfficialReportHeaderHtml({ title: "On-call Endorsement Sheet", subtitle: `Report date · ${report.reportDate}`, language: "en", logoSrc: assets?.logoSrc });
  return `<!DOCTYPE html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${createReportPrintCss({ language: "en", fontCss: assets?.fontCss })}</style></head><body><main class="print-page">${header}<section class="report-intro"><div><h1 class="report-title">On-call Endorsement</h1><p class="report-subtitle">Clinical handover · ${escapeHtml(report.reportDate)}</p></div><span class="report-kicker">Riyadh 24-hour shift</span></section><table class="head"><tr><td>Report date</td><td>${escapeHtml(report.reportDate)}</td></tr><tr><td>1st on-call</td><td>${escapeHtml(report.onCall.first)}</td></tr><tr><td>2nd on-call</td><td>${escapeHtml(report.onCall.second)}</td></tr><tr><td>3rd on-call</td><td>${escapeHtml(report.onCall.third)}</td></tr></table><div class="section">Consultations</div><table class="report-table"><thead><tr><th>AM/PM</th><th>MRN</th><th>Age</th><th>Diagnosis</th><th>Consulting specialty</th><th>Plan</th><th>Require F/U?</th></tr></thead><tbody>${consultationRows}</tbody></table><div class="section admit">Admissions</div><table class="report-table"><thead><tr><th>MRN</th><th>Diagnosis</th><th>Elective vs Emergency</th><th>Plan</th><th>Admitting consultant</th></tr></thead><tbody>${admissionRows}</tbody></table><div class="section emergency">Emergency Surgeries</div><table class="report-table"><thead><tr><th>MRN</th><th>Diagnosis</th><th>Surgery</th></tr></thead><tbody>${emergencyRows}</tbody></table><p class="meta">Shift window (Riyadh): ${escapeHtml(formatRiyadhDateTime(report.shiftStartAt))} – ${escapeHtml(formatRiyadhDateTime(report.shiftEndAt))}. Generated by ${escapeHtml(report.generatedBy)}.</p></main></body></html>`;
}
