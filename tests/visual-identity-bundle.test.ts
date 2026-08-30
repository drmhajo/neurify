import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("حزمة الهوية المرئية المحلية", () => {
  it("تضمّن أصول الهوية وخط Material Icons في حزمة Android", () => {
    const config = fs.readFileSync(path.join(root, "app.config.ts"), "utf8");
    const layout = fs.readFileSync(path.join(root, "app", "_layout.tsx"), "utf8");
    const gradlePlugin = fs.readFileSync(path.join(root, "plugins", "with-gradle-constraints.js"), "utf8");

    const requiredVisualAssets = [
      "icon.png",
      "splash-icon.png",
      "favicon.png",
      "android-icon-background.png",
      "android-icon-foreground.png",
      "android-icon-monochrome.png",
      "neurify-mark-transparent.png",
      "neurify-wordmark.png",
      "neurosurgery-department-logo.png",
      "neurosurgery-department-report-logo.png",
    ];
    requiredVisualAssets.forEach((asset) => expect(fs.existsSync(path.join(root, "assets", "images", asset))).toBe(true));
    expect(fs.existsSync(path.join(root, "assets", "fonts", "MaterialIcons.ttf"))).toBe(true);
    expect(config).not.toContain('"expo-asset"');
    expect(config).toContain('"./plugins/with-gradle-constraints.js"');
    expect(gradlePlugin).toContain('org.gradle.jvmargs');
    expect(gradlePlugin).toContain('org.gradle.parallel", "false"');
    expect(gradlePlugin).toContain('org.gradle.workers.max", "2"');
    expect(config).toContain('fonts: ["./assets/fonts/MaterialIcons.ttf"]');
    expect(config).not.toContain("fontDefinitions");
    expect(config).not.toContain("fontWeight");
    expect(layout).toContain('material: require("../assets/fonts/MaterialIcons.ttf")');
    expect(layout).toContain('require("../assets/images/neurosurgery-department-logo.png")');
  });

  it("يستخدم لوحة ألوان Neurify المحلية الثابتة في النسخة المثبتة", () => {
    const config = fs.readFileSync(path.join(root, "app.config.ts"), "utf8");
    const theme = fs.readFileSync(path.join(root, "theme.config.js"), "utf8");
    const provider = fs.readFileSync(path.join(root, "lib", "theme-provider.tsx"), "utf8");

    expect(config).toContain('userInterfaceStyle: "light"');
    expect(theme).toContain("primary: { light: '#123D63'");
    expect(theme).toContain("background: { light: '#F3F7FB'");
    expect(theme).not.toMatch(/https?:\/\//);
    expect(provider).toContain('useState<ColorScheme>("light")');
    expect(provider).not.toContain("useSystemColorScheme");
  });
});
