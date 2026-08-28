import { describe, expect, it } from "vitest";
import { createInitialDepartmentData } from "../lib/department-model";
import { eligibleOnCallUsers, isEligibleForOnCallSlot, searchOnCallUsers } from "../lib/on-call-eligibility";

describe("أهلية قوائم المناوبين", () => {
  it("تقصر كل دور على الفئة الوظيفية النشطة المطلوبة", () => {
    const users = createInitialDepartmentData().users.map((user) => ({ ...user, active: ["u-roster-omer", "u-roster-shoaib", "u-roster-sami"].includes(user.id) }));

    expect(eligibleOnCallUsers(users, "first").map((user) => user.name)).toEqual(["Omer"]);
    expect(eligibleOnCallUsers(users, "second").map((user) => user.name)).toEqual(["Shoaib"]);
    expect(eligibleOnCallUsers(users, "third").map((user) => user.name)).toEqual(["Sami"]);
  });

  it("لا يسمح بحفظ مستخدم خارج فئته الوظيفية في دور المناوبة", () => {
    const users = createInitialDepartmentData().users;
    const consultant = users.find((user) => user.id === "u-roster-sami")!;
    const specialist = users.find((user) => user.id === "u-roster-shoaib")!;

    expect(isEligibleForOnCallSlot(consultant, "first")).toBe(false);
    expect(isEligibleForOnCallSlot(specialist, "second")).toBe(false);
  });

  it("يبحث بالاسم أو المسمى ضمن قائمة المستخدمين المؤهلين فقط", () => {
    const users = createInitialDepartmentData().users.map((user) => ({ ...user, active: ["u-roster-omer", "u-roster-tahir", "u-roster-shoaib"].includes(user.id) }));
    const residents = eligibleOnCallUsers(users, "first");

    expect(searchOnCallUsers(residents, "omer").map((user) => user.name)).toEqual(["Omer"]);
    expect(searchOnCallUsers(residents, "مقيم").map((user) => user.name)).toEqual(["Omer", "Tahir"]);
    expect(searchOnCallUsers(residents, "specialist")).toEqual([]);
  });
});
