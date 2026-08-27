import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("خدمة الإشعارات الفورية", () => {
  it("تصل إلى التحقق من رمز الجهاز بعد تفعيل خدمة Push", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.push.register({ staffId: "push-test", token: "invalid-push-token", platform: "android" })).rejects.toThrow("Invalid push token");
  });
});
