import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

describe("central Push registration migration", () => {
  it("keeps Push devices behind RLS and the service role", () => {
    const migration = fs.readFileSync(path.join(root, "supabase/central_registration.sql"), "utf8");
    expect(migration).toContain("create table if not exists public.push_devices");
    expect(migration).toContain("alter table public.push_devices enable row level security");
    expect(migration).toContain("revoke all on table public.push_devices from anon, authenticated");
  });

  it("routes remote-device registration through the HTTPS central function with a short-lived proof", () => {
    const functionCode = fs.readFileSync(path.join(root, "supabase/functions/central-registration/index.ts"), "utf8");
    const client = fs.readFileSync(path.join(root, "lib/central-registration-api.ts"), "utf8");
    const pushClient = fs.readFileSync(path.join(root, "lib/push-notifications.ts"), "utf8");
    expect(functionCode).toContain('case "push_register"');
    expect(functionCode).toContain("createPushRegistrationProof");
    expect(functionCode).toContain("hasValidPushRegistrationProof");
    expect(client).toContain("registerCentralPushDevice");
    expect(pushClient).toContain("registerCentralPushDevice");
    expect(pushClient).toContain('staffId.startsWith("remote-") && pushProof');
  });

  it("protects general Push dispatch with the central approval secret and sends no patient details", () => {
    const functionCode = fs.readFileSync(path.join(root, "supabase/functions/central-registration/index.ts"), "utf8");
    const announcementScreen = fs.readFileSync(path.join(root, "app/general-announcement.tsx"), "utf8");
    expect(functionCode).toContain('case "push_send_general"');
    expect(functionCode).toContain("requireApprovalSecret(body.approvalSecret)");
    expect(functionCode).toContain('url: "/notifications"');
    expect(announcementScreen).toContain("secureTextEntry");
    expect(announcementScreen).toContain("never saved on the device");
  });
});
