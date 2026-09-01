import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AppCard, IconAction, palette, PrimaryButton, SectionTitle, StatusPill } from "@/components/neuro-ui";
import type { PatientCase } from "@/lib/department-model";
import type { DepartmentSession } from "@/lib/department-session";
import { requestMedicalReportDraft } from "@/lib/medical-report-draft-api";
import { exportApprovedMedicalReport, shareApprovedMedicalReportPdf } from "@/lib/medical-report-draft-export";
import { MEDICAL_REPORT_SECTION_KEYS, medicalReportSectionLabels, type MedicalReportDraft } from "@/shared/medical-report-draft";

type DraftProgressStage = "preparing" | "verifying" | "drafting";

function progressCopy(stage: DraftProgressStage, language: "ar" | "en") {
  const copy = language === "en"
    ? {
      preparing: { title: "Preparing documented data", detail: "Only the fields needed for this draft are being prepared." },
      verifying: { title: "Verifying secure connection", detail: "An approved department session is required." },
      drafting: { title: "Creating review draft", detail: "No final report is issued automatically." },
    }
    : {
      preparing: { title: "جارٍ تجهيز البيانات الموثقة", detail: "يتم تجهيز الحقول اللازمة لهذه المسودة فقط." },
      verifying: { title: "جارٍ التحقق من الاتصال الآمن", detail: "يلزم وجود جلسة قسم معتمدة." },
      drafting: { title: "جارٍ إنشاء مسودة للمراجعة", detail: "لا يتم إصدار تقرير نهائي تلقائيًا." },
    };
  return copy[stage];
}

function draftFailureCopy(error: unknown, language: "ar" | "en") {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("approved department session")) return language === "en" ? "Your approved department session has expired. Sign in again, then retry." : "انتهت جلسة القسم المعتمدة. سجّل الدخول مرة أخرى ثم أعد المحاولة.";
  if (message.includes("Please wait before")) return language === "en" ? "Please wait a minute before requesting another draft." : "يرجى الانتظار دقيقة قبل طلب مسودة أخرى.";
  if (message.includes("Unable to contact")) return language === "en" ? "The report service could not be reached. Check the network connection and retry." : "تعذر الوصول إلى خدمة التقرير. تحقق من اتصال الشبكة ثم أعد المحاولة.";
  if (message.includes("temporarily unavailable")) return language === "en" ? "The draft service is temporarily unavailable. Your patient file was not changed; retry shortly." : "خدمة تجهيز المسودة غير متاحة مؤقتًا. لم يتم تعديل ملف المريض؛ أعد المحاولة بعد قليل.";
  return language === "en" ? "The report draft could not be created. Your patient file was not changed." : "تعذر إنشاء مسودة التقرير. لم يتم تعديل ملف المريض.";
}

