const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const encoder = new TextEncoder();
const PBKDF2_ITERATIONS = 210_000;
const PUSH_PROOF_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PUSH_PROOF_CLOCK_SKEW_MS = 5 * 60 * 1000;
const DATA_PROOF_TTL_MS = 12 * 60 * 60 * 1000;
const PASSWORD_RESET_CODE_TTL_MS = 15 * 60 * 1000;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;
const CENTRAL_ADMIN_USERNAME = "admin";
const CENTRAL_ADMIN_EMAIL = "admin@ksmc.local";
const GOOGLE_PLAY_REVIEWER_EMAIL = "googleplay.tester@neurify.review";

type RegistrationRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  job_title: string;
  password_hash: string;
  password_salt: string;
  password_iterations: number;
  password_reset_code_hash: string | null;
  password_reset_code_salt: string | null;
  password_reset_code_iterations: number | null;
  password_reset_code_expires_at: string | null;
  password_reset_attempts: number;
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

type DepartmentSnapshotRow = {
  data: unknown;
  version: number;
  updated_at: string;
  updated_by: string;
};

type DepartmentSnapshotWriteRow = {
  accepted: boolean;
  version: number;
  updated_at: string | null;
  updated_by: string | null;
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

function normalizeIdentifier(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function createPasswordRecoveryCode() {
  return String(crypto.getRandomValues(new Uint32Array(1))[0] % 900_000 + 100_000);
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

const OFFICIAL_DEPARTMENT_LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663029677493/faAuaUHZiRmxbDab.png";

function gmailRelayConfiguration() {
  const url = Deno.env.get("GMAIL_RELAY_URL")?.trim() ?? "";
  const token = Deno.env.get("GMAIL_RELAY_TOKEN")?.trim() ?? "";
  if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(url) || token.length < 32) {
    throw new Error("Password recovery Gmail relay is not configured.");
  }
  return { url, token };
}

function passwordRecoveryEmailContent(code: string) {
  const subject = "Neurify password recovery code / رمز استعادة كلمة المرور";
  const text = `Your Neurify password recovery code is: ${code}\nIt expires in 15 minutes. Do not share it with anyone.\n\nرمز استعادة كلمة مرور Neurify هو: ${code}\nتنتهي صلاحيته خلال 15 دقيقة. لا تشاركه مع أي شخص.`;
  const html = `<div style="margin:0;background:#F4F8FA;padding:28px 16px;font-family:Arial,sans-serif;color:#082B49"><div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #D7E4E8;border-radius:16px;overflow:hidden"><div style="padding:24px;text-align:center;background:#082B49"><img src="${OFFICIAL_DEPARTMENT_LOGO_URL}" width="72" height="72" alt="Neurosurgery Department" style="display:block;margin:0 auto 12px;object-fit:contain"/><div style="font-size:24px;font-weight:700;letter-spacing:.3px;color:#ffffff">Neurify</div><div style="margin-top:6px;font-size:13px;color:#BFE7E8">Neurosurgery Department · King Saud Medical City</div></div><div style="padding:28px 24px;text-align:center"><h1 style="margin:0 0 12px;font-size:21px;color:#082B49">Password recovery / استعادة كلمة المرور</h1><p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#334E5C">Use this one-time code to reset your Neurify password. Do not share it with anyone.</p><p dir="rtl" style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#334E5C">استخدم هذا الرمز لمرة واحدة لتعيين كلمة مرور Neurify جديدة. لا تشاركه مع أي شخص.</p><div style="margin:0 auto 18px;padding:15px 18px;width:max-content;min-width:150px;border-radius:10px;background:#E8F6F6;color:#082B49;font-size:30px;font-weight:700;letter-spacing:7px">${code}</div><p style="margin:0;font-size:13px;line-height:1.6;color:#607480">This code expires in 15 minutes. / تنتهي صلاحية الرمز خلال 15 دقيقة.</p></div></div></div>`;
  return { subject, text, html };
}

function welcomeEmailContent(name: string) {
  const displayName = cleanText(name, 160) || "Neurify user";
  const subject = "Welcome to Neurify / مرحبًا بك في Neurify";
  const text = `Welcome to Neurify, ${displayName}. Your account registration request has been received and is awaiting central approval. You will be able to sign in only after approval.\n\nمرحبًا بك في Neurify، ${displayName}. تم استلام طلب تسجيل حسابك وهو بانتظار الموافقة المركزية. ستتمكن من تسجيل الدخول بعد الموافقة فقط.`;
  const html = `<div style="margin:0;background:#F4F8FA;padding:28px 16px;font-family:Arial,sans-serif;color:#082B49"><div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #D7E4E8;border-radius:16px;overflow:hidden"><div style="padding:24px;text-align:center;background:#082B49"><img src="${OFFICIAL_DEPARTMENT_LOGO_URL}" width="72" height="72" alt="Neurosurgery Department" style="display:block;margin:0 auto 12px;object-fit:contain"/><div style="font-size:24px;font-weight:700;letter-spacing:.3px;color:#ffffff">Neurify</div><div style="margin-top:6px;font-size:13px;color:#BFE7E8">Neurosurgery Department · King Saud Medical City</div></div><div style="padding:28px 24px;text-align:center"><h1 style="margin:0 0 12px;font-size:21px;color:#082B49">Welcome to Neurify / مرحبًا بك</h1><p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334E5C">Dear ${displayName}, your account registration request has been received and is awaiting central approval.</p><p dir="rtl" style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#334E5C">عزيزي/عزيزتي ${displayName}، تم استلام طلب تسجيل حسابك وهو بانتظار الموافقة المركزية.</p><div style="padding:14px 16px;border-radius:10px;background:#E8F6F6;font-size:14px;line-height:1.6;color:#082B49">You can sign in only after approval. We will notify you when the account is ready.<br/><span dir="rtl">يمكنك تسجيل الدخول بعد الموافقة فقط. سنبلغك عند جاهزية الحساب.</span></div></div></div></div>`;
  return { subject, text, html };
}

async function sendPasswordRecoveryEmail(email: string, code: string) {
  const { url, token } = gmailRelayConfiguration();
  const content = passwordRecoveryEmailContent(code);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "password_recovery", relay_token: token, to: email, code, ...content }),
  });
  const payload = await response.json().catch(() => null) as { ok?: boolean } | null;
  if (!response.ok || !payload?.ok) throw new Error(`Password recovery Gmail relay failed (${response.status}).`);
}

