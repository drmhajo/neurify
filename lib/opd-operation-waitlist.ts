import type { DepartmentData, OpdOperationWaitingEntry, PermissionKey, UserRole } from "@/lib/department-model";

export const OPD_OPERATION_PRIORITIES = ["عاجل", "قريب", "روتيني"] as const;
export const OPD_OPERATION_STATUSES = ["بانتظار مراجعة", "معتمد", "مجدول", "مكتمل", "ملغى"] as const;

export function canManageOpdOperationWaitingList(role: UserRole | undefined, permissions: PermissionKey[] | undefined) {
  return role === "admin" || Boolean(permissions?.includes("manage_schedules"));
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
