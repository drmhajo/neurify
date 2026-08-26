import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppCard, MetricCard, NotificationBell, palette, PrimaryButton, SectionTitle, StatusPill } from "@/components/neuro-ui";
import { useDepartment } from "@/lib/department-store";
import { getDashboardSummary } from "@/lib/department-model";

export default function HomeScreen() {
  const { data, session } = useDepartment();
  const summary = getDashboardSummary(data);
  const firstReport = data.reports.find((item) => item.status !== "مكتمل") ?? data.reports[0];
  const firstSurgery = data.surgeries[0];
  const unreadNotifications = (data.notifications ?? []).filter((item) => item.recipientIds.includes(session?.userId ?? "") && !item.readByUserIds.includes(session?.userId ?? "")).length;

  return <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View><Text style={styles.hello}>صباح الخير،</Text><Text style={styles.name}>{session?.name}</Text><Text style={styles.date}>الأربعاء، 26 أغسطس</Text></View><NotificationBell count={unreadNotifications} onPress={() => router.push("/notifications")} /></View>
    <AppCard style={styles.banner}><View style={styles.bannerIcon}><MaterialIcons name="medical-services" color="#FFFFFF" size={23} /></View><View style={styles.bannerCopy}><Text style={styles.bannerTitle}>لوحة متابعة القسم</Text><Text style={styles.bannerText}>اطلع على العمليات والمناوبات والطلبات ذات الأولوية اليوم.</Text></View></AppCard>
    <View style={styles.metricsRow}><MetricCard icon="description" value={summary.openReports} label="طلبات مفتوحة" tone="red" /><MetricCard icon="local-hospital" value={summary.surgeriesToday} label="عمليات اليوم" tone="blue" /></View>
    <View style={styles.metricsRow}><MetricCard icon="hotel" value={summary.admittedCases} label="حالات منوّمة" tone="teal" /><MetricCard icon="groups" value={summary.activeTeams} label="فرق علاجية" tone="gold" /></View>
    <SectionTitle title="الأولوية الآن" action="عرض التقارير" onPress={() => router.push("/(tabs)/reports")} />
    {firstReport ? <AppCard><View style={styles.cardTop}><StatusPill label={firstReport.priority} tone={firstReport.priority === "عاجل" ? "red" : firstReport.priority === "عادي" ? "blue" : "gold"} /><Text style={styles.code}>{firstReport.patientCode}</Text></View><Text style={styles.cardTitle}>{firstReport.title}</Text><View style={styles.rowDetail}><Text style={styles.detail}>{firstReport.requester}</Text><Text style={styles.detail}>الاستحقاق: {firstReport.dueAt}</Text></View><PrimaryButton label="فتح الطلب" icon="arrow-back" onPress={() => router.push("/(tabs)/reports")} tone="light" /></AppCard> : null}
    <SectionTitle title="أول عملية اليوم" action="عرض الجدول" onPress={() => router.push("/(tabs)/schedule")} />
    {firstSurgery ? <AppCard><View style={styles.operationTop}><View><Text style={styles.operationTime}>{firstSurgery.time}</Text><Text style={styles.operationRoom}>{firstSurgery.room}</Text></View><StatusPill label={firstSurgery.status} tone={firstSurgery.status === "مؤكد" ? "teal" : "gold"} /></View><Text style={styles.cardTitle}>{firstSurgery.procedure}</Text><Text style={styles.detail}>{firstSurgery.patientCode} · {firstSurgery.surgeon}</Text></AppCard> : null}
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas }, content: { padding: 18, paddingBottom: 32 }, header: { flexDirection: "row-reverse", alignItems: "flex-start", justifyContent: "space-between", paddingTop: 8 }, hello: { color: palette.muted, fontSize: 14, writingDirection: "rtl", textAlign: "right" }, name: { color: palette.ink, fontSize: 22, fontWeight: "900", writingDirection: "rtl", textAlign: "right", marginTop: 3 }, date: { color: palette.muted, fontSize: 12, writingDirection: "rtl", textAlign: "right", marginTop: 4 }, banner: { marginTop: 20, flexDirection: "row-reverse", backgroundColor: palette.navy, borderColor: palette.navy, gap: 12 }, bannerIcon: { height: 44, width: 44, borderRadius: 15, backgroundColor: "#FFFFFF2C", alignItems: "center", justifyContent: "center" }, bannerCopy: { flex: 1, alignItems: "flex-end" }, bannerTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", writingDirection: "rtl" }, bannerText: { color: "#D8EEF9", fontSize: 12, lineHeight: 18, writingDirection: "rtl", textAlign: "right", marginTop: 4 }, metricsRow: { flexDirection: "row-reverse", gap: 10, marginTop: 10 }, cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, code: { color: palette.muted, fontWeight: "800", fontSize: 12 }, cardTitle: { color: palette.ink, fontSize: 16, fontWeight: "900", writingDirection: "rtl", textAlign: "right", marginTop: 12, marginBottom: 8 }, rowDetail: { flexDirection: "row-reverse", justifyContent: "space-between", marginBottom: 14 }, detail: { color: palette.muted, fontSize: 12, writingDirection: "rtl", textAlign: "right" }, operationTop: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }, operationTime: { color: palette.navy, fontSize: 25, fontWeight: "900", textAlign: "right" }, operationRoom: { color: palette.muted, fontSize: 12, writingDirection: "rtl", textAlign: "right", marginTop: 2 },
});
