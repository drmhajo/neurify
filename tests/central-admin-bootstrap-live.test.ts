import { describe, expect, it } from "vitest";

const baseUrl = (process.env.SUPABASE_URL ?? "").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const functionUrl = baseUrl ? `${baseUrl}/functions/v1/central-registration` : "";
const anonKey = process.env.SUPABASE_ANON_KEY ?? "";
const approvalSecret = process.env.REGISTRATION_APPROVAL_SECRET ?? "";
const password = process.env.CENTRAL_ADMIN_PASSWORD ?? "";

async function call(body: Record<string, unknown>) {
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { response, payload: await response.json() as Record<string, unknown> };
}

describe.runIf(process.env.RUN_CENTRAL_ADMIN_BOOTSTRAP_TEST === "true")("central administrator bootstrap", () => {
  it("provisions the administrator and verifies central sign-in without exposing the password", async () => {
    expect(functionUrl).toMatch(/^https:\/\/[^/]+\.supabase\.co\/functions\/v1\/central-registration$/);
    expect(anonKey.length).toBeGreaterThan(20);
    expect(approvalSecret.length).toBeGreaterThanOrEqual(16);
    expect(password.length).toBeGreaterThanOrEqual(8);

    const provision = await call({ action: "bootstrap_admin", username: "admin", password, approvalSecret });
    expect(provision.response.status).toBe(200);
    expect(provision.payload.ok).toBe(true);

    const signIn = await call({ action: "sign_in", identifier: "admin", password });
    expect(signIn.response.status).toBe(200);
    expect(signIn.payload.ok).toBe(true);
    expect((signIn.payload.account as Record<string, unknown>).role).toBe("admin");

    const accountId = String((signIn.payload.account as Record<string, unknown>).id);
    const reset = await call({ action: "reset_password", accountId, approvalSecret });
    expect(reset.response.status).toBe(200);
    expect(reset.payload.ok).toBe(true);
    const temporaryPassword = String(reset.payload.temporaryPassword);
    expect(temporaryPassword.length).toBeGreaterThanOrEqual(10);

    const temporarySignIn = await call({ action: "sign_in", identifier: "admin", password: temporaryPassword });
    expect(temporarySignIn.payload.ok).toBe(true);
    const temporaryAccount = temporarySignIn.payload.account as Record<string, unknown>;
    const changed = await call({ action: "change_password", accountId: temporaryAccount.id, pushProof: temporaryAccount.pushProof, currentPassword: temporaryPassword, newPassword: "KSMC-Check-2026!" });
    expect(changed.response.status).toBe(200);
    expect(changed.payload.ok).toBe(true);

    const restore = await call({ action: "bootstrap_admin", username: "admin", password, approvalSecret });
    expect(restore.response.status).toBe(200);
    expect(restore.payload.ok).toBe(true);
  }, 30_000);
});
