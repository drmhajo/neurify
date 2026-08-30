import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(import.meta.dirname, "../supabase/functions/central-registration/index.ts"),
  "utf8",
);

describe("رسالة ترحيب المستخدم الجديد", () => {
  it("تُرسل عبر وسيط Gmail بعد إنشاء طلب التسجيل وتحمل هوية القسم", () => {
    expect(source).toContain("function welcomeEmailContent(name: string)");
    expect(source).toContain("Welcome to Neurify");
    expect(source).toContain("مرحبًا بك في Neurify");
    expect(source).toContain("OFFICIAL_DEPARTMENT_LOGO_URL");
    expect(source).toContain('action: "account_welcome"');
    expect(source).toContain("await sendRegistrationWelcomeEmail(email, name)");
  });

  it("يبقي التسجيل قائمًا حتى لو تعذر إرسال رسالة الترحيب", () => {
    expect(source).toContain("Registration welcome email unavailable");
    expect(source).toContain("return json({ accepted: true, id: rows[0].id });");
  });
});
