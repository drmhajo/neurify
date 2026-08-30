import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("مسار بدء Neurify الآمن", () => {
  it("يفتح شاشة تسجيل الدخول بعد التهيئة ولا يستعيد جلسة المشرف تلقائيًا", () => {
    const startScreen = fs.readFileSync(path.join(root, "app", "index.tsx"), "utf8");

    expect(startScreen).toContain('return <Redirect href="/login" />;');
    expect(startScreen).not.toContain('session ? "/(tabs)" : "/login"');
    expect(startScreen).toContain("explicit central sign-in");
  });

  it("ينعم انتقال شاشة البداية ويظهر العلامة النصية تدريجيًا", () => {
    const rootLayout = fs.readFileSync(path.join(root, "app", "_layout.tsx"), "utf8");
    const loader = fs.readFileSync(path.join(root, "components", "logo-loading.tsx"), "utf8");

    expect(rootLayout).toContain("SplashScreen.setOptions({ duration: 260, fade: true })");
    expect(loader).toContain("wordmarkOpacity = useRef(new Animated.Value(0))");
    expect(loader).toContain("fadeInWordmark = Animated.timing(wordmarkOpacity");
    expect(loader).toContain("duration: 360");
    expect(loader).toContain("<Animated.View style={{ opacity: wordmarkOpacity }}>");
  });

  it("يحمّل خط Material Icons قبل إظهار شاشة الدخول أو أيقونات التبويب في Android", () => {
    const rootLayout = fs.readFileSync(path.join(root, "app", "_layout.tsx"), "utf8");

    expect(rootLayout).toContain('import { useFonts } from "expo-font"');
    expect(rootLayout).toContain('material: require("../assets/fonts/MaterialIcons.ttf")');
    expect(rootLayout).toContain("materialIconsLoaded || Boolean(materialIconsError)");
    expect(rootLayout).toContain("startupAssetsReady = iconFontReady && coreUiAssetsReady");
  });

  it("يخزّن أصول الواجهة الأساسية محليًا قبل فتح التطبيق", () => {
    const rootLayout = fs.readFileSync(path.join(root, "app", "_layout.tsx"), "utf8");
    const config = fs.readFileSync(path.join(root, "app.config.ts"), "utf8");

    expect(rootLayout).toContain('import { useAssets } from "expo-asset"');
    expect(rootLayout).toContain('require("../assets/fonts/MaterialIcons.ttf")');
    expect(rootLayout).toContain('require("../assets/images/icon.png")');
    expect(rootLayout).toContain("startupAssetsReady ? <LanguageTransition>");
    expect(config).toContain('assets: ["./assets/images", "./assets/fonts"]');
    expect(config).toContain('fonts: ["./assets/fonts/MaterialIcons.ttf"]');
    expect(config).toContain('fontFamily: "material"');
  });
});
