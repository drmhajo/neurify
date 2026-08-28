import { describe, expect, it } from "vitest";
import { rolePermissionDefaults, type DepartmentUser } from "../lib/department-model";

describe("وصول المستخدمين المعتمدين للملفات الطبية", () => {
  it("يمنح الحساب المعتمد حديثًا صلاحيات تحرير الملف اللازمة دون إسناد فريق", () => {
    const user: DepartmentUser = { id: "remote-reg-test", username: "test@hospital.sa", name: "Registration Test", email: "test@hospital.sa", phone: "0500000000", jobTitle: "Resident", role: "team_member", teamIds: [], active: true, permissions: rolePermissionDefaults.team_member, passwordRecoveryRequired: false };
    expect(user.active).toBe(true);
    expect(user.teamIds).toEqual([]);
    expect(user.permissions).toContain("edit_medical_files");
  });
});
