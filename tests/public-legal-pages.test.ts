import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const serverEntry = readFileSync("server/_core/index.ts", "utf8");
const legalPages = readFileSync("server/public-legal-pages.ts", "utf8");
const login = readFileSync("app/login.tsx", "utf8");

describe("public privacy page", () => {
  it("registers a public privacy route without app authentication", () => {
    expect(serverEntry).toContain('registerPublicLegalPages(app)');
    expect(legalPages).toContain('app.get("/privacy"');
    expect(legalPages).not.toContain('app.get("/account-deletion"');
    expect(legalPages).not.toContain("CENTRAL_SUPABASE_SERVICE_ROLE_KEY");
  });

  it("uses the official publicly listed KSMC contact and directs users away from patient details", () => {
    expect(legalPages).toContain('const KSMC_CONTACT_EMAIL = "info@ksmc.med.sa"');
    expect(legalPages).toContain("Do not include patient names");
    expect(legalPages).toContain("لا تضع أسماء مرضى");
    expect(legalPages).toContain("Google Gemini");
  });

  it("links only the public privacy policy from the unauthenticated sign-in screen", () => {
    expect(login).toContain('const PRIVACY_POLICY_URL = "https://neurify.manus.space/privacy"');
    expect(login).toContain("Privacy policy");
    expect(login).not.toContain("ACCOUNT_DELETION_URL");
  });
});
