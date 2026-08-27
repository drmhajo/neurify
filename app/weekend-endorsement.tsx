import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppCard, EmptyState, IconAction, palette, PrimaryButton, SectionTitle } from "@/components/neuro-ui";
import { LogoLoading } from "@/components/logo-loading";
import { useDepartment } from "@/lib/department-store";
import { exportWeekendEndorsement } from "@/lib/weekend-endorsement-export";
import { buildWeekendEndorsementReport, type WeekendEndorsementEntry } from "@/lib/weekend-endorsement";
import { useAppLanguage } from "@/lib/language";

export default function WeekendEndorsementScreen() {
  const { data, session } = useDepartment();
  const { language, isRTL } = useAppLanguage();
  const [exporting, setExporting] = useState(false);
  const currentUser = data.users.find((user) => user.id === session?.userId);
  const canPrint = Boolean(session?.role === "admin" || currentUser?.permissions.includes("manage_reports"));
  const report = useMemo(() => buildWeekendEndorsementReport(data, session?.name ?? "Department staff"), [data, session?.name]);

  const printReport = async () => {
    if (!canPrint) {
      Alert.alert(language === "en" ? "Permission required" : "الصلاحية مطلوبة", language === "en" ? "Report management permission is required to print the Weekend Endorsement." : "يلزم توفر صلاحية إدارة التقارير لطباعة Weekend Endorsement.");
      return;
    }
    if (!report.entries.length) {
      Alert.alert(language === "en" ? "No inpatients" : "لا توجد حالات منومة", language === "en" ? "There are no inpatient plans to print." : "لا توجد خطط لحالات منومة لطباعة التقرير.");
      return;
    }
    try {
      setExporting(true);
      const result = await exportWeekendEndorsement(report);
      Alert.alert(language === "en" ? "Weekend Endorsement ready" : "تقرير Weekend Endorsement جاهز", result === "shared" ? (language === "en" ? "Use the device share sheet to save, send, or print the PDF." : "استخدم خيارات المشاركة في الجهاز للحفظ أو الإرسال أو الطباعة.") : (language === "en" ? "The printable report opened in a new window." : "فُتح التقرير القابل للطباعة في نافذة جديدة."));
    } catch {
      Alert.alert(language === "en" ? "Print unavailable" : "تعذرت الطباعة", language === "en" ? "The Weekend Endorsement could not be prepared." : "تعذر تجهيز تقرير Weekend Endorsement للطباعة.");
    } finally {
      setExporting(false);
    }
  };

  const renderEntry = ({ item }: { item: WeekendEndorsementEntry }) => {
    const plan = item.weekendPlan === "Not documented" ? (language === "en" ? item.weekendPlan : "لم تُوثق خطة بعد") : item.weekendPlan;
    return <AppCard style={styles.entry}><View style={[styles.entryHead, direction(isRTL)]}><View style={styles.patientIcon}><MaterialIcons name="person" size={19} color={palette.teal} /></View><View style={styles.flex}><Text style={[styles.patientName, align(isRTL)]}>{item.patientName}</Text><Text style={[styles.recordNumber, align(isRTL)]}>{language === "en" ? `MRN: ${item.fileNumber}` : `رقم الملف: ${item.fileNumber}`}</Text></View></View><View style={styles.divider} /><Info label={language === "en" ? "Treating consultant" : "الاستشاري المعالج"} value={item.consultant} isRTL={isRTL} /><Text style={[styles.planLabel, align(isRTL)]}>{language === "en" ? "Weekend plan" : "خطة نهاية الأسبوع"}</Text><Text style={[styles.plan, align(isRTL)]}>{plan}</Text></AppCard>;
  };

  return <View style={styles.page}>{exporting ? <LogoLoading overlay label={language === "en" ? "Preparing Weekend Endorsement…" : "جارٍ تجهيز Weekend Endorsement…"} /> : null}<View style={[styles.header, direction(isRTL)]}><IconAction icon={isRTL ? "arrow-forward" : "arrow-back"} label={language === "en" ? "Back" : "رجوع"} onPress={() => router.back()} /><View style={styles.flex}><Text style={[styles.title, align(isRTL)]}>Weekend Endorsement</Text><Text style={[styles.subtitle, align(isRTL)]}>{language === "en" ? "Consolidated handover for all inpatients" : "تسليم موحد لجميع المرضى المنومين"}</Text></View></View><AppCard style={styles.summary}><View style={[styles.summaryRow, direction(isRTL)]}><View style={styles.summaryIcon}><MaterialIcons name="weekend" size={24} color="#FFFFFF" /></View><View style={styles.flex}><Text style={[styles.summaryTitle, align(isRTL)]}>{language === "en" ? "Weekend handover report" : "تقرير تسليم نهاية الأسبوع"}</Text><Text style={[styles.summaryText, align(isRTL)]}>{language === "en" ? `${report.entries.length} inpatient records are included.` : `يتضمن التقرير ${report.entries.length} من المرضى المنومين.`}</Text></View></View>{canPrint ? <View style={styles.printWrap}><PrimaryButton label={language === "en" ? "Print / export report" : "طباعة / تصدير التقرير"} icon="print" onPress={() => { void printReport(); }} disabled={exporting || !report.entries.length} /></View> : <Text style={[styles.permission, align(isRTL)]}>{language === "en" ? "Report management permission is required to print." : "تتطلب الطباعة صلاحية إدارة التقارير."}</Text>}</AppCard><FlatList data={report.entries} renderItem={renderEntry} keyExtractor={(item) => item.id} contentContainerStyle={report.entries.length ? styles.list : styles.empty} ListHeaderComponent={<SectionTitle title={language === "en" ? "Inpatient plans" : "خطط المرضى المنومين"} />} ListEmptyComponent={<EmptyState icon="hotel" text={language === "en" ? "No inpatients are available for Weekend Endorsement." : "لا توجد حالات منومة متاحة لتقرير Weekend Endorsement."} />} /></View>;
}

