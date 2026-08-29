import type { UserRole } from "./department-model";

export type DepartmentSession = {
  userId: string;
  name: string;
  role: UserRole;
  pushProof?: string;
  dataProof?: string;
};

const sessionRoles: UserRole[] = ["admin", "consultant", "coordinator", "team_member"];

/**
 * Normalizes sessions retained by old Android builds before the `name` and
 * `pushProof` fields existed, preventing legacy storage from crashing screens.
 */
export function parseStoredDepartmentSession(raw: string): DepartmentSession | null {
  try {
    const parsed = JSON.parse(raw) as Partial<DepartmentSession>;
    if (!parsed || typeof parsed.userId !== "string" || !parsed.userId.trim()) return null;
    return {
      userId: parsed.userId,
      name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : "عضو القسم",
      role: sessionRoles.includes(parsed.role as UserRole) ? (parsed.role as UserRole) : "team_member",
      ...(typeof parsed.pushProof === "string" && parsed.pushProof ? { pushProof: parsed.pushProof } : {}),
      ...(typeof parsed.dataProof === "string" && parsed.dataProof ? { dataProof: parsed.dataProof } : {}),
    };
  } catch {
    return null;
  }
}
