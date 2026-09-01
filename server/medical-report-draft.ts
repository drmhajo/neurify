import type { Express } from "express";
import { z } from "zod";
import { generateMedicalReportDraftWithGemini } from "./gemini-medical-report-refinement";
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

export function registerMedicalReportDraftRoute(app: Express) {
  app.post("/api/medical-report-draft", async (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid medical-report draft request." });
    const { accountId, dataProof, language, clinicalData } = parsed.data;
    if (!withinRateLimit(accountId)) return res.status(429).json({ error: "Please wait before requesting another draft." });

    try {
      const authorized = await hasValidDepartmentSession(accountId, dataProof);
      if (!authorized) return res.status(403).json({ error: "An approved department session is required." });

      const generated = await generateMedicalReportDraftWithGemini({ clinicalData, language });
      if (!generated.available || !generated.accepted) return res.status(502).json({ error: "The medical-report drafting service is temporarily unavailable." });
      const payload: MedicalReportDraftResponse = {
        draft: generated.draft,
        generationEngine: "gemini",
        reviewNotice: language === "en"
          ? "Gemini prepared this draft from minimized documented patient-file data only. Verify every section against the patient file, then edit and approve it before use."
          : "أعد Gemini هذه المسودة من بيانات ملف المريض الموثقة والمصغرة فقط. راجع كل قسم مقابل ملف المريض، ثم عدّله واعتمده قبل الاستخدام.",
      };
      return res.json(payload);
    } catch {
      return res.status(502).json({ error: "The medical-report drafting service is temporarily unavailable." });
    }
  });
}
