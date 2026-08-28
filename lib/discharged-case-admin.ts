import type { DepartmentData, DischargedPatient, PatientCase, UserRole } from "@/lib/department-model";

export type ArchivedCaseUpdate = Pick<PatientCase, "fullName" | "age" | "medicalHistory" | "clinicalTests" | "diagnosis" | "ward" | "bed"> & Pick<DischargedPatient, "dischargeReason">;

export function canManageDischargedCases(role?: UserRole) {
  return role === "admin";
}

export function updateDischargedCase(data: DepartmentData, teamId: string, caseId: string, update: ArchivedCaseUpdate): DepartmentData {
  return { ...data, teams: data.teams.map((team) => team.id === teamId ? { ...team, dischargedCases: (team.dischargedCases ?? []).map((patient) => patient.id === caseId ? { ...patient, ...update } : patient) } : team) };
}

export function deleteDischargedCase(data: DepartmentData, teamId: string, caseId: string): DepartmentData {
  return { ...data, teams: data.teams.map((team) => team.id === teamId ? { ...team, dischargedCases: (team.dischargedCases ?? []).filter((patient) => patient.id !== caseId) } : team) };
}
