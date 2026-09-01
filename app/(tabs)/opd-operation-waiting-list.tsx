import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppCard, EmptyState, IconAction, palette, PrimaryButton, SectionTitle, StatusPill } from "@/components/neuro-ui";
import { NeurosurgeryDiagnosisPicker } from "@/components/neurosurgery-diagnosis-picker";
import { useDepartment } from "@/lib/department-store";
import type { OpdOperationWaitingEntry } from "@/lib/department-model";
import { useAppLanguage } from "@/lib/language";
import { NEUROSURGERY_PROCEDURES, procedureLabel, type NeurosurgeryProcedureCode } from "@/lib/neurosurgery-procedure-catalog";
import { canAddOpdOperationWaitingList, canManageOpdOperationWaitingList, isOpdWaitingEntryNew, OPD_OPERATION_PRIORITIES, OPD_OPERATION_STATUSES, opdNewEntryLabel, opdPriorityLabel, opdStatusLabel } from "@/lib/opd-operation-waitlist";
import { buildOpdWaitlistReport, exportOpdWaitlistExcel, exportOpdWaitlistPdf, filterOpdWaitlist } from "@/lib/opd-operation-waitlist-export";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Draft = Omit<OpdOperationWaitingEntry, "id" | "createdAt" | "updatedAt" | "updatedBy" | "patientLink">;
type PriorityFilter = "all" | OpdOperationWaitingEntry["priority"];
type StatusFilter = "all" | OpdOperationWaitingEntry["status"];

const emptyDraft = (): Draft => ({
  patientName: "",
  fileNumber: "",
  diagnosis: "",
  procedure: "",
  procedureCode: undefined,
  requestedBy: "",
  plannedDate: "",
  priority: "روتيني",
  status: "بانتظار مراجعة",
  notes: "",
});

