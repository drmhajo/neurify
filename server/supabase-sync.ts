import {
  PILOT_WORKSPACE_KEY,
  parseCloudDepartmentData,
  prepareDepartmentDataForCloud,
} from "../lib/department-sync";
import type { DepartmentData } from "../lib/department-model";

const MAX_SNAPSHOT_BYTES = 7_500_000;

type SnapshotRow = {
  workspace_key: string;
  schema_version: number;
  data: unknown;
  version: number;
  updated_at: string;
  updated_by: string;
};

export type CloudDepartmentSnapshot = {
  data: DepartmentData;
  version: number;
  updatedAt: string;
  updatedBy: string;
};

function getProjectUrl() {
  const configured = process.env.SUPABASE_URL;
  if (!configured) throw new Error("Supabase is not configured.");
  return configured.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function getServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Supabase server credential is not configured.");
  return key;
}

function mapSnapshot(row: SnapshotRow): CloudDepartmentSnapshot {
  return {
    data: parseCloudDepartmentData(row.data),
    version: row.version,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

async function readApiError(response: Response) {
  const detail = await response.text().catch(() => response.statusText);
  return `Supabase request failed (${response.status}): ${detail.slice(0, 500)}`;
}

export async function getPilotSnapshot(): Promise<CloudDepartmentSnapshot | null> {
  const projectUrl = getProjectUrl();
  const key = getServiceRoleKey();
  const response = await fetch(
    `${projectUrl}/rest/v1/department_snapshots?workspace_key=eq.${encodeURIComponent(PILOT_WORKSPACE_KEY)}&select=workspace_key,schema_version,data,version,updated_at,updated_by&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" } },
  );
  if (!response.ok) throw new Error(await readApiError(response));
  const rows = await response.json() as SnapshotRow[];
  return rows.length ? mapSnapshot(rows[0]) : null;
}

export async function savePilotSnapshot(input: { data: unknown; actorName: string }): Promise<CloudDepartmentSnapshot> {
  const parsedData = parseCloudDepartmentData(input.data);
  const data = prepareDepartmentDataForCloud(parsedData);
  const serialized = JSON.stringify(data);
  if (serialized.length > MAX_SNAPSHOT_BYTES) throw new Error("Pilot snapshot is too large to synchronize.");

  const actorName = input.actorName.trim();
  if (!actorName || actorName.length > 120) throw new Error("A valid sync actor is required.");

  const existing = await getPilotSnapshot();
  const key = getServiceRoleKey();
  const response = await fetch(`${getProjectUrl()}/rest/v1/department_snapshots?on_conflict=workspace_key`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      workspace_key: PILOT_WORKSPACE_KEY,
      schema_version: 1,
      data,
      version: (existing?.version ?? 0) + 1,
      updated_at: new Date().toISOString(),
      updated_by: actorName,
    }),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  const rows = await response.json() as SnapshotRow[];
  if (!rows.length) throw new Error("Supabase did not return the saved snapshot.");
  return mapSnapshot(rows[0]);
}
