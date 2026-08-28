import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { OFFICIAL_LOGO_URL, createOfficialReportHeaderHtml } from "../lib/report-branding";

const root = path.resolve(import.meta.dirname, "..");

describe("ترويسة التقارير الرسمية", () => {
  it("uses the supplied Neurosurgery Department logo in printable headers", () => {
    const header = createOfficialReportHeaderHtml({ title: "On-call Endorsement", subtitle: "2026-08-28", language: "en" });

    expect(OFFICIAL_LOGO_URL).toContain("faAuaUHZiRmxbDab.png");
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

  it("uses the supplied department emblem in the login screen with its supporting palette", () => {
    const login = fs.readFileSync(path.join(root, "app", "login.tsx"), "utf8");

    expect(login).toContain('require("../assets/images/neurosurgery-department-logo.png")');
    expect(login).not.toContain('require("../assets/images/icon.png")');
    expect(login).toContain('navy: "#163F66"');
    expect(login).toContain('teal: "#168D93"');
    expect(login).toContain('gold: "#D4B62E"');
    expect(fs.statSync(path.join(root, "assets", "images", "neurosurgery-department-logo.png")).size).toBeGreaterThan(0);
  });
});
