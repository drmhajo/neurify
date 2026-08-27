import { describe, expect, it } from "vitest";
import { validateConsultationDecision } from "../lib/consultation-decision";

describe("قرار الاستشارة والتدخل الجراحي", () => {
  it("يتطلب كتابة القرار السريري", () => {
    expect(validateConsultationDecision({ clinicalDecision: "", surgicalIntervention: false, surgeryType: "" })).toBe("missing_decision");
  });

  it("يتطلب نوع العملية فقط عند اختيار تدخل جراحي", () => {
    expect(validateConsultationDecision({ clinicalDecision: "متابعة بعد التصوير", surgicalIntervention: true, surgeryType: "" })).toBe("missing_surgery_type");
    expect(validateConsultationDecision({ clinicalDecision: "تدخل جراحي", surgicalIntervention: true, surgeryType: "استئصال ورم" })).toBeNull();
  });
});
