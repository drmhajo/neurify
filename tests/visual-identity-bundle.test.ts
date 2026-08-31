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

  it("يحمي واجهات الدخول والتبويبات والإجراءات السريعة حتى يجهز خط Material Icons المحلي", () => {
    const layout = fs.readFileSync(path.join(root, "app", "_layout.tsx"), "utf8");
    const login = fs.readFileSync(path.join(root, "app", "login.tsx"), "utf8");
    const tabs = fs.readFileSync(path.join(root, "app", "(tabs)", "_layout.tsx"), "utf8");
    const dashboard = fs.readFileSync(path.join(root, "app", "(tabs)", "index.tsx"), "utf8");
    const iconSymbol = fs.readFileSync(path.join(root, "components", "ui", "icon-symbol.tsx"), "utf8");

    expect(layout).toContain('material: require("../assets/fonts/MaterialIcons.ttf")');
    expect(layout).toContain("startupAssetsReady = iconFontReady && coreUiAssetsReady");
    expect(layout).toContain("startupAssetsReady ? <LanguageTransition>");
    for (const iconName of ["person-outline", "lock-outline", "lock-reset", "error-outline", "person-add-alt-1", "verified-user"]) {
      expect(login).toContain(`name=\"${iconName}\"`);
    }
    expect(login).toContain('"visibility-off"');
    expect(login).toContain(': "visibility"');
    for (const iconName of ["house.fill", "doc.text.fill", "calendar", "person.3.fill", "bubble.left.and.bubble.right.fill", "gearshape.fill"]) {
      expect(tabs).toContain(`name=\"${iconName}\"`);
    }
    for (const materialIcon of ["home", "description", "calendar-today", "groups", "forum", "admin-panel-settings"]) {
      expect(iconSymbol).toContain(`\"${materialIcon}\"`);
    }
    for (const iconName of ["medical-services", "manage-search", "search", "add-comment", "notifications", "local-hospital", "hotel"]) {
      expect(dashboard).toContain(`\"${iconName}\"`);
    }
  });
});
