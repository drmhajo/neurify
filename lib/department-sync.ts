import {
  DEPARTMENT_BACKUP_FORMAT,
  DEPARTMENT_BACKUP_VERSION,
  parseDepartmentBackup,
} from "./department-backup";
import type { DepartmentData } from "./department-model";

export const PILOT_WORKSPACE_KEY = "ksmc-neurosurgery-pilot";

export type DepartmentSyncStatus = "local" | "syncing" | "synced" | "offline" | "error";

export type DepartmentSyncState = {
  status: DepartmentSyncStatus;
  lastSyncedAt?: string;
  version?: number;
};

export function syncFailureStatus(error: unknown): "offline" | "error" {
  const message = error instanceof Error ? error.message : String(error);
  return /network|fetch|offline|timeout|failed to fetch/i.test(message) ? "offline" : "error";
}

/**
 * Omits device-only file paths before sending the pilot snapshot to the cloud.
 * The file bytes are never copied by this synchronization layer.
 */
export function prepareDepartmentDataForCloud(data: DepartmentData): DepartmentData {
  return {
    ...data,
    scheduleDocuments: data.scheduleDocuments.map((document) => ({ ...document, localUri: "" })),
    teams: data.teams.map((team) => ({
      ...team,
      cases: team.cases.map((patientCase) => ({
        ...patientCase,
        imaging: patientCase.imaging.map((image) => ({ ...image, localUri: "" })),
        messages: patientCase.messages.map((message) => ({
          ...message,
          attachment: message.attachment ? { ...message.attachment, localUri: "" } : undefined,
        })),
      })),
      dischargedCases: team.dischargedCases.map((patientCase) => ({
        ...patientCase,
        imaging: patientCase.imaging.map((image) => ({ ...image, localUri: "" })),
        messages: patientCase.messages.map((message) => ({
          ...message,
          attachment: message.attachment ? { ...message.attachment, localUri: "" } : undefined,
        })),
      })),
    })),
  };
}

/** Restores local file references only when the same record already exists on this device. */
export function restoreLocalAttachmentReferences(cloudData: DepartmentData, localData: DepartmentData): DepartmentData {
  const scheduleUris = new Map(localData.scheduleDocuments.map((document) => [document.id, document.localUri]));
  const imagingUris = new Map(
    localData.teams.flatMap((team) => [...team.cases, ...team.dischargedCases])
      .flatMap((patientCase) => patientCase.imaging)
      .map((image) => [image.id, image.localUri]),
  );
  const messageAttachmentUris = new Map(
    localData.teams.flatMap((team) => [...team.cases, ...team.dischargedCases])
      .flatMap((patientCase) => patientCase.messages)
      .filter((message) => Boolean(message.attachment?.localUri))
      .map((message) => [message.id, message.attachment!.localUri]),
  );

  const restoreCase = <T extends DepartmentData["teams"][number]["cases"][number]>(patientCase: T): T => ({
    ...patientCase,
    imaging: patientCase.imaging.map((image) => ({ ...image, localUri: imagingUris.get(image.id) ?? image.localUri })),
    messages: patientCase.messages.map((message) => ({
      ...message,
      attachment: message.attachment
        ? { ...message.attachment, localUri: messageAttachmentUris.get(message.id) ?? message.attachment.localUri }
        : undefined,
    })),
  });

  return {
    ...cloudData,
    scheduleDocuments: cloudData.scheduleDocuments.map((document) => ({ ...document, localUri: scheduleUris.get(document.id) ?? document.localUri })),
    teams: cloudData.teams.map((team) => ({
      ...team,
      cases: team.cases.map(restoreCase),
      dischargedCases: team.dischargedCases.map(restoreCase),
    })),
  };
}

export function parseCloudDepartmentData(value: unknown): DepartmentData {
  const parsed = parseDepartmentBackup({
    format: DEPARTMENT_BACKUP_FORMAT,
    version: DEPARTMENT_BACKUP_VERSION,
    exportedAt: new Date(0).toISOString(),
    exportedBy: "cloud-sync",
    data: value,
  });

  if (!parsed.ok) throw new Error("Cloud snapshot has an unsupported structure.");
  return parsed.backup.data;
}
