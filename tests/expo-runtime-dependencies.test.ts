import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("اعتمادات Expo الأصلية", () => {
  it("keeps expo-asset installed and configured for expo-audio production builds", () => {
    const packageJson = readFileSync(resolve(process.cwd(), "package.json"), "utf8");
    const appConfig = readFileSync(resolve(process.cwd(), "app.config.ts"), "utf8");

    expect(packageJson).toContain('"expo-asset": "~12.0.13"');
    expect(appConfig).toContain('"expo-asset"');
  });
});
