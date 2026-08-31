import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppCard, palette, SectionTitle, StatusPill } from "@/components/neuro-ui";
import type { Surgery } from "@/lib/department-model";
import { useDepartment } from "@/lib/department-store";
import { MedicalReportDraftAction } from "@/components/medical-report-draft-action";
import { useLocalSearchParams } from "expo-router";

type SurgeryStatus = Surgery["status"];
const statuses: SurgeryStatus[] = ["مؤكد", "قيد التحضير", "بانتظار مراجعة"];

export function PatientScheduledOperations({ operations, isRTL, language }: { operations: Surgery[]; isRTL: boolean; language: "ar" | "en" }) {
  const { data, session, updateSurgery } = useDepartment();
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const patient = data.teams.flatMap((team) => team.cases).find((item) => item.id === caseId);
  const currentUser = data.users.find((user) => user.id === session?.userId);
  const canUpdateStatus = Boolean(session?.role === "admin" || currentUser?.permissions.includes("manage_schedules"));
  const updateStatus = (operation: Surgery, status: SurgeryStatus) => updateSurgery(operation.id, { ...operation, status });

  return <View>
    {patient ? <MedicalReportDraftAction patient={patient} session={session} language={language} isRTL={isRTL} /> : null}
    <SectionTitle title={language === "en" ? "Scheduled operations" : "العمليات الجراحية المجدولة"} />
    {operations.length ? operations.map((operation) => <AppCard key={operation.id} style={styles.card}><View style={[styles.head, direction(isRTL)]}><View><Text style={[styles.time, align(isRTL)]}>{operation.time}</Text><View style={[styles.dateLine, direction(isRTL)]}><MaterialIcons name="event" size={13} color={palette.teal} /><Text style={styles.date}>{operation.date}</Text></View></View><StatusPill label={statusLabel(operation.status, language)} tone={statusTone(operation.status)} /></View><Text style={[styles.title, align(isRTL)]}>{operation.procedure}</Text><Text style={[styles.meta, align(isRTL)]}>{operation.surgeon} · {operation.room}</Text>{operation.notes ? <View style={[styles.notes, direction(isRTL)]}><MaterialIcons name="sticky-note-2" size={16} color={palette.gold} /><Text style={[styles.notesText, align(isRTL)]}>{operation.notes}</Text></View> : null}{canUpdateStatus ? <View style={styles.statusControl}><Text style={[styles.statusControlTitle, align(isRTL)]}>{language === "en" ? "Update operation status" : "تحديث حالة العملية"}</Text><View style={[styles.statusChoices, direction(isRTL)]}>{statuses.map((status) => <Pressable key={status} onPress={() => updateStatus(operation, status)} style={({ pressed }) => [styles.statusChoice, operation.status === status && styles.statusChoiceActive, pressed && styles.pressed]} accessibilityLabel={language === "en" ? `Set status to ${statusLabel(status, language)}` : `تعيين الحالة إلى ${statusLabel(status, language)}`}><Text style={[styles.statusChoiceText, operation.status === status && styles.statusChoiceTextActive]}>{statusLabel(status, language)}</Text></Pressable>)}</View></View> : null}</AppCard>) : <AppCard style={styles.emptyCard}><MaterialIcons name="event-available" size={22} color={palette.muted} /><Text style={[styles.emptyText, align(isRTL)]}>{language === "en" ? "No scheduled operations are linked to this medical record." : "لا توجد عمليات جراحية مجدولة مرتبطة بهذا الملف الطبي."}</Text></AppCard>}
  </View>;
}

function statusLabel(status: SurgeryStatus, language: "ar" | "en") { if (language === "ar") return status; return status === "مؤكد" ? "Confirmed" : status === "قيد التحضير" ? "Preparing" : "Awaiting review"; }
function statusTone(status: SurgeryStatus) { return status === "مؤكد" ? "teal" as const : status === "قيد التحضير" ? "blue" as const : "gold" as const; }
function direction(isRTL: boolean) { return { flexDirection: isRTL ? "row-reverse" as const : "row" as const }; }
function align(isRTL: boolean) { return { writingDirection: isRTL ? "rtl" as const : "ltr" as const, textAlign: isRTL ? "right" as const : "left" as const }; }

const styles = StyleSheet.create({ card: { marginTop: 10, padding: 14, borderColor: "#C8E3E7" }, head: { justifyContent: "space-between", alignItems: "center" }, time: { color: palette.navy, fontSize: 21, fontWeight: "900" }, dateLine: { gap: 4, alignItems: "center", marginTop: 2 }, date: { color: palette.teal, fontSize: 10, fontWeight: "700" }, title: { color: palette.ink, fontSize: 14, fontWeight: "900", marginTop: 10 }, meta: { color: palette.muted, fontSize: 11, marginTop: 4 }, notes: { gap: 7, alignItems: "flex-start", backgroundColor: "#FFF8E9", borderRadius: 10, padding: 9, marginTop: 10 }, notesText: { color: "#765016", flex: 1, fontSize: 11, lineHeight: 16 }, statusControl: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: palette.line }, statusControlTitle: { color: palette.navy, fontSize: 11, fontWeight: "900", marginBottom: 7 }, statusChoices: { gap: 6 }, statusChoice: { flex: 1, minHeight: 34, borderRadius: 10, justifyContent: "center", alignItems: "center", paddingHorizontal: 4, backgroundColor: "#F0F6F6", borderWidth: 1, borderColor: palette.line }, statusChoiceActive: { backgroundColor: palette.navy, borderColor: palette.navy }, statusChoiceText: { color: palette.muted, fontSize: 9, fontWeight: "800", textAlign: "center" }, statusChoiceTextActive: { color: "#FFFFFF" }, pressed: { opacity: 0.72 }, emptyCard: { marginTop: 10, alignItems: "center", gap: 8, backgroundColor: "#F8FBFB" }, emptyText: { color: palette.muted, fontSize: 12 } });
