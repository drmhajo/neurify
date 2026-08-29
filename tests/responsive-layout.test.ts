import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createResponsiveLayout } from "../lib/responsive-layout";

const root = path.resolve(import.meta.dirname, "..");

describe("التخطيط المتجاوب على الهواتف", () => {
  it("يقلل المسافات والعناصر الثانوية على الهاتف الضيق أو القصير دون خفض أهداف اللمس", () => {
    const compact = createResponsiveLayout(320, 640);
    const standard = createResponsiveLayout(390, 844);
    expect(compact).toMatchObject({ isCompact: true, isShort: true, screenPadding: 14, loginLogoSize: 88, loginLogoImageSize: 72, loginDescriptionTopMargin: 36, tabHeight: 58, tabLabelSize: 8 });
    expect(standard).toMatchObject({ isCompact: false, isShort: false, loginLogoSize: 104, loginLogoImageSize: 86, loginDescriptionTopMargin: 50, tabHeight: 64, tabLabelSize: 10 });
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
});
