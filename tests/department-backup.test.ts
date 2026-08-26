import { describe, expect, it } from "vitest";
import { backupFileName, createDepartmentBackup, parseDepartmentBackup } from "../lib/department-backup";
import { createInitialDepartmentData } from "../lib/department-model";

describe("نسخ بيانات القسم", () => {
  it("ينشئ حزمة قابلة للتحقق باسم ملف آمن", () => {
    const backup = createDepartmentBackup(createInitialDepartmentData(), "د. المشرف");
    const parsed = parseDepartmentBackup(JSON.stringify(backup));

    expect(parsed.ok).toBe(true);
    expect(backupFileName(backup)).toMatch(/^ksmc-neurosurgery-backup-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it("يرفض الحزم الناقصة أو غير المدعومة", () => {
    expect(parseDepartmentBackup("not-json").ok).toBe(false);
    expect(parseDepartmentBackup({ format: "other", version: 1, data: {} }).ok).toBe(false);
  });
});
