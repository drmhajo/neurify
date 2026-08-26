import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";
import { AppCard, palette, SectionTitle, StatusPill } from "@/components/neuro-ui";
import type { Surgery } from "@/lib/department-model";

export function PatientScheduledOperations({ operations, isRTL, language }: { operations: Surgery[]; isRTL: boolean; language: "ar" | "en" }) {
  return <View>
    <SectionTitle title={language === "en" ? "Scheduled operations" : "العمليات الجراحية المجدولة"} />
    {operations.length ? operations.map((operation) => <AppCard key={operation.id} style={styles.card}><View style={[styles.head, { flexDirection: isRTL ? "row-reverse" : "row" }]}><View><Text style={[styles.time, align(isRTL)]}>{operation.time}</Text><View style={[styles.dateLine, { flexDirection: isRTL ? "row-reverse" : "row" }]}><MaterialIcons name="event" size={13} color={palette.teal} /><Text style={styles.date}>{operation.date}</Text></View></View><StatusPill label={operation.status} tone={operation.status === "مؤكد" ? "teal" : operation.status === "قيد التحضير" ? "blue" : "gold"} /></View><Text style={[styles.title, align(isRTL)]}>{operation.procedure}</Text><Text style={[styles.meta, align(isRTL)]}>{language === "en" ? `${operation.surgeon} · ${operation.room}` : `${operation.surgeon} · ${operation.room}`}</Text>{operation.notes ? <View style={[styles.notes, { flexDirection: isRTL ? "row-reverse" : "row" }]}><MaterialIcons name="sticky-note-2" size={16} color={palette.gold} /><Text style={[styles.notesText, align(isRTL)]}>{operation.notes}</Text></View> : null}</AppCard>) : <AppCard style={styles.emptyCard}><MaterialIcons name="event-available" size={22} color={palette.muted} /><Text style={[styles.emptyText, align(isRTL)]}>{language === "en" ? "No scheduled operations are linked to this medical record." : "لا توجد عمليات جراحية مجدولة مرتبطة بهذا الملف الطبي."}</Text></AppCard>}
  </View>;
}

function align(isRTL: boolean) { return { writingDirection: isRTL ? "rtl" as const : "ltr" as const, textAlign: isRTL ? "right" as const : "left" as const }; }

const styles = StyleSheet.create({ card: { marginTop: 10, padding: 14, borderColor: "#C8E3E7" }, head: { justifyContent: "space-between", alignItems: "center" }, time: { color: palette.navy, fontSize: 21, fontWeight: "900" }, dateLine: { gap: 4, alignItems: "center", marginTop: 2 }, date: { color: palette.teal, fontSize: 10, fontWeight: "700" }, title: { color: palette.ink, fontSize: 14, fontWeight: "900", marginTop: 10 }, meta: { color: palette.muted, fontSize: 11, marginTop: 4 }, notes: { gap: 7, alignItems: "flex-start", backgroundColor: "#FFF8E9", borderRadius: 10, padding: 9, marginTop: 10 }, notesText: { color: "#765016", flex: 1, fontSize: 11, lineHeight: 16 }, emptyCard: { marginTop: 10, alignItems: "center", gap: 8, backgroundColor: "#F8FBFB" }, emptyText: { color: palette.muted, fontSize: 12 } });
