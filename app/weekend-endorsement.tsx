import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AppCard, EmptyState, IconAction, palette, SectionTitle } from "@/components/neuro-ui";
import { LogoLoading } from "@/components/logo-loading";
import { useDepartment } from "@/lib/department-store";
import { exportWeekendEndorsementExcel, exportWeekendEndorsementPdf, type WeekendEndorsementExportResult } from "@/lib/weekend-endorsement-export";
import { buildWeekendEndorsementReport, searchWeekendEndorsementEntries, type WeekendEndorsementEntry } from "@/lib/weekend-endorsement";
import { useAppLanguage } from "@/lib/language";

type ExportFormat = "pdf" | "xlsx";

export default function WeekendEndorsementScreen() {
  const { data, session } = useDepartment();
  const { language, isRTL } = useAppLanguage();
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const currentUser = data.users.find((user) => user.id === session?.userId);
  const canExport = Boolean(session?.role === "admin" || currentUser?.permissions.includes("manage_reports"));
  const consultants = useMemo(() => Array.from(new Set(data.teams.map((team) => team.lead).filter(Boolean))), [data.teams]);
  const report = useMemo(() => buildWeekendEndorsementReport(data, session?.name ?? "Department staff", selectedConsultant), [data, selectedConsultant, session?.name]);
  const visibleEntries = useMemo(() => searchWeekendEndorsementEntries(report.entries, searchQuery), [report.entries, searchQuery]);
  const scopeLabel = selectedConsultant ?? (language === "en" ? "All consultants" : "جميع الاستشاريين");
  const busy = exportingFormat !== null;

  const exportReport = async (format: ExportFormat) => {
    if (!canExport) {
      Alert.alert(language === "en" ? "Permission required" : "الصلاحية مطلوبة", language === "en" ? "Report management permission is required to export the Weekend Endorsement." : "يلزم توفر صلاحية إدارة التقارير لتصدير Weekend Endorsement.");
      return;
    }
    if (!report.entries.length) {
      Alert.alert(language === "en" ? "No matching inpatients" : "لا توجد حالات مطابقة", language === "en" ? "There are no inpatients for the selected consultant." : "لا توجد حالات منومة تخص الاستشاري المحدد.");
      return;
    }
    try {
      setExportingFormat(format);
      const result: WeekendEndorsementExportResult = format === "pdf" ? await exportWeekendEndorsementPdf(report) : await exportWeekendEndorsementExcel(report, language);
      if (result === "unavailable") throw new Error("Export unavailable");
      const formatLabel = format === "pdf" ? "PDF" : "Excel";
      const message = result === "shared"
        ? (language === "en" ? `Use the device share sheet to save, send, or print the ${formatLabel} file.` : `استخدم خيارات المشاركة في الجهاز لحفظ أو إرسال ملف ${formatLabel}.`)
        : result === "print-opened"
          ? (language === "en" ? "The printable PDF report opened in a new window." : "فُتح تقرير PDF القابل للطباعة في نافذة جديدة.")
          : (language === "en" ? `The filtered ${formatLabel} file was downloaded.` : `تم تنزيل ملف ${formatLabel} المصفى.`);
      Alert.alert(language === "en" ? "Weekend Endorsement ready" : "تقرير Weekend Endorsement جاهز", message);
    } catch {
      Alert.alert(language === "en" ? "Export unavailable" : "تعذر التصدير", language === "en" ? "The selected file could not be prepared on this device." : "تعذر تجهيز الملف المطلوب على هذا الجهاز.");
    } finally {
      setExportingFormat(null);
    }
  };

  const renderEntry = ({ item }: { item: WeekendEndorsementEntry }) => {
    const plan = item.weekendPlan === "Not documented" ? (language === "en" ? item.weekendPlan : "لم تُوثق خطة بعد") : item.weekendPlan;
    return <AppCard style={styles.entry}><View style={[styles.entryHead, direction(isRTL)]}><View style={styles.patientIcon}><MaterialIcons name="person" size={19} color={palette.teal} /></View><View style={styles.flex}><Text style={[styles.patientName, align(isRTL)]}>{item.patientName}</Text><Text style={[styles.recordNumber, align(isRTL)]}>{language === "en" ? `MRN: ${item.fileNumber}` : `رقم الملف: ${item.fileNumber}`}</Text></View></View><View style={styles.divider} /><Info label={language === "en" ? "Ward" : "الجناح"} value={item.ward} isRTL={isRTL} /><Info label={language === "en" ? "Bed" : "السرير"} value={item.bed} isRTL={isRTL} /><Info label={language === "en" ? "Diagnosis" : "التشخيص"} value={item.diagnosis} isRTL={isRTL} /><Info label={language === "en" ? "Treating consultant" : "الاستشاري المعالج"} value={item.consultant} isRTL={isRTL} /><Text style={[styles.planLabel, align(isRTL)]}>{language === "en" ? "Weekend plan" : "خطة نهاية الأسبوع"}</Text><Text style={[styles.plan, align(isRTL)]}>{plan}</Text></AppCard>;
  };

  return <View style={styles.page}>
    {busy ? <LogoLoading overlay label={exportingFormat === "xlsx" ? (language === "en" ? "Preparing Excel file…" : "جارٍ تجهيز ملف Excel…") : (language === "en" ? "Preparing PDF report…" : "جارٍ تجهيز تقرير PDF…")} /> : null}
    <View style={[styles.header, direction(isRTL)]}><IconAction icon={isRTL ? "arrow-forward" : "arrow-back"} label={language === "en" ? "Back" : "رجوع"} onPress={() => router.back()} /><View style={styles.flex}><Text style={[styles.title, align(isRTL)]}>Weekend Endorsement</Text><Text style={[styles.subtitle, align(isRTL)]}>{language === "en" ? "Consolidated handover for inpatients" : "تسليم موحد للمرضى المنومين"}</Text></View></View>
    <AppCard style={styles.summary}><View style={[styles.summaryRow, direction(isRTL)]}><View style={styles.summaryIcon}><MaterialIcons name="weekend" size={24} color="#FFFFFF" /></View><View style={styles.flex}><Text style={[styles.summaryTitle, align(isRTL)]}>{language === "en" ? "Weekend handover report" : "تقرير تسليم نهاية الأسبوع"}</Text><Text style={[styles.summaryText, align(isRTL)]}>{language === "en" ? `${report.entries.length} inpatient records for ${scopeLabel}.` : `يتضمن التقرير ${report.entries.length} من المرضى المنومين للاستشاري: ${scopeLabel}.`}</Text></View></View>
      <View style={styles.filterSection}><Text style={[styles.filterLabel, align(isRTL)]}>{language === "en" ? "Filter by treating consultant" : "تصفية حسب الاستشاري المعالج"}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterChoices, direction(isRTL)]}><ConsultantChip label={language === "en" ? "All consultants" : "جميع الاستشاريين"} selected={!selectedConsultant} isRTL={isRTL} onPress={() => setSelectedConsultant(undefined)} />{consultants.map((consultant) => <ConsultantChip key={consultant} label={consultant} selected={selectedConsultant === consultant} isRTL={isRTL} onPress={() => setSelectedConsultant(consultant)} />)}</ScrollView></View>
      {canExport ? <View style={[styles.exportActions, direction(isRTL)]}><ExportAction icon="picture-as-pdf" label="PDF" isRTL={isRTL} disabled={busy || !report.entries.length} onPress={() => { void exportReport("pdf"); }} /><ExportAction icon="grid-on" label="Excel" isRTL={isRTL} disabled={busy || !report.entries.length} onPress={() => { void exportReport("xlsx"); }} /></View> : <Text style={[styles.permission, align(isRTL)]}>{language === "en" ? "Report management permission is required to export." : "يتطلب التصدير صلاحية إدارة التقارير."}</Text>}
    </AppCard>
    <View style={[styles.searchBox, direction(isRTL)]}><MaterialIcons name="search" size={21} color={palette.teal} /><TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder={language === "en" ? "Search by patient name or MRN" : "ابحث باسم المريض أو رقم الملف"} placeholderTextColor="#7890A2" returnKeyType="search" style={[styles.searchInput, align(isRTL)]} textAlign={isRTL ? "right" : "left"} accessibilityLabel={language === "en" ? "Search by patient name or medical record number" : "البحث باسم المريض أو رقم الملف"} />{searchQuery ? <Pressable accessibilityRole="button" accessibilityLabel={language === "en" ? "Clear search" : "مسح البحث"} onPress={() => setSearchQuery("")} style={styles.clearSearch}><MaterialIcons name="close" size={18} color={palette.navy} /></Pressable> : null}</View>
    <FlatList data={visibleEntries} renderItem={renderEntry} keyExtractor={(item) => item.id} contentContainerStyle={visibleEntries.length ? styles.list : styles.empty} ListHeaderComponent={<SectionTitle title={language === "en" ? "Inpatient plans" : "خطط المرضى المنومين"} action={searchQuery.trim() ? (language === "en" ? `${visibleEntries.length} matches` : `${visibleEntries.length} نتائج`) : scopeLabel} />} ListEmptyComponent={<EmptyState icon="search" text={searchQuery.trim() ? (language === "en" ? "No patient matches this search." : "لا توجد حالة مطابقة للبحث.") : (language === "en" ? "No inpatients match this consultant." : "لا توجد حالات منومة مطابقة لهذا الاستشاري.")} />} />
  </View>;
}

