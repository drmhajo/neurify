import type { DepartmentUser, OnCallSlot } from "./department-model";

const eligibilityMatchers: Record<OnCallSlot, RegExp> = {
  first: /resident|طبيب\s*مقيم/i,
  second: /specialist|أخصائي/i,
  third: /consultant|استشاري/i,
};

export function isEligibleForOnCallSlot(user: Pick<DepartmentUser, "role" | "jobTitle" | "active">, slot: OnCallSlot) {
  if (!user.active) return false;
  if (slot === "third" && user.role === "consultant") return true;
  return eligibilityMatchers[slot].test(user.jobTitle);
}

export function eligibleOnCallUsers(users: DepartmentUser[], slot: OnCallSlot) {
  return users.filter((user) => isEligibleForOnCallSlot(user, slot));
}
