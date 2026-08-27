import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AppCard, IconAction, palette, PrimaryButton, SectionTitle } from "@/components/neuro-ui";
import { consultationDestination, type ClinicalDisposition } from "@/lib/department-model";
import { validateConsultationDecision } from "@/lib/consultation-decision";
import { useDepartment } from "@/lib/department-store";
import { useAppLanguage } from "@/lib/language";
import { NEUROSURGERY_PROCEDURES, procedureLabel, type NeurosurgeryProcedureCode } from "@/lib/neurosurgery-procedure-catalog";

const blankForm = {
  title: "", subject: "", code: "", fileNumber: "", fullName: "", age: "", medicalHistory: "", clinicalTests: "", diagnosis: "",
  clinicalDecision: "", surgicalIntervention: false, surgeryType: "", surgeryTypeCode: undefined as NeurosurgeryProcedureCode | undefined, disposition: "follow_up" as ClinicalDisposition,
};

export default function NewConsultationScreen() {
  const { data, session, addConsultation } = useDepartment();
  const { language, isRTL } = useAppLanguage();
  const [form, setForm] = useState(blankForm);
  const [teamId, setTeamId] = useState("");
  const availableTeams = data.teams.filter((team) => session?.role === "admin" || team.memberIds.includes(session?.userId ?? ""));
  const destination = consultationDestination(form.disposition);

  const submit = () => {
    if (!teamId) { Alert.alert(language === "en" ? "Treating team required" : "الفريق المعالج مطلوب", language === "en" ? "Select the treating team before saving the consultation." : "اختر الفريق المعالج قبل حفظ الاستشارة."); return; }
    if (!form.title.trim() || !form.code.trim() || !form.fullName.trim() || !form.diagnosis.trim()) { Alert.alert(language === "en" ? "Missing information" : "بيانات ناقصة", language === "en" ? "Enter the consultation title, patient code, patient name, and diagnosis." : "أدخل عنوان الاستشارة ورمز الحالة واسم المريض والتشخيص."); return; }
    const decisionError = validateConsultationDecision(form);
    if (decisionError) { Alert.alert(language === "en" ? "Clinical decision required" : "القرار السريري مطلوب", decisionError === "missing_surgery_type" ? (language === "en" ? "Enter the surgery type for the planned surgical intervention." : "أدخل نوع العملية للتدخل الجراحي المخطط.") : (language === "en" ? "Enter the clinical decision before saving the consultation." : "اكتب القرار السريري قبل حفظ الاستشارة.")); return; }
    addConsultation(teamId, {
      title: form.title,
      subject: form.subject || form.diagnosis,
      disposition: form.disposition,
      patient: {
        code: form.code, fileNumber: form.fileNumber || form.code, fullName: form.fullName, age: Number(form.age) || null,
        medicalHistory: form.medicalHistory, clinicalTests: form.clinicalTests, diagnosis: form.diagnosis,
        clinicalDecision: form.clinicalDecision, surgeryType: form.surgicalIntervention ? form.surgeryType : undefined, surgeryTypeCode: form.surgicalIntervention ? form.surgeryTypeCode : undefined,
      },
    });
    router.replace({ pathname: "/team/[id]", params: { id: teamId, section: destination.section } });
  };

  return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={[styles.header, { flexDirection: isRTL ? "row" : "row-reverse" }]}>
      <IconAction icon={isRTL ? "arrow-forward" : "arrow-back"} label={language === "en" ? "Back" : "رجوع"} onPress={() => router.back()} />
      <View style={styles.headerCopy}><Text style={[styles.title, align(isRTL)]}>{language === "en" ? "New consultation" : "استشارة جديدة"}</Text><Text style={[styles.subtitle, align(isRTL)]}>{language === "en" ? "Select the treating team and clinical pathway." : "اختر الفريق المعالج وحدد مسار الحالة السريري."}</Text></View>
    </View>

    <AppCard style={styles.teamCard}>
      <View style={[styles.teamCardHead, { flexDirection: isRTL ? "row-reverse" : "row" }]}><MaterialIcons name="groups" size={20} color={palette.navy} /><Text style={[styles.teamTitle, align(isRTL)]}>{language === "en" ? "Treating team" : "الفريق المعالج"}</Text></View>
      <Text style={[styles.teamHint, align(isRTL)]}>{language === "en" ? "The patient is added only to the selected team's lists." : "سيضاف المريض تلقائياً إلى قوائم الفريق الذي تختاره فقط."}</Text>
      <View style={styles.teamOptions}>{availableTeams.map((team) => <Pressable key={team.id} accessibilityRole="button" accessibilityState={{ selected: teamId === team.id }} onPress={() => setTeamId(team.id)} style={({ pressed }) => [styles.teamOption, teamId === team.id && { borderColor: team.color, backgroundColor: `${team.color}12` }, pressed && { opacity: 0.75 }]}><View style={[styles.teamMark, { backgroundColor: team.color }]}><Text style={styles.teamMarkText}>{team.shortName}</Text></View><Text style={[styles.teamOptionText, align(isRTL)]}>{team.name}</Text><MaterialIcons name={teamId === team.id ? "check-circle" : "radio-button-unchecked"} size={20} color={teamId === team.id ? team.color : palette.muted} /></Pressable>)}</View>
    </AppCard>

    <SectionTitle title={language === "en" ? "Consultation and patient details" : "تفاصيل الاستشارة والمريض"} />
    <AppCard style={styles.formCard}>
      <Field label={language === "en" ? "Consultation title" : "عنوان الاستشارة"} value={form.title} onChangeText={(value) => setForm({ ...form, title: value })} placeholder={language === "en" ? "e.g. Pre-operative assessment" : "مثال: تقييم قبل العملية"} isRTL={isRTL} />
      <Field label={language === "en" ? "Patient name" : "اسم المريض"} value={form.fullName} onChangeText={(value) => setForm({ ...form, fullName: value })} placeholder={language === "en" ? "Full name" : "الاسم الكامل"} isRTL={isRTL} />
      <View style={[styles.rowFields, { flexDirection: isRTL ? "row-reverse" : "row" }]}><View style={styles.flexField}><Field label={language === "en" ? "Patient code" : "رمز الحالة"} value={form.code} onChangeText={(value) => setForm({ ...form, code: value })} placeholder="NS-2051" isRTL={isRTL} /></View><View style={styles.flexField}><Field label={language === "en" ? "Medical record no." : "رقم الملف"} value={form.fileNumber} onChangeText={(value) => setForm({ ...form, fileNumber: value })} placeholder="KSMC-000000" isRTL={isRTL} /></View></View>
      <Field label={language === "en" ? "Age" : "العمر"} value={form.age} onChangeText={(value) => setForm({ ...form, age: value })} keyboardType="numeric" isRTL={isRTL} />
      <Field label={language === "en" ? "Diagnosis" : "التشخيص"} value={form.diagnosis} onChangeText={(value) => setForm({ ...form, diagnosis: value })} placeholder={language === "en" ? "Clinical diagnosis" : "التشخيص السريري"} isRTL={isRTL} />
      <Field label={language === "en" ? "Clinical history" : "التاريخ المرضي"} value={form.medicalHistory} onChangeText={(value) => setForm({ ...form, medicalHistory: value })} multiline isRTL={isRTL} />
      <Field label={language === "en" ? "Clinical findings" : "الاختبارات السريرية"} value={form.clinicalTests} onChangeText={(value) => setForm({ ...form, clinicalTests: value })} multiline isRTL={isRTL} />
      <Field label={language === "en" ? "Consultation details / discharge reason" : "تفاصيل الاستشارة / سبب الخروج"} value={form.subject} onChangeText={(value) => setForm({ ...form, subject: value })} multiline isRTL={isRTL} />
      <Field label={language === "en" ? "Clinical decision" : "القرار السريري"} value={form.clinicalDecision} onChangeText={(value) => setForm({ ...form, clinicalDecision: value })} placeholder={language === "en" ? "e.g. Plan for surgical intervention" : "مثال: التوصية بتدخل جراحي"} multiline isRTL={isRTL} />
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: form.surgicalIntervention }} onPress={() => setForm({ ...form, surgicalIntervention: !form.surgicalIntervention, surgeryType: form.surgicalIntervention ? "" : form.surgeryType, surgeryTypeCode: form.surgicalIntervention ? undefined : form.surgeryTypeCode })} style={[styles.surgeryToggle, { flexDirection: isRTL ? "row-reverse" : "row" }, form.surgicalIntervention && styles.surgeryToggleActive]}><View style={[styles.toggleIcon, form.surgicalIntervention && styles.toggleIconActive]}><MaterialIcons name={form.surgicalIntervention ? "check" : "add"} size={17} color={form.surgicalIntervention ? "#FFFFFF" : palette.gold} /></View><View style={styles.flexField}><Text style={[styles.surgeryToggleTitle, align(isRTL)]}>{language === "en" ? "Surgical intervention planned" : "تدخل جراحي مخطط"}</Text><Text style={[styles.surgeryToggleText, align(isRTL)]}>{language === "en" ? "Activate this to document the surgery type." : "فعّل هذا الخيار لتوثيق نوع العملية."}</Text></View></Pressable>
      {form.surgicalIntervention ? <ProcedurePicker selectedCode={form.surgeryTypeCode} customValue={form.surgeryType} onSelect={(code) => setForm({ ...form, surgeryTypeCode: code, surgeryType: code === "other" ? form.surgeryType : procedureLabel(code, language) })} onCustomChange={(surgeryType) => setForm({ ...form, surgeryType })} isRTL={isRTL} language={language} /> : null}
      <Text style={[styles.fieldLabel, align(isRTL)]}>{language === "en" ? "Clinical pathway" : "المسار السريري"}</Text>
      <View style={[styles.decisionRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}><Decision label={language === "en" ? "Admit" : "تنويم"} icon="hotel" active={form.disposition === "admit"} color={palette.urgent} onPress={() => setForm({ ...form, disposition: "admit" })} /><Decision label={language === "en" ? "Follow-up" : "متابعة"} icon="visibility" active={form.disposition === "follow_up"} color={palette.navy} onPress={() => setForm({ ...form, disposition: "follow_up" })} /><Decision label={language === "en" ? "Discharge" : "خروج"} icon="exit-to-app" active={form.disposition === "discharge"} color={palette.teal} onPress={() => setForm({ ...form, disposition: "discharge" })} /></View>
      <View style={[styles.pathHint, { flexDirection: isRTL ? "row-reverse" : "row" }]}><MaterialIcons name={destination.icon} size={18} color={destination.color} /><Text style={[styles.pathHintText, align(isRTL)]}>{language === "en" ? destination.englishHint : destination.arabicHint}</Text></View>
      <PrimaryButton label={language === "en" ? "Save consultation" : "حفظ الاستشارة"} icon="save" onPress={submit} />
    </AppCard>
  </ScrollView>;
}

