import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const source = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("AI medical-report draft workflow", () => {
  it("protects generation behind central-session validation and rate limiting", () => {
    const route = source("server/medical-report-draft.ts");
    expect(route).toContain('app.post("/api/medical-report-draft"');
    expect(route).toContain('action: "data_pull", accountId, dataProof');
    expect(route).toContain("MAX_REQUESTS_PER_MINUTE = 3");
    expect(route).toContain('model: "gpt-5-mini"');
    expect(route).toContain("Do not infer missing facts");
    expect(route).toContain("return res.status(403)");
  });

  it("keeps identifiers and private discussion text out of the client payload", () => {
    const data = source("lib/medical-report-draft-data.ts");
    expect(data).not.toContain("fullName:");
    expect(data).not.toContain("fileNumber:");
    expect(data).not.toContain("messages:");
    expect(data).not.toContain("ward:");
    expect(data).not.toContain("bed:");
  });

  it("requires explicit approval before the reviewed PDF can be exported", () => {
    const action = source("components/medical-report-draft-action.tsx");
    const patientFile = source("components/patient-scheduled-operations.tsx");
    const exporter = source("lib/medical-report-draft-export.ts");
    expect(action).toContain("disabled={!approved}");
    expect(action).toContain("Approve reviewed draft");
    expect(action).toContain("English · Official");
    expect(action).toContain("if (!draft || !approved) return");
    expect(patientFile).toContain("MedicalReportDraftAction patient={patient} session={session}");
    expect(exporter).toContain("AI-assisted from documented file data");
    expect(exporter).toContain("Patient Medical Report");
    expect(exporter).toContain("formal-english");
  });

  it("shows bilingual, non-clinical progress updates while the draft is generated", () => {
    const action = source("components/medical-report-draft-action.tsx");
    expect(action).toContain('type DraftProgressStage = "preparing" | "verifying" | "drafting"');
    expect(action).toContain("Preparing documented data");
    expect(action).toContain("Verifying secure connection");
    expect(action).toContain("No final report is issued automatically.");
    expect(action).toContain("جارٍ تجهيز البيانات الموثقة");
    expect(action).toContain("جارٍ التحقق من الاتصال الآمن");
    expect(action).toContain("لا يتم إصدار تقرير نهائي تلقائيًا.");
    expect(action).toContain('setProgressStage("verifying")');
    expect(action).toContain("styles.progressPanel");
  });

  it("uses a public native API fallback and preserves safe recovery messages", () => {
    const apiBase = source("constants/oauth.ts");
    const api = source("lib/medical-report-draft-api.ts");
    const action = source("components/medical-report-draft-action.tsx");
    expect(apiBase).toContain('const NATIVE_PRODUCTION_API_BASE_URL = "https://neurify.manus.space"');
    expect(apiBase).toContain("return NATIVE_PRODUCTION_API_BASE_URL");
    expect(api).toContain("Unable to contact the medical-report service");
    expect(action).toContain("draftFailureCopy");
    expect(action).toContain("لم يتم تعديل ملف المريض");
  });

  it("shares only an approved, successfully exported PDF through the device share sheet", () => {
    const action = source("components/medical-report-draft-action.tsx");
    const exporter = source("lib/medical-report-draft-export.ts");
    expect(exporter).toContain("export type MedicalReportExportResult");
    expect(exporter).toContain("shareApprovedMedicalReportPdf");
    expect(exporter).toContain("await Sharing.shareAsync(input.uri");
    expect(exporter).not.toContain("mailto:");
    expect(exporter).not.toContain("recipient");
    expect(action).toContain("const [exportedPdf, setExportedPdf]");
    expect(action).toContain("result.status === \"downloaded\" && result.uri");
    expect(action).toContain("if (!approved || !exportedPdf) return");
    expect(action).toContain("approved && exportedPdf ?");
    expect(action).toContain("Share final medical report");
    expect(action).toContain("مشاركة التقرير الطبي النهائي");
    expect(action).toContain("no report is sent automatically");
    expect(action).toContain("ولا يُرسل أي تقرير تلقائيًا");
  });

  it("limits Gemini to server-side linguistic editing of the minimized draft", () => {
    const route = source("server/medical-report-draft.ts");
    const refinement = source("server/gemini-medical-report-refinement.ts");
    const action = source("components/medical-report-draft-action.tsx");
    expect(route).toContain("refineMedicalReportDraftLanguage");
    expect(route).toContain("hasValidDepartmentSession(accountId, dataProof)");
    expect(refinement).toContain("GEMINI_API_KEY");
    expect(refinement).toContain("gemini-3.6-flash");
    expect(refinement).toContain("Improve grammar, spelling, clarity, and professional ordering only");
    expect(refinement).toContain("Do not add, remove, infer, reinterpret, summarize, or change any clinical fact");
    expect(refinement).toContain("Preserve every numeric value exactly");
    expect(refinement).not.toContain("fullName");
    expect(refinement).not.toContain("fileNumber");
    expect(refinement).not.toContain("ward");
    expect(refinement).not.toContain("bed");
    expect(action).toContain("Gemini may improve grammar and structure");
    expect(action).toContain("ولا يغني عن مراجعة الطبيب");
  });
});
