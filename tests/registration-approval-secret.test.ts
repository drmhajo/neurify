import { describe, expect, it } from "vitest";

describe("رمز اعتماد طلبات التسجيل", () => {
  it("يتوفر بطول كافٍ قبل تفعيل الموافقات المركزية", () => {
    const secret = process.env.REGISTRATION_APPROVAL_SECRET;
    expect(secret).toBeTruthy();
    expect(secret?.trim().length).toBeGreaterThanOrEqual(16);
  });
});
