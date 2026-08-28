import { describe, expect, it } from "vitest";

const enabled = process.env.RUN_SUPABASE_MANAGEMENT_TOKEN_TEST === "true";
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = "zyszoiezbbrunkgscwth";

describe.skipIf(!enabled)("Supabase management token", () => {
  it("can read Edge Function metadata without exposing token contents", async () => {
    expect(accessToken).toBeTruthy();
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/functions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(response.status).toBe(200);
    const functions = await response.json() as Array<{ slug?: string }>;
    expect(functions.some((item) => item.slug === "central-registration")).toBe(true);
  }, 15_000);
});
