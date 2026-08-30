import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const source = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

describe("استعادة كلمة المرور المركزية عبر البريد", () => {
  it("يعرض مسار نسيت كلمة المرور وطلب الرمز وتأكيده بالعربية والإنجليزية", () => {
    const login = source("app/login.tsx");
    const store = source("lib/department-store.tsx");
    const api = source("lib/central-registration-api.ts");

    expect(login).toContain('"Forgot password?"');
    expect(login).toContain('"نسيت كلمة المرور؟"');
    expect(login).toContain("handleRecoveryRequest");
    expect(login).toContain("handleRecoveryConfirm");
    expect(store).toContain("requestPasswordRecovery");
    expect(store).toContain("confirmPasswordRecovery");
    expect(api).toContain('"password_reset_request"');
    expect(api).toContain('"password_reset_confirm"');
  });

  it("يحفظ رموز الاستعادة مشفرة ومحدودة الصلاحية ولا يكشف وجود الحساب", () => {
    const functionSource = source("supabase/functions/central-registration/index.ts");
    const schema = source("supabase/central_registration.sql");

    expect(functionSource).toContain("GMAIL_RELAY_URL");
    expect(functionSource).toContain("GMAIL_RELAY_TOKEN");
    expect(functionSource).toContain('action: "password_recovery"');
    expect(functionSource).toContain("OFFICIAL_DEPARTMENT_LOGO_URL");
    expect(functionSource).toContain("Neurify");
    expect(functionSource).toContain('action: "account_welcome"');
    expect(functionSource).toContain("sendRegistrationWelcomeEmail(email, name)");
    expect(functionSource).toContain("PASSWORD_RESET_CODE_TTL_MS = 15 * 60 * 1000");
    expect(functionSource).toContain("PASSWORD_RESET_MAX_ATTEMPTS = 5");
    expect(functionSource).toContain('return json({ accepted: true });');
    expect(functionSource).toContain("password_reset_code_hash: null");
    expect(schema).toContain("password_reset_code_hash");
    expect(schema).toContain("password_reset_code_expires_at");
    expect(schema).toContain("password_reset_attempts");
  });
});
