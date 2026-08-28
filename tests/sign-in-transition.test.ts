import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("انتقال تسجيل الدخول إلى لوحة Neurify", () => {
  it("يعرض تأكيدًا تدريجيًا قصيرًا ثم يستبدل صفحة الدخول بلوحة التحكم", () => {
    const login = fs.readFileSync(path.join(root, "app", "login.tsx"), "utf8");

    expect(login).toContain("const [dashboardTransitioning, setDashboardTransitioning] = useState(false)");
    expect(login).toContain("const transitionToDashboard = () =>");
    expect(login).toContain("Animated.timing(dashboardTransitionOpacity, { toValue: 1, duration: 260");
    expect(login).toContain('router.replace("/(tabs)")');
    expect(login).toContain("disabled={submitting || dashboardTransitioning}");
    expect(login).toContain("dashboardTransition");
  });

  it("يحافظ على توجيه استعادة كلمة المرور ولا يلتف على مسار الدخول المركزي", () => {
    const login = fs.readFileSync(path.join(root, "app", "login.tsx"), "utf8");
    const rootLayout = fs.readFileSync(path.join(root, "app", "_layout.tsx"), "utf8");

    expect(login).toContain('router.replace("/profile")');
    expect(rootLayout).toContain('<Stack.Screen name="(tabs)" options={{ animation: "fade_from_bottom" }} />');
  });
});
