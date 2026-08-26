import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { RequireSession } from "@/components/require-session";
import { palette } from "@/components/neuro-ui";
import { useDepartment } from "@/lib/department-store";
import { useAppLanguage } from "@/lib/language";

export default function TabLayout() {
  const { session } = useDepartment();
  const { t } = useAppLanguage();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  return <RequireSession><Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: palette.navy, tabBarInactiveTintColor: "#829AB1", tabBarButton: HapticTab, tabBarStyle: { height: 60 + bottomPadding, paddingTop: 8, paddingBottom: bottomPadding, backgroundColor: "#FFFFFF", borderTopColor: palette.line }, tabBarLabelStyle: { fontSize: 10, fontWeight: "700" } }}>
    <Tabs.Screen name="index" options={{ title: t("home"), tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} /> }} />
    <Tabs.Screen name="reports" options={{ title: t("reports"), tabBarIcon: ({ color }) => <IconSymbol size={24} name="doc.text.fill" color={color} /> }} />
    <Tabs.Screen name="schedule" options={{ title: t("schedules"), tabBarIcon: ({ color }) => <IconSymbol size={24} name="calendar" color={color} /> }} />
    <Tabs.Screen name="teams" options={{ title: t("teams"), tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.3.fill" color={color} /> }} />
    <Tabs.Screen name="admin" options={{ title: t("admin"), href: session?.role === "admin" ? undefined : null, tabBarIcon: ({ color }) => <IconSymbol size={24} name="gearshape.fill" color={color} /> }} />
  </Tabs></RequireSession>;
}
