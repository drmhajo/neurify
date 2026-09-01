import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppCard, EmptyState, IconAction, palette, StatusPill } from "@/components/neuro-ui";
import { useDepartment } from "@/lib/department-store";
import type { TeamNotification } from "@/lib/department-model";
import { useAppLanguage } from "@/lib/language";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const align = (isRTL: boolean) => ({ writingDirection: isRTL ? "rtl" as const : "ltr" as const, textAlign: isRTL ? "right" as const : "left" as const });

export default function NotificationsScreen() {
  const { data, session, markNotificationRead, markAllNotificationsRead } = useDepartment();
  const { language, isRTL, localize } = useAppLanguage();
  const insets = useSafeAreaInsets();
  const userId = session?.userId ?? "";
  const user = data.users.find((item) => item.id === userId);
  const canSendGeneral = Boolean(user?.active && user.permissions.includes("send_general_announcement"));
  const notifications = (data.notifications ?? []).filter((item) => item.recipientIds.includes(userId));
  const unreadCount = notifications.filter((item) => !item.readByUserIds.includes(userId)).length;
  const openNotification = (item: TeamNotification) => {
    markNotificationRead(item.id);
    if (item.type === "shift_report") router.push("/shift-report");
    else if (item.type !== "general_announcement") router.push({ pathname: "/team/[id]", params: { id: item.teamId } });
  };
  const renderItem = ({ item }: { item: TeamNotification }) => {
    const unread = !item.readByUserIds.includes(userId);
    const isGeneral = item.type === "general_announcement";
    const isReport = item.type === "shift_report";
    const isConsultation = item.type === "consultation";
    const icon = isGeneral ? "campaign" : isReport ? "assignment" : isConsultation ? "forum" : "hotel";
    const color = isGeneral ? palette.gold : isReport ? palette.navy : isConsultation ? palette.teal : palette.gold;
    const background = isGeneral ? "#FFF3D4" : isReport ? palette.paleBlue : isConsultation ? palette.paleTeal : "#FFF3D4";
    const typeLabel = isGeneral ? (language === "en" ? "General announcement" : "إشعار عام") : isReport ? (language === "en" ? "Shift report" : "تقرير مناوبة") : isConsultation ? (language === "en" ? "Consultation" : "استشارة") : (language === "en" ? "Inpatient" : "حالة منوّمة");
    const source = isGeneral || isReport ? (language === "en" ? "Neurosurgery Department" : "قسم جراحة المخ والأعصاب") : item.teamName;
    const action = isGeneral ? (language === "en" ? "Read announcement" : "قراءة الإشعار") : isReport ? (language === "en" ? "Open report" : "فتح التقرير") : localize("فتح غرفة الفريق");
    return <Pressable onPress={() => openNotification(item)} style={({ pressed }) => pressed && { opacity: 0.78 }}><AppCard style={[styles.card, unread && styles.unreadCard]}><View style={[styles.cardHead, { flexDirection: isRTL ? "row-reverse" : "row" }]}><View style={[styles.iconShell, { backgroundColor: background }]}><MaterialIcons name={icon} size={20} color={color} /></View><View style={styles.headText}><Text style={[styles.teamName, align(isRTL)]}>{source}</Text><Text style={[styles.time, align(isRTL)]}>{localize(item.createdAt)}</Text></View>{unread ? <View style={styles.unreadDot} /> : null}</View><Text style={[styles.notificationTitle, align(isRTL)]}>{localize(item.title)}</Text><Text style={[styles.message, align(isRTL)]}>{localize(item.message)}</Text><View style={[styles.cardFoot, { flexDirection: isRTL ? "row-reverse" : "row" }]}><StatusPill label={typeLabel} tone={isGeneral ? "gold" : isReport ? "blue" : isConsultation ? "teal" : "gold"} /><View style={[styles.openLink, { flexDirection: isRTL ? "row-reverse" : "row" }]}><Text style={[styles.openLinkText, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{action}</Text>{isGeneral ? null : <MaterialIcons name={isRTL ? "arrow-back" : "arrow-forward"} size={15} color={palette.navy} />}</View></View></AppCard></Pressable>;
  };
  return <View style={styles.page}><View style={[styles.header, { flexDirection: isRTL ? "row" : "row-reverse", paddingTop: Math.max(12, insets.top + 8) }]}><IconAction icon={isRTL ? "arrow-forward" : "arrow-back"} label={language === "en" ? "Back" : "رجوع"} onPress={() => router.back()} /><View style={styles.titleWrap}><Text style={[styles.title, align(isRTL)]}>{localize("الإشعارات")}</Text><Text style={[styles.subtitle, align(isRTL)]}>{unreadCount > 0 ? language === "en" ? `${unreadCount} unread alerts` : `${unreadCount} تنبيهات غير مقروءة` : language === "en" ? "All alerts are read" : "جميع التنبيهات مقروءة"}</Text></View>{unreadCount > 0 ? <Pressable onPress={markAllNotificationsRead} style={styles.readAll}><Text style={[styles.readAllText, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{language === "en" ? "Mark all read" : "قراءة الكل"}</Text></Pressable> : <View style={styles.readAll} />}</View><FlatList data={notifications} renderItem={renderItem} keyExtractor={(item) => item.id} contentContainerStyle={[notifications.length ? styles.list : styles.emptyList, { paddingBottom: Math.max(canSendGeneral ? 100 : 28, insets.bottom + (canSendGeneral ? 80 : 16)) }]} ListEmptyComponent={<EmptyState icon="notifications-none" text={language === "en" ? "There are no new alerts for your care teams." : "لا توجد إشعارات جديدة لفرقك العلاجية."} />} showsVerticalScrollIndicator={false} />{canSendGeneral ? <Pressable accessibilityRole="button" accessibilityLabel={language === "en" ? "Send general announcement" : "إرسال إشعار عام"} onPress={() => router.push("/general-announcement")} style={({ pressed }) => [styles.compose, { flexDirection: isRTL ? "row-reverse" : "row", bottom: insets.bottom + 16 }, pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] }]}><MaterialIcons name="campaign" size={20} color="#FFFFFF" /><Text style={styles.composeText}>{language === "en" ? "General announcement" : "إشعار عام"}</Text></Pressable> : null}</View>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: palette.canvas, paddingHorizontal: 18 }, header: { paddingTop: 20, paddingBottom: 16, alignItems: "center", gap: 12 }, titleWrap: { flex: 1 }, title: { color: palette.ink, fontSize: 21, fontWeight: "900" }, subtitle: { color: palette.muted, fontSize: 12, marginTop: 3 }, readAll: { minWidth: 56, alignItems: "flex-end" }, readAllText: { color: palette.navy, fontSize: 12, fontWeight: "800" }, list: { gap: 10, paddingBottom: 100 }, emptyList: { flexGrow: 1, justifyContent: "center", paddingBottom: 86 }, card: { padding: 15 }, unreadCard: { borderColor: "#93C5FD", backgroundColor: "#FCFEFF" }, cardHead: { alignItems: "center", gap: 10 }, iconShell: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" }, headText: { flex: 1 }, teamName: { color: palette.ink, fontSize: 13, fontWeight: "900" }, time: { color: palette.muted, fontSize: 10, marginTop: 2 }, unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.urgent }, notificationTitle: { color: palette.ink, fontSize: 15, fontWeight: "900", marginTop: 13 }, message: { color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }, cardFoot: { marginTop: 13, paddingTop: 11, borderTopWidth: 1, borderTopColor: palette.line, justifyContent: "space-between", alignItems: "center" }, openLink: { alignItems: "center", gap: 4 }, openLinkText: { color: palette.navy, fontSize: 11, fontWeight: "800" }, compose: { position: "absolute", bottom: 20, alignSelf: "center", alignItems: "center", gap: 8, minHeight: 50, paddingHorizontal: 18, backgroundColor: palette.navy, borderRadius: 16, shadowColor: palette.navy, shadowOpacity: 0.25, shadowRadius: 9, elevation: 4 }, composeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" } });
