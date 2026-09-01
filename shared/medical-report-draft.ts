export const MEDICAL_REPORT_SECTION_KEYS = [
  "chiefComplaint",
  "historyOfPresentIllness",
  "pastMedicalHistory",
  "medications",
  "physicalExaminationFindings",
  "assessmentAndDiagnosis",
  "treatmentPlan",
  "prognosisAndFollowUp",
] as const;

export type MedicalReportSectionKey = (typeof MEDICAL_REPORT_SECTION_KEYS)[number];

export type MedicalReportDraft = Record<MedicalReportSectionKey, string>;

export type MedicalReportClinicalData = {
  age: number | null;
  status: string;
  medicalHistory: string;
  clinicalTests: string;
  diagnosis: string;
  clinicalDecision: string;
  surgeryType: string;
  weekendPlan: string;
  imaging: Array<{ studyName: string; modality: string; date: string }>;
};

export type MedicalReportDraftRequest = {
  accountId: string;
  dataProof: string;
  language: "ar" | "en";
  clinicalData: MedicalReportClinicalData;
};

export type MedicalReportDraftResponse = {
  draft: MedicalReportDraft;
  reviewNotice: string;
  generationEngine: "gemini";
};

export function medicalReportSectionLabels(language: "ar" | "en"): Record<MedicalReportSectionKey, string> {
  if (language === "en") {
    return {
      chiefComplaint: "Chief Complaint",
      historyOfPresentIllness: "History of Present Illness",
      pastMedicalHistory: "Past Medical History",
      medications: "Medications",
      physicalExaminationFindings: "Physical Examination Findings",
      assessmentAndDiagnosis: "Assessment and Diagnosis",
      treatmentPlan: "Treatment Plan",
      prognosisAndFollowUp: "Prognosis and Follow-up",
    };
  }

  return {
    chiefComplaint: "الشكوى الرئيسية",
    historyOfPresentIllness: "تاريخ المرض الحالي",
    pastMedicalHistory: "التاريخ المرضي السابق",
    medications: "الأدوية",
    physicalExaminationFindings: "نتائج الفحص السريري",
    assessmentAndDiagnosis: "التقييم والتشخيص",
    treatmentPlan: "خطة العلاج",
    prognosisAndFollowUp: "الإنذار والمتابعة",
  };
}

export function undocumentedClinicalText(language: "ar" | "en") {
  return language === "en" ? "Not documented in this patient file." : "غير موثّق في ملف المريض الحالي.";
}
