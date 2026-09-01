import { MEDICAL_REPORT_SECTION_KEYS, type MedicalReportDraft, undocumentedClinicalText } from "../shared/medical-report-draft";

const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_GENERATE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

function acceptsRefinement(source: MedicalReportDraft, candidate: MedicalReportDraft, language: "ar" | "en") {
  const fallback = undocumentedClinicalText(language);
  const originalNumbers: string[] = numberTokens(MEDICAL_REPORT_SECTION_KEYS.map((key) => source[key]).join(" "));
  const candidateNumbers = numberTokens(MEDICAL_REPORT_SECTION_KEYS.map((key) => candidate[key]).join(" "));
  if (candidateNumbers.some((value) => !originalNumbers.includes(value))) return false;
  return MEDICAL_REPORT_SECTION_KEYS.every((key) => source[key] !== fallback || candidate[key] === fallback);
}

function normalizeRefinement(source: MedicalReportDraft, raw: unknown, language: "ar" | "en") {
  const values = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const candidate = Object.fromEntries(MEDICAL_REPORT_SECTION_KEYS.map((key) => {
    const value = typeof values[key] === "string" ? values[key].trim().replace(/\s+/g, " ").slice(0, 2800) : "";
    return [key, value || source[key]];
  })) as MedicalReportDraft;
  return acceptsRefinement(source, candidate, language) ? candidate : source;
}

const LINGUISTIC_EDITING_INSTRUCTION = `You are a linguistic editor for a clinician-reviewed medical report draft. Return only one JSON object with exactly the supplied section keys. Improve grammar, spelling, clarity, and professional ordering only. Do not add, remove, infer, reinterpret, summarize, or change any clinical fact. Do not add symptoms, examination findings, medicines, dates, diagnoses, treatments, risks, prognosis, follow-up plans, recommendations, patient identifiers, or markdown. Preserve every numeric value exactly. Preserve the exact supplied undocumented statement wherever it appears. The clinician must review and approve the result before use.`;

export async function refineMedicalReportDraftLanguage(input: { draft: MedicalReportDraft; language: "ar" | "en" }): Promise<{ draft: MedicalReportDraft; applied: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return { draft: input.draft, applied: false };
  try {
    const response = await fetch(GEMINI_GENERATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: LINGUISTIC_EDITING_INSTRUCTION }] }, contents: [{ role: "user", parts: [{ text: JSON.stringify({ language: input.language, undocumentedStatement: undocumentedClinicalText(input.language), draft: input.draft }) }] }], generationConfig: { temperature: 0, responseMimeType: "application/json" } }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return { draft: input.draft, applied: false };
    const draft = normalizeRefinement(input.draft, parseJsonObject(extractGeminiText(await response.json())), input.language);
    return { draft, applied: draft !== input.draft };
  } catch { return { draft: input.draft, applied: false }; }
}
