import type { DailyShiftReport, DepartmentData } from "./department-model";

export const SHIFT_TIME_ZONE = "Asia/Riyadh";
export const SHIFT_START_HOUR = 7;
export const SHIFT_START_MINUTE = 30;
export const SHIFT_END_HOUR = 7;
export const SHIFT_END_MINUTE = 20;

export type ShiftWindow = { startAt: string; endAt: string; reportDate: string };

/** Computes the active or most-recent 24-hour handover period on the device. */
export function getShiftWindow(now = new Date()): ShiftWindow {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: SHIFT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const todayStart = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), SHIFT_START_HOUR - 3, SHIFT_START_MINUTE));
  const activeStart = now >= todayStart ? todayStart : new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const activeEnd = new Date(activeStart.getTime() + ((23 * 60 + 50) * 60 * 1000));
  const reportDate = activeStart.toLocaleDateString("en-CA", { timeZone: SHIFT_TIME_ZONE });
  return { startAt: activeStart.toISOString(), endAt: activeEnd.toISOString(), reportDate };
}

export function isShiftClosed(now = new Date()) {
  return now.getTime() >= new Date(getShiftWindow(now).endAt).getTime();
}

function periodFromLabel(value: string): "AM" | "PM" {
  const match = value.match(/(?:^|\D)([01]?\d|2[0-3]):[0-5]\d/);
  if (match && Number(match[1]) >= 12) return "PM";
  return /مساء|ليل|pm/i.test(value) ? "PM" : "AM";
}

/**
 * Builds the three-section KSMC handover format from the current structured
 * departmental snapshot. Legacy records without precise timestamps are kept
 * in a manual preview so existing pilot data remains reviewable.
 */
export function buildDailyShiftReport(data: DepartmentData, generatedBy: string, now = new Date()): DailyShiftReport {
  const window = getShiftWindow(now);
  const startAt = new Date(window.startAt).getTime();
  const endAt = new Date(window.endAt).getTime();
  const happenedWithinShift = (value?: string) => {
    if (!value) return true;
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) || (timestamp >= startAt && timestamp <= endAt);
  };
  const onCall = data.shifts.slice(0, 3).map((shift) => shift.clinician);
  const selectedOnCall = (userId?: string) => userId
    ? data.users.find((user) => user.id === userId && user.active)?.name
    : undefined;
  const consultations = data.teams.flatMap((team) => team.consultations)
    .filter((consultation) => Boolean(consultation.patient) && happenedWithinShift(consultation.createdAt))
    .map((consultation) => ({
      id: consultation.id,
      period: periodFromLabel(consultation.time),
      mrn: consultation.patient!.fileNumber || consultation.patient!.code,
      age: consultation.patient!.age === null ? "—" : `${consultation.patient!.age} Y`,
      diagnosis: consultation.patient!.diagnosis,
      consultingSpecialty: consultation.title,
      plan: consultation.patient!.clinicalDecision || consultation.subject || "—",
      requiresFollowUp: consultation.disposition === "follow_up",
    }));
  const admissions = data.teams.flatMap((team) => team.cases.filter((patient) => patient.status === "منوّم" && happenedWithinShift(patient.admittedAt)).map((patient) => ({
    id: patient.id,
    mrn: patient.fileNumber || patient.code,
    diagnosis: patient.diagnosis,
    admissionType: "Unspecified" as const,
    plan: patient.clinicalDecision || "—",
    admittingConsultant: team.lead,
  })));
  const emergencySurgeries = data.surgeries
    .filter((surgery) => /emergency|urgent|طارئ|إسعاف/i.test(`${surgery.procedure} ${surgery.notes}`) && happenedWithinShift(surgery.recordedAt))
    .map((surgery) => {
      const patient = data.teams.flatMap((team) => team.cases).find((item) => item.code === surgery.patientCode);
      return { id: surgery.id, mrn: patient?.fileNumber || surgery.patientCode, diagnosis: patient?.diagnosis || "—", surgery: surgery.procedure };
    });
  return {
    id: `shift-${window.reportDate}`,
    reportDate: window.reportDate,
    shiftStartAt: window.startAt,
    shiftEndAt: window.endAt,
    generatedAt: now.toISOString(),
    generatedBy,
    onCall: {
      first: selectedOnCall(data.shiftReportPreferences?.firstOnCallUserId) || onCall[0] || "—",
      second: selectedOnCall(data.shiftReportPreferences?.secondOnCallUserId) || onCall[1] || "—",
      third: selectedOnCall(data.shiftReportPreferences?.thirdOnCallUserId) || onCall[2] || "—",
    },
    consultations,
    admissions,
    emergencySurgeries,
    statistics: { consultations: consultations.length, requiringFollowUp: consultations.filter((item) => item.requiresFollowUp).length, admissions: admissions.length, emergencySurgeries: emergencySurgeries.length },
  };
}

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character); }
function cells(values: string[]) { return `<tr>${values.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`; }

