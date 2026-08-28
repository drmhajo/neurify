import { describe, expect, it } from "vitest";
import { formatRiyadhDateTime, getRiyadhDateKey, RIYADH_TIME_ZONE } from "../lib/riyadh-time";

describe("توقيت الرياض", () => {
  it("يعتمد المنطقة الزمنية الرسمية للمملكة", () => {
    expect(RIYADH_TIME_ZONE).toBe("Asia/Riyadh");
  });

  it("يعرض ويحسب بداية اليوم بحسب توقيت الرياض لا توقيت الجهاز", () => {
    const instant = new Date("2026-08-27T21:30:00.000Z");
    expect(getRiyadhDateKey(instant)).toBe("2026-08-28");
    expect(formatRiyadhDateTime(instant, "en")).toContain("00:30");
  });
});
