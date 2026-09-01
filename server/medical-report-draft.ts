import type { Express } from "express";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { refineMedicalReportDraftLanguage } from "./gemini-medical-report-refinement";
import {
  MEDICAL_REPORT_SECTION_KEYS,
  type MedicalReportDraft,
  type MedicalReportDraftResponse,
  undocumentedClinicalText,
} from "../shared/medical-report-draft";

const MAX_REQUESTS_PER_MINUTE = 3;
const requestWindows = new Map<string, number[]>();

const requestSchema = z.object({
  accountId: z.string().trim().min(8).max(128),
  dataProof: z.string().trim().min(16).max(512),
  language: z.enum(["ar", "en"]),
  clinicalData: z.object({
    age: z.number().int().min(0).max(130).nullable(),
    status: z.string().trim().max(80),
    medicalHistory: z.string().trim().max(5000),
    clinicalTests: z.string().trim().max(5000),
    diagnosis: z.string().trim().max(1800),
    clinicalDecision: z.string().trim().max(2500),
    surgeryType: z.string().trim().max(500),
    weekendPlan: z.string().trim().max(3500),
    imaging: z.array(z.object({ studyName: z.string().trim().max(240), modality: z.string().trim().max(120), date: z.string().trim().max(80) })).max(30),
  }),
});

const draftSchema = {
  name: "medical_report_draft",
  strict: true,
  schema: {
    type: "object",
    properties: Object.fromEntries(MEDICAL_REPORT_SECTION_KEYS.map((key) => [key, { type: "string" }])),
    required: [...MEDICAL_REPORT_SECTION_KEYS],
    additionalProperties: false,
  },
};

function centralRegistrationUrl() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  return url ? `${url}/functions/v1/central-registration` : "";
}

async function hasValidDepartmentSession(accountId: string, dataProof: string) {
  const url = centralRegistrationUrl();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return false;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    body: JSON.stringify({ action: "data_pull", accountId, dataProof }),
  });
  if (!response.ok) return false;
  const result = await response.json().catch(() => null) as { ok?: boolean } | null;
  return result?.ok === true;
}

function withinRateLimit(accountId: string) {
  const now = Date.now();
  const active = (requestWindows.get(accountId) ?? []).filter((time) => now - time < 60_000);
  if (active.length >= MAX_REQUESTS_PER_MINUTE) return false;
  active.push(now);
  requestWindows.set(accountId, active);
  return true;
}

function contentText(content: string | Array<{ type: string; text?: string }>) {
  return typeof content === "string"
    ? content
    : content.filter((part): part is { type: "text"; text: string } => part.type === "text" && typeof part.text === "string").map((part) => part.text).join("");
}

function normalizeDraft(input: unknown, language: "ar" | "en"): MedicalReportDraft {
  const fallback = undocumentedClinicalText(language);
  const source = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return Object.fromEntries(MEDICAL_REPORT_SECTION_KEYS.map((key) => {
    const value = typeof source[key] === "string" ? source[key].trim().replace(/\s+/g, " ").slice(0, 2800) : "";
    return [key, value || fallback];
  })) as MedicalReportDraft;
}

const clinicalDraftSystemPrompt = `You are a clinical documentation assistant. Produce a neutral medical-report DRAFT, never a final clinical report. Use only the structured source data supplied in the user message. Do not infer missing facts, do not create symptoms, examination findings, medicines, dates, diagnoses, treatments, risks, prognosis, follow-up plans, or recommendations. For every missing requested section write exactly the supplied local-language undocumented statement. Assessment and Diagnosis may only restate the supplied diagnosis and explicitly documented clinical findings. Treatment Plan and Prognosis and Follow-up may only restate the documented clinical decision, surgery type, or weekend plan. Do not mention AI, do not include patient identifiers, do not use markdown, and return only the requested JSON object.`;

export function registerMedicalReportDraftRoute(app: Express) {
  app.post("/api/medical-report-draft", async (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid medical-report draft request." });
    const { accountId, dataProof, language, clinicalData } = parsed.data;
    if (!withinRateLimit(accountId)) return res.status(429).json({ error: "Please wait before requesting another draft." });

    try {
      const authorized = await hasValidDepartmentSession(accountId, dataProof);
      if (!authorized) return res.status(403).json({ error: "An approved department session is required." });

      const response = await invokeLLM({
        model: "gpt-5-mini",
        maxTokens: 1800,
        outputSchema: draftSchema,
        messages: [
          { role: "system", content: clinicalDraftSystemPrompt },
          { role: "user", content: JSON.stringify({ language, undocumentedStatement: undocumentedClinicalText(language), clinicalData }) },
        ],
      });
      const raw = contentText(response.choices[0]?.message.content ?? "");
      const sourceDraft = normalizeDraft(JSON.parse(raw), language);
      const linguisticEdit = await refineMedicalReportDraftLanguage({ draft: sourceDraft, language });
      const payload: MedicalReportDraftResponse = {
        draft: linguisticEdit.draft,
        linguisticEditing: linguisticEdit.applied ? "gemini" : "unavailable",
        reviewNotice: linguisticEdit.applied
          ? (language === "en" ? "Gemini completed linguistic editing of the minimized draft only. Verify every section against the patient file, then edit and approve it before use." : "أكمل Gemini التحرير اللغوي للمسودة المصغرة فقط. راجع كل قسم مقابل ملف المريض، ثم عدّله واعتمده قبل الاستخدام.")
          : (language === "en" ? "AI-assisted draft based only on documented file data. Gemini linguistic editing was unavailable; verify every section against the patient file, then edit and approve it before use." : "هذه مسودة مساعدة بالذكاء الاصطناعي تعتمد فقط على البيانات الموثقة في الملف. تعذر التحرير اللغوي عبر Gemini؛ راجع كل قسم مقابل ملف المريض، ثم عدّله واعتمده قبل الاستخدام."),
      };
      return res.json(payload);
    } catch {
      return res.status(502).json({ error: "The medical-report drafting service is temporarily unavailable." });
    }
  });
}
