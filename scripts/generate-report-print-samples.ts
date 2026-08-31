import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { DailyShiftReport, OpdOperationWaitingEntry } from "../lib/department-model";
import { createOpdWaitlistHtml, type OpdWaitlistReport } from "../lib/opd-operation-waitlist-export-data";
import type { ReportPrintAssets } from "../lib/report-print-styles";
import { createMonthlyDashboardHtml } from "../lib/shift-report-dashboard-export";
import type { MonthlyShiftReportAnalytics } from "../lib/shift-report-analytics";
import { createShiftReportHtml } from "../lib/shift-endorsement";
import { createWeekendEndorsementHtml, type WeekendEndorsementReport } from "../lib/weekend-endorsement";

const root = process.cwd();
const output = path.join("/home/ubuntu", "neurify-report-print-samples", "html");

async function dataUri(relativePath: string, mimeType: string) {
  const content = await readFile(path.join(root, relativePath));
  return `data:${mimeType};base64,${content.toString("base64")}`;
}

async function loadPrintAssets(): Promise<ReportPrintAssets> {
  const [logoSrc, cairoRegular, cairoSemiBold, cairoBold] = await Promise.all([
    dataUri("assets/images/neurosurgery-department-logo.png", "image/png"),
    dataUri("assets/fonts/Cairo-Regular.ttf", "font/ttf"),
    dataUri("assets/fonts/Cairo-SemiBold.ttf", "font/ttf"),
    dataUri("assets/fonts/Cairo-Bold.ttf", "font/ttf"),
  ]);
  return {
    logoSrc,
    fontCss: `@font-face{font-family:'Neurify Cairo';src:url('${cairoRegular}') format('truetype');font-weight:400}@font-face{font-family:'Neurify Cairo';src:url('${cairoSemiBold}') format('truetype');font-weight:600}@font-face{font-family:'Neurify Cairo';src:url('${cairoBold}') format('truetype');font-weight:700}`,
  };
}

const dailyShift: DailyShiftReport = {
  id: "sample-shift-2026-09-01",
  reportDate: "2026-09-01",
  shiftStartAt: "2026-09-01T04:30:00.000Z",
  shiftEndAt: "2026-09-02T04:30:00.000Z",
  generatedAt: "2026-09-02T04:35:00.000Z",
  generatedBy: "Demo Department Staff",
  onCall: { first: "Demo Resident", second: "Demo Specialist", third: "Demo Consultant" },
  consultations: [{ id: "sample-consult-1", period: "AM", mrn: "SAMPLE-001", age: "48 Y", diagnosis: "Illustrative intracranial lesion", consultingSpecialty: "Emergency Department", plan: "Illustrative observation plan", requiresFollowUp: true }],
  admissions: [{ id: "sample-admission-1", mrn: "SAMPLE-002", diagnosis: "Illustrative spinal condition", admissionType: "Emergency", plan: "Illustrative admission plan", admittingConsultant: "Demo Consultant" }],
  emergencySurgeries: [{ id: "sample-surgery-1", mrn: "SAMPLE-003", diagnosis: "Illustrative acute condition", surgery: "Illustrative procedure" }],
  statistics: { consultations: 1, requiringFollowUp: 1, admissions: 1, emergencySurgeries: 1 },
};

const analytics: MonthlyShiftReportAnalytics = {
  month: "2026-08", reportCount: 4, consultations: 16, admissions: 7, emergencySurgeries: 3, requiringFollowUp: 8, totalCases: 26,
  daily: [
    { date: "2026-08-03", consultations: 4, admissions: 2, emergencySurgeries: 1, totalCases: 7 },
    { date: "2026-08-10", consultations: 5, admissions: 2, emergencySurgeries: 1, totalCases: 8 },
    { date: "2026-08-17", consultations: 3, admissions: 1, emergencySurgeries: 0, totalCases: 4 },
    { date: "2026-08-24", consultations: 4, admissions: 2, emergencySurgeries: 1, totalCases: 7 },
  ],
};

const weekend: WeekendEndorsementReport = {
  generatedAt: "2026-09-02T04:35:00.000Z", generatedBy: "فريق القسم التجريبي", consultantFilter: "استشاري تجريبي", wardFilter: "200A",
  entries: [
    { id: "sample-weekend-1", teamId: "sample-team", patientName: "مريض تجريبي أ", fileNumber: "SAMPLE-101", consultant: "استشاري تجريبي", ward: "200A", bed: "12", diagnosis: "تشخيص توضيحي", weekendPlan: "خطة توضيحية للمتابعة خلال عطلة نهاية الأسبوع.", teamName: "فريق تجريبي" },
    { id: "sample-weekend-2", teamId: "sample-team", patientName: "مريض تجريبي ب", fileNumber: "SAMPLE-102", consultant: "استشاري تجريبي", ward: "200A", bed: "15", diagnosis: "تشخيص توضيحي ثانٍ", weekendPlan: "متابعة سريرية توضيحية مع مراجعة صباحية.", teamName: "فريق تجريبي" },
  ],
};

const opdEntries: OpdOperationWaitingEntry[] = [
  { id: "sample-opd-1", patientName: "Demo Patient A", fileNumber: "SAMPLE-201", diagnosis: "Illustrative diagnosis", procedure: "Illustrative procedure", requestedBy: "Demo Clinician", plannedDate: "2026-09-05", priority: "عاجل", status: "بانتظار مراجعة", notes: "Illustrative priority request.", createdAt: "2026-09-01T08:00:00.000Z", updatedAt: "2026-09-01T08:00:00.000Z", updatedBy: "Demo Clinician" },
  { id: "sample-opd-2", patientName: "Demo Patient B", fileNumber: "SAMPLE-202", diagnosis: "Illustrative follow-up diagnosis", procedure: "Illustrative elective procedure", requestedBy: "Demo Clinician", plannedDate: "2026-09-10", priority: "قريب", status: "معتمد", notes: "Illustrative approved request.", createdAt: "2026-09-01T08:30:00.000Z", updatedAt: "2026-09-01T08:30:00.000Z", updatedBy: "Demo Clinician" },
];

const opd: OpdWaitlistReport = { entries: opdEntries, generatedAt: "2026-09-02T04:35:00.000Z", generatedBy: "Demo Operations Supervisor" };

async function main() {
  const assets = await loadPrintAssets();
  await mkdir(output, { recursive: true });
  await Promise.all([
    writeFile(path.join(output, "01-oncall-endorsement-en.html"), createShiftReportHtml(dailyShift, assets)),
    writeFile(path.join(output, "02-monthly-dashboard-ar.html"), createMonthlyDashboardHtml(analytics, "ar", assets)),
    writeFile(path.join(output, "03-weekend-endorsement-ar.html"), createWeekendEndorsementHtml(weekend, "ar", assets)),
    writeFile(path.join(output, "04-opd-waiting-list-en.html"), createOpdWaitlistHtml(opd, "en", assets)),
  ]);
  console.log(output);
}

void main();
