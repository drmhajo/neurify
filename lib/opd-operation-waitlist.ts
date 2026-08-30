import type { DepartmentData, OpdOperationWaitingEntry, PermissionKey, UserRole } from "@/lib/department-model";

export const OPD_OPERATION_PRIORITIES = ["عاجل", "قريب", "روتيني"] as const;
export const OPD_OPERATION_STATUSES = ["بانتظار مراجعة", "معتمد", "مجدول", "مكتمل", "ملغى"] as const;

export function canAddOpdOperationWaitingList(role: UserRole | undefined) {
  return Boolean(role);
}

export function canSuperviseOperations(role: UserRole | undefined, permissions: PermissionKey[] | undefined) {
  return role === "admin" || Boolean(permissions?.includes("manage_operations"));
}

export function canManageOpdOperationWaitingList(role: UserRole | undefined, permissions: PermissionKey[] | undefined) {
  return canSuperviseOperations(role, permissions);
}

export function findOpdWaitingListPatientLink(data: DepartmentData, fileNumber: string): OpdOperationWaitingEntry["patientLink"] {
  const normalized = fileNumber.trim();
  if (!normalized) return undefined;
  return data.teams
    .flatMap((team) => team.cases.map((patient) => patient.fileNumber === normalized || patient.code === normalized ? { teamId: team.id, caseId: patient.id } : undefined))
    .find(Boolean);
}

export function opdPriorityLabel(priority: OpdOperationWaitingEntry["priority"], language: "ar" | "en") {
  if (language === "ar") return priority;
  return priority === "عاجل" ? "Urgent" : priority === "قريب" ? "Soon" : "Routine";
}

export function opdStatusLabel(status: OpdOperationWaitingEntry["status"], language: "ar" | "en") {
  if (language === "ar") return status;
  return status === "بانتظار مراجعة" ? "Awaiting review" : status === "معتمد" ? "Approved" : status === "مجدول" ? "Scheduled" : status === "مكتمل" ? "Completed" : "Cancelled";
}

/** A newly submitted request remains visually new until an Operations supervisor changes its status. */
export function isOpdWaitingEntryNew(entry: OpdOperationWaitingEntry) {
  return entry.status === "بانتظار مراجعة";
}

export function opdNewEntryLabel(language: "ar" | "en") {
  return language === "en" ? "NEW · Review needed" : "جديد · يحتاج مراجعة";
}
