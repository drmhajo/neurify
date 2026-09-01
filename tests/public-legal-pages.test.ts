import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const serverEntry = readFileSync("server/_core/index.ts", "utf8");
const legalPages = readFileSync("server/public-legal-pages.ts", "utf8");
const login = readFileSync("app/login.tsx", "utf8");

describe("public legal pages", () => {
  it("registers public privacy and account-deletion routes without app authentication", () => {
    expect(serverEntry).toContain('registerPublicLegalPages(app)');
    expect(legalPages).toContain('app.get("/privacy"');
    expect(legalPages).toContain('app.get("/account-deletion"');
    expect(legalPages).not.toContain("CENTRAL_SUPABASE_SERVICE_ROLE_KEY");
  });

  it("uses the official publicly listed KSMC contact and directs users away from patient details", () => {
    expect(legalPages).toContain('const KSMC_CONTACT_EMAIL = "info@ksmc.med.sa"');
    expect(legalPages).toContain("Do not send patient information");
    expect(legalPages).toContain("لا ترسل بيانات مرضى");
    expect(legalPages).toContain("Google Gemini");
  });

  it("links policy and account deletion from the unauthenticated sign-in screen", () => {
    expect(login).toContain('const PRIVACY_POLICY_URL = "https://neurify.manus.space/privacy"');
    expect(login).toContain('const ACCOUNT_DELETION_URL = "https://neurify.manus.space/account-deletion"');
    expect(login).toContain("Privacy policy");
    expect(login).toContain("حذف الحساب");
  });
});
