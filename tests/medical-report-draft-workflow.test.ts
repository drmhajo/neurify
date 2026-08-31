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
});
