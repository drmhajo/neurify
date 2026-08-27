import type { DepartmentData } from "./department-model";
import { createOfficialReportHeaderHtml } from "./report-branding";

export type WeekendEndorsementEntry = {
  id: string;
  patientName: string;
  fileNumber: string;
  consultant: string;
  weekendPlan: string;
  teamName: string;
};

export type WeekendEndorsementReport = {
  generatedAt: string;
  generatedBy: string;
  consultantFilter?: string;
  entries: WeekendEndorsementEntry[];
};

export function buildWeekendEndorsementReport(data: DepartmentData, generatedBy: string, consultantFilter?: string): WeekendEndorsementReport {
  return {
    generatedAt: new Date().toISOString(),
    generatedBy,
    consultantFilter,
    entries: data.teams.flatMap((team) => team.cases
      .filter((patient) => patient.status === "منوّم" && (!consultantFilter || team.lead === consultantFilter))
      .map((patient) => ({
        id: patient.id,
        patientName: patient.fullName,
        fileNumber: patient.fileNumber || patient.code,
        consultant: team.lead,
        weekendPlan: patient.weekendPlan?.trim() || "Not documented",
        teamName: team.name,
      }))),
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export function createWeekendEndorsementHtml(report: WeekendEndorsementReport) {
  const rows = report.entries.map((entry, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(entry.patientName)}</td><td>${escapeHtml(entry.fileNumber)}</td><td>${escapeHtml(entry.consultant)}</td><td class="plan">${escapeHtml(entry.weekendPlan).replace(/\n/g, "<br />")}</td></tr>`).join("") || '<tr><td colspan="5" class="empty">No inpatients are recorded.</td></tr>';
  const scope = report.consultantFilter ? `Treating consultant · ${report.consultantFilter}` : "All treating consultants";
  const header = createOfficialReportHeaderHtml({ title: "Weekend Endorsement", subtitle: `${scope} · ${new Date(report.generatedAt).toLocaleString()}` });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:15mm}*{box-sizing:border-box}body{font-family:Arial,"Noto Naskh Arabic",sans-serif;color:#123D63;margin:0;font-size:10px;line-height:1.45}.official-header{display:flex;align-items:center;gap:11px;border-bottom:3px solid #08766D;padding:0 0 12px;margin-bottom:16px}.official-logo{width:60px;height:60px;object-fit:contain}.official-identity{flex:1}.official-hospital{font-size:10px;font-weight:700;color:#08766D;margin:0}.official-department{font-size:15px;line-height:1.28;color:#123D63;margin:3px 0 0}.official-hospital span,.official-department span{display:block;direction:ltr}.official-report{min-width:132px;text-align:right;border-left:1px solid #D8E4EF;padding-left:10px}.official-report strong{display:block;font-size:11px}.official-report span{display:block;color:#5F738A;font-size:9px;margin-top:3px}h1{font-size:16px;margin:0 0 4px}p{margin:0;color:#526A7B}table{border-collapse:collapse;width:100%;margin-top:18px}th,td{border:1px solid #C9DBE8;padding:8px;text-align:left;vertical-align:top}th{background:#E7F0F7;color:#123D63;font-weight:700}.plan{white-space:normal;min-width:250px}.empty{text-align:center;color:#526A7B;padding:18px}.meta{border-top:1px solid #D8E4EF;margin-top:18px;padding-top:8px;font-size:9px}</style></head><body>${header}<h1>Weekend Endorsement</h1><p>Inpatients only · ${escapeHtml(scope)} · ${report.entries.length} patient${report.entries.length === 1 ? "" : "s"}</p><table><thead><tr><th>#</th><th>Patient name</th><th>MRN</th><th>Treating consultant</th><th>Weekend plan</th></tr></thead><tbody>${rows}</tbody></table><p class="meta">Prepared by ${escapeHtml(report.generatedBy)} · ${escapeHtml(new Date(report.generatedAt).toLocaleString())}</p></body></html>`;
}
