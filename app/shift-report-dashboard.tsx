import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppCard, EmptyState, IconAction, palette, SectionTitle } from "@/components/neuro-ui";
import { useDepartment } from "@/lib/department-store";
import { availableReportMonths, buildMonthlyShiftReportAnalytics, monthLabel } from "@/lib/shift-report-analytics";
import { exportMonthlyDashboardExcel, exportMonthlyDashboardPdf } from "@/lib/shift-report-dashboard-export-platform";
import { useAppLanguage } from "@/lib/language";

function align(isRTL: boolean) {
  return {
    writingDirection: isRTL ? "rtl" as const : "ltr" as const,
    textAlign: isRTL ? "right" as const : "left" as const,
  };
}

function direction(isRTL: boolean) {
  return { flexDirection: isRTL ? "row-reverse" as const : "row" as const };
}

type ExportFormat = "pdf" | "xlsx";

export default function ShiftReportDashboardScreen() {
  const { data, session } = useDepartment();
  const { language, isRTL } = useAppLanguage();
  const reports = useMemo(() => data.shiftReports ?? [], [data.shiftReports]);
  const months = useMemo(() => availableReportMonths(reports), [reports]);
  const [month, setMonth] = useState(months[0] ?? "");
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  useEffect(() => {
    if (!month || !months.includes(month)) setMonth(months[0] ?? "");
  }, [month, months]);

  const analytics = useMemo(
    () => (month ? buildMonthlyShiftReportAnalytics(reports, month) : null),
    [reports, month],
  );
  const canManage = Boolean(session && data.users.find((user) => user.id === session.userId)?.permissions.includes("manage_reports"));
  const title = language === "en" ? "Monthly on-call dashboard" : "لوحة معلومات المناوبات الشهرية";

  const exportDashboard = async (format: ExportFormat) => {
    if (!analytics || exporting) return;
    setExporting(format);
    try {
      const result = format === "pdf"
        ? await exportMonthlyDashboardPdf(analytics, language)
        : await exportMonthlyDashboardExcel(analytics, language);
      if (result === "unavailable") {
        Alert.alert(
          language === "en" ? "Export unavailable" : "التصدير غير متاح",
          language === "en"
            ? "Please allow browser pop-ups or use a device that supports file sharing, then try again."
            : "يرجى السماح بالنوافذ المنبثقة في المتصفح أو استخدام جهاز يدعم مشاركة الملفات ثم المحاولة مجدداً.",
        );
        return;
      }
      const message = result === "print-opened"
        ? (language === "en" ? "The print window is open. Choose Save as PDF to download the file." : "فُتحت نافذة الطباعة. اختر «حفظ كملف PDF» لتنزيل الملف.")
        : format === "pdf"
          ? (language === "en" ? "The PDF is ready in the sharing panel." : "ملف PDF جاهز في لوحة المشاركة.")
          : (language === "en" ? "The Excel workbook is ready." : "ملف Excel أصبح جاهزاً.");
      Alert.alert(language === "en" ? "Export ready" : "تم تجهيز التصدير", message);
    } catch {
      Alert.alert(
        language === "en" ? "Export failed" : "تعذر التصدير",
        language === "en" ? "The selected dashboard data could not be exported. Please try again." : "تعذر تصدير بيانات لوحة المعلومات المختارة. يرجى المحاولة مجدداً.",
      );
    } finally {
      setExporting(null);
    }
  };

  if (!canManage) {
    return (
      <View style={styles.page}>
        <View style={[styles.header, direction(isRTL)]}>
          <IconAction icon={isRTL ? "arrow-forward" : "arrow-back"} label={language === "en" ? "Back" : "رجوع"} onPress={() => router.back()} />
          <Text style={[styles.title, align(isRTL)]}>{title}</Text>
        </View>
        <EmptyState icon="lock" text={language === "en" ? "Report-management permission is required to view this dashboard." : "يلزم توفر صلاحية إدارة التقارير لعرض لوحة المعلومات."} />
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.page}>
        <View style={[styles.header, direction(isRTL)]}>
          <IconAction icon={isRTL ? "arrow-forward" : "arrow-back"} label={language === "en" ? "Back" : "رجوع"} onPress={() => router.back()} />
          <Text style={[styles.title, align(isRTL)]}>{title}</Text>
        </View>
        <EmptyState icon="insights" text={language === "en" ? "The dashboard will show monthly trends once an on-call report is archived." : "ستظهر الاتجاهات الشهرية بعد أرشفة أول تقرير مناوبة."} />
      </View>
    );
  }

  const chartMax = Math.max(1, ...analytics.daily.map((day) => day.totalCases));

  return (
    <View style={styles.page}>
      <View style={[styles.header, direction(isRTL)]}>
        <IconAction icon={isRTL ? "arrow-forward" : "arrow-back"} label={language === "en" ? "Back" : "رجوع"} onPress={() => router.back()} />
        <View style={styles.headerCopy}>
          <Text style={[styles.title, align(isRTL)]}>{title}</Text>
          <Text style={[styles.subtitle, align(isRTL)]}>{language === "en" ? "From archived shift reports" : "من تقارير المناوبات المؤرشفة"}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.months, direction(isRTL)]}>
        {months.map((item) => (
          <Pressable key={item} onPress={() => setMonth(item)} style={[styles.monthChip, month === item && styles.monthChipSelected]}>
            <Text style={[styles.monthText, month === item && styles.monthTextSelected]}>{monthLabel(item, language)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.exportActions, direction(isRTL)]}>
        <ExportButton
          icon="picture-as-pdf"
          label={exporting === "pdf" ? (language === "en" ? "Preparing…" : "جارٍ التجهيز…") : "PDF"}
          onPress={() => exportDashboard("pdf")}
          disabled={Boolean(exporting)}
          tone="pdf"
        />
        <ExportButton
          icon="table-chart"
          label={exporting === "xlsx" ? (language === "en" ? "Preparing…" : "جارٍ التجهيز…") : "Excel"}
          onPress={() => exportDashboard("xlsx")}
          disabled={Boolean(exporting)}
          tone="excel"
        />
      </View>

      <AppCard style={styles.monthCard}>
        <Text style={[styles.monthTitle, align(isRTL)]}>{monthLabel(month, language)}</Text>
        <Text style={[styles.monthSubtitle, align(isRTL)]}>{language === "en" ? `${analytics.reportCount} archived shift reports` : `${analytics.reportCount} تقرير مناوبة مؤرشف`}</Text>
        <View style={[styles.metricGrid, direction(isRTL)]}>
          <MetricCard icon="forum" value={analytics.consultations} label={language === "en" ? "Consultations" : "الاستشارات"} tone="blue" />
          <MetricCard icon="hotel" value={analytics.admissions} label={language === "en" ? "Admissions" : "التنويم"} tone="gold" />
          <MetricCard icon="emergency" value={analytics.emergencySurgeries} label={language === "en" ? "Emergency OR" : "عمليات إسعافية"} tone="teal" />
        </View>
        <View style={[styles.followUp, direction(isRTL)]}>
          <MaterialIcons name="follow-the-signs" size={18} color={palette.gold} />
          <Text style={[styles.followUpText, align(isRTL)]}>{language === "en" ? `${analytics.requiringFollowUp} cases require follow-up` : `${analytics.requiringFollowUp} حالات تحتاج متابعة`}</Text>
        </View>
      </AppCard>

      <SectionTitle title={language === "en" ? "Daily case trend" : "اتجاه الحالات اليومي"} />
      <AppCard style={styles.chartCard}>
        <View style={[styles.legend, direction(isRTL)]}>
          <Legend color={palette.navy} label={language === "en" ? "Consultations" : "استشارات"} />
          <Legend color={palette.gold} label={language === "en" ? "Admissions" : "تنويم"} />
          <Legend color={palette.teal} label={language === "en" ? "Emergency OR" : "إسعافية"} />
        </View>
        {analytics.daily.length ? (
          <View style={[styles.chart, direction(isRTL)]}>
            {analytics.daily.map((day) => (
              <View key={day.date} style={styles.barGroup}>
                <View style={styles.bars}>
                  <View style={[styles.bar, styles.consultBar, { height: Math.max(3, (day.consultations / chartMax) * 104) }]} />
                  <View style={[styles.bar, styles.admissionBar, { height: Math.max(3, (day.admissions / chartMax) * 104) }]} />
                  <View style={[styles.bar, styles.emergencyBar, { height: Math.max(3, (day.emergencySurgeries / chartMax) * 104) }]} />
                </View>
                <Text style={styles.barTotal}>{day.totalCases}</Text>
                <Text style={styles.dayLabel}>{day.date.slice(8)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState icon="show-chart" text={language === "en" ? "No daily trend is available for this month." : "لا توجد بيانات يومية لهذا الشهر."} />
        )}
      </AppCard>

      <SectionTitle title={language === "en" ? "Daily breakdown" : "التفصيل اليومي"} />
      <FlatList
        data={analytics.daily}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <AppCard style={styles.dayCard}>
            <View style={[styles.dayHead, direction(isRTL)]}>
              <Text style={[styles.dayDate, align(isRTL)]}>{item.date}</Text>
              <Text style={styles.total}>{item.totalCases}</Text>
            </View>
            <View style={[styles.dayValues, direction(isRTL)]}>
              <SmallValue value={item.consultations} label={language === "en" ? "Consultations" : "استشارات"} />
              <SmallValue value={item.admissions} label={language === "en" ? "Admissions" : "تنويم"} />
              <SmallValue value={item.emergencySurgeries} label={language === "en" ? "Emergency" : "إسعافية"} />
            </View>
          </AppCard>
        )}
      />
    </View>
  );
}

function ExportButton({ icon, label, onPress, disabled, tone }: { icon: "picture-as-pdf" | "table-chart"; label: string; onPress: () => void; disabled: boolean; tone: "pdf" | "excel" }) {
  const isPdf = tone === "pdf";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Export ${label}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.exportButton, isPdf ? styles.pdfButton : styles.excelButton, (pressed || disabled) && styles.exportButtonMuted]}
    >
      <MaterialIcons name={icon} color={isPdf ? "#FFFFFF" : palette.teal} size={18} />
      <Text style={[styles.exportButtonText, isPdf ? styles.pdfButtonText : styles.excelButtonText]}>{label}</Text>
    </Pressable>
  );
}

