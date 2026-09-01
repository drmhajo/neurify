import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppCard, EmptyState, palette, PrimaryButton, StatusPill } from "@/components/neuro-ui";
import type { MedicalReport } from "@/lib/department-model";
import { useDepartment } from "@/lib/department-store";
import { useAppLanguage } from "@/lib/language";
import { isReportReminderDue } from "@/lib/report-request-notifications";
import { formatRiyadhDateTime } from "@/lib/riyadh-time";

function align(isRTL: boolean) { return { writingDirection: isRTL ? "rtl" as const : "ltr" as const, textAlign: isRTL ? "right" as const : "left" as const }; }

function reminderLabel(report: MedicalReport, language: "ar" | "en") {
  if (report.notifyCompletedAt) return language === "en" ? "Notify completed" : "إشعار مكتمل";
  if (!report.lastReminderAt) return language === "en" ? "No reminder sent yet" : "لم يُرسل تذكير بعد";
  if (report.lastReminderStatus === "sent") return language === "en" ? "Last reminder sent" : "تم إرسال آخر تذكير";
  if (report.lastReminderStatus === "delivery_unavailable") return language === "en" ? "Delivery unavailable" : "تعذر الإرسال";
  return language === "en" ? "No registered device" : "لا يوجد جهاز مسجل";
}

