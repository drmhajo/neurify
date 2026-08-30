import { describe, expect, it } from "vitest";

describe("اعتماد وسيط Gmail", () => {
  it("يهيئ وسيط Apps Script برمز الحماية دون إرسال بريد", async () => {
    const url = process.env.GMAIL_RELAY_URL;
    const token = process.env.GMAIL_RELAY_TOKEN;

    expect(url).toMatch(/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/);
    expect((token ?? "").length).toBeGreaterThanOrEqual(32);

    const response = await fetch(url!, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bootstrap", relay_token: token }),
    });
    const responseText = await response.text();

    expect(response.ok).toBe(true);
    expect(responseText).toContain('"ok":true');
  }, 20_000);
});
