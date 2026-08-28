import type { DepartmentData, PatientCase } from "@/lib/department-model";

export type PatientFileSearchResult = Pick<PatientCase, "id" | "fileNumber" | "fullName" | "diagnosis" | "status"> & { teamId: string; teamName: string };

export function normalizeFileNumber(value: string) {
  return value.trim().toUpperCase().replace(/[\s-]+/g, "");
}

export function searchActivePatientFiles(data: DepartmentData, query: string): PatientFileSearchResult[] {
  const normalizedQuery = normalizeFileNumber(query);
  if (!normalizedQuery) return [];
  return data.teams.flatMap((team) => team.cases.map((patient) => ({ ...patient, teamId: team.id, teamName: team.name }))).filter((patient) => normalizeFileNumber(patient.fileNumber).includes(normalizedQuery));
}
