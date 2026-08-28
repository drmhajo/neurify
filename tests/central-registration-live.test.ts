import { afterAll, describe, expect, it } from "vitest";

const enabled = process.env.RUN_SUPABASE_REGISTRATION_LIVE_TEST === "true";
const projectUrl = process.env.SUPABASE_URL
  ?.replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const approvalSecret = process.env.REGISTRATION_APPROVAL_SECRET;
const email = `tls-check-${Date.now()}@example.test`;
const password = "KSMC-Live-Test-2026!";

async function callFunction(body: Record<string, unknown>) {
  const response = await fetch(`${projectUrl}/functions/v1/central-registration`, {
    method: "POST",
    headers: {
      apikey: anonKey!,
      Authorization: `Bearer ${anonKey!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  return { response, result };
}

describe.skipIf(!enabled)("live Supabase central registration", () => {
  afterAll(async () => {
    if (!projectUrl || !serviceRoleKey) return;
    await fetch(`${projectUrl}/rest/v1/registration_requests?email=eq.${encodeURIComponent(email)}`, {
      method: "DELETE",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });
  });

  it("submits, approves, and signs in over the stable HTTPS function", async () => {
    expect(projectUrl).toMatch(/^https:\/\/[^/]+\.supabase\.co$/);
    expect(anonKey).toBeTruthy();
    expect(serviceRoleKey).toBeTruthy();
    expect(approvalSecret).toBeTruthy();

    const submitted = await callFunction({
      action: "submit",
      name: "TLS Verification User",
      email,
      phone: "+966500000000",
      jobTitle: "Resident",
      password,
    });
    expect(submitted.response.status).toBe(200);
    expect(submitted.result).toMatchObject({ accepted: true });

    const pendingSignIn = await callFunction({ action: "sign_in", email, password });
    expect(pendingSignIn.result).toMatchObject({ ok: false, status: "pending" });

    const listed = await callFunction({ action: "list", approvalSecret });
    expect(listed.response.status).toBe(200);
    const request = (listed.result as Array<{ id: string; email: string }>).find((item) => item.email === email);
    expect(request?.id).toBeTruthy();

    const approved = await callFunction({
      action: "approve",
      id: request!.id,
      approvedBy: "Automated TLS verification",
      approvalSecret,
    });
    expect(approved.response.status).toBe(200);
    expect(approved.result).toMatchObject({ id: request!.id, email });

    const signedIn = await callFunction({ action: "sign_in", email, password });
    expect(signedIn.response.status).toBe(200);
    expect(signedIn.result).toMatchObject({
      ok: true,
      account: { email, name: "TLS Verification User", jobTitle: "Resident" },
    });
    const account = (signedIn.result as { account: { id: string; pushProof?: string } }).account;
    expect(account.pushProof).toBeTruthy();

    const pushRegistration = await callFunction({
      action: "push_register",
      accountId: account.id,
      token: `ExponentPushToken[central_live_${Date.now()}]`,
      platform: "android",
      pushProof: account.pushProof,
    });
    expect(pushRegistration.response.status).toBe(200);
    expect(pushRegistration.result).toEqual({ persisted: true });
  }, 30_000);
});
