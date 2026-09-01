import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createResponsiveLayout } from "../lib/responsive-layout";

const root = path.resolve(import.meta.dirname, "..");

describe("التخطيط المتجاوب على الهواتف", () => {
  it("يقلل المسافات والعناصر الثانوية على الهاتف الضيق أو القصير دون خفض أهداف اللمس", () => {
    const compact = createResponsiveLayout(320, 640);
    const standard = createResponsiveLayout(390, 844);
    expect(compact).toMatchObject({ isCompact: true, isShort: true, screenPadding: 14, loginLogoSize: 88, loginLogoImageSize: 72, loginDescriptionTopMargin: 36, scheduleHeaderTopPadding: 12, profileContentTopPadding: 10, tabHeight: 58, tabLabelSize: 8 });
    expect(standard).toMatchObject({ isCompact: false, isShort: false, loginLogoSize: 104, loginLogoImageSize: 86, loginDescriptionTopMargin: 50, scheduleHeaderTopPadding: 24, profileContentTopPadding: 18, tabHeight: 64, tabLabelSize: 10 });
    expect(compact.contentBottomPadding).toBeGreaterThanOrEqual(24);
  });

  it("يتجنب تراكب لوحة التحكم في الشاشة الضيقة ويستفيد من الحواف الآمنة", () => {
    const dashboard = fs.readFileSync(path.join(root, "app", "(tabs)", "index.tsx"), "utf8");
    const sharedUi = fs.readFileSync(path.join(root, "components", "neuro-ui.tsx"), "utf8");
    expect(dashboard).toContain("useSafeAreaInsets");
    expect(dashboard).toContain("paddingHorizontal: layout.screenPadding");
    expect(dashboard).toContain("quickActionCompact: { flexBasis: \"47%\"");
    expect(dashboard).toContain("wide icon=\"person\"");
    expect(sharedUi).toContain("minWidth: 0");
    expect(sharedUi).toContain("compactMetricCard");
    expect(sharedUi).toContain("minHeight: 48");
  });

  it("يضبط تسجيل الدخول وشريط التبويب وفق أبعاد الجهاز والحواف الآمنة", () => {
    const login = fs.readFileSync(path.join(root, "app", "login.tsx"), "utf8");
    const tabs = fs.readFileSync(path.join(root, "app", "(tabs)", "_layout.tsx"), "utf8");
    expect(login).toContain("const insets = useSafeAreaInsets()");
    expect(login).toContain("paddingTop: contentTopPadding");
    expect(login).toContain("paddingBottom: contentBottomPadding");
    expect(login).toContain("top: insets.top + 10");
    expect(login).toContain("loginLogoImageSize");
    expect(login).toContain("padding: 6");
    expect(login).toContain("loginDescriptionTopMargin");
    expect(tabs).toContain("const layout = useResponsiveLayout()");
    expect(tabs).toContain("height: layout.tabHeight + bottomPadding");
    expect(tabs).toContain("tabBarItemStyle: { minWidth: 0");
  });

  it("يحافظ على صف العمليات وملف المستخدم قابلاً للعرض على Android الضيق في RTL وLTR", () => {
    const schedule = fs.readFileSync(path.join(root, "app", "(tabs)", "schedule.tsx"), "utf8");
    const profile = fs.readFileSync(path.join(root, "app", "profile.tsx"), "utf8");
    const login = fs.readFileSync(path.join(root, "app", "login.tsx"), "utf8");
    expect(schedule).toContain("const layout = useResponsiveLayout()");
    expect(schedule).toContain("paddingTop: Math.max(layout.scheduleHeaderTopPadding, insets.top + 8)");
    expect(schedule).toContain("opdWaitingListCopy: { flex: 1, minWidth: 0");
    expect(schedule).toContain("numberOfLines={2}");
    expect(profile).toContain('import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"');
    expect(profile).toContain("<View style={styles.screen}><SafeAreaView");
    expect(profile).toContain("const layout = useResponsiveLayout()");
    expect(login).toContain("input: { flex: 1, minWidth: 0");
    expect(login).toContain("centralInfoText: { color:");
  });

  it("يوفر حواف أمان ديناميكية للترويسات والقوائم والإجراءات السفلية في الشاشات الأساسية", () => {
    const rootLayout = fs.readFileSync(path.join(root, "app", "_layout.tsx"), "utf8");
    const schedule = fs.readFileSync(path.join(root, "app", "(tabs)", "schedule.tsx"), "utf8");
    const teams = fs.readFileSync(path.join(root, "app", "(tabs)", "teams.tsx"), "utf8");
    const reports = fs.readFileSync(path.join(root, "app", "(tabs)", "reports.tsx"), "utf8");
    const notifications = fs.readFileSync(path.join(root, "app", "notifications.tsx"), "utf8");
    const teamDetail = fs.readFileSync(path.join(root, "app", "team", "[id].tsx"), "utf8");
    const discussions = fs.readFileSync(path.join(root, "app", "(tabs)", "discussions.tsx"), "utf8");
    expect(rootLayout).toContain("SafeAreaProvider");
    expect(schedule).toContain("const insets = useSafeAreaInsets()");
    expect(teams).toContain("const insets = useSafeAreaInsets()");
    expect(reports).toContain("const insets = useSafeAreaInsets()");
    expect(notifications).toContain("bottom: insets.bottom + 16");
    expect(teamDetail).toContain("bottom: insets.bottom + 16");
    expect(discussions).toContain('edges={["top", "left", "right", "bottom"]}');
  });
});
