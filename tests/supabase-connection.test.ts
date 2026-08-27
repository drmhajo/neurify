import { describe, expect, it } from "vitest";

describe("اتصال Supabase التجريبي", () => {
  it("يقبل مفتاح الخادم ويعيد واجهة REST", async () => {
    const configuredUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const projectUrl = configuredUrl?.replace(/\/rest\/v1\/?$/, "");

    expect(projectUrl).toMatch(/^https:\/\/.+\.supabase\.co$/);
    expect(serviceRoleKey).toBeTruthy();

    const response = await fetch(`${projectUrl}/rest/v1/`, {
      headers: {
        apikey: serviceRoleKey!,
        Authorization: `Bearer ${serviceRoleKey!}`,
      },
    });

    expect(response.ok).toBe(true);
  });
});