export default function ReportRequestMonitorScreen() {
  const { data, session, syncNow } = useDepartment();
  const { language, isRTL } = useAppLanguage();
  const insets = useSafeAreaInsets();
  const [syncing, setSyncing] = useState(false);
  const overdue = useMemo(() => data.reports.filter((report) => isReportReminderDue(report)), [data.reports]);
  const canManage = session?.role === "admin";

  if (!canManage) return <View style={[styles.denied, { paddingTop: Math.max(36, insets.top + 24) }]}><MaterialIcons name="lock" size={34} color={palette.muted} /><Text style={[styles.deniedTitle, align(isRTL)]}>{language === "en" ? "Administrator access required" : "تتطلب صلاحية المشرف"}</Text><Text style={[styles.deniedText, align(isRTL)]}>{language === "en" ? "Only department administrators can review overdue report requests and reminder status." : "يمكن لمشرفي القسم فقط مراجعة طلبات التقارير المتأخرة وحالة التذكيرات."}</Text></View>;

  const refresh = async () => { setSyncing(true); await syncNow(); setSyncing(false); };
  const renderItem = ({ item }: { item: MedicalReport }) => {
    const team = data.teams.find((candidate) => candidate.id === item.teamId);
    const lastReminder = item.lastReminderAt ? formatRiyadhDateTime(item.lastReminderAt, language) : (language === "en" ? "Waiting for first eligible run" : "بانتظار أول موعد مستحق");
    return <AppCard style={styles.card}><View style={[styles.cardHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}><View style={styles.cardCopy}><Text style={[styles.patientName, align(isRTL)]}>{item.patientName || (language === "en" ? "Name not recorded" : "الاسم غير موثق")}</Text><Text style={[styles.recordNumber, align(isRTL)]}>{language === "en" ? `Record no.: ${item.patientCode}` : `رقم الملف: ${item.patientCode}`}</Text></View><StatusPill label={language === "en" ? "Overdue" : "متأخر"} tone="red" /></View><View style={styles.divider} /><Text style={[styles.meta, align(isRTL)]}>{language === "en" ? `Visit: ${item.visitDate || "Not recorded"}` : `الزيارة: ${item.visitDate || "غير موثق"}`}</Text><Text style={[styles.meta, align(isRTL)]}>{language === "en" ? `Consultant: ${item.consultantName || team?.lead || "Not recorded"}` : `الاستشاري: ${item.consultantName || team?.lead || "غير موثق"}`}</Text><Text style={[styles.meta, align(isRTL)]}>{language === "en" ? `Treating team: ${team?.name || "Not recorded"}` : `الفريق المعالج: ${team?.name || "غير موثق"}`}</Text><View style={[styles.reminderBox, { flexDirection: isRTL ? "row-reverse" : "row" }]}><MaterialIcons name="notifications-active" size={20} color={palette.teal} /><View style={styles.reminderCopy}><Text style={[styles.reminderTitle, align(isRTL)]}>{reminderLabel(item, language)}</Text><Text style={[styles.reminderTime, align(isRTL)]}>{language === "en" ? `Last reminder: ${lastReminder}` : `آخر تذكير: ${lastReminder}`}</Text></View></View></AppCard>;
  };

  return <View style={styles.page}><View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row", paddingTop: Math.max(12, insets.top + 8) }]}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={language === "en" ? "Back" : "رجوع"}><MaterialIcons name={isRTL ? "arrow-forward" : "arrow-back"} size={22} color={palette.navy} /></Pressable><View style={styles.headerCopy}><Text style={[styles.title, align(isRTL)]}>{language === "en" ? "Overdue report requests" : "طلبات التقارير المتأخرة"}</Text><Text style={[styles.subtitle, align(isRTL)]}>{language === "en" ? "Reminder status for requests awaiting Notify completed" : "حالة التذكير للطلبات التي تنتظر Notify completed"}</Text></View></View><View style={[styles.summary, { flexDirection: isRTL ? "row-reverse" : "row" }]}><View style={styles.summaryIcon}><MaterialIcons name="assignment-late" size={24} color="#FFFFFF" /></View><View style={styles.summaryCopy}><Text style={[styles.summaryCount, align(isRTL)]}>{language === "en" ? `${overdue.length} overdue` : `${overdue.length} طلبات متأخرة`}</Text><Text style={[styles.summaryText, align(isRTL)]}>{language === "en" ? "A reminder runs daily at 09:00 Riyadh time, starting after the third day." : "يعمل التذكير يوميًا الساعة 09:00 بتوقيت الرياض، ابتداءً بعد اليوم الثالث."}</Text></View></View><PrimaryButton label={syncing ? (language === "en" ? "Refreshing…" : "جارٍ التحديث…") : (language === "en" ? "Refresh central data" : "تحديث البيانات المركزية")} icon="cloud-sync" tone="teal" onPress={refresh} disabled={syncing} /><FlatList data={overdue} renderItem={renderItem} keyExtractor={(item) => item.id} contentContainerStyle={[styles.list, { paddingBottom: Math.max(24, insets.bottom + 16) }]} showsVerticalScrollIndicator={false} ListEmptyComponent={<EmptyState icon="task-alt" text={language === "en" ? "No overdue report requests. Completed notifications and recently created requests do not appear here." : "لا توجد طلبات تقارير متأخرة. لا تظهر هنا الطلبات المكتملة أو التي لم يمضِ على إنشائها ثلاثة أيام."} />} ListFooterComponent={syncing ? <ActivityIndicator color={palette.teal} /> : null} /></View>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: palette.canvas, paddingHorizontal: 18 }, header: { alignItems: "center", gap: 12, paddingBottom: 14 }, back: { height: 42, width: 42, borderRadius: 14, backgroundColor: palette.paleBlue, alignItems: "center", justifyContent: "center" }, headerCopy: { flex: 1, minWidth: 0 }, title: { color: palette.ink, fontSize: 22, fontWeight: "900" }, subtitle: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }, summary: { backgroundColor: palette.navy, borderRadius: 18, padding: 14, gap: 11, alignItems: "center", marginBottom: 12 }, summaryIcon: { height: 42, width: 42, borderRadius: 14, backgroundColor: "#FFFFFF2B", alignItems: "center", justifyContent: "center" }, summaryCopy: { flex: 1 }, summaryCount: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" }, summaryText: { color: "#D8EEF9", fontSize: 10, lineHeight: 15, marginTop: 3 }, list: { paddingTop: 12, gap: 10 }, card: { padding: 14 }, cardHeader: { alignItems: "center", gap: 10 }, cardCopy: { flex: 1 }, patientName: { color: palette.ink, fontSize: 16, fontWeight: "900" }, recordNumber: { color: palette.muted, fontSize: 11, marginTop: 3 }, divider: { height: 1, backgroundColor: palette.line, marginVertical: 10 }, meta: { color: "#3B5961", fontSize: 11, lineHeight: 17, marginTop: 2 }, reminderBox: { marginTop: 12, backgroundColor: "#E8F8F5", borderRadius: 12, padding: 10, gap: 8, alignItems: "center" }, reminderCopy: { flex: 1 }, reminderTitle: { color: palette.teal, fontSize: 12, fontWeight: "900" }, reminderTime: { color: "#2D6F69", fontSize: 10, marginTop: 2 }, denied: { flex: 1, backgroundColor: palette.canvas, alignItems: "center", paddingHorizontal: 32 }, deniedTitle: { color: palette.ink, fontSize: 19, fontWeight: "900", marginTop: 14 }, deniedText: { color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 7 }, pressed: { opacity: 0.75 } });
