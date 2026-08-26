import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

function createContext(role: "admin" | "user"): TrpcContext {
  return {
    user: { id: 1, openId: "backup-test", name: "Backup Tester", email: null, loginMethod: "demo", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const payload = JSON.stringify({ format: "ksmc-neurosurgery-backup", version: 1, data: { users: [], reports: [], shifts: [], surgeries: [], weeklyAssignments: [], scheduleDocuments: [], teams: [], notifications: [] } });

describe("واجهة API للنسخ الاحتياطي", () => {
  it("تتحقق من بنية نسخة صالحة للمشرف", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(caller.backup.validate({ payload })).resolves.toMatchObject({ valid: true });
  });

  it("تمنع غير المشرف من استخدام مسار التحقق الإداري", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.backup.validate({ payload })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
