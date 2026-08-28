import { describe, expect, it } from "vitest";
import { OFFICIAL_LOGO_URL, createOfficialReportHeaderHtml } from "../lib/report-branding";

describe("ترويسة التقارير الرسمية", () => {
  it("uses the supplied Neurosurgery Department logo in printable headers", () => {
    const header = createOfficialReportHeaderHtml({ title: "On-call Endorsement", subtitle: "2026-08-28", language: "en" });

    expect(OFFICIAL_LOGO_URL).toContain("ZiqiFPvQVxNKFyil.png");
    expect(header).toContain(OFFICIAL_LOGO_URL);
    expect(header).toContain('alt="Neurosurgery Department logo"');
  });

  it("keeps the bilingual KSMC identity and report-specific title", () => {
    const header = createOfficialReportHeaderHtml({ title: "تقرير المناوبة", subtitle: "07:30", language: "ar" });

    expect(header).toContain("مدينة الملك سعود الطبية");
    expect(header).toContain("King Saud Medical City");
    expect(header).toContain("تقرير المناوبة");
    expect(header).toContain('dir="rtl"');
  });
});
