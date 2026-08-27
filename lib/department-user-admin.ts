import type { DepartmentUser } from "./department-model";

export function normalizeDemoUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ".");
}

export function isValidDemoUsername(value: string) {
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(value);
}

export function canRemoveDepartmentUser(users: DepartmentUser[], targetUserId: string, currentUserId?: string) {
  const target = users.find((user) => user.id === targetUserId);
  if (!target || targetUserId === currentUserId) return false;
  const activeAdministrators = users.filter((user) => user.active && user.role === "admin");
  return !(target.role === "admin" && activeAdministrators.length <= 1);
}
