import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

describe("central registration Supabase migration", () => {
  it("keeps service-role credentials out of the mobile registration client", () => {
    const client = fs.readFileSync(path.join(root, "lib/central-registration-api.ts"), "utf8");
    const appConfig = fs.readFileSync(path.join(root, "app.config.ts"), "utf8");
    expect(client).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(appConfig).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(appConfig).toContain("/functions/v1/central-registration");
    expect(client).toContain("centralRegistration");
    expect(appConfig).toContain('version: "1.0.3"');
    expect(appConfig).toContain("versionCode: 4");
  });

  it("routes submit, sign-in, list, approve, and reject through the Edge Function", () => {
    const client = fs.readFileSync(path.join(root, "lib/central-registration-api.ts"), "utf8");
    for (const action of ["submit", "sign_in", "list", "approve", "reject"]) {
      expect(client).toContain(`\"${action}\"`);
    }
  });

  it("defines a protected registration table without public direct access", () => {
    const migration = fs.readFileSync(path.join(root, "supabase/central_registration.sql"), "utf8");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("revoke all on table public.registration_requests from anon, authenticated");
    expect(migration).toContain("grant all on table public.registration_requests to service_role");
  });
});
