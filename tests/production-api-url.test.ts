import { describe, expect, it } from "vitest";

const enabled = process.env.RUN_SUPABASE_REGISTRATION_LIVE_TEST === "true";

describe.skipIf(!enabled)("عنوان API المنشور", () => {
  it("يصل إلى وظيفة Supabase HTTPS الثابتة لتسجيل المستخدم وأجهزة Android", async () => {
    const projectUrl = process.env.SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
    const anonKey = process.env.SUPABASE_ANON_KEY;
    expect(projectUrl).toMatch(/^https:\/\/[^/]+\.supabase\.co$/);
    expect(anonKey).toBeTruthy();
    const response = await fetch(`${projectUrl}/functions/v1/central-registration`, {
      method: "POST",
      headers: { apikey: anonKey!, Authorization: `Bearer ${anonKey!}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({ action: "health_probe" }),
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "unknown_action" });
  }, 15_000);
});
