import { describe, expect, it } from "vitest";

describe("عنوان API المنشور", () => {
  it("يصل إلى مسار عام من الخادم لتسجيل جهاز Android", async () => {
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    expect(apiBaseUrl).toBeTruthy();
    const response = await fetch(`${apiBaseUrl}/api/trpc/auth.me?batch=1&input=%7B%220%22%3A%7B%7D%7D`);
    expect(response.ok).toBe(true);
  });
});
