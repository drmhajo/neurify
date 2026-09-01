import { describe, expect, it } from "vitest";
import { rolePermissionDefaults } from "../lib/department-model";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const centralRegistration = readFileSync(resolve(process.cwd(), "supabase/functions/central-registration/index.ts"), "utf8");

describe("Google Play reviewer account safeguards", () => {
  it("defines a no-permission review role", () => {
    expect(rolePermissionDefaults.play_reviewer).toEqual([]);
  });

  it("returns a separate empty review workspace instead of the department snapshot", () => {
    expect(centralRegistration).toContain('const GOOGLE_PLAY_REVIEWER_EMAIL = "googleplay.tester@neurify.review"');
    expect(centralRegistration).toContain("function googlePlayReviewerSnapshot");
    expect(centralRegistration).toContain("if (isGooglePlayReviewer(account)) {");
    expect(centralRegistration).toContain("data: googlePlayReviewerSnapshot(account)");
  });

  it("denies review-account writes and Push-device registration", () => {
    expect(centralRegistration).toContain('error: "reviewer_write_not_available"');
    expect(centralRegistration).toContain('error: "reviewer_push_not_available"');
  });
});