export function MedicalReportDraftAction({ patient, session, language, isRTL }: { patient: PatientCase; session: DepartmentSession | null; language: "ar" | "en"; isRTL: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressStage, setProgressStage] = useState<DraftProgressStage | null>(null);
  const [draft, setDraft] = useState<MedicalReportDraft | null>(null);
  const [approved, setApproved] = useState(false);
  const [exportedPdf, setExportedPdf] = useState<{ uri: string; fileName: string } | null>(null);
  const [reportLanguage, setReportLanguage] = useState<"ar" | "en">(language);
  const labels = medicalReportSectionLabels(reportLanguage);
  const title = language === "en" ? "Medical report" : "تقرير طبي";

  useEffect(() => {
    if (!loading) return;
    setProgressStage("preparing");
    const connectionTimer = setTimeout(() => setProgressStage("verifying"), 360);
    const draftingTimer = setTimeout(() => setProgressStage("drafting"), 960);
    return () => {
      clearTimeout(connectionTimer);
      clearTimeout(draftingTimer);
    };
  }, [loading]);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await requestMedicalReportDraft({ patient, session, language: reportLanguage });
      setDraft(result.draft);
      setApproved(false);
      setExportedPdf(null);
      setOpen(true);
    } catch (error) {
      Alert.alert(language === "en" ? "Draft unavailable" : "تعذر إنشاء المسودة", draftFailureCopy(error, language));
    } finally {
      setProgressStage(null);
      setLoading(false);
    }
  };

  const updateSection = (key: keyof MedicalReportDraft, value: string) => {
    setApproved(false);
    setExportedPdf(null);
    setDraft((current) => current ? { ...current, [key]: value } : current);
  };

  const approve = () => {
    setApproved(true);
    Alert.alert(language === "en" ? "Draft approved" : "تم اعتماد المسودة", language === "en" ? "You can now export the reviewed PDF." : "يمكنك الآن تصدير ملف PDF بعد المراجعة.");
  };

  const exportPdf = async () => {
    if (!draft || !approved) return;
    try {
      const result = await exportApprovedMedicalReport({
        patient,
        draft,
        language: reportLanguage,
        template: reportLanguage === "en" ? "formal-english" : "standard",
        approvedBy: session?.name ?? (language === "en" ? "Approved clinician" : "الطبيب المعتمد"),
      });
      if (result.status === "downloaded" && result.uri) setExportedPdf({ uri: result.uri, fileName: result.fileName });
      Alert.alert(
        language === "en" ? "Report ready" : "التقرير جاهز",
        result.status === "downloaded"
          ? (language === "en" ? "The PDF download is ready. You can now share it through an approved channel." : "أصبح تنزيل PDF جاهزًا. يمكنك الآن مشاركته عبر قناة معتمدة.")
          : (language === "en" ? "Choose where to save the reviewed PDF." : "اختر مكان حفظ PDF بعد المراجعة."),
      );
    } catch {
      Alert.alert(language === "en" ? "Export unavailable" : "تعذر التصدير", language === "en" ? "The reviewed PDF could not be prepared." : "لم نتمكن من تجهيز PDF بعد المراجعة.");
    }
  };

  const sharePdf = async () => {
    if (!approved || !exportedPdf) return;
    try {
      const result = await shareApprovedMedicalReportPdf(exportedPdf);
      if (result === "unavailable") throw new Error("unavailable");
    } catch {
      Alert.alert(language === "en" ? "Sharing unavailable" : "المشاركة غير متاحة", language === "en" ? "This device cannot open the system share sheet for this file." : "لا يستطيع هذا الجهاز فتح صفحة مشاركة النظام لهذا الملف.");
    }
  };

  const progress = progressStage ? progressCopy(progressStage, language) : null;
  const progressStep = progressStage ? (["preparing", "verifying", "drafting"] as DraftProgressStage[]).indexOf(progressStage) : -1;
  const shareNotice = !approved
    ? (language === "en" ? "Sharing remains locked until clinician approval and PDF export." : "تبقى المشاركة مقفلة حتى اعتماد الطبيب وتصدير PDF.")
    : !exportedPdf
      ? (language === "en" ? "Export the approved PDF on this device before sharing it." : "صدّر PDF المعتمد على هذا الجهاز قبل مشاركته.")
      : (language === "en" ? "The system share sheet lets you choose an approved secure email or messaging channel; no report is sent automatically." : "تتيح لك صفحة مشاركة النظام اختيار بريد إلكتروني أو قناة مراسلة آمنة ومعتمدة؛ ولا يُرسل أي تقرير تلقائيًا.");

  return <>
    <SectionTitle title={title} />
    <AppCard style={styles.card}>
      <View style={[styles.row, direction(isRTL)]}>
        <View style={styles.icon}><MaterialIcons name="description" size={21} color="#FFFFFF" /></View>
        <View style={styles.flex}>
          <Text style={[styles.title, align(isRTL)]}>{language === "en" ? "AI-assisted medical report draft" : "مسودة تقرير طبي بمساعدة الذكاء الاصطناعي"}</Text>
          <Text style={[styles.text, align(isRTL)]}>{language === "en" ? "Uses documented file data only. Clinician review and approval are required before export." : "تستخدم البيانات الموثقة في الملف فقط. تتطلب مراجعة واعتماد الطبيب قبل التصدير."}</Text>
        </View>
      </View>
      <Text style={[styles.templateLabel, align(isRTL)]}>{language === "en" ? "Report language and print template" : "لغة التقرير ونموذج الطباعة"}</Text>
      <View style={[styles.templateRow, direction(isRTL)]}>
        <Pressable onPress={() => { setReportLanguage("en"); setApproved(false); setExportedPdf(null); }} style={[styles.templateChoice, reportLanguage === "en" && styles.templateChoiceActive]}>
          <Text style={[styles.templateChoiceText, reportLanguage === "en" && styles.templateChoiceTextActive]}>English · Official</Text>
        </Pressable>
        <Pressable onPress={() => { setReportLanguage("ar"); setApproved(false); setExportedPdf(null); }} style={[styles.templateChoice, reportLanguage === "ar" && styles.templateChoiceActive]}>
          <Text style={[styles.templateChoiceText, reportLanguage === "ar" && styles.templateChoiceTextActive]}>العربية · نموذج موحد</Text>
        </Pressable>
      </View>
      <Pressable onPress={generate} disabled={loading} style={({ pressed }) => [styles.generate, pressed && styles.pressed, loading && styles.disabled]} accessibilityLabel={language === "en" ? "Generate medical report draft" : "إنشاء مسودة تقرير طبي"}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <MaterialIcons name="auto-awesome" size={19} color="#FFFFFF" />}
        <Text style={styles.generateText}>{loading ? (language === "en" ? "Preparing draft…" : "جارٍ تجهيز المسودة…") : (language === "en" ? "Generate review draft" : "إنشاء مسودة للمراجعة")}</Text>
      </Pressable>
      {loading && progress ? <View style={[styles.progressPanel, direction(isRTL)]}>
        <ActivityIndicator color={palette.teal} size="small" />
        <View style={styles.flex}>
          <Text style={[styles.progressTitle, align(isRTL)]}>{progress.title}</Text>
          <Text style={[styles.progressDetail, align(isRTL)]}>{progress.detail}</Text>
        </View>
        <View style={[styles.progressDots, direction(isRTL)]}>
          {(["preparing", "verifying", "drafting"] as DraftProgressStage[]).map((stage, index) => <View key={stage} style={[styles.progressDot, index <= progressStep && styles.progressDotActive]} />)}
        </View>
      </View> : null}
    </AppCard>

    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <View style={styles.modalPage}>
        <View style={[styles.modalHeader, direction(isRTL)]}>
          <IconAction icon={isRTL ? "arrow-forward" : "arrow-back"} label={language === "en" ? "Close" : "إغلاق"} onPress={() => setOpen(false)} />
          <Text style={[styles.modalTitle, align(isRTL)]}>{language === "en" ? "Review medical report" : "مراجعة التقرير الطبي"}</Text>
          <View style={styles.headerSpace} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.notice, direction(isRTL)]}>
            <MaterialIcons name="health-and-safety" size={20} color={palette.navy} />
            <Text style={[styles.noticeText, align(isRTL)]}>{language === "en" ? "AI-assisted draft. Verify every section against the patient file; complete or correct it before approval. This tool does not make diagnoses or clinical recommendations." : "مسودة مساعدة بالذكاء الاصطناعي. راجع كل قسم مقابل ملف المريض واستكمله أو صححه قبل الاعتماد. لا تصدر الأداة تشخيصات أو توصيات سريرية."}</Text>
          </View>
          {draft ? MEDICAL_REPORT_SECTION_KEYS.map((key) => <View key={key} style={styles.field}>
            <Text style={[styles.label, align(isRTL)]}>{labels[key]}</Text>
            <TextInput value={draft[key]} onChangeText={(value) => updateSection(key, value)} multiline textAlignVertical="top" textAlign={isRTL ? "right" : "left"} style={[styles.input, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]} />
          </View>) : null}
          <View style={[styles.reviewState, direction(isRTL)]}>
            <StatusPill label={approved ? (language === "en" ? "Clinician reviewed" : "تمت المراجعة") : (language === "en" ? "Review required" : "مراجعة مطلوبة")} tone={approved ? "teal" : "gold"} />
            <Text style={[styles.reviewText, align(isRTL)]}>{approved ? (language === "en" ? "The PDF may be exported." : "يمكن تصدير PDF الآن.") : (language === "en" ? "PDF export remains locked until you approve the reviewed draft." : "يبقى تصدير PDF مقفلاً حتى تعتمد المسودة بعد المراجعة.")}</Text>
          </View>
          <PrimaryButton label={language === "en" ? "Approve reviewed draft" : "اعتماد المسودة بعد المراجعة"} icon="verified" onPress={approve} />
          <Pressable onPress={exportPdf} disabled={!approved} style={[styles.export, !approved && styles.exportDisabled]}>
            <MaterialIcons name="picture-as-pdf" size={20} color={approved ? "#FFFFFF" : palette.muted} />
            <Text style={[styles.exportText, !approved && styles.exportTextDisabled]}>{language === "en" ? "Export approved PDF" : "تصدير PDF المعتمد"}</Text>
          </Pressable>
          {approved && exportedPdf ? <Pressable onPress={sharePdf} style={styles.share} accessibilityLabel={language === "en" ? "Share final medical report" : "مشاركة التقرير الطبي النهائي"}>
            <MaterialIcons name="share" size={20} color={palette.navy} />
            <Text style={styles.shareText}>{language === "en" ? "Share final medical report" : "مشاركة التقرير الطبي النهائي"}</Text>
          </Pressable> : null}
          <Text style={[styles.shareNotice, align(isRTL)]}>{shareNotice}</Text>
        </ScrollView>
      </View>
    </Modal>
  </>;
}

