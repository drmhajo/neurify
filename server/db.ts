import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { devicePushTokens, InsertDevicePushToken, InsertUser, users } from "../drizzle/schema";
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

// TODO: add feature queries here as your schema grows.
