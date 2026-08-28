import { describe, expect, it } from "vitest";

describe("Supabase credentials", () => {
  it("reaches the Supabase auth settings endpoint with configured credentials", async () => {
    const projectUrl = process.env.SUPABASE_URL
      ?.replace(/\/rest\/v1\/?$/, "")
      .replace(/\/$/, "");
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(projectUrl).toMatch(/^https:\/\/[^/]+\.supabase\.co$/);
    expect(anonKey).toBeTruthy();
    expect(serviceRoleKey).toBeTruthy();

    const response = await fetch(`${projectUrl}/auth/v1/settings`, {
      headers: {
        apikey: anonKey!,
        Authorization: `Bearer ${serviceRoleKey!}`,
      },
    });

    expect(response.ok).toBe(true);
  }, 15000);
});