export default function OpdOperationWaitingListScreen() {
  const { data, session, addOpdOperationWaitingEntry, updateOpdOperationWaitingEntry } = useDepartment();
  const insets = useSafeAreaInsets();
  const { language, isRTL } = useAppLanguage();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const currentUser = data.users.find((user) => user.id === session?.userId);
  const canManage = canManageOpdOperationWaitingList(session?.role, currentUser?.permissions);
  const canAdd = canAddOpdOperationWaitingList(session?.role);
  const filterValues = {
    priority: priorityFilter === "all" ? undefined : priorityFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  };
  const filteredEntries = useMemo(
    () => filterOpdWaitlist(data.opdOperationWaitingList ?? [], {
      priority: priorityFilter === "all" ? undefined : priorityFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [data.opdOperationWaitingList, priorityFilter, statusFilter],
  );
  const visibleEntries = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return filteredEntries;
    return filteredEntries.filter((entry) =>
      [entry.patientName, entry.fileNumber, entry.diagnosis, entry.procedure, entry.requestedBy, entry.status]
        .some((value) => value.toLocaleLowerCase().includes(term)),
    );
  }, [filteredEntries, search]);

  const setField = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setDraft(emptyDraft());
  };
  const openNew = () => {
    if (!canAdd) return;
    setEditingId(null);
    setDraft(emptyDraft());
    setModalVisible(true);
  };
  const openEdit = (entry: OpdOperationWaitingEntry) => {
    if (!canManage) return;
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, updatedBy: _updatedBy, patientLink: _patientLink, ...next } = entry;
    setEditingId(entry.id);
    setDraft(next);
    setModalVisible(true);
  };
  const selectProcedure = (code: NeurosurgeryProcedureCode) => {
    setField("procedureCode", code);
    setField("procedure", code === "other" ? "" : procedureLabel(code, language));
  };
  const save = () => {
    if ((editingId && !canManage) || (!editingId && !canAdd)) {
      Alert.alert(
        language === "en" ? "Operation supervision required" : "مطلوب إشراف العمليات",
        editingId
          ? language === "en"
            ? "Only users with Operations supervision can update waiting-list entries."
            : "تحديث عناصر قائمة الانتظار متاح فقط لمن لديهم صلاحية إشراف العمليات."
          : language === "en"
            ? "Your account is not approved to add a waiting-list request."
            : "حسابك غير معتمد لإضافة طلب في قائمة الانتظار.",
      );
      return;
    }
    if (!draft.patientName.trim() || !draft.fileNumber.trim() || !draft.procedure.trim() || !draft.requestedBy.trim()) {
      Alert.alert(
        language === "en" ? "Missing details" : "بيانات ناقصة",
        language === "en"
          ? "Enter patient name, medical record number, procedure, and requesting clinician."
          : "أدخل اسم المريض ورقم الملف ونوع العملية والطبيب طالب العملية.",
      );
      return;
    }
    if (editingId) updateOpdOperationWaitingEntry(editingId, draft);
    else addOpdOperationWaitingEntry(draft);
    closeModal();
  };
  const exportList = async (format: "pdf" | "xlsx") => {
    const report = buildOpdWaitlistReport(
      data.opdOperationWaitingList ?? [],
      session?.name ?? (language === "en" ? "Authorized user" : "مستخدم مخول"),
      filterValues,
    );
    const result = format === "pdf"
      ? await exportOpdWaitlistPdf(report, language)
      : await exportOpdWaitlistExcel(report, language);
    if (result === "downloaded") {
      Alert.alert(
        language === "en" ? "Download complete" : "اكتمل التنزيل",
        language === "en" ? "The report was saved to the selected folder on this device." : "تم حفظ التقرير في المجلد الذي اخترته على الجهاز.",
      );
    } else if (result === "unavailable") {
      Alert.alert(
        language === "en" ? "Download unavailable" : "تعذر التنزيل",
        language === "en" ? "Choose a device folder and try again." : "اختر مجلدًا على الجهاز ثم حاول مرة أخرى.",
      );
    }
  };
  const canOpen = (entry: OpdOperationWaitingEntry) => {
    const team = entry.patientLink ? data.teams.find((item) => item.id === entry.patientLink?.teamId) : undefined;
    return Boolean(team && entry.patientLink && (session?.role === "admin" || currentUser?.permissions.includes("view_all_patients") || team.memberIds.includes(session?.userId ?? "")));
  };
  const priorityOptions: PriorityFilter[] = ["all", ...OPD_OPERATION_PRIORITIES];
  const statusOptions: StatusFilter[] = ["all", ...OPD_OPERATION_STATUSES];
  const newEntriesCount = filteredEntries.filter(isOpdWaitingEntryNew).length;

  const renderEntry = ({ item }: { item: OpdOperationWaitingEntry }) => {
    const isNew = isOpdWaitingEntryNew(item);
    return (
    <AppCard style={[styles.entry, isNew && styles.newEntry]}>
      {isNew ? <View style={[styles.newBanner, direction(isRTL)]}><MaterialIcons name="fiber-new" size={16} color="#8A4B08" /><Text style={[styles.newBannerText, align(isRTL)]}>{opdNewEntryLabel(language)}</Text></View> : null}
      <View style={[styles.entryHead, direction(isRTL)]}>
        <View style={styles.entryIcon}><MaterialIcons name="event-note" size={21} color={palette.teal} /></View>
        <View style={styles.flex}>
          <Text style={[styles.patientName, align(isRTL)]}>{item.patientName}</Text>
          <Text style={[styles.meta, align(isRTL)]}>{language === "en" ? `MRN: ${item.fileNumber}` : `رقم الملف: ${item.fileNumber}`}</Text>
        </View>
        <StatusPill label={opdStatusLabel(item.status, language)} tone={item.status === "مكتمل" ? "teal" : item.status === "ملغى" ? "red" : item.status === "مجدول" ? "blue" : "gold"} />
      </View>
      <View style={styles.divider} />
      <Text style={[styles.procedure, align(isRTL)]}>{item.procedure}</Text>
      <Text style={[styles.detail, align(isRTL)]}>{language === "en" ? `Diagnosis: ${item.diagnosis || "Not documented"}` : `التشخيص: ${item.diagnosis || "غير موثق"}`}</Text>
      <View style={[styles.infoRow, direction(isRTL)]}>
        <View style={[styles.priority, item.priority === "عاجل" && styles.urgent]}>
          <MaterialIcons name={item.priority === "عاجل" ? "priority-high" : "flag"} size={14} color={item.priority === "عاجل" ? "#B42318" : palette.navy} />
          <Text style={styles.priorityText}>{opdPriorityLabel(item.priority, language)}</Text>
        </View>
        <Text style={[styles.detail, align(isRTL)]}>{item.plannedDate ? (language === "en" ? `Target: ${item.plannedDate}` : `الموعد المتوقع: ${item.plannedDate}`) : (language === "en" ? "Date to be confirmed" : "بانتظار تحديد الموعد")}</Text>
      </View>
      <Text style={[styles.detail, align(isRTL)]}>{language === "en" ? `Requested by: ${item.requestedBy}` : `طلب العملية: ${item.requestedBy}`}</Text>
      {item.notes ? <Text style={[styles.notes, align(isRTL)]}>{item.notes}</Text> : null}
      <View style={[styles.actions, direction(isRTL)]}>
        {canOpen(item) && item.patientLink ? <Pressable accessibilityRole="button" accessibilityLabel={language === "en" ? "Open linked patient record" : "فتح ملف المريض المرتبط"} onPress={() => router.push({ pathname: "/patient/[teamId]/[caseId]" as never, params: item.patientLink as never })} style={({ pressed }) => [styles.openRecord, pressed && styles.pressed]}><MaterialIcons name="folder-open" size={17} color={palette.teal} /><Text style={styles.openRecordText}>{language === "en" ? "Open file" : "فتح الملف"}</Text></Pressable> : null}
        {canManage ? <Pressable accessibilityRole="button" accessibilityLabel={language === "en" ? "Update waiting-list entry" : "تحديث عنصر قائمة الانتظار"} onPress={() => openEdit(item)} style={({ pressed }) => [styles.edit, pressed && styles.pressed]}><MaterialIcons name="edit-calendar" size={17} color={palette.navy} /><Text style={styles.editText}>{language === "en" ? "Update" : "تحديث"}</Text></Pressable> : null}
      </View>
    </AppCard>
    );
  };

  return (
    <View style={styles.page}>
      <View style={[styles.header, direction(isRTL)]}>
        <IconAction icon={isRTL ? "arrow-forward" : "arrow-back"} label={language === "en" ? "Back" : "رجوع"} onPress={() => router.back()} />
        <View style={styles.flex}>
          <Text style={[styles.title, align(isRTL)]}>{language === "en" ? "OPD operation waiting list" : "قائمة انتظار عمليات العيادات"}</Text>
          <Text style={[styles.subtitle, align(isRTL)]}>{language === "en" ? "Track outpatient surgery requests before scheduling" : "متابعة طلبات عمليات العيادات قبل الجدولة"}</Text>
        </View>
        {canAdd ? <Pressable accessibilityRole="button" accessibilityLabel={language === "en" ? "Add OPD operation request" : "إضافة طلب عملية عيادة"} onPress={openNew} style={styles.add}><MaterialIcons name="add" color="#FFFFFF" size={25} /></Pressable> : null}
      </View>

      <View style={[styles.summary, direction(isRTL)]}>
        <View style={styles.summaryIcon}><MaterialIcons name="format-list-bulleted" size={21} color="#FFFFFF" /></View>
        <View style={styles.flex}>
          <Text style={[styles.summaryTitle, align(isRTL)]}>{language === "en" ? `${filteredEntries.length} listed requests` : `${filteredEntries.length} طلبات ضمن العرض`}</Text>
          <Text style={[styles.summaryHint, align(isRTL)]}>{language === "en" ? "Any approved user can add a request; Operations supervisors update its details." : "يمكن لجميع المستخدمين المعتمدين إضافة طلب؛ وتحديث تفاصيله متاح لمشرفي العمليات."}</Text>
          {newEntriesCount > 0 ? <View style={[styles.newSummary, direction(isRTL)]}><MaterialIcons name="fiber-new" size={15} color="#FFD58A" /><Text style={[styles.newSummaryText, align(isRTL)]}>{language === "en" ? `${newEntriesCount} new request${newEntriesCount === 1 ? "" : "s"} need review` : `${newEntriesCount} ${newEntriesCount === 1 ? "طلب جديد يحتاج" : "طلبات جديدة تحتاج"} مراجعة`}</Text></View> : null}
        </View>
      </View>

      <View style={styles.filterPanel}>
        <View style={[styles.filterHeading, direction(isRTL)]}><MaterialIcons name="filter-list" size={18} color={palette.teal} /><Text style={[styles.filterTitle, align(isRTL)]}>{language === "en" ? "Filter waiting list" : "تصفية قائمة الانتظار"}</Text></View>
        <Text style={[styles.filterLabel, align(isRTL)]}>{language === "en" ? "Priority" : "الأولوية"}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterChoices, direction(isRTL)]}>{priorityOptions.map((item) => <FilterChoice key={item} label={item === "all" ? (language === "en" ? "All priorities" : "كل الأولويات") : opdPriorityLabel(item, language)} selected={priorityFilter === item} onPress={() => setPriorityFilter(item)} />)}</ScrollView>
        <Text style={[styles.filterLabel, align(isRTL)]}>{language === "en" ? "Status" : "الحالة"}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterChoices, direction(isRTL)]}>{statusOptions.map((item) => <FilterChoice key={item} label={item === "all" ? (language === "en" ? "All statuses" : "كل الحالات") : opdStatusLabel(item, language)} selected={statusFilter === item} onPress={() => setStatusFilter(item)} />)}</ScrollView>
      </View>

      <View style={[styles.exportPanel, direction(isRTL)]}>
        <View style={styles.flex}><Text style={[styles.exportTitle, align(isRTL)]}>{language === "en" ? "Download filtered list" : "تنزيل القائمة المفلترة"}</Text><Text style={[styles.exportHint, align(isRTL)]}>{language === "en" ? "The file saves directly to your selected Android folder." : "يُحفظ الملف مباشرة في المجلد الذي تختاره على جهاز Android."}</Text></View>
        <View style={[styles.exportActions, direction(isRTL)]}><Pressable accessibilityRole="button" accessibilityLabel={language === "en" ? "Download filtered OPD waiting list as PDF" : "تنزيل قائمة انتظار OPD المفلترة PDF"} onPress={() => exportList("pdf")} style={({ pressed }) => [styles.pdfExport, pressed && styles.pressed]}><MaterialIcons name="picture-as-pdf" size={20} color="#FFFFFF" /><Text style={styles.exportButtonText}>PDF</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={language === "en" ? "Download filtered OPD waiting list as Excel" : "تنزيل قائمة انتظار OPD المفلترة Excel"} onPress={() => exportList("xlsx")} style={({ pressed }) => [styles.excelExport, pressed && styles.pressed]}><MaterialIcons name="table-view" size={20} color="#FFFFFF" /><Text style={styles.exportButtonText}>Excel</Text></Pressable></View>
      </View>

      <View style={[styles.search, direction(isRTL)]}><MaterialIcons name="search" size={20} color={palette.teal} /><TextInput value={search} onChangeText={setSearch} placeholder={language === "en" ? "Search patient, MRN, diagnosis, or procedure" : "ابحث بالاسم أو رقم الملف أو التشخيص أو العملية"} placeholderTextColor="#7890A2" returnKeyType="search" style={[styles.searchInput, align(isRTL)]} textAlign={isRTL ? "right" : "left"} accessibilityLabel={language === "en" ? "Search OPD operation waiting list" : "البحث في قائمة انتظار عمليات العيادات"} />{search ? <Pressable onPress={() => setSearch("")} style={styles.clear}><MaterialIcons name="close" size={18} color={palette.navy} /></Pressable> : null}</View>

      <FlatList data={visibleEntries} keyExtractor={(item) => item.id} renderItem={renderEntry} contentContainerStyle={[visibleEntries.length ? styles.list : styles.empty, { paddingBottom: Math.max(28, insets.bottom + 16) }]} ListHeaderComponent={<SectionTitle title={language === "en" ? "Outpatient operation requests" : "طلبات عمليات العيادات"} action={search || priorityFilter !== "all" || statusFilter !== "all" ? (language === "en" ? `${visibleEntries.length} matches` : `${visibleEntries.length} نتائج`) : undefined} />} ListEmptyComponent={<EmptyState icon="event-busy" text={search || priorityFilter !== "all" || statusFilter !== "all" ? (language === "en" ? "No request matches the selected filters." : "لا يوجد طلب يطابق الفلاتر المحددة.") : (language === "en" ? "No OPD operation requests are listed yet." : "لا توجد طلبات عمليات عيادات مسجلة بعد.")} />} />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.shade}><ScrollView style={styles.sheet} contentContainerStyle={[styles.sheetContent, { paddingBottom: Math.max(35, insets.bottom + 20) }]}><View style={styles.handle} /><SectionTitle title={editingId ? (language === "en" ? "Update OPD request" : "تحديث طلب عملية العيادة") : (language === "en" ? "Add OPD operation request" : "إضافة طلب عملية عيادة")} /><Field label={language === "en" ? "Patient name" : "اسم المريض"} value={draft.patientName} onChangeText={(value) => setField("patientName", value)} isRTL={isRTL} /><Field label={language === "en" ? "Medical record no." : "رقم الملف"} value={draft.fileNumber} onChangeText={(value) => setField("fileNumber", value)} isRTL={isRTL} /><NeurosurgeryDiagnosisPicker label={language === "en" ? "Diagnosis" : "التشخيص"} value={draft.diagnosis} onChangeText={(value) => setField("diagnosis", value)} language={language} isRTL={isRTL} placeholder={language === "en" ? "Clinical diagnosis" : "التشخيص السريري"} multiline /><Text style={[styles.label, align(isRTL)]}>{language === "en" ? "Procedure type" : "نوع العملية"}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.procedureChoices, direction(isRTL)]}>{NEUROSURGERY_PROCEDURES.map((item) => <Pressable key={item.code} onPress={() => selectProcedure(item.code)} style={[styles.procedureChoice, draft.procedureCode === item.code && styles.procedureChoiceSelected]}><Text style={[styles.procedureText, draft.procedureCode === item.code && styles.procedureTextSelected]}>{language === "en" ? item.englishLabel : item.arabicLabel}</Text></Pressable>)}</ScrollView>{draft.procedureCode === "other" ? <Field label={language === "en" ? "Specify procedure" : "حدد الإجراء"} value={draft.procedure} onChangeText={(value) => setField("procedure", value)} isRTL={isRTL} /> : null}<Field label={language === "en" ? "Requesting clinician" : "الطبيب طالب العملية"} value={draft.requestedBy} onChangeText={(value) => setField("requestedBy", value)} isRTL={isRTL} /><Field label={language === "en" ? "Target date" : "الموعد المتوقع"} value={draft.plannedDate} onChangeText={(value) => setField("plannedDate", value)} isRTL={isRTL} /><Text style={[styles.label, align(isRTL)]}>{language === "en" ? "Priority" : "الأولوية"}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.choices, direction(isRTL)]}>{OPD_OPERATION_PRIORITIES.map((item) => <Choice key={item} label={opdPriorityLabel(item, language)} selected={draft.priority === item} onPress={() => setField("priority", item)} />)}</ScrollView><Text style={[styles.label, align(isRTL)]}>{language === "en" ? "Request status" : "حالة الطلب"}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.choices, direction(isRTL)]}>{OPD_OPERATION_STATUSES.map((item) => <Choice key={item} label={opdStatusLabel(item, language)} selected={draft.status === item} onPress={() => setField("status", item)} />)}</ScrollView><Field label={language === "en" ? "Notes" : "ملاحظات"} value={draft.notes} onChangeText={(value) => setField("notes", value)} isRTL={isRTL} multiline /><PrimaryButton label={editingId ? (language === "en" ? "Save updates" : "حفظ التحديثات") : (language === "en" ? "Add to waiting list" : "إضافة إلى قائمة الانتظار")} icon="save" onPress={save} /></ScrollView></View>
      </Modal>
    </View>
  );
}

