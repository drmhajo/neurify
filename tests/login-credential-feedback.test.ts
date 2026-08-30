import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("تنبيه بيانات اعتماد الدخول", () => {
  it("يستخدم تسمية مختصرة ويعرض تنبيهًا واضحًا للبيانات الناقصة أو الخاطئة", () => {
    const screen = fs.readFileSync(path.join(root, "app", "login.tsx"), "utf8");

    expect(screen).toContain('"Username or approved email"');
    expect(screen).toContain('"اسم المستخدم أو البريد المعتمد"');
    expect(screen).toContain("const [credentialError, setCredentialError]");
    expect(screen).toContain('accessibilityRole="alert"');
    expect(screen).toContain("credentialStyles.inputShell");
  });
});
