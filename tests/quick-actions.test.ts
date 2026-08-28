import { describe, expect, it } from "vitest";
import { canStartQuickAction } from "../lib/quick-actions";

describe("quick action loading gate", () => {
  it("allows the first action and blocks a second action while loading", () => {
    expect(canStartQuickAction(null)).toBe(true);
    expect(canStartQuickAction("reports")).toBe(false);
  });
});
