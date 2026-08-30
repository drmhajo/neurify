import { describe, expect, it } from "vitest";
import { NEUROSURGERY_DIAGNOSES, NEUROSURGERY_DIAGNOSIS_CODES, diagnosisLabel } from "../lib/neurosurgery-diagnosis-catalog";

describe("قائمة التشخيصات الشائعة في جراحة المخ والأعصاب", () => {
  it("توفر خيارات ثنائية اللغة مرتبة مع خيار لتسجيل تشخيص آخر", () => {
    expect(NEUROSURGERY_DIAGNOSIS_CODES).toContain("hydrocephalus");
    expect(NEUROSURGERY_DIAGNOSIS_CODES).toContain("cerebral_aneurysm");
    expect(NEUROSURGERY_DIAGNOSIS_CODES.at(-1)).toBe("other");
    expect(NEUROSURGERY_DIAGNOSES.map((option) => option.code)).toEqual(NEUROSURGERY_DIAGNOSIS_CODES);
  });

  it("يعرض التسمية الصحيحة بالعربية والإنجليزية", () => {
    expect(diagnosisLabel("hydrocephalus", "ar")).toBe("استسقاء دماغي");
    expect(diagnosisLabel("hydrocephalus", "en")).toBe("Hydrocephalus");
    expect(diagnosisLabel("other", "ar")).toBe("تشخيص آخر");
  });
});
