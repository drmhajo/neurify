import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const read = (fileName: string) => fs.readFileSync(path.join(root, "lib", fileName), "utf8");

describe("تنزيل التقارير مباشرة إلى جهاز Android", () => {
  it("يحفظ ملف التقرير في مجلد يختاره المستخدم ويتذكره محليًا", () => {
    const helper = read("report-direct-download.ts");
    expect(helper).toContain("StorageAccessFramework.requestDirectoryPermissionsAsync");
    expect(helper).toContain("StorageAccessFramework.createFileAsync");
    expect(helper).toContain("neurify.report-download-directory.v1");
  });

  it("يوجّه صادرات التقارير إلى الحفظ المباشر على Android", () => {
    ["shift-report-export.ts", "weekend-endorsement-export.ts", "shift-report-dashboard-export-platform.ts", "opd-operation-waitlist-export.ts"].forEach((fileName) => {
      const source = read(fileName);
      expect(source).toContain('Platform.OS === "android"');
      expect(source).toContain("saveReport");
    });
  });
});
