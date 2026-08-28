import type { DepartmentData } from "./department-model";

export function shouldLockLocalBootstrap(data: Pick<DepartmentData, "initialSetupCompleted" | "users">, localAdminPasswordExists: boolean): boolean {
  const onlyLocalBootstrapAdmin = data.users.length === 1 && data.users[0]?.id === "u-admin";
  return data.initialSetupCompleted === false && onlyLocalBootstrapAdmin && !localAdminPasswordExists;
}
