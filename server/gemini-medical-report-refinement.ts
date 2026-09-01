import {
  MEDICAL_REPORT_SECTION_KEYS,
  type MedicalReportClinicalData,
  type MedicalReportDraft,
  undocumentedClinicalText,
} from "../shared/medical-report-draft";

const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_GENERATE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const DIRECT_DRAFT_INSTRUCTION = `You are a clinical documentation assistant preparing a clinician-reviewed medical-report DRAFT. Return only one JSON object with exactly these keys: chiefComplaint, historyOfPresentIllness, pastMedicalHistory, medications, physicalExaminationFindings, assessmentAndDiagnosis, treatmentPlan, prognosisAndFollowUp. Use only facts explicitly documented in the supplied clinicalData object. Do not add, remove, infer, reinterpret, summarize beyond clear linguistic organization, or change any clinical fact. Do not create symptoms, examination findings, medicines, dates, diagnoses, treatments, risks, prognosis, follow-up plans, recommendations, patient identifiers, or markdown. Preserve every numeric value exactly. If a requested section is not explicitly documented, write exactly the supplied undocumented statement. The treating clinician must review, edit, and explicitly approve the draft before it is used, exported, or shared.`;

function extractGeminiText(body: unknown) {
  const source = body && typeof body === "object" ? body as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> } : null;
  return source?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
}

function parseJsonObject(value: string) {
  try { return JSON.parse(value) as unknown; } catch {
    const match = value.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) as unknown : null;
  }
}

function numberTokens(value: string): string[] { return value.match(/\d+(?:[.,]\d+)?/g) ?? []; }

function normalizedDraft(raw: unknown, language: "ar" | "en"): MedicalReportDraft {
  const fallback = undocumentedClinicalText(language);
  const values = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  return Object.fromEntries(MEDICAL_REPORT_SECTION_KEYS.map((key) => {
    const value = typeof values[key] === "string" ? values[key].trim().replace(/\s+/g, " ").slice(0, 2800) : "";
    return [key, value || fallback];
  })) as MedicalReportDraft;
}

function preservesDocumentedNumbers(clinicalData: MedicalReportClinicalData, draft: MedicalReportDraft) {
  const documentedNumbers = new Set<string>(numberTokens(JSON.stringify(clinicalData)));
  const draftNumbers = numberTokens(MEDICAL_REPORT_SECTION_KEYS.map((key) => draft[key]).join(" "));
  return draftNumbers.every((value) => documentedNumbers.has(value));
}

export async function generateMedicalReportDraftWithGemini(input: { clinicalData: MedicalReportClinicalData; language: "ar" | "en" }): Promise<{ draft: MedicalReportDraft; available: boolean; accepted: boolean }> {
  const fallbackDraft = normalizedDraft(null, input.language);
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return { draft: fallbackDraft, available: false, accepted: false };

  try {
    const response = await fetch(GEMINI_GENERATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: DIRECT_DRAFT_INSTRUCTION }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify({ language: input.language, undocumentedStatement: undocumentedClinicalText(input.language), clinicalData: input.clinicalData }) }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return { draft: fallbackDraft, available: false, accepted: false };
    const draft = normalizedDraft(parseJsonObject(extractGeminiText(await response.json())), input.language);
    return { draft, available: true, accepted: preservesDocumentedNumbers(input.clinicalData, draft) };
  } catch { return { draft: fallbackDraft, available: false, accepted: false }; }
}
