import { describe, expect, it } from "vitest";

describe("Google Gemini server credential", () => {
  it("can read the model catalog without sending clinical content", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeTruthy();

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": apiKey! },
      signal: AbortSignal.timeout(10_000),
    });
    expect(response.ok).toBe(true);
  }, 15_000);
});