function direction(isRTL: boolean) { return { flexDirection: isRTL ? "row-reverse" as const : "row" as const }; }
function align(isRTL: boolean) { return { textAlign: isRTL ? "right" as const : "left" as const, writingDirection: isRTL ? "rtl" as const : "ltr" as const }; }

const styles = StyleSheet.create({
  card: { marginTop: 10, padding: 14, borderColor: "#D8DCFA", backgroundColor: "#FCFCFF" }, row: { gap: 10, alignItems: "flex-start" }, icon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: palette.navy }, flex: { flex: 1 }, title: { color: palette.ink, fontSize: 14, fontWeight: "900" }, text: { color: palette.muted, fontSize: 11, lineHeight: 17, marginTop: 4 }, templateLabel: { color: palette.ink, fontSize: 11, fontWeight: "800", marginTop: 14, marginBottom: 7 }, templateRow: { gap: 8 }, templateChoice: { flex: 1, minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: palette.line, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center", paddingHorizontal: 8 }, templateChoiceActive: { backgroundColor: palette.paleBlue, borderColor: palette.navy }, templateChoiceText: { color: palette.muted, fontSize: 10, fontWeight: "800" }, templateChoiceTextActive: { color: palette.navy }, generate: { minHeight: 45, marginTop: 14, paddingHorizontal: 13, borderRadius: 13, backgroundColor: palette.navy, alignItems: "center", justifyContent: "center", gap: 8, flexDirection: "row" }, generateText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, progressPanel: { marginTop: 10, gap: 8, padding: 10, borderRadius: 12, backgroundColor: "#F1FBF9", borderWidth: 1, borderColor: "#C7E8E1", alignItems: "center" }, progressTitle: { color: palette.teal, fontSize: 10, fontWeight: "900" }, progressDetail: { color: palette.muted, fontSize: 9, lineHeight: 14, marginTop: 2 }, progressDots: { gap: 4, alignItems: "center" }, progressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#BFE3DD" }, progressDotActive: { backgroundColor: palette.teal }, pressed: { opacity: 0.78 }, disabled: { opacity: 0.65 }, modalPage: { flex: 1, backgroundColor: palette.canvas }, modalHeader: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: palette.line }, modalTitle: { flex: 1, color: palette.ink, fontSize: 17, fontWeight: "900" }, headerSpace: { width: 40 }, content: { padding: 18, paddingBottom: 38 }, notice: { gap: 8, padding: 12, borderRadius: 14, backgroundColor: palette.paleBlue, alignItems: "flex-start" }, noticeText: { flex: 1, color: palette.navy, fontSize: 11, lineHeight: 17, fontWeight: "700" }, field: { marginTop: 14 }, label: { color: palette.ink, fontSize: 13, fontWeight: "900", marginBottom: 6 }, input: { minHeight: 88, borderWidth: 1, borderColor: palette.line, borderRadius: 13, backgroundColor: "#FFFFFF", color: palette.ink, paddingHorizontal: 11, paddingTop: 10, fontSize: 12, lineHeight: 19 }, reviewState: { gap: 9, alignItems: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line, padding: 11, borderRadius: 13, marginTop: 16, marginBottom: 12 }, reviewText: { flex: 1, color: palette.muted, fontSize: 10, lineHeight: 15 }, export: { minHeight: 46, borderRadius: 13, backgroundColor: palette.teal, marginTop: 10, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }, exportDisabled: { backgroundColor: palette.paleBlue, borderWidth: 1, borderColor: palette.line }, exportText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, exportTextDisabled: { color: palette.muted }, share: { minHeight: 46, borderRadius: 13, backgroundColor: palette.paleBlue, borderWidth: 1, borderColor: "#C7E8E1", marginTop: 10, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }, shareText: { color: palette.navy, fontSize: 12, fontWeight: "900" }, shareNotice: { color: palette.muted, fontSize: 10, lineHeight: 15, marginTop: 8 },
});
