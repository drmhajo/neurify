import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

function readPngInfo(relativePath: string) {
  const png = fs.readFileSync(path.join(root, relativePath));
  expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
    colorType: png.readUInt8(25),
  };
}

describe("هوية Neurify وأصول الأيقونات", () => {
  it("يحافظ على اسم التطبيق ومعرّف الحزمة ويقدم رقم بناء جديدًا", () => {
    const config = fs.readFileSync(path.join(root, "app.config.ts"), "utf8");

    expect(config).toContain('appName: "Neurify"');
    expect(config).toContain('appSlug: "ksmc-neurosurgery"');
    expect(config).toContain('rawBundleId = "com.app.ksmcneurosurgery"');
    expect(config).toContain('version: "1.0.37"');
    expect(config).toContain("versionCode: 38");
    expect(config).toContain('backgroundColor: "#F4F8FA"');
    expect(config).toContain('logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663029677493/IbIfxQJZJkslXVmk.png"');
  });

  it("يصدر الرمز العصبي بمقاسات iOS وAndroid الصحيحة", () => {
    expect(readPngInfo("assets/images/icon.png")).toMatchObject({ width: 1024, height: 1024, colorType: 2 });
    expect(readPngInfo("assets/images/splash-icon.png")).toMatchObject({ width: 1500, height: 1500, colorType: 3 });
    expect(readPngInfo("assets/images/favicon.png")).toMatchObject({ width: 512, height: 512, colorType: 2 });
    expect(readPngInfo("assets/images/android-icon-background.png")).toMatchObject({ width: 1080, height: 1080, colorType: 2 });
    expect(readPngInfo("assets/images/android-icon-foreground.png")).toMatchObject({ width: 1080, height: 1080, colorType: 6 });
    expect(readPngInfo("assets/images/android-icon-monochrome.png")).toMatchObject({ width: 1080, height: 1080, colorType: 6 });
    expect(readPngInfo("assets/images/neurify-mark-transparent.png")).toMatchObject({ width: 1024, height: 1024, colorType: 6 });
  });

  it("يستخدم العلامة النصية الإنسانية أثناء التحميل دون وضعها داخل أيقونة المشغل", () => {
    const loader = fs.readFileSync(path.join(root, "components", "logo-loading.tsx"), "utf8");
    const builder = fs.readFileSync(path.join(root, "scripts", "build_neurify_app_assets.py"), "utf8");

    expect(loader).toContain('require("../assets/images/neurify-wordmark.png")');
    expect(builder).toContain("WORDMARK_MASTER");
    expect(builder).toContain("save_transparent_mark");
    expect(readPngInfo("assets/images/neurify-wordmark.png")).toMatchObject({ width: 1024, height: 291, colorType: 6 });
  });
});
