import type { CareTeam, DepartmentData, MedicalReport, TeamNotification } from "./department-model";
import { formatRiyadhDateTime, getRiyadhDateKey } from "./riyadh-time";

export const REPORT_REMINDER_DELAY_MS = 3 * 24 * 60 * 60 * 1000;

function normalizedName(value: string) {
  return value.toLocaleLowerCase().replace(/doctor|dr\.?|دكتور|الدكتور|د\./giu, "").replace(/[^\p{L}\p{N}]/gu, "");
}

/** Resolves the current treating team from an exact patient code or file-number match. */
export function findTreatingTeam(data: DepartmentData, patientCode: string) {
  const normalizedCode = patientCode.trim();
  if (!normalizedCode) return undefined;
  return data.teams.find((team) => team.cases.some((patientCase) => (
    patientCase.code.trim() === normalizedCode
    || patientCase.fileNumber.trim() === normalizedCode
  )));
}

/** Only the selected team determines notification scope; no patient matching is used to widen recipients. */
export function resolveReportRecipientIds(data: DepartmentData, team: CareTeam) {
  const lead = normalizedName(team.lead);
  return [...new Set(data.users.filter((user) => user.active && (
    team.memberIds.includes(user.id)
    || (user.role === "consultant" && (user.teamIds.includes(team.id) || normalizedName(user.name) === lead))
  )).map((user) => user.id))];
}

export function createReportRequestNotification(input: { id: string; team: CareTeam; recipientIds: string[]; createdAt: string; reminder?: boolean }): TeamNotification {
  const isReminder = Boolean(input.reminder);
  return {
    id: input.id,
    type: isReminder ? "report_request_reminder" : "report_request",
    teamId: input.team.id,
    teamName: input.team.name,
    title: isReminder ? "تذكير: طلب تقرير يحتاج متابعة" : "طلب تقرير جديد يحتاج متابعة",
    message: isReminder
      ? "لا يزال طلب تقرير مفتوحاً. افتح صفحة التقارير لمتابعة الإجراء المطلوب."
      : "تم إنشاء طلب تقرير لفريقك العلاجي. افتح صفحة التقارير لمتابعة الإجراء المطلوب.",
    createdAt: input.createdAt,
    recipientIds: [...new Set(input.recipientIds)],
    readByUserIds: [],
  };
}

export function isReportReminderDue(report: MedicalReport, now = new Date()) {
  const createdAt = report.createdAtIso ? Date.parse(report.createdAtIso) : Number.NaN;
  return !report.notifyCompletedAt && Number.isFinite(createdAt) && now.getTime() >= createdAt + REPORT_REMINDER_DELAY_MS;
}

export function canCompleteReportNotification(report: MedicalReport, userId?: string, isReportManager = false) {
  return Boolean(userId && !report.notifyCompletedAt && (isReportManager || (report.recipientIds ?? []).includes(userId)));
}

/** Marks one due reminder per Riyadh day before dispatch, so retries cannot duplicate notifications. */
export function prepareDailyReportReminders(data: DepartmentData, now = new Date()) {
  const dateKey = getRiyadhDateKey(now);
  const notifications = [...(data.notifications ?? [])];
  const reportIds: string[] = [];
  const reports = data.reports.map((report) => {
    if (!isReportReminderDue(report, now) || report.lastReminderDate === dateKey || !report.teamId || !(report.recipientIds ?? []).length) return report;
    const team = data.teams.find((candidate) => candidate.id === report.teamId);
    if (!team) return report;
    const notificationId = `n-report-reminder-${report.id}-${dateKey}`;
    if (!notifications.some((notification) => notification.id === notificationId)) {
      notifications.unshift(createReportRequestNotification({ id: notificationId, team, recipientIds: report.recipientIds ?? [], createdAt: formatRiyadhDateTime(now.toISOString()), reminder: true }));
    }
    reportIds.push(report.id);
    return { ...report, lastReminderDate: dateKey, lastReminderStatus: "no_registered_devices" as const };
  });
  return { data: { ...data, reports, notifications }, reportIds };
}

export function recordReportReminderDelivery(data: DepartmentData, reportId: string, submitted: number, now = new Date()) {
  return {
    ...data,
    reports: data.reports.map((report) => report.id !== reportId ? report : {
      ...report,
      lastReminderAt: now.toISOString(),
      lastReminderStatus: submitted > 0 ? "sent" as const : "no_registered_devices" as const,
    }),
  };
}