function FilterChoice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.filterChoice, selected && styles.filterChoiceSelected]}><Text style={[styles.filterChoiceText, selected && styles.filterChoiceTextSelected]}>{label}</Text></Pressable>; }
function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}><Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text></Pressable>; }
function Field({ label, value, onChangeText, isRTL, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; isRTL: boolean; multiline?: boolean }) { return <View><Text style={[styles.label, align(isRTL)]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={label} placeholderTextColor="#9FB3C8" style={[styles.input, multiline && styles.multiInput, align(isRTL)]} textAlign={isRTL ? "right" : "left"} multiline={multiline} /></View>; }
function direction(isRTL: boolean) { return { flexDirection: isRTL ? "row-reverse" as const : "row" as const }; }
function align(isRTL: boolean) { return { writingDirection: isRTL ? "rtl" as const : "ltr" as const, textAlign: isRTL ? "right" as const : "left" as const }; }

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas, paddingHorizontal: 18 }, flex: { flex: 1 }, header: { paddingTop: 22, paddingBottom: 15, gap: 11, alignItems: "center" }, title: { color: palette.ink, fontSize: 20, fontWeight: "900" }, subtitle: { color: palette.muted, fontSize: 11, marginTop: 3 }, add: { height: 43, width: 43, borderRadius: 14, backgroundColor: palette.navy, alignItems: "center", justifyContent: "center" }, summary: { backgroundColor: palette.navy, borderRadius: 16, padding: 14, gap: 10, alignItems: "center" }, summaryIcon: { height: 39, width: 39, borderRadius: 12, backgroundColor: "#FFFFFF2B", alignItems: "center", justifyContent: "center" },   summaryTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, newSummary: { alignSelf: "stretch", minHeight: 28, marginTop: 8, paddingHorizontal: 9, borderRadius: 9, backgroundColor: "#FFFFFF24", alignItems: "center", gap: 6 }, newSummaryText: { color: "#FFD58A", fontSize: 10, fontWeight: "900", flex: 1 }, summaryHint: { color: "#D8EEF9", fontSize: 10, lineHeight: 15, marginTop: 3 }, filterPanel: { marginTop: 12, backgroundColor: "#FFFFFF", borderColor: "#BDE5DB", borderWidth: 1, borderRadius: 15, padding: 12 }, filterHeading: { alignItems: "center", gap: 7 }, filterTitle: { color: palette.teal, fontSize: 12, fontWeight: "900", flex: 1 }, filterLabel: { color: palette.ink, fontSize: 10, fontWeight: "800", marginTop: 9, marginBottom: 5 }, filterChoices: { gap: 7, paddingBottom: 2 }, filterChoice: { minHeight: 35, justifyContent: "center", paddingHorizontal: 10, borderRadius: 10, backgroundColor: "#F2F7F7", borderWidth: 1, borderColor: palette.line }, filterChoiceSelected: { backgroundColor: palette.teal, borderColor: palette.teal }, filterChoiceText: { color: palette.muted, fontSize: 10, fontWeight: "800" }, filterChoiceTextSelected: { color: "#FFFFFF" }, exportPanel: { marginTop: 10, backgroundColor: "#FFFFFF", borderColor: "#C9DBE8", borderWidth: 1, borderRadius: 15, padding: 12, gap: 10, alignItems: "center" }, exportTitle: { color: palette.navy, fontSize: 12, fontWeight: "900" }, exportHint: { color: palette.muted, fontSize: 9, lineHeight: 14, marginTop: 2 }, exportActions: { gap: 7 }, pdfExport: { minHeight: 46, minWidth: 76, borderRadius: 12, backgroundColor: "#C2413A", alignItems: "center", justifyContent: "center", gap: 3, paddingHorizontal: 9 }, excelExport: { minHeight: 46, minWidth: 76, borderRadius: 12, backgroundColor: "#107C41", alignItems: "center", justifyContent: "center", gap: 3, paddingHorizontal: 9 }, exportButtonText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" }, search: { minHeight: 48, marginTop: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#BDE5DB", borderRadius: 14, paddingHorizontal: 12, alignItems: "center", gap: 8 }, searchInput: { flex: 1, minHeight: 46, color: palette.ink, fontSize: 12 }, clear: { height: 28, width: 28, borderRadius: 9, backgroundColor: palette.paleBlue, alignItems: "center", justifyContent: "center" }, list: { gap: 10, paddingTop: 4, paddingBottom: 28 }, empty: { flexGrow: 1, paddingBottom: 55 },   entry: { padding: 14 }, newEntry: { borderColor: "#E6A23C", borderWidth: 1.5, backgroundColor: "#FFFBF2" }, newBanner: { alignSelf: "stretch", minHeight: 30, marginBottom: 10, paddingHorizontal: 9, borderRadius: 9, backgroundColor: "#FFF0D2", alignItems: "center", gap: 6 }, newBannerText: { color: "#8A4B08", fontSize: 10, fontWeight: "900", flex: 1 }, entryHead: { gap: 9, alignItems: "center" }, entryIcon: { height: 36, width: 36, borderRadius: 11, backgroundColor: palette.paleTeal, alignItems: "center", justifyContent: "center" }, patientName: { color: palette.ink, fontSize: 14, fontWeight: "900" }, meta: { color: palette.teal, fontSize: 10, fontWeight: "800", marginTop: 2 }, divider: { height: 1, backgroundColor: palette.line, marginVertical: 10 }, procedure: { color: palette.navy, fontSize: 13, fontWeight: "900" }, detail: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }, infoRow: { justifyContent: "space-between", alignItems: "center", marginTop: 9, gap: 9 }, priority: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: palette.paleBlue, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 }, urgent: { backgroundColor: "#FDECEC" }, priorityText: { color: palette.navy, fontSize: 10, fontWeight: "900" }, notes: { color: "#765016", fontSize: 11, lineHeight: 16, backgroundColor: "#FFF8E9", padding: 9, borderRadius: 10, marginTop: 9 }, actions: { gap: 8, marginTop: 12 }, openRecord: { flex: 1, minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: palette.paleTeal, borderRadius: 11 }, openRecordText: { color: palette.teal, fontSize: 11, fontWeight: "900" }, edit: { flex: 1, minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: palette.paleBlue, borderRadius: 11 }, editText: { color: palette.navy, fontSize: 11, fontWeight: "900" }, shade: { flex: 1, justifyContent: "flex-end", backgroundColor: "#0B34435C" }, sheet: { maxHeight: "92%", backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28 }, sheetContent: { padding: 20, paddingBottom: 35 }, handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: palette.line }, label: { color: palette.ink, fontSize: 12, fontWeight: "800", marginTop: 11, marginBottom: 6 }, input: { minHeight: 47, borderRadius: 13, borderWidth: 1, borderColor: palette.line, color: palette.ink, paddingHorizontal: 12, backgroundColor: "#FCFEFE" }, multiInput: { minHeight: 76, paddingTop: 10, textAlignVertical: "top" }, procedureChoices: { gap: 7, paddingBottom: 4 }, procedureChoice: { maxWidth: 190, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 11, borderWidth: 1, borderColor: palette.line, backgroundColor: "#FFFFFF" }, procedureChoiceSelected: { backgroundColor: palette.paleTeal, borderColor: palette.teal }, procedureText: { color: palette.ink, fontSize: 10, fontWeight: "800" }, procedureTextSelected: { color: palette.teal }, choices: { gap: 7, paddingBottom: 4 }, choice: { minHeight: 38, justifyContent: "center", paddingHorizontal: 11, borderRadius: 11, borderWidth: 1, borderColor: palette.line, backgroundColor: "#FFFFFF" }, choiceSelected: { backgroundColor: palette.navy, borderColor: palette.navy }, choiceText: { color: palette.ink, fontSize: 10, fontWeight: "800" }, choiceTextSelected: { color: "#FFFFFF" }, pressed: { opacity: 0.72 },
});
