import { describe, expect, it } from "vitest";
import { shouldLockLocalBootstrap } from "../lib/local-bootstrap";

const freshDeviceData = {
  initialSetupCompleted: false,
  users: [{ id: "u-admin" }],
} as unknown as Parameters<typeof shouldLockLocalBootstrap>[0];

describe("local administrator bootstrap", () => {
  it("locks the local bootstrap when no local administrator password exists", () => {
    expect(shouldLockLocalBootstrap(freshDeviceData, false)).toBe(true);
    expect(shouldLockLocalBootstrap(freshDeviceData, true)).toBe(false);
  });

  it("does not lock an already configured or multi-user workspace", () => {
    expect(shouldLockLocalBootstrap({ ...freshDeviceData, initialSetupCompleted: true }, false)).toBe(false);
    expect(shouldLockLocalBootstrap({ ...freshDeviceData, users: [...freshDeviceData.users, { id: "remote-user" } as typeof freshDeviceData.users[number]] }, false)).toBe(false);
  });
});
