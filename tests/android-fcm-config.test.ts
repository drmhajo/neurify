import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("إعداد FCM لحزمة Android", () => {
  it("يربط ملف Firebase بمعرّف حزمة التطبيق ويرفع رقم بناء Android", () => {
    const config = fs.readFileSync(path.join(root, "app.config.ts"), "utf8");
    const firebaseConfig = JSON.parse(fs.readFileSync(path.join(root, "google-services.json"), "utf8"));
    const packageName = firebaseConfig.client?.[0]?.client_info?.android_client_info?.package_name;

    expect(packageName).toBe("com.app.ksmcneurosurgery");
    expect(config).toContain('googleServicesFile: "./google-services.json"');
    expect(config).toContain("versionCode: 23");
    expect(config).toContain('backgroundColor: "#F4F8FA"');
    expect(config).toContain('"expo-notifications"');
    expect(config).toContain("centralDataEnabled: true");
  });
});
