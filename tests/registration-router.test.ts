import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

function createContext(): TrpcContext {
  return { user: null, req: { headers: {}, protocol: "https" } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("مسار طلبات التسجيل المركزي", () => {
  it("يرفض رمز اعتماد غير صحيح قبل عرض الطلبات", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.registrations.list({ approvalSecret: "invalid-registration-approval-code" })).rejects.toThrow("Approval authorization failed");
  });

  it("يتحقق من بيانات التسجيل قبل محاولة حفظها", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.registrations.submit({ name: "A", email: "not-an-email", phone: "1", jobTitle: "X", password: "short" })).rejects.toBeTruthy();
  });
});
