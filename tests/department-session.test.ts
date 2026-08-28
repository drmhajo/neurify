import { describe, expect, it } from "vitest";
import { parseStoredDepartmentSession } from "../lib/department-session";

describe("stored department session migration", () => {
  it("repairs a legacy Android session missing the optional display fields", () => {
    expect(parseStoredDepartmentSession(JSON.stringify({ userId: "u-legacy", role: "admin" }))).toEqual({
      userId: "u-legacy",
      name: "عضو القسم",
      role: "admin",
    });
  });

  it("keeps valid central-session data and uses a safe role when old data is invalid", () => {
    expect(parseStoredDepartmentSession(JSON.stringify({ userId: "remote-1", name: "Dr. Amal", role: "consultant", pushProof: "proof" }))).toEqual({
      userId: "remote-1",
      name: "Dr. Amal",
      role: "consultant",
      pushProof: "proof",
    });
    expect(parseStoredDepartmentSession(JSON.stringify({ userId: "u-old", name: "", role: "former_role" }))).toEqual({
      userId: "u-old",
      name: "عضو القسم",
      role: "team_member",
    });
  });

  it("rejects malformed or incomplete persisted content instead of crashing the application", () => {
    expect(parseStoredDepartmentSession("not-json")).toBeNull();
    expect(parseStoredDepartmentSession(JSON.stringify({ name: "No identifier" }))).toBeNull();
  });
});
