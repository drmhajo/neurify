import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("Light launcher icon", () => {
  it("uses the safe-area light master for the launcher and adaptive icon assets", () => {
    const script = fs.readFileSync(path.join(root, "scripts", "build_neurify_app_assets.py"), "utf8");
    expect(script).toContain("neurify-app-icon-light-safe-corrected.png");
    expect(script).toContain("LIGHT_BACKGROUND = (244, 248, 250)");
    expect(script).toContain("full neural-path symbol inside its safe area");
    const appConfig = fs.readFileSync(path.join(root, "app.config.ts"), "utf8");
    expect(appConfig).toContain("IbIfxQJZJkslXVmk.png");
    expect(appConfig).toContain('backgroundColor: "#F4F8FA"');
  });
});
