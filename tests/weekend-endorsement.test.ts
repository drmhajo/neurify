import { describe, expect, it } from "vitest";
import { createInitialDepartmentData } from "../lib/department-model";
import { buildWeekendEndorsementReport, createWeekendEndorsementHtml } from "../lib/weekend-endorsement";

describe("Weekend Endorsement", () => {
  it("يجمع جميع الحالات المنومة مع رقم الملف والاستشاري والخطة في تقرير واحد", () => {
    const data = createInitialDepartmentData();
    data.teams[0].cases[0].weekendPlan = "Repeat MRI and escalate if neurology changes.";

    const report = buildWeekendEndorsementReport(data, "Admin");
    const patient = report.entries.find((entry) => entry.id === data.teams[0].cases[0].id);

    expect(report.entries).toHaveLength(3);
    expect(patient).toMatchObject({
      patientName: data.teams[0].cases[0].fullName,
      fileNumber: data.teams[0].cases[0].fileNumber,
      consultant: "Dr. Hashmi",
      weekendPlan: "Repeat MRI and escalate if neurology changes.",
    });
  });

  it("ينشئ محتوى طباعة رسمياً ويبيّن الخطة غير الموثقة بأمان", () => {
    const data = createInitialDepartmentData();
    const report = buildWeekendEndorsementReport(data, "Admin");
    const html = createWeekendEndorsementHtml(report);

    expect(html).toContain("Weekend Endorsement");
    expect(html).toContain("King Saud Medical City");
    expect(html).toContain("Not documented");
  });

  it("يقصر التقرير ومحتوى الطباعة على الاستشاري المحدد", () => {
    const data = createInitialDepartmentData();
    const report = buildWeekendEndorsementReport(data, "Admin", "Dr. Hashmi");
    const html = createWeekendEndorsementHtml(report);

    expect(report.consultantFilter).toBe("Dr. Hashmi");
    expect(report.entries).toHaveLength(1);
    expect(report.entries.every((entry) => entry.consultant === "Dr. Hashmi")).toBe(true);
    expect(html).toContain("Treating consultant · Dr. Hashmi");
  });
});
