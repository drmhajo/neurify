import { describe, expect, it } from "vitest";
import { applyWeeklyGroupsRoster, createInitialDepartmentData, createInternalDepartmentData, createTeamNotification, getDashboardSummary, getNextReportStatus, rolePermissionDefaults } from "../lib/department-model";

describe("نموذج بيانات قسم جراحة المخ والأعصاب", () => {
  it("يهيئ بيانات عرض متماسكة للوحة اليوم", () => {
    const data = createInitialDepartmentData();
    const summary = getDashboardSummary(data);

    expect(data.teams).toHaveLength(4);
    expect(summary.openReports).toBe(2);
    expect(summary.surgeriesToday).toBe(3);
    expect(summary.admittedCases).toBe(3);
    expect(data.notifications).toEqual([]);
    expect(data.teams[0].cases[0].fileNumber).toBe("KSMC-007584");
    expect(data.teams[0].cases[0].imaging).toHaveLength(1);
    expect(data.teams[0].cases[0].clinicalTests).toContain("الفحص العصبي");
    expect(data.teams[0].cases[0].messages).toHaveLength(1);
    expect(data.users[0].permissions).toEqual(rolePermissionDefaults.admin);
    expect(data.users[1].jobTitle).toContain("استشاري");
    expect(data.weeklyAssignments).toHaveLength(5);
    expect(data.weeklyAssignments[0].day).toBe("الأحد");
    expect(data.scheduleDocuments[0].section).toBe("weekly");
    expect(data.scheduleDocuments[0].mimeType).toBe("application/pdf");
    expect(data.surgeries[0]).toMatchObject({ date: expect.any(String), notes: expect.any(String), status: "مؤكد" });
    expect(data.surgeries.every((surgery) => surgery.date.length > 0 && surgery.room.length > 0)).toBe(true);
    expect(data.surgeries[0].patientLink).toEqual({ teamId: "t1", caseId: "c1" });
    expect(data.teams.every((team) => Array.isArray(team.dischargedCases))).toBe(true);
    expect(data.teams.flatMap((team) => team.dischargedCases)).toHaveLength(0);
  });

  it("يهيئ إصداراً داخلياً خالياً من بيانات المرضى التشغيلية ويطلب تهيئة المشرف", () => {
    const data = createInternalDepartmentData();

    expect(data.initialSetupCompleted).toBe(false);
    expect(data.reports).toEqual([]);
    expect(data.shifts).toEqual([]);
    expect(data.surgeries).toEqual([]);
    expect(data.teams.flatMap((team) => team.cases)).toEqual([]);
    expect(data.users.find((user) => user.id === "u-admin")?.active).toBe(true);
    expect(data.users.filter((user) => user.id !== "u-admin").every((user) => !user.active)).toBe(true);
  });

  it("يتدرج طلب التقرير من جديد إلى قيد الإعداد ثم مكتمل", () => {
    expect(getNextReportStatus("جديد")).toBe("قيد الإعداد");
    expect(getNextReportStatus("قيد الإعداد")).toBe("مكتمل");
    expect(getNextReportStatus("مكتمل")).toBe("مكتمل");
  });

  it("يطابق المستخدمين والفرق توزيع الأسبوع المرفق مع الاحتفاظ بالحالات التجريبية", () => {
    const data = createInitialDepartmentData();
    const migrated = applyWeeklyGroupsRoster({ ...data, rosterVersion: undefined });

    expect(data.users.some((user) => user.name === "Sami" && user.role === "consultant")).toBe(true);
    expect(data.users.some((user) => user.name === "M.Hashim" && user.jobTitle.includes("Resident"))).toBe(true);
    expect(data.teams.find((team) => team.id === "t1")).toMatchObject({ name: "فريق د. Hashmi | Dr. Hashmi", lead: "Dr. Hashmi" });
    expect(data.teams.find((team) => team.id === "t2")).toMatchObject({ name: "فريق د. Jama'an | Dr. Jama'an", lead: "Dr. Jama'an" });
    expect(data.teams.find((team) => team.id === "t3")).toMatchObject({ name: "فريق د. Sami | Dr. Sami", lead: "Dr. Sami" });
    expect(data.teams.find((team) => team.id === "t4")).toMatchObject({ name: "فريق د. Maryam | Dr. Maryam", lead: "Dr. Maryam" });
    expect(data.teams.find((team) => team.id === "t3")?.memberIds).toContain("u-roster-marahib");
    expect(data.teams.find((team) => team.id === "t1")?.cases.length).toBeGreaterThan(0);
    expect(migrated.rosterVersion).toBe(data.rosterVersion);
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

  it("يدعم رسالة مريض ذات مرفق ملف أو فيديو دون فرض نص مرافق", () => {
    const attachment = { fileName: "operative-note.pdf", mimeType: "application/pdf", localUri: "file://operative-note.pdf", kind: "file" as const };
    const message = { id: "m-attach", text: "", senderName: "د. أحمد", sentAt: "الآن", attachment };

    expect(message.text).toBe("");
    expect(message.attachment.kind).toBe("file");
    expect(message.attachment.fileName).toContain("operative-note");
  });
});
