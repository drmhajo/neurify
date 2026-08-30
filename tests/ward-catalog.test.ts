import { describe, expect, it } from "vitest";
import { STANDARD_WARDS, canonicalWard, searchStandardWards } from "../lib/ward-catalog";

describe("قائمة الأجنحة الموحدة", () => {
  it("تحتفظ بقائمة الأجنحة المعتمدة وتزيل اختلاف المسافات وحالة الأحرف", () => {
    expect(STANDARD_WARDS).toContain("200A");
    expect(STANDARD_WARDS).toContain("Truma ICU");
    expect(STANDARD_WARDS).toContain("Pedia4");
    expect(canonicalWard(" 200 a ")).toBe("200A");
    expect(canonicalWard("TRAUMA ICU")).toBe("Truma ICU");
    expect(canonicalWard("truma-icu")).toBe("Truma ICU");
  });

  it("يدعم البحث في قائمة الأجنحة دون إنشاء قيمة غير موحدة", () => {
    expect(searchStandardWards("T1A")).toEqual(["T1A1", "T1A2", "T1A4", "T1A5", "T1A6"]);
    expect(searchStandardWards("icu")).toEqual(["Truma ICU", "PICU", "NICU"]);
  });
});
