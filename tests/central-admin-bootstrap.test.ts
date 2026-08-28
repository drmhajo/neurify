import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createInternalDepartmentData, prepareInternalReleaseData } from "../lib/department-model";

const loginSource = readFileSync(resolve(process.cwd(), "app/login.tsx"), "utf8");
const storeSource = readFileSync(resolve(process.cwd(), "lib/department-store.tsx"), "utf8");
const functionSource = readFileSync(resolve(process.cwd(), "supabase/functions/central-registration/index.ts"), "utf8");
const requestsSource = readFileSync(resolve(process.cwd(), "app/registration-requests.tsx"), "utf8");

describe("central administrator onboarding", () => {
  it("does not seed a local administrator or require first-run password setup", () => {
    const data = createInternalDepartmentData();
    expect(data.initialSetupCompleted).toBe(true);
    expect(data.users.some((user) => user.id === "u-admin")).toBe(false);
    expect(loginSource).not.toContain("Administrator setup");
    expect(loginSource).not.toContain("completeInitialSetup");
  });

  it("removes a legacy local administrator during release migration", () => {
    const migrated = prepareInternalReleaseData({
      ...createInternalDepartmentData(),
      releaseVersion: "internal-release-v1",
      initialSetupCompleted: false,
      users: [{ id: "u-admin", username: "admin", name: "Legacy", role: "admin", jobTitle: "Admin", teamIds: [], active: true, permissions: [], passwordRecoveryRequired: true }],
    });
    expect(migrated.initialSetupCompleted).toBe(true);
    expect(migrated.users.some((user) => user.id === "u-admin")).toBe(false);
  });

  it("routes the administrator username to a secret-gated central account", () => {
    expect(storeSource).toContain('const isCentralAdministrator = normalizedUsername === "admin"');
    expect(functionSource).toContain('const CENTRAL_ADMIN_USERNAME = "admin"');
    expect(functionSource).toContain('case "bootstrap_admin"');
    expect(functionSource).toContain("requireApprovalSecret(body.approvalSecret)");
    expect(functionSource).toContain('case "reset_password"');
    expect(functionSource).toContain('case "change_password"');
    expect(storeSource).toContain("resetCentralPassword");
    expect(storeSource).toContain("changeCentralPassword");
  });

  it("imports approved central accounts into the administrator recovery directory", () => {
    expect(requestsSource).toContain('allRequests.filter((item) => item.status === "approved").forEach((item) => importApprovedRegistration(item))');
    expect(storeSource).toContain('input.email.trim().toLowerCase() === "admin@ksmc.local"');
  });
});
