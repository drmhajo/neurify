import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("Password visibility control", () => {
  it("keeps the password masked by default and exposes an accessible bilingual toggle", () => {
    const login = fs.readFileSync(path.join(root, "app", "login.tsx"), "utf8");
    expect(login).toContain('const [passwordVisible, setPasswordVisible] = useState(false)');
    expect(login).toContain("secureTextEntry={!passwordVisible}");
    expect(login).toContain('name={passwordVisible ? "visibility-off" : "visibility"}');
    expect(login).toContain("Show password");
    expect(login).toContain("إظهار كلمة المرور");
    expect(login).toContain('accessibilityRole="button"');
  });
});
