import { describe, expect, it } from "vitest";
import { canRemoveDepartmentUser, isValidDemoUsername, normalizeDemoUsername } from "../lib/department-user-admin";
import type { DepartmentUser } from "../lib/department-model";

const users: DepartmentUser[] = [
  { id: "admin", username: "admin", name: "Admin", role: "admin", jobTitle: "Lead", teamIds: [], active: true, permissions: [] },
  { id: "staff", username: "staff.user", name: "Staff", role: "team_member", jobTitle: "Member", teamIds: ["t1"], active: true, permissions: [] },
];

describe("إدارة حسابات القسم التجريبية", () => {
  it("يوحّد اسم المستخدم ويتحقق من صيغته", () => {
    expect(normalizeDemoUsername("  Staff User  ")).toBe("staff.user");
    expect(isValidDemoUsername("staff.user")).toBe(true);
    expect(isValidDemoUsername("غير صالح")).toBe(false);
  });

  it("يمنع إزالة المشرف الحالي أو آخر مشرف نشط", () => {
    expect(canRemoveDepartmentUser(users, "admin", "admin")).toBe(false);
    expect(canRemoveDepartmentUser(users, "admin", "staff")).toBe(false);
    expect(canRemoveDepartmentUser(users, "staff", "admin")).toBe(true);
  });
});
