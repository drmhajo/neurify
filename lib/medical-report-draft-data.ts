import type { PatientCase } from "./department-model";
import type { MedicalReportClinicalData } from "../shared/medical-report-draft";

function trimField(value: string | undefined, maximum: number) { return (value ?? "").trim().slice(0, maximum); }

/** Builds the minimum documented clinical payload sent to the protected drafting service. */
export function toMedicalReportClinicalData(patient: PatientCase): MedicalReportClinicalData {
  return {
    age: patient.age ?? null,
    status: patient.status ?? "",
    medicalHistory: trimField(patient.medicalHistory, 5000),
    clinicalTests: trimField(patient.clinicalTests, 5000),
    diagnosis: trimField(patient.diagnosis, 1800),
    clinicalDecision: trimField(patient.clinicalDecision, 2500),
    surgeryType: trimField(patient.surgeryType, 500),
    weekendPlan: trimField(patient.weekendPlan, 3500),
    imaging: (patient.imaging ?? []).slice(0, 30).map((item) => ({ studyName: trimField(item.studyName, 240), modality: trimField(item.modality, 120), date: trimField(item.date, 80) })),
  };
}
