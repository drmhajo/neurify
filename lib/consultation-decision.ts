export type ConsultationDecisionInput = {
  clinicalDecision: string;
  surgicalIntervention: boolean;
  surgeryType: string;
};

export type ConsultationDecisionError = "missing_decision" | "missing_surgery_type" | null;

export function validateConsultationDecision(input: ConsultationDecisionInput): ConsultationDecisionError {
  if (!input.clinicalDecision.trim()) return "missing_decision";
  if (input.surgicalIntervention && !input.surgeryType.trim()) return "missing_surgery_type";
  return null;
}
