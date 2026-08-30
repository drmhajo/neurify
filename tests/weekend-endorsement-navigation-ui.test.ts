import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("بطاقات Weekend Endorsement", () => {
  it("تفتح ملف المريض من قائمة المنومين وتوضح هذا الإجراء للمستخدم", () => {
    const source = fs.readFileSync(path.join(root, "app", "weekend-endorsement.tsx"), "utf8");

    expect(source).toContain("weekendEndorsementPatientRoute(item)");
    expect(source).toContain('pathname: "/patient/[teamId]/[caseId]"');
    expect(source).toContain("Tap to open and update medical record");
    expect(source).toContain("اضغط لفتح وتحديث الملف الطبي");
  });
});
