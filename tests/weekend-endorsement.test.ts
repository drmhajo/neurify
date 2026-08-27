import { describe, expect, it } from "vitest";
import { createInitialDepartmentData } from "../lib/department-model";
import { buildWeekendEndorsementReport, createWeekendEndorsementHtml, searchWeekendEndorsementEntries } from "../lib/weekend-endorsement";
import { createWeekendEndorsementWorkbook, weekendEndorsementExcelRows, weekendEndorsementExportFileName } from "../lib/weekend-endorsement-export-data";

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

  it("ينشئ ملف Excel مصفّى يضم الملخص وخطط المرضى فقط", () => {
    const report = buildWeekendEndorsementReport(createInitialDepartmentData(), "Admin", "Dr. Hashmi");
    const rows = weekendEndorsementExcelRows(report, "en");
    const workbook = createWeekendEndorsementWorkbook(report, "en");

    expect(weekendEndorsementExportFileName(report, "xlsx")).toContain("dr-hashmi");
    expect(rows.summary).toContainEqual(["Scope", "Dr. Hashmi"]);
    expect(rows.plans).toHaveLength(2);
    expect(workbook.SheetNames).toEqual(["Summary", "Inpatient plans"]);
  });

  it("يبحث في نتائج الاستشاري بالاسم أو رقم الملف دون تغيير نطاق التقرير", () => {
    const report = buildWeekendEndorsementReport(createInitialDepartmentData(), "Admin", "Dr. Hashmi");
    const entry = report.entries[0];

    expect(searchWeekendEndorsementEntries(report.entries, entry.fileNumber)).toEqual([entry]);
    expect(searchWeekendEndorsementEntries(report.entries, entry.patientName.slice(0, 3))).toEqual([entry]);
    expect(searchWeekendEndorsementEntries(report.entries, "no match")).toEqual([]);
    expect(report.entries).toHaveLength(1);
  });
});
