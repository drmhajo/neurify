import { describe, expect, it } from "vitest";
import { hasSaveableAttachmentUri, sanitizeAttachmentFileName } from "../lib/attachment-download-utils";

describe("attachment download utilities", () => {
  it("accepts a usable local or remote URI and rejects blank values", () => {
    expect(hasSaveableAttachmentUri("file:///documents/shift.pdf")).toBe(true);
    expect(hasSaveableAttachmentUri("https://example.test/imaging.jpg")).toBe(true);
    expect(hasSaveableAttachmentUri("   ")).toBe(false);
    expect(hasSaveableAttachmentUri(undefined)).toBe(false);
  });

  it("creates a safe fallback filename without directory characters", () => {
    expect(sanitizeAttachmentFileName("weekly plan/مناوبات.pdf")).toBe("weekly_plan________.pdf");
    expect(sanitizeAttachmentFileName("   ")).toBe("attachment");
  });
});
