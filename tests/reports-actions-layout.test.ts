import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const reportsScreen = readFileSync(resolve(process.cwd(), "app", "(tabs)", "reports.tsx"), "utf8");

describe("Reports action layout", () => {
  it("uses a labelled, touch-friendly report-tools panel instead of unlabeled header icons", () => {
    expect(reportsScreen).toContain("reportActionPanel");
    expect(reportsScreen).toContain('minHeight: 88');
    expect(reportsScreen).toContain('"Dashboard"');
    expect(reportsScreen).toContain("On-call report");
    expect(reportsScreen).toContain("New request");
    expect(reportsScreen).toContain("monthly on-call dashboard");
    expect(reportsScreen).toContain("لوحة معلومات المناوبات الشهرية");
    expect(reportsScreen).toContain("تقرير المناوبة اليومي");
    expect(reportsScreen).toContain("إنشاء طلب تقرير جديد");
  });
});
