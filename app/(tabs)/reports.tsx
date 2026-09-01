import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppCard, palette, PrimaryButton, SectionTitle, StatusPill } from "@/components/neuro-ui";
import type { MedicalReport, ReportPriority } from "@/lib/department-model";
import { useDepartment } from "@/lib/department-store";
import { useAppLanguage } from "@/lib/language";

function priorityTone(priority: ReportPriority): "red" | "blue" | "gold" {
  return priority === "عاجل" ? "red" : priority === "عادي" ? "blue" : "gold";
}

function align(isRTL: boolean) {
  return { writingDirection: isRTL ? "rtl" as const : "ltr" as const, textAlign: isRTL ? "right" as const : "left" as const };
}

type ReportActionIcon = "insights" | "assignment" | "add";

export default function ReportsScreen() {
  const { data, session, advanceReport, completeReportNotification, addReport } = useDepartment();
  const { language, isRTL, localize } = useAppLanguage();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientFileNumber, setPatientFileNumber] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [teamId, setTeamId] = useState("");
  const [notes, setNotes] = useState("");
  const selectedTeam = data.teams.find((team) => team.id === teamId);

  const openCreate = () => {
    setTeamId(data.teams[0]?.id ?? "");
    setModalVisible(true);
  };

  const create = async () => {
    if (!patientName.trim() || !patientFileNumber.trim() || !visitDate.trim() || !teamId) {
      Alert.alert(language === "en" ? "Required information" : "بيانات ناقصة", language === "en" ? "Enter the patient name, medical record number, visit date, and treating team." : "أدخل اسم المريض ورقم الملف وتاريخ الزيارة واختر الفريق المعالج.");
      return;
    }
    const result = await addReport({ patientName, patientCode: patientFileNumber, visitDate, teamId, notes });
    if (!result.ok) {
      Alert.alert(language === "en" ? "Request not created" : "لم يتم إنشاء الطلب", result.reason === "no_recipients"
        ? (language === "en" ? "The selected team has no active consultant or member to receive this request." : "لا يضم الفريق المختار استشارياً أو عضواً نشطاً لاستلام هذا الطلب.")
        : (language === "en" ? "The selected treating team is unavailable. Refresh the department data and try again." : "الفريق المعالج المختار غير متاح. حدّث بيانات القسم وحاول مرة أخرى."));
      return;
    }
    setPatientName("");
    setPatientFileNumber("");
    setVisitDate("");
    setTeamId("");
    setNotes("");
    setModalVisible(false);
    if (result.reason === "sync_pending") {
      Alert.alert(language === "en" ? "Request saved" : "تم حفظ الطلب", language === "en" ? "The request is saved locally and will notify the selected treating team when central synchronization is restored." : "حُفظ الطلب محلياً وسيصل إشعار للفريق المعالج المختار عند استعادة المزامنة المركزية.");
    }
  };

  const renderItem = ({ item }: { item: MedicalReport }) => (
    <AppCard style={styles.reportCard}>
      <View style={[styles.reportHead, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={styles.reportIdentity}>
          <Text style={[styles.reportCode, align(isRTL)]}>{item.patientCode}</Text>
          <Text style={[styles.created, align(isRTL)]}>{item.createdAt}</Text>
        </View>
        <StatusPill label={item.priority} tone={priorityTone(item.priority)} />
      </View>
      <Text style={[styles.reportTitle, align(isRTL)]}>{item.patientName || item.title}</Text>
      <Text style={[styles.reportMeta, align(isRTL)]}>{language === "en" ? `Visit: ${item.visitDate || "Not recorded"}` : `تاريخ الزيارة: ${item.visitDate || "غير موثق"}`}</Text>
      <Text style={[styles.reportMeta, align(isRTL)]}>{language === "en" ? `Consultant / team: ${item.consultantName || "Not recorded"}` : `الاستشاري / الفريق: ${item.consultantName || "غير موثق"}`}</Text>
      {item.notes ? <Text style={[styles.reportNotes, align(isRTL)]} numberOfLines={3}>{item.notes}</Text> : null}
      <Text style={[styles.requester, align(isRTL)]}>{language === "en" ? `Requested by: ${item.requester}` : `الطلب من: ${item.requester}`}</Text>
      <View style={[styles.reportFoot, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Text style={[styles.due, align(isRTL)]}>{language === "en" ? `Due: ${item.dueAt}` : `الاستحقاق: ${item.dueAt}`}</Text>
        <Pressable onPress={() => advanceReport(item.id)} style={({ pressed }) => [styles.statusButton, pressed && styles.pressed]} accessibilityRole="button">
          <Text style={styles.statusButtonText}>{item.status === "جديد" ? (language === "en" ? "Start preparation" : "بدء الإعداد") : item.status === "قيد الإعداد" ? (language === "en" ? "Complete report" : "إتمام التقرير") : localize("مكتمل")}</Text>
        </Pressable>
      </View>
      <View style={[styles.notifyRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Text style={[styles.notifyHint, align(isRTL)]}>{item.notifyCompletedAt ? (language === "en" ? "Notify completed" : "اكتمل إشعار المتابعة") : (language === "en" ? "Daily reminder begins after 3 days until Notify completed." : "يبدأ التذكير اليومي بعد ٣ أيام حتى وضع Notify completed.")}</Text>
        {!item.notifyCompletedAt && session && ((item.recipientIds ?? []).includes(session.userId) || session.role === "admin") ? (
          <Pressable onPress={() => {
            if (!completeReportNotification(item.id)) Alert.alert(language === "en" ? "Update unavailable" : "تعذر تحديث الحالة", language === "en" ? "Only the notified treating team or an authorized report manager can complete this notification." : "يمكن للفريق المُبلّغ أو مدير التقارير المخوّل فقط إكمال هذا الإشعار.");
          }} style={({ pressed }) => [styles.notifyCompletedButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={language === "en" ? "Notify completed" : "إشعار مكتمل"}>
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
          <View style={styles.headerCopy}><Text style={[styles.reportActionPanelTitle, align(isRTL)]}>{language === "en" ? "Report tools" : "أدوات التقارير"}</Text><Text style={[styles.reportActionPanelHint, align(isRTL)]}>{language === "en" ? "Choose a report task" : "اختر إجراء التقارير المطلوب"}</Text></View>
        </View>
        <View style={[styles.reportActions, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <ReportAction icon="insights" label={language === "en" ? "Dashboard" : "الإحصاءات"} hint={language === "en" ? "Monthly trends" : "الملخص الشهري"} tone="teal" isRTL={isRTL} accessibilityLabel={language === "en" ? "Open monthly on-call dashboard" : "فتح لوحة معلومات المناوبات الشهرية"} onPress={() => router.push("/shift-report-dashboard")} />
          <ReportAction icon="assignment" label={language === "en" ? "On-call report" : "تقرير المناوبة"} hint={language === "en" ? "Daily handover" : "التسليم اليومي"} tone="gold" isRTL={isRTL} accessibilityLabel={language === "en" ? "Open daily shift report" : "فتح تقرير المناوبة اليومي"} onPress={() => router.push("/shift-report")} />
          <ReportAction icon="add" label={language === "en" ? "New request" : "طلب جديد"} hint={language === "en" ? "Create report" : "إنشاء تقرير"} tone="navy" isRTL={isRTL} accessibilityLabel={language === "en" ? "Create a new report request" : "إنشاء طلب تقرير جديد"} onPress={openCreate} />
        </View>
      </View>

      <Pressable onPress={() => router.push("/weekend-endorsement")} style={({ pressed }) => [weekendReportStyles.card, { flexDirection: isRTL ? "row-reverse" : "row" }, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={language === "en" ? "Open Weekend Endorsement" : "فتح تقرير Weekend Endorsement"}>
        <View style={weekendReportStyles.icon}><MaterialIcons name="weekend" size={22} color="#FFFFFF" /></View>
        <View style={weekendReportStyles.copy}><Text style={[weekendReportStyles.title, align(isRTL)]}>Weekend Endorsement</Text><Text style={[weekendReportStyles.text, align(isRTL)]}>{language === "en" ? "Review and print one handover report for all inpatients." : "راجع واطبع تقرير تسليم موحداً لجميع المرضى المنومين."}</Text></View>
        <MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={24} color={palette.navy} />
      </Pressable>

      <FlatList data={data.reports} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={[styles.list, { paddingBottom: Math.max(24, insets.bottom + 16) }]} showsVerticalScrollIndicator={false} />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalShade}>
          <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
            <View style={styles.handle} />
            <SectionTitle title={language === "en" ? "New report request" : "طلب تقرير جديد"} />
            <Text style={[styles.label, align(isRTL)]}>{language === "en" ? "Patient name" : "اسم المريض"}</Text>
            <TextInput value={patientName} onChangeText={setPatientName} placeholder={language === "en" ? "Patient full name" : "الاسم الكامل للمريض"} placeholderTextColor="#9FB3C8" style={[styles.input, align(isRTL)]} textAlign={isRTL ? "right" : "left"} />
            <Text style={[styles.label, align(isRTL)]}>{language === "en" ? "Medical record no." : "رقم الملف"}</Text>
            <TextInput value={patientFileNumber} onChangeText={setPatientFileNumber} placeholder="KSMC-000000" placeholderTextColor="#9FB3C8" style={[styles.input, align(isRTL)]} textAlign={isRTL ? "right" : "left"} />
            <Text style={[styles.label, align(isRTL)]}>{language === "en" ? "Visit date" : "تاريخ الزيارة"}</Text>
            <TextInput value={visitDate} onChangeText={setVisitDate} placeholder="YYYY-MM-DD" placeholderTextColor="#9FB3C8" style={[styles.input, align(isRTL)]} textAlign={isRTL ? "right" : "left"} />
            <Text style={[styles.label, align(isRTL)]}>{language === "en" ? "Consultant and treating team" : "الاستشاري والفريق المعالج"}</Text>
            <View style={styles.teamChoices}>{data.teams.map((team) => <Pressable key={team.id} onPress={() => setTeamId(team.id)} style={({ pressed }) => [styles.teamChoice, { flexDirection: isRTL ? "row-reverse" : "row" }, teamId === team.id && [styles.teamChoiceSelected, { borderColor: team.color }], pressed && styles.pressed]} accessibilityRole="radio" accessibilityState={{ selected: teamId === team.id }}><View style={[styles.teamDot, { backgroundColor: team.color }]} /><View style={styles.teamChoiceCopy}><Text style={[styles.teamChoiceTitle, align(isRTL)]}>{team.lead}</Text><Text style={[styles.teamChoiceText, align(isRTL)]}>{team.name}</Text></View><MaterialIcons name={teamId === team.id ? "radio-button-checked" : "radio-button-unchecked"} size={20} color={teamId === team.id ? team.color : palette.muted} /></Pressable>)}</View>
            <Text style={[styles.label, align(isRTL)]}>{language === "en" ? "Notes" : "ملاحظات"}</Text>
            <TextInput value={notes} onChangeText={setNotes} placeholder={language === "en" ? "Optional request notes" : "ملاحظات إضافية للطلب"} placeholderTextColor="#9FB3C8" multiline style={[styles.input, styles.notesInput, align(isRTL)]} textAlign={isRTL ? "right" : "left"} />
            {selectedTeam ? <Text style={[styles.scopeHint, align(isRTL)]}>{language === "en" ? `Notification will be sent only to ${selectedTeam.lead} and active members of the selected treating team.` : `سيصل الإشعار فقط إلى ${selectedTeam.lead} وأعضاء الفريق المعالج المختار النشطين.`}</Text> : null}
            <PrimaryButton label={language === "en" ? "Add request" : "إضافة الطلب"} onPress={create} icon="add" />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function ReportAction({ icon, label, hint, tone, isRTL, accessibilityLabel, onPress }: { icon: ReportActionIcon; label: string; hint: string; tone: "teal" | "gold" | "navy"; isRTL: boolean; accessibilityLabel: string; onPress: () => void }) {
  const toneStyles = tone === "teal" ? [styles.reportActionTeal, styles.reportActionIconTeal] : tone === "gold" ? [styles.reportActionGold, styles.reportActionIconGold] : [styles.reportActionNavy, styles.reportActionIconNavy];
  const iconColor = tone === "navy" ? "#FFFFFF" : palette.navy;
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={({ pressed }) => [styles.reportAction, toneStyles[0], pressed && styles.pressed]}><View style={[styles.reportActionIcon, toneStyles[1]]}><MaterialIcons name={icon} size={23} color={iconColor} /></View><Text style={[styles.reportActionLabel, tone === "navy" && styles.reportActionLabelOnNavy, { writingDirection: isRTL ? "rtl" : "ltr" }]} numberOfLines={2}>{label}</Text><Text style={[styles.reportActionHint, tone === "navy" && styles.reportActionHintOnNavy, { writingDirection: isRTL ? "rtl" : "ltr" }]} numberOfLines={1}>{hint}</Text></Pressable>;
}

const weekendReportStyles = StyleSheet.create({ card: { marginBottom: 4, borderWidth: 1, borderColor: "#BDE5DB", backgroundColor: palette.paleTeal, borderRadius: 17, padding: 13, alignItems: "center", gap: 10 }, icon: { height: 40, width: 40, borderRadius: 13, backgroundColor: palette.teal, alignItems: "center", justifyContent: "center" }, copy: { flex: 1 }, title: { color: palette.teal, fontSize: 13, fontWeight: "900" }, text: { color: "#2D6F69", fontSize: 10, lineHeight: 15, marginTop: 3 } });

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas, paddingHorizontal: 18 }, header: { paddingTop: 24, paddingBottom: 14, alignItems: "center" }, headerCopy: { flex: 1, minWidth: 0 }, title: { color: palette.ink, fontSize: 24, fontWeight: "900" }, subtitle: { color: palette.muted, fontSize: 13, marginTop: 4 },
  reportActionPanel: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D6E4EB", borderRadius: 17, padding: 12, marginBottom: 10 }, reportActionPanelHead: { alignItems: "center", gap: 9, marginBottom: 11 }, reportActionPanelIcon: { width: 35, height: 35, borderRadius: 11, backgroundColor: palette.paleBlue, alignItems: "center", justifyContent: "center" }, reportActionPanelTitle: { color: palette.ink, fontSize: 13, fontWeight: "900" }, reportActionPanelHint: { color: palette.muted, fontSize: 10, marginTop: 2 }, reportActions: { gap: 8 }, reportAction: { flex: 1, minWidth: 0, minHeight: 88, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 5, paddingVertical: 8 }, reportActionTeal: { backgroundColor: "#E8F8F5", borderWidth: 1, borderColor: "#9CDDD2" }, reportActionGold: { backgroundColor: "#FFF8E6", borderWidth: 1, borderColor: "#EBC97B" }, reportActionNavy: { backgroundColor: palette.navy, borderWidth: 1, borderColor: palette.navy }, reportActionIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 5 }, reportActionIconTeal: { backgroundColor: "#BDEFE6" }, reportActionIconGold: { backgroundColor: "#FFE8AE" }, reportActionIconNavy: { backgroundColor: "#FFFFFF2B" }, reportActionLabel: { color: palette.ink, fontSize: 10, fontWeight: "900", textAlign: "center", lineHeight: 13 }, reportActionHint: { color: "#48717B", fontSize: 8, textAlign: "center", marginTop: 2 }, reportActionLabelOnNavy: { color: "#FFFFFF" }, reportActionHintOnNavy: { color: "#D8EEF9" },
  list: { paddingBottom: 24, gap: 10 }, reportCard: { padding: 15 }, reportHead: { justifyContent: "space-between" }, reportIdentity: { flex: 1, minWidth: 0 }, reportCode: { color: palette.ink, fontSize: 13, fontWeight: "900" }, created: { color: palette.muted, fontSize: 11, marginTop: 3 }, reportTitle: { color: palette.ink, fontSize: 16, fontWeight: "900", marginTop: 12 }, reportMeta: { color: palette.muted, fontSize: 11, marginTop: 4 }, reportNotes: { color: "#3B5961", backgroundColor: "#F4F9FB", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 11, lineHeight: 16, marginTop: 8 }, requester: { color: palette.muted, fontSize: 12, marginTop: 5 }, reportFoot: { borderTopColor: palette.line, borderTopWidth: 1, marginTop: 13, paddingTop: 11, justifyContent: "space-between", alignItems: "center", gap: 8 }, due: { color: palette.gold, fontSize: 11, fontWeight: "700", flex: 1 }, statusButton: { backgroundColor: palette.paleBlue, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10 }, statusButtonText: { color: palette.navy, fontSize: 11, fontWeight: "800" }, notifyRow: { marginTop: 9, alignItems: "center", gap: 8 }, notifyHint: { color: palette.muted, fontSize: 10, lineHeight: 14, flex: 1 }, notifyCompletedButton: { backgroundColor: "#E8F8F5", borderWidth: 1, borderColor: "#9CDDD2", borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6 }, notifyCompletedButtonText: { color: palette.teal, fontSize: 10, fontWeight: "900" },
  modalShade: { flex: 1, justifyContent: "flex-end", backgroundColor: "#102A4370" }, sheet: { backgroundColor: "#FFFFFF", maxHeight: "90%", borderTopLeftRadius: 28, borderTopRightRadius: 28 }, sheetContent: { padding: 20, paddingBottom: 36 }, handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: palette.line, marginBottom: 2 }, label: { color: palette.ink, fontSize: 13, fontWeight: "800", marginBottom: 6 }, input: { borderWidth: 1, borderColor: palette.line, borderRadius: 13, minHeight: 48, paddingHorizontal: 12, color: palette.ink, marginBottom: 12 }, teamChoices: { gap: 8, marginBottom: 12 }, teamChoice: { borderWidth: 1, borderColor: palette.line, borderRadius: 12, padding: 10, alignItems: "center", gap: 9 }, teamChoiceSelected: { backgroundColor: "#F5FBFC" }, teamDot: { height: 12, width: 12, borderRadius: 6 }, teamChoiceCopy: { flex: 1 }, teamChoiceTitle: { color: palette.ink, fontSize: 12, fontWeight: "900" }, teamChoiceText: { color: palette.muted, fontSize: 10, marginTop: 2 }, notesInput: { minHeight: 82, paddingTop: 12, textAlignVertical: "top" }, scopeHint: { color: palette.teal, fontSize: 10, lineHeight: 15, marginBottom: 14 }, pressed: { opacity: 0.78 },
});
