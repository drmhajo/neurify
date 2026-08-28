import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import { useAppLanguage } from "@/lib/language";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export const palette = {
  navy: "#123D63",
  teal: "#08766D",
  canvas: "#F3F7FB",
  card: "#FFFFFF",
  ink: "#152F47",
  muted: "#60778C",
  line: "#D8E4EE",
  urgent: "#B42318",
  gold: "#B97922",
  paleBlue: "#E7F0FA",
  paleTeal: "#E5F5F1",
  paleGold: "#FFF5E1",
};

export function AppCard({ children, style }: { children: ReactNode; style?: object }) {
  const { isCompact } = useResponsiveLayout();
  return <View style={[styles.card, isCompact && styles.compactCard, style]}>{children}</View>;
}

export function PrimaryButton({ label, onPress, icon = "add", tone = "navy", disabled = false }: { label: string; onPress: () => void; icon?: React.ComponentProps<typeof MaterialIcons>["name"]; tone?: "navy" | "teal" | "light"; disabled?: boolean }) {
  const { localize, isRTL } = useAppLanguage();
  const { isCompact } = useResponsiveLayout();
  const dark = tone !== "light";
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, isCompact && styles.compactPrimaryButton, { flexDirection: isRTL ? "row-reverse" : "row" }, tone === "teal" && styles.tealButton, tone === "light" && styles.lightButton, disabled && styles.disabledButton, pressed && !disabled && styles.pressed]}>
    <MaterialIcons name={icon} size={18} color={dark ? "#FFFFFF" : palette.navy} />
    <Text style={[styles.primaryText, !dark && styles.lightButtonText, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{localize(label)}</Text>
  </Pressable>;
}

export function IconAction({ icon, onPress, label }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; onPress: () => void; label?: string }) {
  const { localize } = useAppLanguage();
  return <Pressable onPress={onPress} accessibilityLabel={label ? localize(label) : undefined} style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}><MaterialIcons name={icon} size={22} color={palette.navy} /></Pressable>;
}

export function NotificationBell({ count, onPress }: { count: number; onPress: () => void }) {
  const { localize } = useAppLanguage();
  return <View style={styles.bellWrap}><Pressable onPress={onPress} accessibilityLabel={localize("الإشعارات")} style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}><MaterialIcons name="notifications-none" size={22} color={palette.navy} /></Pressable>{count > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text></View> : null}</View>;
}