function Field({ label, value, onChangeText, placeholder = "", multiline = false, keyboardType = "default", isRTL }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; multiline?: boolean; keyboardType?: "default" | "numeric"; isRTL: boolean }) { return <View><Text style={[styles.fieldLabel, align(isRTL)]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9FB3C8" multiline={multiline} keyboardType={keyboardType} textAlign={isRTL ? "right" : "left"} style={[styles.input, multiline && styles.textarea, { writingDirection: isRTL ? "rtl" : "ltr" }]} /></View>; }
function ProcedurePicker({ selectedCode, customValue, onSelect, onCustomChange, isRTL, language }: { selectedCode?: NeurosurgeryProcedureCode; customValue: string; onSelect: (code: NeurosurgeryProcedureCode) => void; onCustomChange: (value: string) => void; isRTL: boolean; language: "ar" | "en" }) { return <View><Text style={[styles.fieldLabel, align(isRTL)]}>{language === "en" ? "Surgery type" : "نوع العملية"}</Text><Text style={[styles.procedureHint, align(isRTL)]}>{language === "en" ? "Choose a standard procedure to support future statistics." : "اختر إجراءً معيارياً لدعم الإحصاءات المستقبلية."}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.procedureChoices, { flexDirection: isRTL ? "row-reverse" : "row" }]}>{NEUROSURGERY_PROCEDURES.map((option) => <Pressable key={option.code} onPress={() => onSelect(option.code)} style={[styles.procedureChoice, selectedCode === option.code && styles.procedureChoiceSelected]}><Text style={[styles.procedureChoiceText, selectedCode === option.code && styles.procedureChoiceTextSelected]}>{language === "en" ? option.englishLabel : option.arabicLabel}</Text></Pressable>)}</ScrollView>{selectedCode === "other" ? <Field label={language === "en" ? "Specify procedure" : "حدد الإجراء"} value={customValue} onChangeText={onCustomChange} placeholder={language === "en" ? "Enter procedure name" : "اكتب اسم الإجراء"} isRTL={isRTL} /> : null}</View>; }
function Decision({ label, icon, active, color, onPress }: { label: string; icon: React.ComponentProps<typeof MaterialIcons>["name"]; active: boolean; color: string; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.decision, active && { borderColor: color, backgroundColor: `${color}12` }]}><MaterialIcons name={icon} size={18} color={active ? color : palette.muted} /><Text style={[styles.decisionText, active && { color }]}>{label}</Text></Pressable>; }
function align(isRTL: boolean) { return { writingDirection: isRTL ? "rtl" as const : "ltr" as const, textAlign: isRTL ? "right" as const : "left" as const }; }

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas }, content: { padding: 18, paddingBottom: 34 }, header: { alignItems: "center", gap: 12, marginBottom: 16 }, headerCopy: { flex: 1 }, title: { color: palette.ink, fontSize: 22, fontWeight: "900" }, subtitle: { color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 4 }, teamCard: { padding: 15 }, teamCardHead: { alignItems: "center", gap: 8 }, teamTitle: { color: palette.ink, fontSize: 15, fontWeight: "900", flex: 1 }, teamHint: { color: palette.muted, fontSize: 11, lineHeight: 17, marginTop: 8 }, teamOptions: { gap: 8, marginTop: 12 }, teamOption: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 10, alignItems: "center", flexDirection: "row", gap: 9 }, teamMark: { height: 32, width: 32, borderRadius: 11, alignItems: "center", justifyContent: "center" }, teamMarkText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" }, teamOptionText: { flex: 1, color: palette.ink, fontSize: 13, fontWeight: "800" }, formCard: { padding: 15 }, fieldLabel: { color: palette.ink, fontSize: 12, fontWeight: "800", marginTop: 11, marginBottom: 5 }, procedureHint: { color: palette.muted, fontSize: 10, lineHeight: 15, marginBottom: 7 }, procedureChoices: { gap: 7, paddingBottom: 4 }, procedureChoice: { maxWidth: 190, borderWidth: 1, borderColor: palette.line, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#FFFFFF" }, procedureChoiceSelected: { borderColor: palette.teal, backgroundColor: palette.paleTeal }, procedureChoiceText: { color: palette.ink, fontSize: 10, fontWeight: "800" }, procedureChoiceTextSelected: { color: palette.teal }, input: { borderWidth: 1, borderColor: palette.line, borderRadius: 13, minHeight: 46, paddingHorizontal: 12, color: palette.ink }, textarea: { minHeight: 76, textAlignVertical: "top", paddingTop: 10 }, rowFields: { gap: 8 }, flexField: { flex: 1 }, surgeryToggle: { gap: 10, alignItems: "center", borderWidth: 1, borderColor: "#F2D9AA", borderRadius: 14, padding: 12, backgroundColor: palette.paleGold, marginTop: 12 }, surgeryToggleActive: { borderColor: palette.gold, backgroundColor: "#FFF0D5" }, toggleIcon: { height: 30, width: 30, borderRadius: 10, borderWidth: 1, borderColor: palette.gold, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }, toggleIconActive: { backgroundColor: palette.gold }, surgeryToggleTitle: { color: palette.ink, fontSize: 12, fontWeight: "900" }, surgeryToggleText: { color: palette.muted, fontSize: 10, marginTop: 3, lineHeight: 15 }, decisionRow: { gap: 7, marginTop: 3 }, decision: { flex: 1, minHeight: 67, borderWidth: 1, borderColor: palette.line, borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 3 }, decisionText: { color: palette.muted, fontSize: 10, fontWeight: "800", textAlign: "center" }, pathHint: { gap: 7, alignItems: "flex-start", backgroundColor: "#F4FBF9", borderRadius: 12, padding: 10, marginTop: 14, marginBottom: 14 }, pathHintText: { color: palette.teal, fontSize: 11, lineHeight: 17, flex: 1 },
});
