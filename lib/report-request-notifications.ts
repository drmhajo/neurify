import type { CareTeam, DepartmentData, MedicalReport, TeamNotification } from "./department-model";
import { formatRiyadhDateTime, getRiyadhDateKey } from "./riyadh-time";

export const REPORT_REMINDER_DELAY_MS = 3 * 24 * 60 * 60 * 1000;

function normalizeIdentity(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/doctor|dr\.?|دكتور|الدكتور|د\./giu, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function patientCodeMatches(candidate: string, requested: string) {
  const left = candidate.trim().toLocaleLowerCase();
  const right = requested.trim().toLocaleLowerCase();
  return Boolean(left && right && left === right);
}

/** Resolves the treating team only from a patient-file code or medical record number. */
export function findTreatingTeam(data: DepartmentData, patientCode: string): CareTeam | undefined {
  return data.teams.find((team) => team.cases.some((patient) =>
    patientCodeMatches(patient.fileNumber, patientCode) || patientCodeMatches(patient.code, patientCode),
  ));
}

/** Limits recipients to active treating-team members and the linked active consultant. */
export function resolveReportRecipientIds(data: DepartmentData, team: CareTeam): string[] {
  const leadKey = normalizeIdentity(team.lead);
  const recipients = data.users.filter((user) => {
    if (!user.active) return false;
    const isTeamMember = team.memberIds.includes(user.id);
    const isLinkedConsultant = user.role === "consultant"
      && (user.teamIds.includes(team.id) || normalizeIdentity(user.name) === leadKey || leadKey.includes(normalizeIdentity(user.name)));
    return isTeamMember || isLinkedConsultant;
  });
  return [...new Set(recipients.map((user) => user.id))];
}

export function createReportRequestNotification(input: {
  id: string;
  team: CareTeam;
  recipientIds: string[];
  createdAt: string;
  reminder?: boolean;
}): TeamNotification {
  const reminder = Boolean(input.reminder);
  return {
    id: input.id,
    type: reminder ? "report_request_reminder" : "report_request",
    teamId: input.team.id,
    teamName: input.team.name,
    title: reminder ? "تذكير: طلب تقرير يحتاج متابعة" : "طلب تقرير جديد يحتاج متابعة",
    message: reminder
      ? "لا يزال طلب تقرير مفتوحاً. افتح صفحة التقارير لمتابعة الإجراء المطلوب."
      : "تم إنشاء طلب تقرير لفريقك العلاجي. افتح صفحة التقارير لمتابعة الإجراء المطلوب.",
    createdAt: input.createdAt,
    recipientIds: [...new Set(input.recipientIds)],
    readByUserIds: [],
  };
}

export function reportNotificationIsComplete(report: MedicalReport) {
  return Boolean(report.notifyCompletedAt);
}

export function mayCompleteReportNotification(report: MedicalReport, userId?: string, canManageReports = false) {
  return Boolean(userId && !reportNotificationIsComplete(report) && (canManageReports || (report.recipientIds ?? []).includes(userId)));
}

export function isReportReminderDue(report: MedicalReport, now = new Date()) {
  const createdAt = report.createdAtIso ? Date.parse(report.createdAtIso) : Number.NaN;
  return !reportNotificationIsComplete(report)
    && Number.isFinite(createdAt)
    && now.getTime() >= createdAt + REPORT_REMINDER_DELAY_MS;
}

/**
 * Creates at most one in-app reminder per Riyadh calendar day. The returned report IDs
 * must be sent as external push notifications only after the snapshot write succeeds.
 */
export function prepareDailyReportReminders(data: DepartmentData, now = new Date()) {
  const reminderDate = getRiyadhDateKey(now);
  const notifications = [...(data.notifications ?? [])];
  const reminderReportIds: string[] = [];
  const reports = data.reports.map((report) => {
    if (!isReportReminderDue(report, now) || report.lastReminderDate === reminderDate || !report.teamId) return report;
    const team = data.teams.find((candidate) => candidate.id === report.teamId);
    if (!team) return report;
    const recipients = resolveReportRecipientIds(data, team);
    if (!recipients.length) return report;
    const notificationId = `n-report-reminder-${report.id}-${reminderDate}`;
    if (!notifications.some((notification) => notification.id === notificationId)) {
      notifications.unshift(createReportRequestNotification({
        id: notificationId,
        team,
        recipientIds: recipients,
        createdAt: formatRiyadhDateTime(now.toISOString()),
        reminder: true,
      }));
    }
    reminderReportIds.push(report.id);
    return { ...report, lastReminderDate: reminderDate };
  });
  return { data: { ...data, reports, notifications }, reminderReportIds };
}
