import { describe, expect, it } from "vitest";

describe("report reminder server credentials", () => {
  it("exposes the central Supabase service key to the server test environment without inspecting its value", () => {
    const key = process.env.CENTRAL_SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

    expect(key.length).toBeGreaterThanOrEqual(32);
    expect(key).not.toContain("EXPO_PUBLIC_");
  });
});