export function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  const { localize, isRTL } = useAppLanguage();
  return <View style={[styles.sectionTitle, { flexDirection: isRTL ? "row-reverse" : "row" }]}><Text style={[styles.sectionHeading, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{localize(title)}</Text>{action && onPress ? <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.sectionActionButton, pressed && styles.pressed]}><Text style={[styles.sectionAction, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{localize(action)}</Text></Pressable> : null}</View>;
}

export function StatusPill({ label, tone = "blue" }: { label: string; tone?: "blue" | "teal" | "red" | "gold" | "grey" }) {
  const { localize, isRTL } = useAppLanguage();
  const toneStyle = tone === "teal" ? styles.pillTeal : tone === "red" ? styles.pillRed : tone === "gold" ? styles.pillGold : tone === "grey" ? styles.pillGrey : styles.pillBlue;
  const textStyle = tone === "teal" ? styles.pillTealText : tone === "red" ? styles.pillRedText : tone === "gold" ? styles.pillGoldText : tone === "grey" ? styles.pillGreyText : styles.pillBlueText;
  return <View style={[styles.pill, toneStyle]}><Text style={[styles.pillText, textStyle, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{localize(label)}</Text></View>;
}

export function MetricCard({ icon, value, label, tone = "blue" }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; value: number | string; label: string; tone?: "blue" | "teal" | "gold" | "red" }) {
  const { localize, isRTL } = useAppLanguage();
  const { isCompact } = useResponsiveLayout();
  const background = tone === "teal" ? palette.paleTeal : tone === "gold" ? "#FEF3C7" : tone === "red" ? "#FEE2E2" : palette.paleBlue;
  const color = tone === "teal" ? palette.teal : tone === "gold" ? palette.gold : tone === "red" ? palette.urgent : palette.navy;
  return <View style={[styles.metricCard, isCompact && styles.compactMetricCard, { backgroundColor: background, flexDirection: isRTL ? "row-reverse" : "row" }]}><View style={[styles.metricIcon, isCompact && styles.compactMetricIcon, { backgroundColor: "#FFFFFFAA" }]}><MaterialIcons name={icon} size={isCompact ? 18 : 20} color={color} /></View><View style={styles.metricCopy}><Text style={[styles.metricValue, isCompact && styles.compactMetricValue, { color }]}>{value}</Text><Text style={[styles.metricLabel, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{localize(label)}</Text></View></View>;
}

export function EmptyState({ icon, text }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; text: string }) {
  const { localize, isRTL } = useAppLanguage();
  return <View style={styles.empty}><MaterialIcons name={icon} size={28} color={palette.muted} /><Text style={[styles.emptyText, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{localize(text)}</Text></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, borderRadius: 18, padding: 16, shadowColor: "#123D63", shadowOpacity: 0.055, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 }, compactCard: { borderRadius: 16, padding: 14 },
  primaryButton: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: palette.navy, minHeight: 50, paddingHorizontal: 16, borderRadius: 15 },
  compactPrimaryButton: { minHeight: 48, paddingHorizontal: 14, borderRadius: 14 },
  tealButton: { backgroundColor: palette.teal },
  lightButton: { backgroundColor: palette.paleBlue, borderWidth: 1, borderColor: "#C9DDED" },
  disabledButton: { opacity: 0.5 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.98 }] },
  primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", writingDirection: "rtl" },
  lightButtonText: { color: palette.navy },
  iconAction: { height: 44, width: 44, borderRadius: 22, backgroundColor: "#FFFFFF", borderColor: palette.line, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  bellWrap: { position: "relative" },
  badge: { position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, paddingHorizontal: 3, borderRadius: 9, backgroundColor: palette.urgent, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: palette.canvas },
  badgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "900" },
  sectionTitle: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 12 },
  sectionHeading: { color: palette.ink, fontSize: 18, fontWeight: "800", writingDirection: "rtl" },
  sectionAction: { color: palette.navy, fontSize: 13, fontWeight: "700", writingDirection: "rtl" },
  sectionActionButton: { minHeight: 36, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
  pill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: "800", writingDirection: "rtl" },
  pillBlue: { backgroundColor: palette.paleBlue }, pillBlueText: { color: palette.navy },
  pillTeal: { backgroundColor: palette.paleTeal }, pillTealText: { color: palette.teal },
  pillRed: { backgroundColor: "#FEE2E2" }, pillRedText: { color: palette.urgent },
  pillGold: { backgroundColor: "#FEF3C7" }, pillGoldText: { color: palette.gold },
  pillGrey: { backgroundColor: "#E9EFF5" }, pillGreyText: { color: palette.muted },
  metricCard: { flexDirection: "row-reverse", gap: 10, alignItems: "center", flex: 1, minWidth: 0, borderRadius: 18, padding: 12, minHeight: 82 }, compactMetricCard: { gap: 8, borderRadius: 16, padding: 10, minHeight: 76 },
  metricIcon: { height: 36, width: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  compactMetricIcon: { height: 32, width: 32, borderRadius: 11 }, metricCopy: { flex: 1, minWidth: 0 },
  metricValue: { fontSize: 22, fontWeight: "900", textAlign: "right" }, compactMetricValue: { fontSize: 20 },
  metricLabel: { color: palette.muted, fontSize: 11, fontWeight: "600", writingDirection: "rtl", marginTop: 1 },
  empty: { alignItems: "center", paddingVertical: 28, gap: 8 },
  emptyText: { color: palette.muted, fontSize: 13, writingDirection: "rtl", textAlign: "center" },
});
