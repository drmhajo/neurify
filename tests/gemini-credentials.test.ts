import { describe, expect, it } from "vitest";
import { generateMedicalReportDraftWithGemini } from "../server/gemini-medical-report-refinement";
import { MEDICAL_REPORT_SECTION_KEYS, type MedicalReportClinicalData } from "../shared/medical-report-draft";

describe("Google Gemini server credential", () => {
  it("can read the model catalog without sending clinical content", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeTruthy();
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": apiKey! },
      signal: AbortSignal.timeout(10_000),
    });
    expect(response.ok).toBe(true);
  }, 15_000);

  it("creates a structured template draft from empty, de-identified source data", async () => {
    const clinicalData: MedicalReportClinicalData = { age: null, status: "", medicalHistory: "", clinicalTests: "", diagnosis: "", clinicalDecision: "", surgeryType: "", weekendPlan: "", imaging: [] };
    const result = await generateMedicalReportDraftWithGemini({ clinicalData, language: "en" });
    expect(result.available).toBe(true);
    expect(result.accepted).toBe(true);
    expect(Object.keys(result.draft)).toEqual([...MEDICAL_REPORT_SECTION_KEYS]);
  }, 30_000);
});