function ConsultantChip({ label, selected, isRTL, onPress }: { label: string; selected: boolean; isRTL: boolean; onPress: () => void }) { return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}><MaterialIcons name={selected ? "check-circle" : "person-outline"} size={15} color={selected ? "#FFFFFF" : palette.teal} /><Text style={[styles.chipText, selected && styles.chipTextSelected, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{label}</Text></Pressable>; }
function ExportAction({ icon, label, isRTL, disabled, onPress }: { icon: "picture-as-pdf" | "grid-on"; label: string; isRTL: boolean; disabled: boolean; onPress: () => void }) { return <Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={isRTL ? `تصدير ${label}` : `Export ${label}`} onPress={onPress} style={({ pressed }) => [styles.exportAction, disabled && styles.exportActionDisabled, pressed && !disabled && styles.pressed]}><MaterialIcons name={icon} size={19} color={disabled ? "#86A6B1" : palette.navy} /><Text style={styles.exportActionText}>{label}</Text></Pressable>; }
function Info({ label, value, isRTL }: { label: string; value: string; isRTL: boolean }) { return <View style={[styles.info, direction(isRTL)]}><Text style={[styles.infoLabel, align(isRTL)]}>{label}</Text><Text style={[styles.infoValue, align(isRTL)]}>{value}</Text></View>; }
function align(isRTL: boolean) { return { writingDirection: isRTL ? "rtl" as const : "ltr" as const, textAlign: isRTL ? "right" as const : "left" as const }; }
function direction(isRTL: boolean) { return { flexDirection: isRTL ? "row-reverse" as const : "row" as const }; }

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas, paddingHorizontal: 18 }, flex: { flex: 1 }, header: { paddingTop: 22, paddingBottom: 15, gap: 12, alignItems: "center" }, title: { color: palette.ink, fontSize: 21, fontWeight: "900" }, subtitle: { color: palette.muted, fontSize: 11, marginTop: 3 }, summary: { padding: 15, backgroundColor: palette.navy, borderColor: palette.navy }, summaryRow: { alignItems: "center", gap: 10 }, summaryIcon: { height: 44, width: 44, borderRadius: 14, backgroundColor: "#FFFFFF2B", alignItems: "center", justifyContent: "center" }, summaryTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, summaryText: { color: "#D8EEF9", fontSize: 11, lineHeight: 16, marginTop: 3 }, filterSection: { marginTop: 15, borderTopColor: "#FFFFFF2B", borderTopWidth: 1, paddingTop: 12 }, filterLabel: { color: "#D8EEF9", fontSize: 10, fontWeight: "800", marginBottom: 8 }, filterChoices: { gap: 8, paddingRight: 2 }, chip: { minHeight: 34, paddingHorizontal: 10, borderRadius: 11, borderWidth: 1, borderColor: "#BDE5DB", backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", gap: 5 }, chipSelected: { borderColor: "#FFFFFF", backgroundColor: palette.teal }, chipText: { color: palette.teal, fontSize: 10, fontWeight: "800" }, chipTextSelected: { color: "#FFFFFF" }, exportActions: { gap: 9, marginTop: 14 }, exportAction: { flex: 1, minHeight: 45, borderRadius: 13, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 }, exportActionDisabled: { backgroundColor: "#E4EFF3" }, exportActionText: { color: palette.navy, fontSize: 12, fontWeight: "900" }, permission: { color: "#D8EEF9", fontSize: 10, marginTop: 13 }, searchBox: { minHeight: 48, marginTop: 14, marginBottom: 6, backgroundColor: "#FFFFFF", borderRadius: 14, borderWidth: 1, borderColor: "#BDE5DB", alignItems: "center", paddingHorizontal: 12, gap: 8 }, searchInput: { flex: 1, color: palette.ink, fontSize: 12, minHeight: 46 }, clearSearch: { height: 28, width: 28, borderRadius: 9, backgroundColor: palette.paleBlue, alignItems: "center", justifyContent: "center" }, list: { gap: 10, paddingBottom: 24 }, empty: { flexGrow: 1, paddingBottom: 55 }, entry: { padding: 14 }, entryHead: { alignItems: "center", gap: 9 }, patientIcon: { height: 35, width: 35, borderRadius: 11, backgroundColor: palette.paleTeal, alignItems: "center", justifyContent: "center" }, patientName: { color: palette.ink, fontSize: 14, fontWeight: "900" }, recordNumber: { color: palette.teal, fontSize: 10, fontWeight: "800", marginTop: 2 }, divider: { height: 1, backgroundColor: palette.line, marginVertical: 10 }, info: { justifyContent: "space-between", alignItems: "center", gap: 14 }, infoLabel: { color: palette.muted, fontSize: 11 }, infoValue: { color: palette.ink, fontSize: 12, fontWeight: "800", flex: 1 }, planLabel: { color: palette.navy, fontSize: 11, fontWeight: "900", marginTop: 12 }, plan: { color: palette.ink, fontSize: 12, lineHeight: 19, marginTop: 5, backgroundColor: "#F8FBFD", borderRadius: 10, padding: 10 }, pressed: { opacity: 0.78 },
});