function MetricCard({ icon, value, label, tone }: { icon: "forum" | "hotel" | "emergency"; value: number; label: string; tone: "blue" | "gold" | "teal" }) {
  const colors = { blue: palette.navy, gold: palette.gold, teal: palette.teal };
  return <View style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: `${colors[tone]}1A` }]}><MaterialIcons name={icon} size={19} color={colors[tone]} /></View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>;
}

function SmallValue({ value, label }: { value: number; label: string }) {
  return <View style={styles.smallValue}><Text style={styles.smallNumber}>{value}</Text><Text style={styles.smallLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas, paddingHorizontal: 18 },
  header: { paddingTop: 22, paddingBottom: 13, gap: 12, alignItems: "center" },
  headerCopy: { flex: 1 },
  title: { color: palette.ink, fontSize: 21, fontWeight: "900" },
  subtitle: { color: palette.muted, fontSize: 11, marginTop: 3 },
  months: { gap: 8, paddingBottom: 12 },
  monthChip: { backgroundColor: "#FFFFFF", borderColor: palette.line, borderWidth: 1, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8 },
  monthChipSelected: { backgroundColor: palette.navy, borderColor: palette.navy },
  monthText: { color: palette.ink, fontSize: 11, fontWeight: "800" },
  monthTextSelected: { color: "#FFFFFF" },
  exportActions: { gap: 9, paddingBottom: 13 },
  exportButton: { flex: 1, minHeight: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, borderWidth: 1 },
  pdfButton: { backgroundColor: palette.navy, borderColor: palette.navy },
  excelButton: { backgroundColor: "#EAF8F5", borderColor: "#9CDDD2" },
  exportButtonMuted: { opacity: 0.6 },
  exportButtonText: { fontSize: 12, fontWeight: "900" },
  pdfButtonText: { color: "#FFFFFF" },
  excelButtonText: { color: palette.teal },
  monthCard: { padding: 15 },
  monthTitle: { color: palette.ink, fontSize: 16, fontWeight: "900" },
  monthSubtitle: { color: palette.muted, fontSize: 11, marginTop: 3 },
  metricGrid: { gap: 8, marginTop: 14 },
  metric: { flex: 1, backgroundColor: "#F8FBFD", paddingVertical: 11, borderRadius: 13, alignItems: "center" },
  metricIcon: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  metricValue: { color: palette.ink, fontSize: 20, fontWeight: "900", marginTop: 6 },
  metricLabel: { color: palette.muted, textAlign: "center", fontSize: 9, marginTop: 2 },
  followUp: { borderTopColor: palette.line, borderTopWidth: 1, marginTop: 14, paddingTop: 12, gap: 7, alignItems: "center" },
  followUpText: { flex: 1, color: palette.ink, fontSize: 11, fontWeight: "800" },
  chartCard: { padding: 15 },
  legend: { gap: 11, flexWrap: "wrap", marginBottom: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: palette.muted, fontSize: 9 },
  chart: { height: 152, gap: 10, alignItems: "flex-end", justifyContent: "space-around", borderBottomColor: palette.line, borderBottomWidth: 1, paddingBottom: 4 },
  barGroup: { flex: 1, minWidth: 28, maxWidth: 46, alignItems: "center", justifyContent: "flex-end" },
  bars: { height: 108, flexDirection: "row", gap: 2, alignItems: "flex-end" },
  bar: { width: 7, borderRadius: 4 },
  consultBar: { backgroundColor: palette.navy },
  admissionBar: { backgroundColor: palette.gold },
  emergencyBar: { backgroundColor: palette.teal },
  barTotal: { color: palette.ink, fontSize: 9, fontWeight: "900", marginTop: 3 },
  dayLabel: { color: palette.muted, fontSize: 9, marginTop: 2 },
  list: { gap: 9, paddingBottom: 24 },
  dayCard: { padding: 13 },
  dayHead: { justifyContent: "space-between", alignItems: "center" },
  dayDate: { color: palette.ink, fontSize: 13, fontWeight: "900" },
  total: { color: palette.navy, backgroundColor: palette.paleBlue, borderRadius: 10, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 3, fontSize: 12, fontWeight: "900" },
  dayValues: { gap: 7, marginTop: 11 },
  smallValue: { flex: 1, borderRadius: 10, backgroundColor: "#F8FBFD", alignItems: "center", paddingVertical: 7 },
  smallNumber: { color: palette.ink, fontSize: 14, fontWeight: "900" },
  smallLabel: { color: palette.muted, fontSize: 8, textAlign: "center", marginTop: 2 },
});
