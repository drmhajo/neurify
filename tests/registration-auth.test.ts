import { describe, expect, it } from "vitest";
import { hashRegistrationPassword, isRegistrationApprovalAuthorized, verifyRegistrationPassword } from "../server/db";

describe("توثيق طلبات التسجيل المركزية", () => {
  it("يتحقق من كلمة المرور دون الاحتفاظ بها كنص صريح", () => {
    const password = "Test approval password 2026";
    const hash = hashRegistrationPassword(password);
    expect(hash).not.toContain(password);
    expect(verifyRegistrationPassword(password, hash)).toBe(true);
    expect(verifyRegistrationPassword("incorrect password", hash)).toBe(false);
  });

  it("لا يعتمد الطلبات إلا برمز الاعتماد المهيأ", () => {
    const secret = process.env.REGISTRATION_APPROVAL_SECRET!;
    expect(isRegistrationApprovalAuthorized(secret)).toBe(true);
    expect(isRegistrationApprovalAuthorized("incorrect approval secret")).toBe(false);
  });
});
