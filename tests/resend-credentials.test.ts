import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("وسيط Gmail لاستعادة كلمة المرور", () => {
  it("يستخدم أسرار الخادم ولا يعتمد على Resend أو مفاتيحه", () => {
    const file = path.resolve(import.meta.dirname, "../supabase/functions/central-registration/index.ts");
    const source = fs.readFileSync(file, "utf8");

    expect(source).toContain("GMAIL_RELAY_URL");
    expect(source).toContain("GMAIL_RELAY_TOKEN");
    expect(source).not.toContain("api.resend.com/emails");
    expect(source).not.toContain("RESEND_API_KEY");
  });
});
