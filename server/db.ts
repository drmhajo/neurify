import { and, eq, inArray } from "drizzle-orm";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import { devicePushTokens, InsertDevicePushToken, InsertUser, InsertRegistrationRequest, registrationRequests, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertDevicePushToken(input: Pick<InsertDevicePushToken, "staffId" | "token" | "platform">) {
  const db = await getDb();
  if (!db) return { persisted: false } as const;
  await db.insert(devicePushTokens).values({ ...input, active: true }).onDuplicateKeyUpdate({
    set: { staffId: input.staffId, platform: input.platform, active: true, updatedAt: new Date() },
  });
  return { persisted: true } as const;
}

export async function getActivePushTokens(staffIds: string[]) {
  if (!staffIds.length) return [];
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ token: devicePushTokens.token }).from(devicePushTokens).where(and(inArray(devicePushTokens.staffId, staffIds), eq(devicePushTokens.active, true)));
  return rows.map((row) => row.token);
}

export async function deactivatePushTokens(tokens: string[]) {
  if (!tokens.length) return;
  const db = await getDb();
  if (!db) return;
  await db.update(devicePushTokens).set({ active: false }).where(inArray(devicePushTokens.token, tokens));
}

export type RegistrationSubmission = Pick<InsertRegistrationRequest, "name" | "email" | "phone" | "jobTitle"> & { password: string };

export function hashRegistrationPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyRegistrationPassword(password: string, storedHash: string) {
  const [salt, expectedHash] = storedHash.split(":");
  if (!salt || !expectedHash) return false;
  const actualHash = scryptSync(password, salt, 64).toString("hex");
  return actualHash.length === expectedHash.length && timingSafeEqual(Buffer.from(actualHash), Buffer.from(expectedHash));
}

export function isRegistrationApprovalAuthorized(candidate: string) {
  const secret = process.env.REGISTRATION_APPROVAL_SECRET?.trim();
  const supplied = candidate.trim();
  return Boolean(secret && supplied && secret.length === supplied.length && timingSafeEqual(Buffer.from(secret), Buffer.from(supplied)));
}

export async function submitRegistrationRequest(input: RegistrationSubmission) {
  const db = await getDb();
  if (!db) throw new Error("Registration service is unavailable");
  const email = input.email.trim().toLowerCase();
  const existing = await db.select({ id: registrationRequests.id, status: registrationRequests.status }).from(registrationRequests).where(eq(registrationRequests.email, email)).limit(1);
  if (existing.length) return { accepted: false as const, reason: existing[0].status === "pending" ? "pending" as const : "existing" as const };
  const id = `reg-${randomBytes(12).toString("hex")}`;
  await db.insert(registrationRequests).values({ id, name: input.name.trim(), email, phone: input.phone.trim(), jobTitle: input.jobTitle.trim(), passwordHash: hashRegistrationPassword(input.password), status: "pending" });
  return { accepted: true as const, id };
}

export async function listRegistrationRequests() {
  const db = await getDb();
  if (!db) throw new Error("Registration service is unavailable");
  return db.select({ id: registrationRequests.id, name: registrationRequests.name, email: registrationRequests.email, phone: registrationRequests.phone, jobTitle: registrationRequests.jobTitle, status: registrationRequests.status, approvedBy: registrationRequests.approvedBy, approvedAt: registrationRequests.approvedAt, createdAt: registrationRequests.createdAt }).from(registrationRequests);
}

export async function approveRegistrationRequest(id: string, approvedBy: string) {
  const db = await getDb();
  if (!db) throw new Error("Registration service is unavailable");
  const rows = await db.select().from(registrationRequests).where(eq(registrationRequests.id, id)).limit(1);
  const request = rows[0];
  if (!request || request.status !== "pending") return undefined;
  const approvedAt = new Date();
  await db.update(registrationRequests).set({ status: "approved", approvedBy: approvedBy.trim().slice(0, 120), approvedAt }).where(eq(registrationRequests.id, id));
  return { id: request.id, name: request.name, email: request.email, phone: request.phone, jobTitle: request.jobTitle, approvedAt };
}

export async function rejectRegistrationRequest(id: string, rejectedBy: string) {
  const db = await getDb();
  if (!db) throw new Error("Registration service is unavailable");
  const rows = await db.select().from(registrationRequests).where(eq(registrationRequests.id, id)).limit(1);
  const request = rows[0];
  if (!request || request.status !== "pending") return undefined;
  const reviewedAt = new Date();
  await db.update(registrationRequests).set({ status: "rejected", approvedBy: rejectedBy.trim().slice(0, 120), approvedAt: reviewedAt }).where(eq(registrationRequests.id, id));
  return { id: request.id, name: request.name, email: request.email, phone: request.phone, jobTitle: request.jobTitle, reviewedAt };
}

export async function authenticateApprovedRegistration(emailInput: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Registration service is unavailable");
  const rows = await db.select().from(registrationRequests).where(eq(registrationRequests.email, emailInput.trim().toLowerCase())).limit(1);
  const request = rows[0];
  if (!request || !verifyRegistrationPassword(password, request.passwordHash)) return { ok: false as const, status: "invalid" as const };
  if (request.status !== "approved") return { ok: false as const, status: request.status };
  return { ok: true as const, account: { id: `remote-${request.id}`, name: request.name, email: request.email, phone: request.phone, jobTitle: request.jobTitle } };
}