function Info({ label, value, isRTL }: { label: string; value: string; isRTL: boolean }) { return <View style={[styles.info, direction(isRTL)]}><Text style={[styles.infoLabel, align(isRTL)]}>{label}</Text><Text style={[styles.infoValue, align(isRTL)]}>{value}</Text></View>; }
function align(isRTL: boolean) { return { writingDirection: isRTL ? "rtl" as const : "ltr" as const, textAlign: isRTL ? "right" as const : "left" as const }; }
function direction(isRTL: boolean) { return { flexDirection: isRTL ? "row-reverse" as const : "row" as const }; }

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas, paddingHorizontal: 18 },
  flex: { flex: 1 },
  header: { paddingTop: 22, paddingBottom: 15, gap: 12, alignItems: "center" },
  title: { color: palette.ink, fontSize: 21, fontWeight: "900" },
  subtitle: { color: palette.muted, fontSize: 11, marginTop: 3 },
  summary: { padding: 15, backgroundColor: palette.navy, borderColor: palette.navy },
  summaryRow: { alignItems: "center", gap: 10 },
  summaryIcon: { height: 44, width: 44, borderRadius: 14, backgroundColor: "#FFFFFF2B", alignItems: "center", justifyContent: "center" },
  summaryTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  summaryText: { color: "#D8EEF9", fontSize: 11, lineHeight: 16, marginTop: 3 },
  printWrap: { marginTop: 14 },
  permission: { color: "#D8EEF9", fontSize: 10, marginTop: 13 },
  list: { gap: 10, paddingBottom: 24 },
  empty: { flexGrow: 1, paddingBottom: 55 },
  entry: { padding: 14 },
  entryHead: { alignItems: "center", gap: 9 },
  patientIcon: { height: 35, width: 35, borderRadius: 11, backgroundColor: palette.paleTeal, alignItems: "center", justifyContent: "center" },
  patientName: { color: palette.ink, fontSize: 14, fontWeight: "900" },
  recordNumber: { color: palette.teal, fontSize: 10, fontWeight: "800", marginTop: 2 },
  divider: { height: 1, backgroundColor: palette.line, marginVertical: 10 },
  info: { justifyContent: "space-between", alignItems: "center", gap: 14 },
  infoLabel: { color: palette.muted, fontSize: 11 },
  infoValue: { color: palette.ink, fontSize: 12, fontWeight: "800", flex: 1 },
  planLabel: { color: palette.navy, fontSize: 11, fontWeight: "900", marginTop: 12 },
  plan: { color: palette.ink, fontSize: 12, lineHeight: 19, marginTop: 5, backgroundColor: "#F8FBFD", borderRadius: 10, padding: 10 },
});
