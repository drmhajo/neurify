import { describe, expect, it } from "vitest";

describe("رمز اعتماد طلبات التسجيل", () => {
  it("يتوفر بطول كافٍ ويقبل طلب تحقق مركزي آمن", async () => {
    const secret = process.env.REGISTRATION_APPROVAL_SECRET;
    const projectUrl = process.env.SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
    const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
    expect(secret).toBeTruthy();
    expect(secret?.trim().length).toBeGreaterThanOrEqual(16);
    expect(projectUrl).toMatch(/^https:\/\/[^/]+\.supabase\.co$/);
    expect(anonKey).toBeTruthy();

    const response = await fetch(`${projectUrl}/functions/v1/central-registration`, {
      method: "POST",
      headers: { apikey: anonKey!, Authorization: `Bearer ${anonKey!}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list", approvalSecret: secret }),
    });
    expect(response.status).toBe(200);
    expect(Array.isArray(await response.json())).toBe(true);
  });
});
