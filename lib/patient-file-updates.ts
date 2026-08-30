import type { PatientCase } from "@/lib/department-model";

export function hasUnreadPatientUpdate(patient: Pick<PatientCase, "lastUpdatedAt" | "updateReadByUserIds">, userId?: string) {
  return Boolean(patient.lastUpdatedAt && userId && !patient.updateReadByUserIds?.includes(userId));
}

export function patientUpdateMarker(userId: string | undefined, updatedBy: string) {
  return {
    lastUpdatedAt: new Date().toISOString(),
    lastUpdatedBy: updatedBy,
    updateReadByUserIds: userId ? [userId] : [],
  };
}
