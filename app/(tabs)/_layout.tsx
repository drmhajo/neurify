import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { RequireSession } from "@/components/require-session";
import { palette } from "@/components/neuro-ui";
import { useDepartment } from "@/lib/department-store";
import { getUnreadGeneralDiscussionCount } from "@/lib/department-model";
import { useAppLanguage } from "@/lib/language";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export default function TabLayout() {
  const { session, data } = useDepartment();
  const { t } = useAppLanguage();
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  const unreadDiscussionCount = getUnreadGeneralDiscussionCount({ messages: data.generalDiscussionMessages ?? [], userId: session?.userId, lastReadAt: session?.userId ? data.generalDiscussionReadByUser?.[session.userId] : undefined });
  const discussionBadge = unreadDiscussionCount > 99 ? "99+" : unreadDiscussionCount || undefined;
  return <RequireSession><Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: palette.navy, tabBarInactiveTintColor: "#8094A7", tabBarButton: HapticTab, tabBarStyle: { height: layout.tabHeight + bottomPadding, paddingTop: layout.isCompact ? 7 : 9, paddingBottom: bottomPadding, backgroundColor: "#FFFFFF", borderTopColor: palette.line, borderTopWidth: 1 }, tabBarItemStyle: { minWidth: 0, paddingHorizontal: layout.isCompact ? 0 : 2 }, tabBarLabelStyle: { fontSize: layout.tabLabelSize, fontWeight: "800" } }}>
    <Tabs.Screen name="index" options={{ title: t("home"), tabBarIcon: ({ color }) => <IconSymbol size={layout.tabIconSize} name="house.fill" color={color} /> }} />
    <Tabs.Screen name="reports" options={{ title: t("reports"), tabBarIcon: ({ color }) => <IconSymbol size={layout.tabIconSize} name="doc.text.fill" color={color} /> }} />
    <Tabs.Screen name="schedule" options={{ title: t("schedules"), tabBarIcon: ({ color }) => <IconSymbol size={layout.tabIconSize} name="calendar" color={color} /> }} />
    <Tabs.Screen name="opd-operation-waiting-list" options={{ href: null, title: "OPD operation waiting list" }} />
    <Tabs.Screen name="teams" options={{ title: t("teams"), tabBarIcon: ({ color }) => <IconSymbol size={layout.tabIconSize} name="person.3.fill" color={color} /> }} />
    <Tabs.Screen name="discussions" options={{ title: t("discussions"), tabBarBadge: discussionBadge, tabBarBadgeStyle: { backgroundColor: "#B42318", color: "#FFFFFF", fontSize: layout.isCompact ? 9 : 10, fontWeight: "900" }, tabBarIcon: ({ color }) => <IconSymbol size={layout.tabIconSize} name="bubble.left.and.bubble.right.fill" color={color} /> }} />
    <Tabs.Screen name="admin" options={{ title: t("admin"), href: session?.role === "admin" || data.users.find((user) => user.id === session?.userId)?.permissions.includes("approve_registration_requests") ? undefined : null, tabBarIcon: ({ color }) => <IconSymbol size={layout.tabIconSize} name="gearshape.fill" color={color} /> }} />
  </Tabs></RequireSession>;
}
