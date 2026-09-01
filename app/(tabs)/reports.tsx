import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AppCard, palette, PrimaryButton, SectionTitle, StatusPill } from "@/components/neuro-ui";
import { useDepartment } from "@/lib/department-store";
import type { MedicalReport, ReportPriority } from "@/lib/department-model";
import { useAppLanguage } from "@/lib/language";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function priorityTone(priority: ReportPriority): "red" | "blue" | "gold" {
  return priority === "عاجل" ? "red" : priority === "عادي" ? "blue" : "gold";
}

function align(isRTL: boolean) {
  return { writingDirection: isRTL ? "rtl" as const : "ltr" as const, textAlign: isRTL ? "right" as const : "left" as const };
}

type ReportActionIcon = "insights" | "assignment" | "add";

export default function ReportsScreen() {
  const { data, session, advanceReport, completeReportNotification, addReport } = useDepartment();
  const insets = useSafeAreaInsets();
  const { language, isRTL, localize } = useAppLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [patientFileNumber, setPatientFileNumber] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<ReportPriority>("عادي");

  const create = async () => {
    if (!patientFileNumber.trim() || !title.trim()) {
      Alert.alert(localize("بيانات ناقصة"), language === "en" ? "Enter the medical record number and report title." : "أدخل رقم الملف وعنوان التقرير.");
      return;
    }
    const result = await addReport({ patientCode: patientFileNumber, title, priority });
    if (!result.ok) {
      const message = result.reason === "patient_not_found"
        ? (language === "en" ? "Use a medical record number that is linked to an active treating team." : "استخدم رقم ملف مرتبط بفريق علاجي نشط.")
        : (language === "en" ? "No active consultant or treating-team recipient is available for this request." : "لا يتوفر استشاري أو عضو فريق علاجي نشط لاستلام هذا الطلب.");
      Alert.alert(language === "en" ? "Request not created" : "لم يتم إنشاء الطلب", message);
      return;
    }
    setPatientFileNumber("");
    setTitle("");
    setPriority("عادي");
    setModalVisible(false);
    if (result.reason === "sync_pending") {
      Alert.alert(language === "en" ? "Request saved" : "تم حفظ الطلب", language === "en" ? "The request is saved on this device and will notify the treating team after central synchronization is restored." : "حُفظ الطلب على هذا الجهاز وسيصل إشعار للفريق المعالج بعد استعادة المزامنة المركزية.");
    }
  };

  const renderItem = ({ item }: { item: MedicalReport }) => (
    <AppCard style={styles.reportCard}>
      <View style={[styles.reportHead, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View>
          <Text style={styles.reportCode}>{item.patientCode}</Text>
          <Text style={[styles.created, align(isRTL)]}>{item.createdAt}</Text>
        </View>
        <StatusPill label={item.priority} tone={priorityTone(item.priority)} />
      </View>
      <Text style={[styles.reportTitle, align(isRTL)]}>{item.title}</Text>
      <Text style={[styles.requester, align(isRTL)]}>{language === "en" ? `Requested by: ${item.requester}` : `الطلب من: ${item.requester}`}</Text>
      <View style={[styles.reportFoot, { flexDirection: isRTL ? "row-reverse" : "row" }]}> 
        <Text style={[styles.due, align(isRTL)]}>{language === "en" ? `Due: ${item.dueAt}` : `الاستحقاق: ${item.dueAt}`}</Text>
        <Pressable onPress={() => advanceReport(item.id)} style={({ pressed }) => [styles.statusButton, pressed && styles.pressed]} accessibilityRole="button">
          <Text style={styles.statusButtonText}>{item.status === "جديد" ? (language === "en" ? "Start preparation" : "بدء الإعداد") : item.status === "قيد الإعداد" ? (language === "en" ? "Complete report" : "إتمام التقرير") : localize("مكتمل")}</Text>
        </Pressable>
      </View>
      <View style={[styles.notifyRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}> 
        <Text style={[styles.notifyHint, align(isRTL)]}>{item.notifyCompletedAt ? (language === "en" ? "Notify completed" : "اكتمل إشعار المتابعة") : (language === "en" ? "Reminder starts after 3 days until Notify completed." : "يبدأ التذكير بعد ٣ أيام حتى وضع Notify completed.")}</Text>
        {!item.notifyCompletedAt && session && ((item.recipientIds ?? []).includes(session.userId) || session.role === "admin") ? (
          <Pressable
            onPress={() => {
              if (!completeReportNotification(item.id)) Alert.alert(language === "en" ? "Update unavailable" : "تعذر تحديث الحالة", language === "en" ? "Only the notified treating team or an authorized report manager can complete this notification." : "يمكن للفريق المعالج المُبلّغ أو مدير التقارير المخوّل فقط إكمال هذا الإشعار.");
            }}
            style={({ pressed }) => [styles.notifyCompletedButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={language === "en" ? "Notify completed" : "إشعار مكتمل"}
          >
            <Text style={styles.notifyCompletedButtonText}>{language === "en" ? "Notify completed" : "إشعار مكتمل"}</Text>
          </Pressable>
        ) : null}
      </View>
    </AppCard>
  );

  return (
    <View style={styles.page}>
      <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row", paddingTop: Math.max(12, insets.top + 8) }]}>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, align(isRTL)]}>{language === "en" ? "Report requests" : "طلبات التقارير"}</Text>
          <Text style={[styles.subtitle, align(isRTL)]}>{language === "en" ? `${data.reports.filter((item) => item.status !== "مكتمل").length} requests need follow-up` : `${data.reports.filter((item) => item.status !== "مكتمل").length} طلبات تحتاج متابعة`}</Text>
        </View>
      </View>

      <View style={styles.reportActionPanel}>
        <View style={[styles.reportActionPanelHead, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <View style={styles.reportActionPanelIcon}><MaterialIcons name="description" size={19} color={palette.navy} /></View>
          <View style={styles.headerCopy}>
            <Text style={[styles.reportActionPanelTitle, align(isRTL)]}>{language === "en" ? "Report tools" : "أدوات التقارير"}</Text>
            <Text style={[styles.reportActionPanelHint, align(isRTL)]}>{language === "en" ? "Choose a report task" : "اختر إجراء التقارير المطلوب"}</Text>
          </View>
        </View>
        <View style={[styles.reportActions, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <ReportAction
            icon="insights"
            label={language === "en" ? "Dashboard" : "الإحصاءات"}
            hint={language === "en" ? "Monthly trends" : "الملخص الشهري"}
            tone="teal"
            isRTL={isRTL}
            accessibilityLabel={language === "en" ? "Open monthly on-call dashboard" : "فتح لوحة معلومات المناوبات الشهرية"}
            onPress={() => router.push("/shift-report-dashboard")}
          />
          <ReportAction
            icon="assignment"
            label={language === "en" ? "On-call report" : "تقرير المناوبة"}
            hint={language === "en" ? "Daily handover" : "التسليم اليومي"}
            tone="gold"
            isRTL={isRTL}
            accessibilityLabel={language === "en" ? "Open daily shift report" : "فتح تقرير المناوبة اليومي"}
            onPress={() => router.push("/shift-report")}
          />
          <ReportAction
            icon="add"
            label={language === "en" ? "New request" : "طلب جديد"}
            hint={language === "en" ? "Create report" : "إنشاء تقرير"}
            tone="navy"
            isRTL={isRTL}
            accessibilityLabel={language === "en" ? "Create a new report request" : "إنشاء طلب تقرير جديد"}
            onPress={() => setModalVisible(true)}
          />
        </View>
      </View>

      <Pressable
        onPress={() => router.push("/weekend-endorsement")}
        style={({ pressed }) => [weekendReportStyles.card, { flexDirection: isRTL ? "row-reverse" : "row" }, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={language === "en" ? "Open Weekend Endorsement" : "فتح تقرير Weekend Endorsement"}
      >
        <View style={weekendReportStyles.icon}><MaterialIcons name="weekend" size={22} color="#FFFFFF" /></View>
        <View style={weekendReportStyles.copy}>
          <Text style={[weekendReportStyles.title, align(isRTL)]}>Weekend Endorsement</Text>
          <Text style={[weekendReportStyles.text, align(isRTL)]}>{language === "en" ? "Review and print one handover report for all inpatients." : "راجع واطبع تقرير تسليم موحداً لجميع المرضى المنومين."}</Text>
        </View>
        <MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={24} color={palette.navy} />
      </Pressable>

      <FlatList data={data.reports} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={[styles.list, { paddingBottom: Math.max(24, insets.bottom + 16) }]} showsVerticalScrollIndicator={false} />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalShade}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <SectionTitle title={language === "en" ? "New report request" : "طلب تقرير جديد"} />
            <Text style={[styles.label, align(isRTL)]}>{language === "en" ? "Medical record no." : "رقم الملف"}</Text>
            <TextInput value={patientFileNumber} onChangeText={setPatientFileNumber} placeholder="KSMC-000000" placeholderTextColor="#9FB3C8" style={[styles.input, align(isRTL)]} textAlign={isRTL ? "right" : "left"} />
            <Text style={[styles.label, align(isRTL)]}>{language === "en" ? "Report title" : "عنوان التقرير"}</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder={language === "en" ? "e.g. Discharge report" : "مثال: تقرير خروج طبي"} placeholderTextColor="#9FB3C8" style={[styles.input, align(isRTL)]} textAlign={isRTL ? "right" : "left"} />
            <Text style={[styles.label, align(isRTL)]}>{language === "en" ? "Priority" : "الأولوية"}</Text>
            <View style={[styles.choiceRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              {(["عاجل", "عادي", "متابعة"] as ReportPriority[]).map((option) => (
                <Pressable key={option} onPress={() => setPriority(option)} style={({ pressed }) => [styles.choice, priority === option && styles.choiceSelected, pressed && styles.pressed]} accessibilityRole="radio" accessibilityState={{ selected: priority === option }}>
                  <Text style={styles.choiceText}>{localize(option)}</Text>
                </Pressable>
              ))}
            </View>
            <PrimaryButton label={language === "en" ? "Add request" : "إضافة الطلب"} onPress={create} icon="add" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ReportAction({ icon, label, hint, tone, isRTL, accessibilityLabel, onPress }: { icon: ReportActionIcon; label: string; hint: string; tone: "teal" | "gold" | "navy"; isRTL: boolean; accessibilityLabel: string; onPress: () => void }) {
  const toneStyles = tone === "teal" ? [styles.reportActionTeal, styles.reportActionIconTeal] : tone === "gold" ? [styles.reportActionGold, styles.reportActionIconGold] : [styles.reportActionNavy, styles.reportActionIconNavy];
  const iconColor = tone === "navy" ? "#FFFFFF" : palette.navy;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={({ pressed }) => [styles.reportAction, toneStyles[0], pressed && styles.pressed]}>
      <View style={[styles.reportActionIcon, toneStyles[1]]}><MaterialIcons name={icon} size={23} color={iconColor} /></View>
      <Text style={[styles.reportActionLabel, tone === "navy" && styles.reportActionLabelOnNavy, { writingDirection: isRTL ? "rtl" : "ltr" }]} numberOfLines={2}>{label}</Text>
      <Text style={[styles.reportActionHint, tone === "navy" && styles.reportActionHintOnNavy, { writingDirection: isRTL ? "rtl" : "ltr" }]} numberOfLines={1}>{hint}</Text>
    </Pressable>
  );
}

const weekendReportStyles = StyleSheet.create({
  card: { marginBottom: 4, borderWidth: 1, borderColor: "#BDE5DB", backgroundColor: palette.paleTeal, borderRadius: 17, padding: 13, alignItems: "center", gap: 10 },
  icon: { height: 40, width: 40, borderRadius: 13, backgroundColor: palette.teal, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1 },
  title: { color: palette.teal, fontSize: 13, fontWeight: "900" },
  text: { color: "#2D6F69", fontSize: 10, lineHeight: 15, marginTop: 3 },
});

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas, paddingHorizontal: 18 },
  header: { paddingTop: 24, paddingBottom: 14, alignItems: "center" },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { color: palette.ink, fontSize: 24, fontWeight: "900" },
  subtitle: { color: palette.muted, fontSize: 13, marginTop: 4 },
  reportActionPanel: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D6E4EB", borderRadius: 17, padding: 12, marginBottom: 10 },
  reportActionPanelHead: { alignItems: "center", gap: 9, marginBottom: 11 },
  reportActionPanelIcon: { width: 35, height: 35, borderRadius: 11, backgroundColor: palette.paleBlue, alignItems: "center", justifyContent: "center" },
  reportActionPanelTitle: { color: palette.ink, fontSize: 13, fontWeight: "900" },
  reportActionPanelHint: { color: palette.muted, fontSize: 10, marginTop: 2 },
  reportActions: { gap: 8 },
  reportAction: { flex: 1, minWidth: 0, minHeight: 88, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 5, paddingVertical: 8 },
  reportActionTeal: { backgroundColor: "#E8F8F5", borderWidth: 1, borderColor: "#9CDDD2" },
  reportActionGold: { backgroundColor: "#FFF8E6", borderWidth: 1, borderColor: "#EBC97B" },
  reportActionNavy: { backgroundColor: palette.navy, borderWidth: 1, borderColor: palette.navy },
  reportActionIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 5 },
  reportActionIconTeal: { backgroundColor: "#BDEFE6" },
  reportActionIconGold: { backgroundColor: "#FFE8AE" },
  reportActionIconNavy: { backgroundColor: "#FFFFFF2B" },
  reportActionLabel: { color: palette.ink, fontSize: 10, fontWeight: "900", textAlign: "center", lineHeight: 13 },
  reportActionHint: { color: "#48717B", fontSize: 8, textAlign: "center", marginTop: 2 },
  reportActionLabelOnNavy: { color: "#FFFFFF" },
  reportActionHintOnNavy: { color: "#D8EEF9" },
  list: { paddingBottom: 24, gap: 10 },
  reportCard: { padding: 15 },
  reportHead: { justifyContent: "space-between" },
  reportCode: { color: palette.ink, fontSize: 13, fontWeight: "900" },
  created: { color: palette.muted, fontSize: 11, marginTop: 3 },
  reportTitle: { color: palette.ink, fontSize: 16, fontWeight: "900", marginTop: 12 },
  requester: { color: palette.muted, fontSize: 12, marginTop: 5 },
  reportFoot: { borderTopColor: palette.line, borderTopWidth: 1, marginTop: 13, paddingTop: 11, justifyContent: "space-between", alignItems: "center", gap: 8 },
  due: { color: palette.gold, fontSize: 11, fontWeight: "700", flex: 1 },
  statusButton: { backgroundColor: palette.paleBlue, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10 },
  statusButtonText: { color: palette.navy, fontSize: 11, fontWeight: "800" },
  notifyRow: { marginTop: 9, alignItems: "center", gap: 8 },
  notifyHint: { color: palette.muted, fontSize: 10, lineHeight: 14, flex: 1 },
  notifyCompletedButton: { backgroundColor: "#E8F8F5", borderWidth: 1, borderColor: "#9CDDD2", borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6 },
  notifyCompletedButtonText: { color: palette.teal, fontSize: 10, fontWeight: "900" },
  modalShade: { flex: 1, justifyContent: "flex-end", backgroundColor: "#102A4370" },
  sheet: { backgroundColor: "#FFFFFF", padding: 20, paddingBottom: 36, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: palette.line, marginBottom: 2 },
  label: { color: palette.ink, fontSize: 13, fontWeight: "800", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: palette.line, borderRadius: 13, minHeight: 48, paddingHorizontal: 12, color: palette.ink, marginBottom: 12 },
  choiceRow: { gap: 8, marginBottom: 16 },
  choice: { flex: 1, alignItems: "center", paddingVertical: 11, borderColor: palette.line, borderWidth: 1, borderRadius: 12 },
  choiceSelected: { backgroundColor: palette.paleBlue, borderColor: palette.navy },
  choiceText: { color: palette.ink, fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.78 },
});
