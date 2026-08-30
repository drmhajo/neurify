import { describe, expect, it } from "vitest";

describe("اعتماد Resend لاستعادة كلمة المرور", () => {
  it("يتحقق من مفتاح Resend عبر قائمة النطاقات دون إرسال بريد", async () => {
    const apiKey = process.env.RESEND_API_KEY;

    expect(apiKey).toMatch(/^re_/);
    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    expect(response.ok).toBe(true);
  }, 15_000);
});
