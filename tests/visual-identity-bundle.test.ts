import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("حزمة الهوية المرئية المحلية", () => {
  it("تضمّن أصول الهوية وخطوط Cairo والأيقونات المحلية في حزمة Android", () => {
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
    for (const font of ["MaterialIcons.ttf", "MaterialCommunityIcons.ttf", "Cairo-Regular.ttf", "Cairo-SemiBold.ttf", "Cairo-Bold.ttf"]) expect(fs.existsSync(path.join(root, "assets", "fonts", font))).toBe(true);
    expect(config).not.toContain('"expo-asset"');
    expect(config).toContain('"./plugins/with-gradle-constraints.js"');
    expect(gradlePlugin).toContain('org.gradle.jvmargs');
    expect(gradlePlugin).toContain('org.gradle.parallel", "false"');
    expect(gradlePlugin).toContain('org.gradle.workers.max", "2"');
    expect(config).toContain('"./assets/fonts/MaterialCommunityIcons.ttf"');
    expect(config).toContain('"./assets/fonts/Cairo-Regular.ttf"');
    expect(config).not.toContain("fontDefinitions");
    expect(config).not.toContain("fontWeight");
    expect(layout).toContain('"material-community": require("../assets/fonts/MaterialCommunityIcons.ttf")');
    expect(layout).toContain('"Cairo-Regular": require("../assets/fonts/Cairo-Regular.ttf")');
    expect(layout).toContain('require("../assets/images/neurosurgery-department-logo.png")');
  });

  it("يستخدم لوحة ألوان Neurify المحلية الثابتة في النسخة المثبتة", () => {
    const config = fs.readFileSync(path.join(root, "app.config.ts"), "utf8");
    const theme = fs.readFileSync(path.join(root, "theme.config.js"), "utf8");
    const provider = fs.readFileSync(path.join(root, "lib", "theme-provider.tsx"), "utf8");

    expect(config).toContain('userInterfaceStyle: "light"');
    expect(theme).toContain("primary: { light: '#4956A6'");
    expect(theme).toContain("background: { light: '#F8F8FC'");
    expect(theme).not.toMatch(/https?:\/\//);
    expect(provider).toContain('useState<ColorScheme>("light")');
    expect(provider).not.toContain("useSystemColorScheme");
  });

  it("يحمي واجهات الدخول والتبويبات والإجراءات السريعة حتى تجهز خطوط Cairo والأيقونات المحلية", () => {
    const layout = fs.readFileSync(path.join(root, "app", "_layout.tsx"), "utf8");
    const login = fs.readFileSync(path.join(root, "app", "login.tsx"), "utf8");
    const tabs = fs.readFileSync(path.join(root, "app", "(tabs)", "_layout.tsx"), "utf8");
    const dashboard = fs.readFileSync(path.join(root, "app", "(tabs)", "index.tsx"), "utf8");
    const iconSymbol = fs.readFileSync(path.join(root, "components", "ui", "icon-symbol.tsx"), "utf8");

    expect(layout).toContain('material: require("../assets/fonts/MaterialIcons.ttf")');
    expect(layout).toContain('"Cairo-Bold": require("../assets/fonts/Cairo-Bold.ttf")');
    expect(layout).toContain("startupAssetsReady = visualFontsReady && coreUiAssetsReady");
    expect(layout).toContain("startupAssetsReady ? <LanguageTransition>");
    for (const iconName of ["person-outline", "lock-outline", "lock-reset", "error-outline", "person-add-alt-1", "verified-user"]) {
      expect(login).toContain(`name=\"${iconName}\"`);
    }
    expect(login).toContain('"visibility-off"');
    expect(login).toContain(': "visibility"');
    for (const iconName of ["house.fill", "doc.text.fill", "calendar", "person.3.fill", "bubble.left.and.bubble.right.fill", "gearshape.fill"]) {
      expect(tabs).toContain(`name=\"${iconName}\"`);
    }
    expect(iconSymbol).toContain("MaterialCommunityIcons");
    for (const communityIcon of ["home-variant-outline", "file-document-outline", "calendar-month-outline", "account-group-outline", "forum-outline", "shield-account-outline"]) {
      expect(iconSymbol).toContain(`\"${communityIcon}\"`);
    }
    for (const iconName of ["medical-services", "manage-search", "search", "add-comment", "notifications", "local-hospital", "hotel"]) {
      expect(dashboard).toContain(`\"${iconName}\"`);
    }
  });
});
