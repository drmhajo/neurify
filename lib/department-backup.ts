import type { DepartmentData } from "@/lib/department-model";

export const DEPARTMENT_BACKUP_FORMAT = "ksmc-neurosurgery-backup" as const;
export const DEPARTMENT_BACKUP_VERSION = 1 as const;

export type DepartmentBackup = {
  format: typeof DEPARTMENT_BACKUP_FORMAT;
  version: typeof DEPARTMENT_BACKUP_VERSION;
  exportedAt: string;
  exportedBy: string;
  data: DepartmentData;
};

const requiredCollections = ["users", "reports", "shifts", "surgeries", "weeklyAssignments", "scheduleDocuments", "teams", "notifications"] as const;

export function createDepartmentBackup(data: DepartmentData, exportedBy: string): DepartmentBackup {
  return { format: DEPARTMENT_BACKUP_FORMAT, version: DEPARTMENT_BACKUP_VERSION, exportedAt: new Date().toISOString(), exportedBy, data };
}

export function parseDepartmentBackup(source: string | unknown): { ok: true; backup: DepartmentBackup } | { ok: false; error: string } {
  let candidate: unknown = source;
  if (typeof source === "string") {
    try { candidate = JSON.parse(source); }
    catch { return { ok: false, error: "تعذر قراءة ملف النسخة الاحتياطية." }; }
  }
  if (!isRecord(candidate) || candidate.format !== DEPARTMENT_BACKUP_FORMAT || candidate.version !== DEPARTMENT_BACKUP_VERSION) return { ok: false, error: "تنسيق النسخة الاحتياطية غير مدعوم." };
  if (typeof candidate.exportedAt !== "string" || typeof candidate.exportedBy !== "string" || !isRecord(candidate.data)) return { ok: false, error: "بيانات النسخة الاحتياطية غير مكتملة." };
  for (const key of requiredCollections) if (!Array.isArray(candidate.data[key])) return { ok: false, error: "لا تحتوي النسخة على جميع أقسام بيانات القسم." };
  const users = candidate.data.users as unknown[];
  const teams = candidate.data.teams as unknown[];
  const surgeries = candidate.data.surgeries as unknown[];
  if (!users.every((user) => isRecord(user) && typeof user.id === "string" && typeof user.name === "string") || !teams.every((team) => isRecord(team) && typeof team.id === "string" && Array.isArray(team.cases)) || !surgeries.every((surgery) => isRecord(surgery) && typeof surgery.id === "string" && typeof surgery.status === "string")) return { ok: false, error: "تحتوي النسخة على سجلات قسم غير صالحة." };
  return { ok: true, backup: candidate as DepartmentBackup };
}

export function backupFileName(backup: DepartmentBackup) {
  return `ksmc-neurosurgery-backup-${backup.exportedAt.slice(0, 10)}.json`;
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
