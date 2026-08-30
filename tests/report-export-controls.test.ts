import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = (name: string) => readFileSync(resolve(process.cwd(), "app", name), "utf8");

describe("prominent report export controls", () => {
  it("uses a dedicated, labelled export panel with clearly distinct PDF and Excel colors", () => {
    const dashboard = source("shift-report-dashboard.tsx");
    const weekend = source("weekend-endorsement.tsx");

    for (const screen of [dashboard, weekend]) {
      expect(screen).toContain("exportPanel");
      expect(screen).toContain("#C2413A");
      expect(screen).toContain("#107C41");
      expect(screen).toContain("Export PDF");
      expect(screen).toContain("Export Excel");
      expect(screen).toContain("تصدير PDF");
      expect(screen).toContain("تصدير Excel");
      expect(screen).toContain("تصدير PDF");
      expect(screen).toContain("تصدير Excel");
    }
  });
});
