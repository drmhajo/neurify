const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const encoder = new TextEncoder();
const PBKDF2_ITERATIONS = 210_000;
const PUSH_PROOF_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PUSH_PROOF_CLOCK_SKEW_MS = 5 * 60 * 1000;

type RegistrationRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  job_title: string;
  password_hash: string;
  password_salt: string;
  password_iterations: number;
  status: "pending" | "approved" | "rejected";
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
};

type PushDeviceRow = {
  id: string;
  account_id: string;
  expo_token: string;
  platform: "android" | "ios";
  active: boolean;
};

type FirebaseServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function bytesToBase64Url(bytes: Uint8Array) {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derivePassword(password: string, salt: Uint8Array, iterations: number) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    keyMaterial,
    256,
  );
  return new Uint8Array(bits);
}

async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt, PBKDF2_ITERATIONS);
  return {
    password_hash: bytesToBase64(hash),
    password_salt: bytesToBase64(salt),
    password_iterations: PBKDF2_ITERATIONS,
  };
}

async function verifyPassword(password: string, row: RegistrationRow) {
  const actual = await derivePassword(password, base64ToBytes(row.password_salt), row.password_iterations);
  const expected = base64ToBytes(row.password_hash);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
  return difference === 0;
}

function constantTimeEqual(left: string, right: string) {
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

function requireApprovalSecret(candidate: unknown) {
  const configured = Deno.env.get("REGISTRATION_APPROVAL_SECRET")?.trim() ?? "";
  const supplied = typeof candidate === "string" ? candidate.trim() : "";
  return configured.length >= 16 && constantTimeEqual(configured, supplied);
}

function fcmServiceAccount() {
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON")?.trim() ?? "";
  if (!raw) throw new Error("Firebase service account is unavailable.");
  const account = JSON.parse(raw) as Partial<FirebaseServiceAccount>;
  if (!account.project_id || !account.client_email || !account.private_key) throw new Error("Firebase service account is incomplete.");
  return account as FirebaseServiceAccount;
}

function serviceAccountPrivateKey(value: string) {
  const base64 = value.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  return base64ToBytes(base64).buffer;
}

async function fcmAccessToken(account: FirebaseServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = bytesToBase64Url(encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = bytesToBase64Url(encoder.encode(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })));
  const signingInput = `${header}.${claims}`;
  const key = await crypto.subtle.importKey("pkcs8", serviceAccountPrivateKey(account.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = bytesToBase64Url(new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(signingInput))));
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${signingInput}.${signature}` }),
  });
  const payload = await response.json() as { access_token?: string };
  if (!response.ok || !payload.access_token) throw new Error("Unable to obtain Firebase access token.");
  return payload.access_token;
}

async function sendFirebasePush(token: string, title: string, body: string) {
  const account = fcmServiceAccount();
  const accessToken = await fcmAccessToken(account);
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ message: { token, notification: { title, body }, data: { type: "general_announcement", url: "/notifications" }, android: { priority: "HIGH", notification: { channel_id: "department-alerts", sound: "default" } } } }),
  });
  if (!response.ok) throw new Error(`Firebase push request failed (${response.status}).`);
}

async function signPushRegistrationPayload(payload: string) {
  const secret = Deno.env.get("REGISTRATION_APPROVAL_SECRET")?.trim() ?? "";
  if (secret.length < 16) throw new Error("Push registration secret is unavailable.");
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToBase64(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
}

async function createPushRegistrationProof(accountId: string) {
  const expiresAt = Date.now() + PUSH_PROOF_TTL_MS;
  const signature = await signPushRegistrationPayload(`push:${accountId}:${expiresAt}`);
  return `${expiresAt}.${signature}`;
}

async function hasValidPushRegistrationProof(accountId: string, candidate: unknown) {
  if (typeof candidate !== "string") return false;
  const [expiryText, suppliedSignature, ...rest] = candidate.split(".");
  const expiresAt = Number(expiryText);
  if (rest.length || !Number.isSafeInteger(expiresAt) || expiresAt < Date.now() || expiresAt > Date.now() + PUSH_PROOF_TTL_MS + PUSH_PROOF_CLOCK_SKEW_MS || !suppliedSignature) return false;
  const expectedSignature = await signPushRegistrationPayload(`push:${accountId}:${expiresAt}`);
  return constantTimeEqual(expectedSignature, suppliedSignature);
}

function mapRequest(row: RegistrationRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    jobTitle: row.job_title,
    status: row.status,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
  };
}

function projectRestConfiguration() {
  const projectUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!projectUrl || !serviceRoleKey) throw new Error("Supabase function environment is incomplete.");
  return { restUrl: `${projectUrl}/rest/v1/registration_requests`, serviceRoleKey };
}

async function restRequest(path: string, init: RequestInit = {}) {
  const { restUrl, serviceRoleKey } = projectRestConfiguration();
  const response = await fetch(`${restUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(typeof payload?.message === "string" ? payload.message : `Supabase request failed (${response.status}).`);
  return payload;
}

async function pushDeviceRequest(path: string, init: RequestInit = {}) {
  const { restUrl, serviceRoleKey } = projectRestConfiguration();
  const response = await fetch(`${restUrl.replace(/\/registration_requests$/, "/push_devices")}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(typeof payload?.message === "string" ? payload.message : `Supabase Push registration failed (${response.status}).`);
  return payload;
}

async function findByEmail(email: string) {
  const rows = await restRequest(`?email=eq.${encodeURIComponent(email)}&select=*&limit=1`) as RegistrationRow[];
  return rows[0] ?? null;
}

async function findById(id: string) {
  const rows = await restRequest(`?id=eq.${encodeURIComponent(id)}&select=*&limit=1`) as RegistrationRow[];
  return rows[0] ?? null;
}

async function handleSubmit(body: Record<string, unknown>) {
  const name = cleanText(body.name, 160);
  const email = normalizeEmail(body.email);
  const phone = cleanText(body.phone, 32);
  const jobTitle = cleanText(body.jobTitle, 160);
  const password = typeof body.password === "string" ? body.password : "";
  if (name.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.length < 7 || jobTitle.length < 2 || password.length < 12 || password.length > 128) {
    return json({ error: "invalid_input" }, 400);
  }
  const existing = await findByEmail(email);
  if (existing) return json({ accepted: false, reason: existing.status === "pending" ? "pending" : "existing" });
  const passwordFields = await hashPassword(password);
  const rows = await restRequest("", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ name, email, phone, job_title: jobTitle, ...passwordFields, status: "pending" }),
  }) as RegistrationRow[];
  return json({ accepted: true, id: rows[0].id });
}

async function handleSignIn(body: Record<string, unknown>) {
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return json({ ok: false, status: "invalid" });
  const request = await findByEmail(email);
  if (!request || !await verifyPassword(password, request)) return json({ ok: false, status: "invalid" });
  if (request.status !== "approved") return json({ ok: false, status: request.status });
  return json({
    ok: true,
    account: {
      id: `remote-${request.id}`,
      name: request.name,
      email: request.email,
      phone: request.phone,
      jobTitle: request.job_title,
      pushProof: await createPushRegistrationProof(request.id),
    },
  });
}

async function handlePushRegister(body: Record<string, unknown>) {
  const accountId = cleanText(body.accountId, 64).replace(/^remote-/, "");
  const token = cleanText(body.token, 255);
  const platform = body.platform === "ios" ? "ios" : body.platform === "android" ? "android" : "";
  if (!/^[0-9a-f-]{36}$/i.test(accountId) || !/^[A-Za-z0-9:_.-]{16,1024}$/.test(token) || platform !== "android" || !await hasValidPushRegistrationProof(accountId, body.pushProof)) {
    return json({ persisted: false, error: "push_registration_unauthorized" }, 403);
  }
  const account = await findById(accountId);
  if (!account || account.status !== "approved") return json({ persisted: false, error: "account_not_approved" }, 403);
  const rows = await pushDeviceRequest("?on_conflict=expo_token", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ account_id: accountId, expo_token: token, platform, active: true, last_seen_at: new Date().toISOString() }),
  }) as PushDeviceRow[];
  return json({ persisted: Boolean(rows[0]) });
}

function isFirebaseDeviceToken(token: string) {
  return /^[A-Za-z0-9:_.-]{16,1024}$/.test(token);
}

async function handleGeneralPush(body: Record<string, unknown>) {
  if (!requireApprovalSecret(body.approvalSecret)) return json({ error: "push_dispatch_unauthorized" }, 403);
  const title = cleanText(body.title, 80);
  const message = cleanText(body.body, 280);
  if (!title || !message) return json({ error: "invalid_input" }, 400);
  const registered = await pushDeviceRequest("?active=is.true&select=expo_token") as Array<Pick<PushDeviceRow, "expo_token">>;
  const tokens = [...new Set(registered.map((device) => device.expo_token).filter(isFirebaseDeviceToken))];
  for (const token of tokens) await sendFirebasePush(token, title, message);
  return json({ submitted: tokens.length });
}

async function handleList(body: Record<string, unknown>) {
  if (!requireApprovalSecret(body.approvalSecret)) return json({ error: "approval_unauthorized" }, 403);
  const rows = await restRequest("?select=*&order=created_at.desc") as RegistrationRow[];
  return json(rows.map(mapRequest));
}

async function handleDecision(body: Record<string, unknown>, decision: "approved" | "rejected") {
  if (!requireApprovalSecret(body.approvalSecret)) return json({ error: "approval_unauthorized" }, 403);
  const id = cleanText(body.id, 64);
  const reviewerField = decision === "approved" ? body.approvedBy : body.rejectedBy;
  const reviewer = cleanText(reviewerField, 120);
  if (!/^[0-9a-f-]{36}$/i.test(id) || reviewer.length < 2) return json({ error: "invalid_input" }, 400);
  const rows = await restRequest(`?id=eq.${encodeURIComponent(id)}&status=eq.pending`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ status: decision, approved_by: reviewer, approved_at: new Date().toISOString() }),
  }) as RegistrationRow[];
  if (!rows.length) return json({ error: "request_not_pending" }, 409);
  return json(decision === "approved" ? mapRequest(rows[0]) : { ...mapRequest(rows[0]), reviewedAt: rows[0].approved_at });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const body = await request.json() as Record<string, unknown>;
    switch (body.action) {
      case "submit": return await handleSubmit(body);
      case "sign_in": return await handleSignIn(body);
      case "list": return await handleList(body);
      case "approve": return await handleDecision(body, "approved");
      case "reject": return await handleDecision(body, "rejected");
      case "push_register": return await handlePushRegister(body);
      case "push_send_general": return await handleGeneralPush(body);
      default: return json({ error: "unknown_action" }, 400);
    }
  } catch (error) {
    console.error("central-registration failure", error instanceof Error ? error.message : error);
    return json({ error: "service_unavailable" }, 503);
  }
});
