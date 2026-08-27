import { describe, expect, it } from "vitest";
import { NEUROSURGERY_PROCEDURES, procedureLabel } from "../lib/neurosurgery-procedure-catalog";

describe("قائمة عمليات جراحة المخ والأعصاب", () => {
  it("توفر إجراءات معيارية بالعربية والإنجليزية مع خيار إجراء آخر", () => {
    expect(NEUROSURGERY_PROCEDURES.some((item) => item.code === "vp_shunt")).toBe(true);
    expect(NEUROSURGERY_PROCEDURES.at(-1)?.code).toBe("other");
    expect(procedureLabel("craniotomy_tumor_resection", "ar")).toBe("فتح القحف واستئصال ورم");
    expect(procedureLabel("craniotomy_tumor_resection", "en")).toBe("Craniotomy and tumor resection");
  });
});
