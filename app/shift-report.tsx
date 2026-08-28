import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AppCard, EmptyState, IconAction, palette, PrimaryButton, SectionTitle, StatusPill } from "@/components/neuro-ui";
import type { DailyShiftReport } from "@/lib/department-model";
import { useDepartment } from "@/lib/department-store";
import { exportShiftReport } from "@/lib/shift-report-export";
import { getShiftWindow, getShiftWindowForReportDate } from "@/lib/shift-endorsement";
import { useAppLanguage } from "@/lib/language";
import { LogoLoading } from "@/components/logo-loading";
import { eligibleOnCallUsers, searchOnCallUsers } from "@/lib/on-call-eligibility";

export default function ShiftReportScreen() {
  const { data, session, generateDailyShiftReport, setOnCallUserId } = useDepartment();
  const { language, isRTL } = useAppLanguage();
  const [selected, setSelected] = useState<DailyShiftReport | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [reportDate, setReportDate] = useState(() => getShiftWindow().reportDate);
  const canManage = Boolean(session && data.users.find((user) => user.id === session.userId)?.permissions.includes("manage_reports"));
  const activeUsers = data.users.filter((user) => user.active);
  const onCallCandidates = {
    first: eligibleOnCallUsers(activeUsers, "first"),
    second: eligibleOnCallUsers(activeUsers, "second"),
    third: eligibleOnCallUsers(activeUsers, "third"),
  };
  const selectedOnCall = {
    first: onCallCandidates.first.find((user) => user.id === data.shiftReportPreferences?.firstOnCallUserId),
    second: onCallCandidates.second.find((user) => user.id === data.shiftReportPreferences?.secondOnCallUserId),
    third: onCallCandidates.third.find((user) => user.id === data.shiftReportPreferences?.thirdOnCallUserId),
  };
  const window = getShiftWindowForReportDate(reportDate);
  const moveReportDate = (days: number) => {
    const date = new Date(`${reportDate}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return setReportDate(getShiftWindow().reportDate);
    date.setUTCDate(date.getUTCDate() + days);
    setReportDate(date.toISOString().slice(0, 10));
  };

  const generate = () => {
    if (!window) {
      Alert.alert(language === "en" ? "On-call day required" : "يوم المناوبة مطلوب", language === "en" ? "Enter a valid date in YYYY-MM-DD format." : "أدخل تاريخاً صحيحاً بصيغة YYYY-MM-DD.");
      return;
    }
    if (!selectedOnCall.first || !selectedOnCall.second || !selectedOnCall.third) {
      Alert.alert(
        language === "en" ? "On-call team required" : "فريق المناوبة مطلوب",
        language === "en" ? "Select the 1st, 2nd, and 3rd on-call clinicians from active users before creating the report." : "اختر المناوب الأول والثاني والثالث من المستخدمين النشطين قبل إنشاء التقرير.",
      );
      return;
    }
    const report = generateDailyShiftReport(reportDate);
    if (!report) {
      Alert.alert(language === "en" ? "Permission required" : "الصلاحية مطلوبة", language === "en" ? "Only users with report-management permission can generate the shift report." : "يمكن للمستخدمين المخولين بإدارة التقارير فقط إنشاء تقرير المناوبة.");
      return;
    }
    setSelected(report);
    Alert.alert(language === "en" ? "Report ready" : "التقرير جاهز", language === "en" ? "An internal notification has been created for authorized report users." : "تم إنشاء تنبيه داخلي للمستخدمين المخولين بالتقارير.");
  };

  const download = async (report: DailyShiftReport) => {
    try {
      setDownloading(true);
      const result = await exportShiftReport(report);
      Alert.alert(language === "en" ? "Download ready" : "التنزيل جاهز", result === "shared" ? (language === "en" ? "Use the device share sheet to save or send the PDF." : "استخدم خيارات المشاركة في الجهاز لحفظ ملف PDF أو إرساله.") : (language === "en" ? "The printable report file was downloaded." : "تم تنزيل ملف التقرير القابل للطباعة."));
    } catch {
      Alert.alert(language === "en" ? "Export unavailable" : "تعذر التصدير", language === "en" ? "The report could not be prepared for download on this device." : "تعذر تجهيز التقرير للتنزيل على هذا الجهاز.");
    } finally {
      setDownloading(false);
    }
  };

  const renderReport = ({ item }: { item: DailyShiftReport }) => (
    <Pressable onPress={() => setSelected(item)} style={({ pressed }) => pressed && { opacity: 0.76 }}>
      <AppCard style={styles.reportCard}>
        <View style={[styles.cardHead, direction(isRTL)]}>
          <View>
            <Text style={[styles.reportDate, align(isRTL)]}>{item.reportDate}</Text>
            <Text style={[styles.reportMeta, align(isRTL)]}>{language === "en" ? `Prepared by ${item.generatedBy}` : `أعدّه ${item.generatedBy}`}</Text>
          </View>
          <StatusPill label={language === "en" ? "Ready" : "جاهز"} tone="teal" />
        </View>
        <View style={[styles.statRow, direction(isRTL)]}>
          <MiniStat value={item.statistics.consultations} label={language === "en" ? "Consults" : "استشارات"} />
          <MiniStat value={item.statistics.admissions} label={language === "en" ? "Admissions" : "تنويم"} />
          <MiniStat value={item.statistics.emergencySurgeries} label={language === "en" ? "Emergency OR" : "عمليات إسعافية"} />
        </View>
        <View style={[styles.cardActions, direction(isRTL)]}>
          <Text style={[styles.openText, align(isRTL)]}>{language === "en" ? "Open report" : "فتح التقرير"}</Text>
          <MaterialIcons name={isRTL ? "arrow-back" : "arrow-forward"} size={17} color={palette.navy} />
        </View>
      </AppCard>
    </Pressable>
  );

  return (
    <View style={styles.page}>
      {downloading ? <LogoLoading overlay label={language === "en" ? "Preparing shift report…" : "جارٍ تجهيز تقرير المناوبة…"} /> : null}
      <View style={[styles.header, direction(isRTL)]}>
        <IconAction icon={isRTL ? "arrow-forward" : "arrow-back"} label={language === "en" ? "Back" : "رجوع"} onPress={() => router.back()} />
        <View style={styles.headerCopy}>
          <Text style={[styles.title, align(isRTL)]}>{language === "en" ? "Daily shift report" : "تقرير المناوبة اليومي"}</Text>
          <Text style={[styles.subtitle, align(isRTL)]}>{language === "en" ? "KSMC neurosurgery endorsement format" : "وفق نموذج تسليم مناوبات جراحة المخ والأعصاب"}</Text>
        </View>
        <IconAction icon="archive" label={language === "en" ? "Archive" : "الأرشيف"} onPress={() => router.push("/shift-report-archive")} />
      </View>

      <AppCard style={styles.windowCard}>
        <View style={[styles.windowHead, direction(isRTL)]}>
          <MaterialIcons name="schedule" size={22} color={palette.gold} />
          <Text style={[styles.windowTitle, align(isRTL)]}>{language === "en" ? "24-hour handover window" : "نافذة تسليم 24 ساعة"}</Text>
        </View>
        <Text style={[styles.windowText, align(isRTL)]}>{language === "en" ? "Choose the on-call day: cases created from 07:30 until 07:30 the next day are included." : "اختر يوم المناوبة: يشمل التقرير الحالات المضافة من 07:30 صباحاً حتى 07:30 صباح اليوم التالي."}</Text>
        <View style={[styles.reportDateControls, direction(isRTL)]}>
          <Pressable onPress={() => moveReportDate(-1)} style={styles.reportDateStep} accessibilityLabel={language === "en" ? "Previous on-call day" : "يوم المناوبة السابق"}><MaterialIcons name={isRTL ? "chevron-right" : "chevron-left"} size={20} color={palette.navy} /></Pressable>
          <TextInput value={reportDate} onChangeText={setReportDate} placeholder="YYYY-MM-DD" placeholderTextColor="#8AA0B3" autoCapitalize="none" keyboardType="numbers-and-punctuation" maxLength={10} style={styles.reportDateInput} textAlign="center" accessibilityLabel={language === "en" ? "On-call day" : "يوم المناوبة"} />
          <Pressable onPress={() => setReportDate(getShiftWindow().reportDate)} style={styles.reportDateToday}><Text style={styles.reportDateTodayText}>{language === "en" ? "Today" : "اليوم"}</Text></Pressable>
          <Pressable onPress={() => moveReportDate(1)} style={styles.reportDateStep} accessibilityLabel={language === "en" ? "Next on-call day" : "يوم المناوبة التالي"}><MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={20} color={palette.navy} /></Pressable>
        </View>
        <Text style={[styles.windowDate, align(isRTL)]}>{window ? `${window.startAt.slice(0, 10)} · 07:30 → 07:30` : (language === "en" ? "Enter a valid on-call day" : "أدخل يوم مناوبة صحيحاً")}</Text>
      </AppCard>

      {canManage ? (
        <AppCard style={styles.onCallCard}>
          <View style={[styles.onCallHead, direction(isRTL)]}>
            <View style={styles.onCallBadge}><MaterialIcons name="groups" size={18} color={palette.teal} /></View>
            <View style={styles.headerCopy}>
              <Text style={[styles.onCallTitle, align(isRTL)]}>{language === "en" ? "On-call team" : "فريق المناوبة"}</Text>
              <Text style={[styles.onCallHint, align(isRTL)]}>{language === "en" ? "1st: resident · 2nd: specialist · 3rd: consultant. Active users only." : "الأول: مقيم · الثاني: أخصائي · الثالث: استشاري. تظهر الحسابات النشطة فقط."}</Text>
            </View>
          </View>
          <OnCallUserPicker slot="first" selectedUser={selectedOnCall.first} users={onCallCandidates.first} language={language} isRTL={isRTL} onSelect={setOnCallUserId} />
          <OnCallUserPicker slot="second" selectedUser={selectedOnCall.second} users={onCallCandidates.second} language={language} isRTL={isRTL} onSelect={setOnCallUserId} />
          <OnCallUserPicker slot="third" selectedUser={selectedOnCall.third} users={onCallCandidates.third} language={language} isRTL={isRTL} onSelect={setOnCallUserId} />
        </AppCard>
      ) : null}

      <View style={styles.createWrap}>
        {canManage ? <PrimaryButton label={language === "en" ? "Generate report now" : "إنشاء التقرير الآن"} icon="description" onPress={generate} /> : <Text style={[styles.permissionText, align(isRTL)]}>{language === "en" ? "Report management permission is required." : "يلزم توفر صلاحية إدارة التقارير."}</Text>}
      </View>

      <SectionTitle title={language === "en" ? "Generated reports" : "التقارير المُنشأة"} action={language === "en" ? "Archive" : "الأرشيف"} onPress={() => router.push("/shift-report-archive")} />
      <FlatList
        data={data.shiftReports ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderReport}
        contentContainerStyle={(data.shiftReports ?? []).length ? styles.list : styles.empty}
        ListEmptyComponent={<EmptyState icon="description" text={language === "en" ? "No shift report has been generated yet. Use the button above to prepare a manual report." : "لم يُنشأ تقرير مناوبة بعد. استخدم الزر أعلاه لإعداد تقرير يدوي."} />}
      />

      <Modal visible={Boolean(selected)} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.shade}>
          <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
            <View style={styles.handle} />
            <View style={[styles.previewHead, direction(isRTL)]}>
              <View>
                <Text style={[styles.previewTitle, align(isRTL)]}>{language === "en" ? "Shift endorsement" : "تسليم المناوبة"}</Text>
                <Text style={[styles.previewDate, align(isRTL)]}>{selected?.reportDate}</Text>
              </View>
              <Pressable onPress={() => setSelected(null)} style={styles.close}><MaterialIcons name="close" size={20} color={palette.navy} /></Pressable>
            </View>
            <InfoRow label={language === "en" ? "Prepared by" : "أعدّه"} value={selected?.generatedBy ?? "—"} isRTL={isRTL} />
            <InfoRow label={language === "en" ? "1st on call" : "المناوب الأول"} value={selected?.onCall.first ?? "—"} isRTL={isRTL} />
            <InfoRow label="2nd on-call" value={selected?.onCall.second ?? "—"} isRTL={isRTL} />
            <InfoRow label={language === "en" ? "3rd on call" : "المناوب الثالث"} value={selected?.onCall.third ?? "—"} isRTL={isRTL} />
            <View style={[styles.previewStats, direction(isRTL)]}>
              <MiniStat value={selected?.statistics.consultations ?? 0} label={language === "en" ? "Consults" : "استشارات"} />
              <MiniStat value={selected?.statistics.admissions ?? 0} label={language === "en" ? "Admissions" : "تنويم"} />
              <MiniStat value={selected?.statistics.emergencySurgeries ?? 0} label={language === "en" ? "Emergency OR" : "عمليات إسعافية"} />
            </View>
            {selected ? <PrimaryButton label={downloading ? (language === "en" ? "Preparing…" : "جارٍ التجهيز…") : (language === "en" ? "Download report" : "تنزيل التقرير")} icon="file-download" onPress={() => { void download(selected); }} disabled={downloading} /> : null}
            <Text style={[styles.privacy, align(isRTL)]}>{language === "en" ? "Use the report only through approved departmental channels." : "استخدم التقرير عبر القنوات المعتمدة في القسم فقط."}</Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return <View style={styles.miniStat}><Text style={styles.miniValue}>{value}</Text><Text style={styles.miniLabel}>{label}</Text></View>;
}

function OnCallUserPicker({ slot, selectedUser, users, language, isRTL, onSelect }: { slot: "first" | "second" | "third"; selectedUser?: { id: string; name: string; jobTitle: string }; users: { id: string; name: string; jobTitle: string }[]; language: "ar" | "en"; isRTL: boolean; onSelect: (slot: "first" | "second" | "third", userId: string) => void }) {
  const [query, setQuery] = useState("");
  const labels = {
    first: language === "en" ? "1st on-call" : "المناوب الأول",
    second: language === "en" ? "2nd on-call" : "المناوب الثاني",
    third: language === "en" ? "3rd on-call" : "المناوب الثالث",
  };
  const matchingUsers = searchOnCallUsers(users, query);
  const placeholder = language === "en" ? "Search by name or title" : "ابحث بالاسم أو المسمى";
  return <View style={styles.onCallSection}><Text style={[styles.onCallSectionTitle, align(isRTL)]}>{labels[slot]}</Text><View style={[styles.onCallSearch, direction(isRTL)]}><MaterialIcons name="search" size={18} color={palette.teal} /><TextInput value={query} onChangeText={setQuery} placeholder={placeholder} placeholderTextColor="#7890A2" returnKeyType="search" accessibilityLabel={placeholder} style={[styles.onCallSearchInput, align(isRTL)]} textAlign={isRTL ? "right" : "left"} />{query ? <Pressable accessibilityRole="button" accessibilityLabel={language === "en" ? "Clear search" : "مسح البحث"} onPress={() => setQuery("")} style={styles.clearOnCallSearch}><MaterialIcons name="close" size={16} color={palette.navy} /></Pressable> : null}</View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.onCallChoices, direction(isRTL)]}>{matchingUsers.map((user) => { const active = user.id === selectedUser?.id; return <Pressable key={user.id} accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={() => onSelect(slot, user.id)} style={({ pressed }) => [styles.onCallChoice, active && styles.onCallChoiceActive, pressed && styles.pressed]}><MaterialIcons name={active ? "check-circle" : "account-circle"} size={19} color={active ? "#FFFFFF" : palette.teal} /><Text style={[styles.onCallName, active && styles.onCallNameActive, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{user.name}</Text><Text style={[styles.onCallRole, active && styles.onCallRoleActive, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{user.jobTitle}</Text></Pressable>; })}</ScrollView>{matchingUsers.length === 0 ? <Text style={[styles.noOnCallMatch, align(isRTL)]}>{language === "en" ? "No eligible clinician matches this search." : "لا يوجد طبيب مؤهل يطابق هذا البحث."}</Text> : null}<Text style={[styles.onCallSelected, align(isRTL)]}>{selectedUser ? (language === "en" ? `Selected: ${selectedUser.name}` : `المختار: ${selectedUser.name}`) : (language === "en" ? "No clinician selected yet." : "لم يتم اختيار مستخدم بعد.")}</Text></View>;
}

function InfoRow({ label, value, isRTL }: { label: string; value: string; isRTL: boolean }) {
  return <View style={[styles.infoRow, direction(isRTL)]}><Text style={[styles.infoLabel, align(isRTL)]}>{label}</Text><Text style={[styles.infoValue, align(isRTL)]}>{value}</Text></View>;
}

function align(isRTL: boolean) {
  return { writingDirection: isRTL ? "rtl" as const : "ltr" as const, textAlign: isRTL ? "right" as const : "left" as const };
}

function direction(isRTL: boolean) {
  return { flexDirection: isRTL ? "row-reverse" as const : "row" as const };
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas, paddingHorizontal: 18 },
  header: { paddingTop: 22, paddingBottom: 15, gap: 12, alignItems: "center" },
  headerCopy: { flex: 1 },
  title: { color: palette.ink, fontSize: 21, fontWeight: "900" },
  subtitle: { color: palette.muted, fontSize: 11, marginTop: 3 },
  windowCard: { padding: 15, backgroundColor: palette.navy },
  windowHead: { gap: 8, alignItems: "center" },
  windowTitle: { flex: 1, color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  windowText: { color: "#D8EEF9", fontSize: 11, lineHeight: 17, marginTop: 8 },
  windowDate: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", marginTop: 9 },
  reportDateControls: { gap: 7, alignItems: "center", marginTop: 12 },
  reportDateStep: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  reportDateInput: { flex: 1, minHeight: 40, borderRadius: 12, backgroundColor: "#FFFFFF", color: palette.navy, fontSize: 13, fontWeight: "900", paddingHorizontal: 8 },
  reportDateToday: { minHeight: 38, borderRadius: 12, justifyContent: "center", paddingHorizontal: 11, backgroundColor: palette.paleGold },
  reportDateTodayText: { color: palette.navy, fontSize: 10, fontWeight: "900" },
  onCallCard: { marginTop: 12, padding: 14, borderColor: "#BDE5DB" },
  onCallHead: { gap: 9, alignItems: "center" },
  onCallBadge: { height: 34, width: 34, borderRadius: 11, backgroundColor: palette.paleTeal, alignItems: "center", justifyContent: "center" },
  onCallTitle: { color: palette.ink, fontSize: 13, fontWeight: "900" },
  onCallHint: { color: palette.muted, fontSize: 10, marginTop: 2, lineHeight: 15 },
  onCallSection: { borderTopColor: palette.line, borderTopWidth: 1, marginTop: 12, paddingTop: 10 },
  onCallSectionTitle: { color: palette.navy, fontSize: 11, fontWeight: "900" },
  onCallSearch: { minHeight: 42, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#BDE5DB", borderRadius: 12, alignItems: "center", paddingHorizontal: 10, gap: 7, marginTop: 8 },
  onCallSearchInput: { flex: 1, minHeight: 40, color: palette.ink, fontSize: 11 },
  clearOnCallSearch: { height: 27, width: 27, borderRadius: 8, backgroundColor: palette.paleBlue, alignItems: "center", justifyContent: "center" },
  onCallChoices: { gap: 8, paddingTop: 8, paddingBottom: 6 },
  onCallChoice: { width: 156, minHeight: 79, borderWidth: 1, borderColor: "#BDE5DB", backgroundColor: "#F4FBF9", borderRadius: 13, padding: 10, gap: 3 },
  onCallChoiceActive: { backgroundColor: palette.teal, borderColor: palette.teal },
  onCallName: { color: palette.ink, fontSize: 11, fontWeight: "900", marginTop: 2 },
  onCallNameActive: { color: "#FFFFFF" },
  onCallRole: { color: "#3D766F", fontSize: 9, lineHeight: 12 },
  onCallRoleActive: { color: "#D9F3EF" },
  noOnCallMatch: { color: palette.muted, fontSize: 10, marginTop: 4 },
  onCallSelected: { color: palette.teal, fontSize: 10, fontWeight: "800", marginTop: 4 },
  createWrap: { marginTop: 13, marginBottom: 2 },
  permissionText: { color: palette.muted, fontSize: 12, textAlign: "center", paddingVertical: 11 },
  list: { gap: 10, paddingBottom: 24 },
  empty: { flexGrow: 1, justifyContent: "center", paddingBottom: 55 },
  reportCard: { padding: 14 },
  cardHead: { justifyContent: "space-between", alignItems: "center" },
  reportDate: { color: palette.ink, fontSize: 14, fontWeight: "900" },
  reportMeta: { color: palette.muted, fontSize: 10, marginTop: 3 },
  statRow: { gap: 8, marginTop: 12 },
  miniStat: { flex: 1, borderRadius: 11, backgroundColor: palette.paleBlue, paddingVertical: 8, alignItems: "center" },
  miniValue: { color: palette.navy, fontWeight: "900", fontSize: 15 },
  miniLabel: { color: palette.muted, fontSize: 9, marginTop: 2, textAlign: "center" },
  cardActions: { marginTop: 12, paddingTop: 10, borderTopColor: palette.line, borderTopWidth: 1, alignItems: "center", gap: 4 },
  openText: { color: palette.navy, flex: 1, fontSize: 11, fontWeight: "800" },
  shade: { flex: 1, backgroundColor: "#102A4370", justifyContent: "flex-end" },
  sheet: { maxHeight: "88%", backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheetContent: { padding: 20, paddingBottom: 38 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: palette.line },
  previewHead: { justifyContent: "space-between", alignItems: "center", marginTop: 14, marginBottom: 8 },
  previewTitle: { color: palette.ink, fontSize: 18, fontWeight: "900" },
  previewDate: { color: palette.muted, fontSize: 11, marginTop: 3 },
  close: { width: 36, height: 36, backgroundColor: palette.paleBlue, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  infoRow: { justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomColor: palette.line, borderBottomWidth: 1 },
  infoLabel: { color: palette.muted, fontSize: 11 },
  infoValue: { color: palette.ink, fontSize: 12, fontWeight: "800", flex: 1, marginHorizontal: 16 },
  previewStats: { gap: 8, marginVertical: 14 },
  privacy: { color: palette.muted, fontSize: 10, lineHeight: 16, textAlign: "center", marginTop: 14 },
  pressed: { opacity: 0.74 },
});
