import { describe, expect, it } from "vitest";
import { refineMedicalReportDraftLanguage } from "../server/gemini-medical-report-refinement";
import { MEDICAL_REPORT_SECTION_KEYS, undocumentedClinicalText, type MedicalReportDraft } from "../shared/medical-report-draft";

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

  it("returns a structured de-identified draft for linguistic editing", async () => {
    const fallback = undocumentedClinicalText("en");
    const draft = Object.fromEntries(MEDICAL_REPORT_SECTION_KEYS.map((key) => [key, fallback])) as MedicalReportDraft;
    const result = await refineMedicalReportDraftLanguage({ draft, language: "en" });

    expect(result.applied).toBe(true);
    expect(result.draft).toEqual(draft);
  }, 30_000);
});