/** Creates a printable HTML version that follows the uploaded two-page endorsement sheet. */
export function createShiftReportHtml(report: DailyShiftReport) {
  const consultationRows = report.consultations.map((item) => cells([item.period, item.mrn, item.age, item.diagnosis, item.consultingSpecialty, item.plan, item.requiresFollowUp ? "YES" : "NO"])).join("") || cells(["—", "—", "—", "No consultations recorded", "—", "—", "—"]);
  const admissionRows = report.admissions.map((item) => cells([item.mrn, item.diagnosis, item.admissionType, item.plan, item.admittingConsultant])).join("") || cells(["—", "—", "—", "—", "—"]);
  const emergencyRows = report.emergencySurgeries.map((item) => cells([item.mrn, item.diagnosis, item.surgery])).join("") || cells(["—", "—", "No emergency surgeries recorded"]);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{margin:18px}body{font-family:Arial,sans-serif;color:#102A43}h1{font-size:17px;margin:0 0 18px}.head{width:62%;border-collapse:collapse;margin:0 auto 28px}.head td{border:1px solid #333;padding:5px}.head tr:first-child{background:#F28C42;font-weight:700}.section{font-weight:700;color:#fff;padding:6px 8px;margin-top:22px;background:#3E8CC2}.section.admit{background:#EAAA00}.section.emergency{background:#69A845}table{border-collapse:collapse;width:100%;font-size:10px}td,th{border:1px solid #8DB7D4;padding:5px;text-align:left;vertical-align:top}th{background:#DCE8F3}.admit+table th{background:#FFF0C8}.emergency+table th{background:#DCEBCF}.meta{color:#526A7B;font-size:10px;margin-top:18px}</style></head><body><h1>KSMC Neurosurgery endorsement sheet</h1><table class="head"><tr><td>Date:</td><td>${escapeHtml(report.reportDate)}</td></tr><tr><td>1st on call</td><td>${escapeHtml(report.onCall.first)}</td></tr><tr><td>2nd on call</td><td>${escapeHtml(report.onCall.second)}</td></tr><tr><td>3rd on call</td><td>${escapeHtml(report.onCall.third)}</td></tr></table><div class="section">Consultations</div><table><thead><tr><th>AM/PM</th><th>MRN</th><th>Age</th><th>Diagnosis</th><th>Consulting specialty</th><th>Plan</th><th>Require F/U?</th></tr></thead><tbody>${consultationRows}</tbody></table><div class="section admit">Admissions</div><table><thead><tr><th>MRN</th><th>Diagnosis</th><th>Elective vs Emergency</th><th>Plan</th><th>Admitting consultant</th></tr></thead><tbody>${admissionRows}</tbody></table><div class="section emergency">Emergency Surgeries</div><table><thead><tr><th>MRN</th><th>Diagnosis</th><th>Surgery</th></tr></thead><tbody>${emergencyRows}</tbody></table><p class="meta">Shift window: ${escapeHtml(new Date(report.shiftStartAt).toLocaleString())} – ${escapeHtml(new Date(report.shiftEndAt).toLocaleString())}. Generated by ${escapeHtml(report.generatedBy)}.</p></body></html>`;
}
