import { describe, expect, it } from "vitest";
import { consultationDestination } from "../lib/department-model";

describe("مسار الاستشارة حسب قرار الفريق المعالج", () => {
  it("يوجه قرار التنويم إلى قائمة المنومين", () => expect(consultationDestination("admit").section).toBe("inpatients"));
  it("يوجه المتابعة إلى قائمة الاستشارات والخروج إلى الأرشيف", () => {
    expect(consultationDestination("follow_up").section).toBe("consultations");
    expect(consultationDestination("discharge").section).toBe("discharged");
  });
});
