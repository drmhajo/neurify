import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("central department data synchronization", () => {
  const source = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

  it("uses an approved-account proof for central reads and writes without exposing the service role to the app", () => {
    const client = source("lib/central-registration-api.ts");
    const functionSource = source("supabase/functions/central-registration/index.ts");

    expect(client).toContain("pullCentralDepartmentData");
    expect(client).toContain("saveCentralDepartmentData");
    expect(client).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(functionSource).toContain("DATA_PROOF_TTL_MS");
    expect(functionSource).toContain("hasValidDataAccessProof");
    expect(functionSource).toContain('case "data_pull"');
    expect(functionSource).toContain('case "data_push"');
  });

  it("enforces versioned writes and records non-clinical audit summaries in protected database objects", () => {
    const migration = source("supabase/central_data_sync.sql");

    expect(migration).toContain("write_department_snapshot");
    expect(migration).toContain("p_expected_version");
    expect(migration).toContain("department_data_audit");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("revoke all on table public.department_data_audit from anon, authenticated");
    expect(migration).toContain("change_summary");
  });

  it("syncs approved sessions automatically and preserves a local recovery copy instead of overwriting conflicts", () => {
    const store = source("lib/department-store.tsx");

    expect(store).toContain("CENTRAL_SYNC_POLL_MS");
    expect(store).toContain("AppState.addEventListener");
    expect(store).toContain("CENTRAL_MIGRATION_BACKUP_KEY");
    expect(store).toContain("CENTRAL_CONFLICT_BACKUP_KEY");
    expect(store).toContain("hasCentralBaselineRef");
    expect(store).toContain('status: "conflict"');
    expect(store).not.toContain("CLOUD_SYNC_ENABLED");
    expect(store).not.toContain("cloudSync.pull");
  });
});
