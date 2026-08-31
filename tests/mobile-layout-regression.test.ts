import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

describe("mobile layout regression", () => {
  it("keeps the discussion list expanded so the composer stays at the bottom above the tab bar", () => {
    const screen = fs.readFileSync(path.join(root, "app/(tabs)/discussions.tsx"), "utf8");
    expect(screen).toContain("style={styles.list}");
    expect(screen).toContain("list: { flex: 1, minHeight: 0 }");
    expect(screen).toContain('behavior={Platform.OS === "ios" ? "padding" : undefined}');
    expect(screen).toContain("messageArea: { flex: 1, minHeight: 0 }");
    expect(screen).toContain('edges={["top", "left", "right"]}');
    expect(screen).toContain('keyboardShouldPersistTaps="handled"');
  });

  it("uses a safe-area profile layout and presents sign-out as a clear confirmed destructive action", () => {
    const screen = fs.readFileSync(path.join(root, "app/profile.tsx"), "utf8");
    expect(screen).toContain('import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"');
    expect(screen).toContain("<View style={styles.screen}><SafeAreaView edges={[\"top\", \"left\", \"right\", \"bottom\"]} style={styles.safeArea}>");
    expect(screen).toContain("Math.max(layout.contentBottomPadding, insets.bottom + 24)");
    expect(screen).toContain("const displayName = session?.name?.trim()");
    expect(screen).toContain("displayName.slice(0, 1)");
    expect(screen).toContain("Session control");
    expect(screen).toContain("Sign out?");
    expect(screen).toContain("signOutSection");
  });

  it("uses command targets large enough to remain legible and easy to tap", () => {
    const ui = fs.readFileSync(path.join(root, "components/neuro-ui.tsx"), "utf8");
    expect(ui).toContain("minHeight: 50");
    expect(ui).toContain("height: 42, width: 42");
    expect(ui).toContain("sectionActionButton");
  });
});