async function sendRegistrationWelcomeEmail(email: string, name: string) {
  const { url, token } = gmailRelayConfiguration();
  const content = welcomeEmailContent(name);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "account_welcome", relay_token: token, to: email, ...content }),
  });
  const payload = await response.json().catch(() => null) as { ok?: boolean } | null;
  if (!response.ok || !payload?.ok) throw new Error(`Registration welcome email failed (${response.status}).`);
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

async function sendFirebasePush(token: string, title: string, body: string, data: { type: string; url: string }) {
  const account = fcmServiceAccount();
  const accessToken = await fcmAccessToken(account);
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ message: { token, notification: { title, body }, data, android: { priority: "HIGH", notification: { channel_id: "department-alerts", sound: "default" } } } }),
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

async function createDataAccessProof(accountId: string) {
  const expiresAt = Date.now() + DATA_PROOF_TTL_MS;
  const signature = await signPushRegistrationPayload(`data:${accountId}:${expiresAt}`);
  return `${expiresAt}.${signature}`;
}

async function hasValidDataAccessProof(accountId: string, candidate: unknown) {
  if (typeof candidate !== "string") return false;
  const [expiryText, suppliedSignature, ...rest] = candidate.split(".");
  const expiresAt = Number(expiryText);
  if (rest.length || !Number.isSafeInteger(expiresAt) || expiresAt < Date.now() || expiresAt > Date.now() + DATA_PROOF_TTL_MS + PUSH_PROOF_CLOCK_SKEW_MS || !suppliedSignature) return false;
  const expectedSignature = await signPushRegistrationPayload(`data:${accountId}:${expiresAt}`);
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

function mapApprovedAccount(row: RegistrationRow) {
  const administrator = row.email === CENTRAL_ADMIN_EMAIL;
  const playReviewer = row.email === GOOGLE_PLAY_REVIEWER_EMAIL;
  return {
    id: `remote-${row.id}`,
    username: administrator ? CENTRAL_ADMIN_USERNAME : row.email,
    name: row.name,
    email: row.email,
    phone: row.phone,
    jobTitle: row.job_title,
    role: administrator ? "admin" : playReviewer ? "play_reviewer" : "team_member",
  };
}

function isGooglePlayReviewer(row: RegistrationRow | null | undefined) {
  return row?.status === "approved" && row.email === GOOGLE_PLAY_REVIEWER_EMAIL;
}

function googlePlayReviewerSnapshot(row: RegistrationRow) {
  return {
    users: [{ ...mapApprovedAccount(row), teamIds: [], active: true, permissions: [] }],
    reports: [],
    shifts: [],
    surgeries: [],
    opdOperationWaitingList: [],
    weeklyAssignments: [],
    scheduleDocuments: [],
    teams: [],
    notifications: [],
    generalDiscussionMessages: [],
    generalDiscussionReadByUser: {},
    shiftReports: [],
    rosterVersion: "google-play-review-sandbox",
    releaseVersion: "Google Play reviewer access — no clinical records",
    initialSetupCompleted: true,
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

async function snapshotRequest(path: string, init: RequestInit = {}) {
  const { restUrl, serviceRoleKey } = projectRestConfiguration();
  const response = await fetch(`${restUrl.replace(/\/registration_requests$/, "/department_snapshots")}${path}`, {
    ...init,
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json", ...init.headers },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(typeof payload?.message === "string" ? payload.message : `Supabase snapshot request failed (${response.status}).`);
  return payload;
}

async function snapshotRpcRequest(init: RequestInit = {}) {
  const { restUrl, serviceRoleKey } = projectRestConfiguration();
  const response = await fetch(restUrl.replace(/\/registration_requests$/, "/rpc/write_department_snapshot"), {
    ...init,
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json", ...init.headers },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(typeof payload?.message === "string" ? payload.message : `Supabase snapshot write failed (${response.status}).`);
  return payload;
}

function snapshotResponse(row: DepartmentSnapshotRow) {
  return { data: row.data, version: Number(row.version), updatedAt: row.updated_at, updatedBy: row.updated_by };
}

function departmentChangeSummary(value: unknown) {
  const data = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const teams = Array.isArray(data.teams) ? data.teams as Array<Record<string, unknown>> : [];
  return {
    users: Array.isArray(data.users) ? data.users.length : 0,
    teams: teams.length,
    active_cases: teams.reduce((total, team) => total + (Array.isArray(team.cases) ? team.cases.length : 0), 0),
    discharged_cases: teams.reduce((total, team) => total + (Array.isArray(team.dischargedCases) ? team.dischargedCases.length : 0), 0),
    consultations: teams.reduce((total, team) => total + (Array.isArray(team.consultations) ? team.consultations.length : 0), 0),
  };
}

async function approvedDataAccount(body: Record<string, unknown>) {
  const accountId = cleanText(body.accountId, 64).replace(/^remote-/, "");
  if (!/^[0-9a-f-]{36}$/i.test(accountId) || !await hasValidDataAccessProof(accountId, body.dataProof)) return null;
  const account = await findById(accountId);
  return account?.status === "approved" ? account : null;
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
  if (rows[0]) {
    try {
      await sendRegistrationWelcomeEmail(email, name);
    } catch (error) {
      console.warn("Registration welcome email unavailable", error instanceof Error ? error.message : error);
    }
  }
  return json({ accepted: true, id: rows[0].id });
}

async function handleSignIn(body: Record<string, unknown>) {
  const identifier = normalizeIdentifier(body.identifier ?? body.email);
  const password = typeof body.password === "string" ? body.password : "";
  const email = identifier === CENTRAL_ADMIN_USERNAME ? CENTRAL_ADMIN_EMAIL : normalizeEmail(identifier);
  if (!email || !password) return json({ ok: false, status: "invalid" });
  const request = await findByEmail(email);
  if (!request || !await verifyPassword(password, request)) return json({ ok: false, status: "invalid" });
  if (request.status !== "approved") return json({ ok: false, status: request.status });
  return json({
    ok: true,
    account: {
      ...mapApprovedAccount(request),
      pushProof: await createPushRegistrationProof(request.id),
      dataProof: await createDataAccessProof(request.id),
    },
  });
}

async function handleBootstrapAdministrator(body: Record<string, unknown>) {
  if (!requireApprovalSecret(body.approvalSecret)) return json({ error: "approval_unauthorized" }, 403);
  const username = normalizeIdentifier(body.username);
  const password = typeof body.password === "string" ? body.password : "";
  if (username !== CENTRAL_ADMIN_USERNAME || password.length < 8 || password.length > 128) return json({ error: "invalid_input" }, 400);
  const passwordFields = await hashPassword(password);
  const accountFields = {
    name: "قسم جراحة المخ والأعصاب — المشرف",
    phone: "0000000000",
    job_title: "Department Administrator",
    ...passwordFields,
    status: "approved",
    approved_by: "central_bootstrap",
    approved_at: new Date().toISOString(),
  };
  const existing = await findByEmail(CENTRAL_ADMIN_EMAIL);
  const rows = existing
    ? await restRequest(`?id=eq.${encodeURIComponent(existing.id)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(accountFields) }) as RegistrationRow[]
    : await restRequest("", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ email: CENTRAL_ADMIN_EMAIL, ...accountFields }) }) as RegistrationRow[];
  if (!rows[0]) throw new Error("Unable to provision central administrator.");
  return json({ ok: true, account: mapApprovedAccount(rows[0]) });
}

function createTemporaryPassword() {
  const digits = crypto.getRandomValues(new Uint32Array(1))[0] % 900_000 + 100_000;
  return `KSMC-${digits}!`;
}

async function handleResetPassword(body: Record<string, unknown>) {
  if (!requireApprovalSecret(body.approvalSecret)) return json({ error: "approval_unauthorized" }, 403);
  const accountId = cleanText(body.accountId, 64).replace(/^remote-/, "");
  if (!/^[0-9a-f-]{36}$/i.test(accountId)) return json({ error: "invalid_input" }, 400);
  const account = await findById(accountId);
  if (!account || account.status !== "approved") return json({ error: "account_not_approved" }, 403);
  const temporaryPassword = createTemporaryPassword();
  const passwordFields = await hashPassword(temporaryPassword);
  const rows = await restRequest(`?id=eq.${encodeURIComponent(accountId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(passwordFields),
  }) as RegistrationRow[];
  if (!rows[0]) throw new Error("Unable to reset the account password.");
  return json({ ok: true, temporaryPassword });
}

async function handleChangePassword(body: Record<string, unknown>) {
  const accountId = cleanText(body.accountId, 64).replace(/^remote-/, "");
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  if (!/^[0-9a-f-]{36}$/i.test(accountId) || newPassword.length < 8 || newPassword.length > 128 || !await hasValidPushRegistrationProof(accountId, body.pushProof)) return json({ ok: false, error: "password_change_unauthorized" }, 403);
  const account = await findById(accountId);
  if (!account || account.status !== "approved" || !await verifyPassword(currentPassword, account)) return json({ ok: false, error: "invalid_credentials" }, 403);
  const passwordFields = await hashPassword(newPassword);
  const rows = await restRequest(`?id=eq.${encodeURIComponent(accountId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(passwordFields),
  }) as RegistrationRow[];
  if (!rows[0]) throw new Error("Unable to change the account password.");
  return json({ ok: true });
}

async function handlePasswordResetRequest(body: Record<string, unknown>) {
  const email = normalizeEmail(body.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ accepted: true });
  const account = await findByEmail(email);
  if (!account || account.status !== "approved") return json({ accepted: true });
  const code = createPasswordRecoveryCode();
  const codeFields = await hashPassword(code);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_CODE_TTL_MS).toISOString();
  await restRequest(`?id=eq.${encodeURIComponent(account.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ password_reset_code_hash: codeFields.password_hash, password_reset_code_salt: codeFields.password_salt, password_reset_code_iterations: codeFields.password_iterations, password_reset_code_expires_at: expiresAt, password_reset_attempts: 0 }),
  });
  try {
    await sendPasswordRecoveryEmail(email, code);
  } catch (error) {
    console.warn("Password recovery email unavailable", error instanceof Error ? error.message : error);
  }
  return json({ accepted: true });
}

async function handlePasswordResetConfirm(body: Record<string, unknown>) {
  const email = normalizeEmail(body.email);
  const code = cleanText(body.code, 12);
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code) || newPassword.length < 12 || newPassword.length > 128) return json({ ok: false }, 400);
  const account = await findByEmail(email);
  const expiresAt = account?.password_reset_code_expires_at ? Date.parse(account.password_reset_code_expires_at) : 0;
  const remainingAttempts = account ? PASSWORD_RESET_MAX_ATTEMPTS - Number(account.password_reset_attempts ?? 0) : 0;
  const validCode = Boolean(account && account.status === "approved" && account.password_reset_code_hash && account.password_reset_code_salt && account.password_reset_code_iterations && expiresAt > Date.now() && remainingAttempts > 0 && await verifyPassword(code, { ...account, password_hash: account.password_reset_code_hash, password_salt: account.password_reset_code_salt, password_iterations: account.password_reset_code_iterations }));
  if (!account || !validCode) {
    if (account && remainingAttempts > 0) await restRequest(`?id=eq.${encodeURIComponent(account.id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ password_reset_attempts: Number(account.password_reset_attempts ?? 0) + 1 }) });
    return json({ ok: false }, 403);
  }
  const passwordFields = await hashPassword(newPassword);
  await restRequest(`?id=eq.${encodeURIComponent(account.id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ ...passwordFields, password_reset_code_hash: null, password_reset_code_salt: null, password_reset_code_iterations: null, password_reset_code_expires_at: null, password_reset_attempts: 0 }) });
  return json({ ok: true });
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
  if (isGooglePlayReviewer(account)) return json({ persisted: false, error: "reviewer_push_not_available" }, 403);
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

async function sendToRegisteredDevices(title: string, body: string, data: { type: string; url: string }, accountIds?: string[]) {
  const scopedAccountIds = [...new Set((accountIds ?? []).map((value) => value.replace(/^remote-/, "")).filter((value) => /^[0-9a-f-]{36}$/i.test(value)))];
  if (accountIds && !scopedAccountIds.length) return 0;
  const accountFilter = scopedAccountIds.length ? `&account_id=in.(${scopedAccountIds.map(encodeURIComponent).join(",")})` : "";
  const registered = await pushDeviceRequest(`?active=is.true${accountFilter}&select=expo_token`) as Array<Pick<PushDeviceRow, "expo_token">>;
  const tokens = [...new Set(registered.map((device) => device.expo_token).filter(isFirebaseDeviceToken))];
  let submitted = 0;
  for (const token of tokens) {
    try {
      await sendFirebasePush(token, title, body, data);
      submitted += 1;
    } catch (error) {
      console.warn("Firebase Push delivery failed", error instanceof Error ? error.message : error);
    }
  }
  return submitted;
}

async function handleGeneralPush(body: Record<string, unknown>) {
  if (!requireApprovalSecret(body.approvalSecret)) return json({ error: "push_dispatch_unauthorized" }, 403);
  const title = cleanText(body.title, 80);
  const message = cleanText(body.body, 280);
  if (!title || !message) return json({ error: "invalid_input" }, 400);
  const submitted = await sendToRegisteredDevices(title, message, { type: "general_announcement", url: "/notifications" });
  return json({ submitted });
}

async function handleConsultationPush(body: Record<string, unknown>) {
  const accountId = cleanText(body.accountId, 64).replace(/^remote-/, "");
  const teamId = cleanText(body.teamId, 120);
  if (!/^[0-9a-f-]{36}$/i.test(accountId) || teamId.length < 2 || !await hasValidPushRegistrationProof(accountId, body.pushProof)) {
    return json({ submitted: 0, error: "push_dispatch_unauthorized" }, 403);
  }
  const account = await findById(accountId);
  if (!account || account.status !== "approved") return json({ submitted: 0, error: "account_not_approved" }, 403);
  const submitted = await sendToRegisteredDevices(
    "استشارة جديدة في قسم جراحة المخ والأعصاب",
    "تم تسجيل استشارة جديدة. افتح التطبيق لمتابعة تفاصيل القسم.",
    { type: "consultation", url: "/teams" },
  );
  return json({ submitted });
}

async function readSnapshotReport(reportId: string) {
  const rows = await snapshotRequest("?workspace_key=eq.ksmc-neurosurgery-pilot&select=data&limit=1") as DepartmentSnapshotRow[];
  const data = rows[0]?.data;
  const workspace = data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {};
  const reports = Array.isArray(workspace.reports) ? workspace.reports as Array<Record<string, unknown>> : [];
  return reports.find((report) => report.id === reportId);
}

function scopedReportRecipients(report: Record<string, unknown> | undefined) {
  return Array.isArray(report?.recipientIds) ? report.recipientIds.filter((id): id is string => typeof id === "string" && /^remote-[0-9a-f-]{36}$/i.test(id)) : [];
}

async function handleReportRequestPush(body: Record<string, unknown>) {
  const account = await approvedDataAccount(body);
  const reportId = cleanText(body.reportId, 80);
  if (!account || !reportId) return json({ submitted: 0, error: "push_dispatch_unauthorized" }, 403);
  const report = await readSnapshotReport(reportId);
  if (!report || report.createdByUserId !== `remote-${account.id}` || report.notifyCompletedAt) return json({ submitted: 0, skipped: "report_unavailable" });
  const submitted = await sendToRegisteredDevices(
    "طلب تقرير جديد يحتاج متابعة",
    "تم إنشاء طلب تقرير لفريقك العلاجي. افتح التطبيق لمتابعة الإجراء المطلوب.",
    { type: "report_request", url: "/reports" },
    scopedReportRecipients(report),
  );
  return json({ submitted });
}

function hasInternalReportReminderPermission(request: Request) {
  const supplied = request.headers.get("x-report-reminder-internal")?.trim() ?? "";
  const configured = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
  return configured.length >= 32 && constantTimeEqual(configured, supplied);
}

async function handleReportReminderPush(body: Record<string, unknown>, request: Request) {
  const reportId = cleanText(body.reportId, 80);
  if (!hasInternalReportReminderPermission(request) || !reportId) return json({ submitted: 0, error: "push_dispatch_unauthorized" }, 403);
  const report = await readSnapshotReport(reportId);
  if (!report || report.notifyCompletedAt) return json({ submitted: 0, skipped: "report_unavailable" });
  const submitted = await sendToRegisteredDevices(
    "تذكير: طلب تقرير يحتاج متابعة",
    "لا يزال طلب تقرير مفتوحاً. افتح صفحة التقارير لمتابعة الإجراء المطلوب.",
    { type: "report_request_reminder", url: "/reports" },
    scopedReportRecipients(report),
  );
  return json({ submitted });
}

async function handleDataPull(body: Record<string, unknown>) {
  const account = await approvedDataAccount(body);
  if (!account) return json({ error: "data_access_unauthorized" }, 403);
  if (isGooglePlayReviewer(account)) {
    return json({
      ok: true,
      snapshot: {
        data: googlePlayReviewerSnapshot(account),
        version: 1,
        updatedAt: new Date().toISOString(),
        updatedBy: "google_play_review_sandbox",
      },
    });
  }
  const rows = await snapshotRequest("?workspace_key=eq.ksmc-neurosurgery-pilot&select=data,version,updated_at,updated_by&limit=1") as DepartmentSnapshotRow[];
  return json({ ok: true, snapshot: rows[0] ? snapshotResponse(rows[0]) : null });
}

async function handleDataPush(body: Record<string, unknown>) {
  const account = await approvedDataAccount(body);
  const expectedVersion = Number(body.expectedVersion);
  const data = body.data;
  if (!account) return json({ error: "data_access_unauthorized" }, 403);
  if (isGooglePlayReviewer(account)) return json({ error: "reviewer_write_not_available" }, 403);
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0 || !data || typeof data !== "object" || Array.isArray(data)) return json({ error: "invalid_snapshot_request" }, 400);
  const serialized = JSON.stringify(data);
  if (encoder.encode(serialized).byteLength > 7_500_000) return json({ error: "snapshot_too_large" }, 413);
  const rows = await snapshotRpcRequest({
    method: "POST",
    body: JSON.stringify({
      p_workspace_key: "ksmc-neurosurgery-pilot",
      p_expected_version: expectedVersion,
      p_data: data,
      p_actor_account_id: account.id,
      p_actor_name: account.name,
      p_change_summary: departmentChangeSummary(data),
    }),
  }) as DepartmentSnapshotWriteRow[];
  const result = rows[0];
  if (!result || !result.accepted) return json({ ok: false, reason: "conflict", latestVersion: Number(result?.version ?? 0) });
  return json({ ok: true, snapshot: { data, version: Number(result.version), updatedAt: result.updated_at, updatedBy: result.updated_by } });
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
      case "bootstrap_admin": return await handleBootstrapAdministrator(body);
      case "reset_password": return await handleResetPassword(body);
      case "change_password": return await handleChangePassword(body);
      case "password_reset_request": return await handlePasswordResetRequest(body);
      case "password_reset_confirm": return await handlePasswordResetConfirm(body);
      case "list": return await handleList(body);
      case "approve": return await handleDecision(body, "approved");
      case "reject": return await handleDecision(body, "rejected");
      case "push_register": return await handlePushRegister(body);
      case "push_send_general": return await handleGeneralPush(body);
      case "push_send_consultation": return await handleConsultationPush(body);
      case "push_send_report_request": return await handleReportRequestPush(body);
      case "push_send_report_reminder": return await handleReportReminderPush(body, request);
      case "data_pull": return await handleDataPull(body);
      case "data_push": return await handleDataPush(body);
      default: return json({ error: "unknown_action" }, 400);
    }
  } catch (error) {
    console.error("central-registration failure", error instanceof Error ? error.message : error);
    return json({ error: "service_unavailable" }, 503);
  }
});
