import { describe, expect, it } from "vitest";
import type { PatientCase } from "../lib/department-model";
import { toMedicalReportClinicalData } from "../lib/medical-report-draft-data";
import { MEDICAL_REPORT_SECTION_KEYS, medicalReportSectionLabels, undocumentedClinicalText } from "../shared/medical-report-draft";

const patient = {
  id: "case-demo",
  code: "KSMC-001234",
  fileNumber: "KSMC-001234",
  fullName: "De-identified example name",
  age: 44,
  medicalHistory: "Documented hypertension.",
  clinicalTests: "Documented examination finding.",
  diagnosis: "Documented diagnosis.",
  clinicalDecision: "Documented decision.",
  surgeryType: "Documented procedure.",
  weekendPlan: "Documented follow-up note.",
  ward: "200A",
  bed: "B-12",
  status: "منوّم" as const,
  admittedSince: "Today",
  admittedAt: "2026-08-31",
  imaging: [{ id: "img-1", studyName: "MRI brain", modality: "MRI", date: "2026-08-30", fileName: "private.pdf", mimeType: "application/pdf", localUri: "file://private.pdf", addedBy: "Clinician" }],
  messages: [{ id: "message-1", senderName: "Clinician", text: "Private discussion", sentAt: "10:30" }],
} as PatientCase;

describe("AI medical-report draft safety boundaries", () => {
  it("uses only the minimized documented clinical fields and excludes direct identifiers", () => {
    const clinicalData = toMedicalReportClinicalData(patient);
    const serialized = JSON.stringify(clinicalData);

    expect(clinicalData).toMatchObject({ age: 44, diagnosis: "Documented diagnosis.", medicalHistory: "Documented hypertension.", clinicalDecision: "Documented decision.", surgeryType: "Documented procedure.", weekendPlan: "Documented follow-up note." });
    expect(clinicalData.imaging).toEqual([{ studyName: "MRI brain", modality: "MRI", date: "2026-08-30" }]);
    expect(serialized).not.toContain(patient.fullName);
    expect(serialized).not.toContain(patient.fileNumber);
    expect(serialized).not.toContain(patient.ward!);
    expect(serialized).not.toContain(patient.bed!);
    expect(serialized).not.toContain("Private discussion");
    expect(serialized).not.toContain("private.pdf");
  });

  it("provides every requested clinical-report section in English and Arabic", () => {
    const english = medicalReportSectionLabels("en");
    const arabic = medicalReportSectionLabels("ar");
    expect(MEDICAL_REPORT_SECTION_KEYS).toHaveLength(8);
    expect(english.chiefComplaint).toBe("Chief Complaint");
    expect(english.prognosisAndFollowUp).toBe("Prognosis and Follow-up");
    expect(arabic.chiefComplaint).toBe("الشكوى الرئيسية");
    expect(arabic.prognosisAndFollowUp).toBe("الإنذار والمتابعة");
  });

  it("uses an explicit undocumented statement rather than silently filling missing data", () => {
    expect(undocumentedClinicalText("en")).toBe("Not documented in this patient file.");
    expect(undocumentedClinicalText("ar")).toBe("غير موثّق في ملف المريض الحالي.");
  });
});
