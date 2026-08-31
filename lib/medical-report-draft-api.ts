import { getApiBaseUrl } from "@/constants/oauth";
import type { PatientCase } from "@/lib/department-model";
import type { DepartmentSession } from "@/lib/department-session";
import type { MedicalReportDraftResponse } from "@/shared/medical-report-draft";
import { toMedicalReportClinicalData } from "./medical-report-draft-data";

export { toMedicalReportClinicalData } from "./medical-report-draft-data";

export async function requestMedicalReportDraft(input: { patient: PatientCase; session: DepartmentSession | null; language: "ar" | "en" }): Promise<MedicalReportDraftResponse> {
  const accountId = input.session?.userId.replace(/^remote-/, "") ?? "";
  const dataProof = input.session?.dataProof ?? "";
  const apiBaseUrl = getApiBaseUrl();
  if (!accountId || !input.session?.userId.startsWith("remote-") || !dataProof || !apiBaseUrl) throw new Error("A secure approved department connection is required.");

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/medical-report-draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, dataProof, language: input.language, clinicalData: toMedicalReportClinicalData(input.patient) }),
    });
  } catch {
    throw new Error("Unable to contact the medical-report service. Check the network connection and try again.");
  }
  const body = await response.json().catch(() => null) as (MedicalReportDraftResponse & { error?: string }) | null;
  if (!response.ok || !body?.draft) throw new Error(body?.error || "Medical-report draft generation is unavailable.");
  return body;
}
