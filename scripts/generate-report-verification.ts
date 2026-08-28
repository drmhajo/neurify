import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInitialDepartmentData } from "../lib/department-model";
import { buildDailyShiftReport, createShiftReportHtml } from "../lib/shift-endorsement";
import { buildWeekendEndorsementReport, createWeekendEndorsementHtml } from "../lib/weekend-endorsement";

const outputDirectory = join(process.cwd(), "report-review");
const verificationTimestamp = new Date("2026-08-25T10:00:00+03:00");
const data = createInitialDepartmentData();
const templatePatient = data.teams[0].cases[0];
const templateConsultation = data.teams[0].consultations[0];

const verificationPatient = {
  ...templatePatient,
  id: "verification-patient",
  code: "TEST-0001",
  fileNumber: "TEST-0001",
  fullName: "Verification record — no patient data",
  age: null,
  ward: "Ward Test",
  bed: "Bed 01",
  diagnosis: "Verification diagnosis only",
  medicalHistory: "Verification-only content; no clinical information.",
  clinicalTests: "Verification-only content; no clinical information.",
  weekendPlan: "Verification plan: review the Ward, Bed, and Diagnosis columns.",
  admittedSince: "Verification only",
  admittedAt: "2026-08-25T08:00:00.000+03:00",
  status: "منوّم" as const,
};

data.surgeries = [];
data.teams = data.teams.map((team, index) => index === 0 ? {
  ...team,
  cases: [verificationPatient],
  consultations: [{
    ...templateConsultation,
    id: "verification-consultation",
    title: "Verification consultation",
    subject: "Verification-only report content.",
    createdBy: "Verification user",
    time: "08:00",
    createdAt: "2026-08-25T08:00:00.000+03:00",
    patient: {
      code: verificationPatient.code,
      fileNumber: verificationPatient.fileNumber,
      fullName: verificationPatient.fullName,
      age: verificationPatient.age,
      medicalHistory: verificationPatient.medicalHistory,
      clinicalTests: verificationPatient.clinicalTests,
      diagnosis: verificationPatient.diagnosis,
      clinicalDecision: "Verification only",
      surgeryType: "Verification emergency procedure",
    },
    disposition: "admit" as const,
  }],
} : { ...team, cases: [], consultations: [] });

const weekendReport = buildWeekendEndorsementReport(data, "Verification user");
const shiftReport = buildDailyShiftReport(data, "Verification user", verificationTimestamp);

if (weekendReport.entries[0]?.ward !== "Ward Test" || weekendReport.entries[0]?.bed !== "Bed 01" || weekendReport.entries[0]?.diagnosis !== "Verification diagnosis only") {
  throw new Error("Weekend Endorsement verification fields are missing.");
}
if (!shiftReport.emergencySurgeries.some((entry) => entry.surgery === "Verification emergency procedure")) {
  throw new Error("Emergency Surgeries verification entry is missing.");
}

mkdirSync(outputDirectory, { recursive: true });
writeFileSync(join(outputDirectory, "weekend-endorsement-verification.html"), createWeekendEndorsementHtml(weekendReport));
writeFileSync(join(outputDirectory, "daily-shift-report-verification.html"), createShiftReportHtml(shiftReport));
writeFileSync(join(outputDirectory, "daily-shift-report-verification.json"), JSON.stringify(shiftReport, null, 2));
