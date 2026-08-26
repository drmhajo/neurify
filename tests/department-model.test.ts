import { describe, expect, it } from "vitest";
import { createInitialDepartmentData, createTeamNotification, getDashboardSummary, getNextReportStatus } from "../lib/department-model";

describe("نموذج بيانات قسم جراحة المخ والأعصاب", () => {
  it("يهيئ بيانات عرض متماسكة للوحة اليوم", () => {
    const data = createInitialDepartmentData();
    const summary = getDashboardSummary(data);

    expect(data.teams).toHaveLength(3);
    expect(summary.openReports).toBe(2);
    expect(summary.surgeriesToday).toBe(3);
    expect(summary.admittedCases).toBe(3);
    expect(data.notifications).toEqual([]);
  });

  it("يتدرج طلب التقرير من جديد إلى قيد الإعداد ثم مكتمل", () => {
    expect(getNextReportStatus("جديد")).toBe("قيد الإعداد");
    expect(getNextReportStatus("قيد الإعداد")).toBe("مكتمل");
    expect(getNextReportStatus("مكتمل")).toBe("مكتمل");
  });

  it("يوجه التنبيه إلى أعضاء الفريق فقط ولا يعرض تشخيص الحالة المنوّمة", () => {
    const data = createInitialDepartmentData();
    const team = data.teams[0];
    const notification = createTeamNotification({ id: "n-test", type: "admitted_case", team });

    expect(notification.recipientIds).toEqual(team.memberIds);
    expect(notification.teamId).toBe(team.id);
    expect(notification.message).not.toContain(team.cases[0].diagnosis);
    expect(notification.readByUserIds).toEqual([]);
  });
});
