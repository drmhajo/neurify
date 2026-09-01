import Constants from "expo-constants";

export type CentralRegistrationRequest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
};

export type CentralApprovedAccount = Pick<CentralRegistrationRequest, "id" | "name" | "email" | "phone" | "jobTitle"> & {
  username?: string;
  role: "admin" | "team_member";
  pushProof?: string;
  dataProof?: string;
};

export type CentralDepartmentSnapshot = {
  data: unknown;
  version: number;
  updatedAt: string;
  updatedBy: string;
};

type CentralRegistrationConfig = {
  url?: string;
  anonKey?: string;
};

function getConfiguration() {
  const extra = Constants.expoConfig?.extra as { centralRegistration?: CentralRegistrationConfig } | undefined;
  const url = extra?.centralRegistration?.url?.trim().replace(/\/$/, "");
  const anonKey = extra?.centralRegistration?.anonKey?.trim();
  if (!url || !anonKey) throw new Error("Central registration is not configured.");
  if (!/^https:\/\/[^/]+\.supabase\.co\/functions\/v1\/central-registration$/.test(url)) {
    throw new Error("Central registration URL is invalid.");
  }
  return { url, anonKey };
}

async function callCentralRegistration<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { url, anonKey } = getConfiguration();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({})) as T & { error?: string };
    if (!response.ok) throw new Error(result.error || `Central registration failed (${response.status}).`);
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

export function submitCentralRegistration(input: { name: string; email: string; phone: string; jobTitle: string; password: string }) {
  return callCentralRegistration<{ accepted: boolean; id?: string; reason?: "pending" | "existing" }>("submit", input);
}

export function signInCentralRegistration(input: { identifier: string; password: string }) {
  return callCentralRegistration<
    | { ok: true; account: CentralApprovedAccount }
    | { ok: false; status: "pending" | "rejected" | "invalid" }
  >("sign_in", input);
}

export function listCentralRegistrationRequests(approvalSecret: string) {
  return callCentralRegistration<CentralRegistrationRequest[]>("list", { approvalSecret });
}

export function approveCentralRegistration(input: { id: string; approvedBy: string; approvalSecret: string }) {
  return callCentralRegistration<CentralApprovedAccount>("approve", input);
}

export function resetCentralPassword(input: { accountId: string; approvalSecret: string }) {
  return callCentralRegistration<{ ok: boolean; temporaryPassword: string }>("reset_password", input);
}

export function changeCentralPassword(input: { accountId: string; pushProof: string; currentPassword: string; newPassword: string }) {
  return callCentralRegistration<{ ok: boolean }>("change_password", input);
}

export function requestCentralPasswordRecovery(input: { email: string }) {
  return callCentralRegistration<{ accepted: boolean }>("password_reset_request", input);
}

export function confirmCentralPasswordRecovery(input: { email: string; code: string; newPassword: string }) {
  return callCentralRegistration<{ ok: boolean }>("password_reset_confirm", input);
}

export function rejectCentralRegistration(input: { id: string; rejectedBy: string; approvalSecret: string }) {
  return callCentralRegistration<CentralRegistrationRequest & { reviewedAt?: string | null }>("reject", input);
}

export function registerCentralPushDevice(input: { accountId: string; token: string; platform: "android" | "ios"; pushProof: string }) {
  return callCentralRegistration<{ persisted: boolean }>("push_register", input);
}

export function sendCentralGeneralPush(input: { title: string; body: string; approvalSecret: string }) {
  return callCentralRegistration<{ submitted: number }>("push_send_general", input);
}

export function sendCentralConsultationPush(input: { accountId: string; pushProof: string; teamId: string }) {
  return callCentralRegistration<{ submitted: number }>("push_send_consultation", input);
}

/** Contains no patient data; the central function resolves recipients from the saved report scope. */
export function sendCentralReportRequestPush(input: { accountId: string; dataProof: string; reportId: string }) {
  return callCentralRegistration<{ submitted: number; skipped?: string }>("push_send_report_request", input);
}

export function pullCentralDepartmentData(input: { accountId: string; dataProof: string }) {
  return callCentralRegistration<{ ok: true; snapshot: CentralDepartmentSnapshot | null }>("data_pull", input);
}

export function saveCentralDepartmentData(input: { accountId: string; dataProof: string; expectedVersion: number; data: unknown }) {
  return callCentralRegistration<
    | { ok: true; snapshot: CentralDepartmentSnapshot }
    | { ok: false; reason: "conflict"; latestVersion: number }
  >("data_push", input);
}
