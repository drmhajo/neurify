import type { DepartmentData, PatientCase } from "@/lib/department-model";

export type PatientFileSearchResult = Pick<PatientCase, "id" | "fileNumber" | "fullName" | "diagnosis" | "status"> & { teamId: string; teamName: string };

export function normalizeFileNumber(value: string) {
  return value.trim().toUpperCase().replace(/[\s-]+/g, "");
}

export function normalizePatientSearchText(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function searchActivePatientFiles(data: DepartmentData, query: string): PatientFileSearchResult[] {
  const normalizedFileQuery = normalizeFileNumber(query);
  const normalizedDiagnosisQuery = normalizePatientSearchText(query);
  if (!normalizedFileQuery || !normalizedDiagnosisQuery) return [];
  return data.teams
    .flatMap((team) => team.cases.map((patient) => ({ ...patient, teamId: team.id, teamName: team.name })))
    .filter((patient) =>
      normalizeFileNumber(patient.fileNumber).includes(normalizedFileQuery)
      || normalizePatientSearchText(patient.diagnosis).includes(normalizedDiagnosisQuery),
    );
}
