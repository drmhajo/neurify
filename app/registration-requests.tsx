import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { AppCard, EmptyState, IconAction, palette, PrimaryButton, StatusPill } from "@/components/neuro-ui";
import { RequireSession } from "@/components/require-session";
import { useDepartment } from "@/lib/department-store";
import { useAppLanguage } from "@/lib/language";
import { createTRPCClient } from "@/lib/trpc";
import { formatRiyadhDate } from "@/lib/riyadh-time";

type RegistrationRequestItem = { id: string; name: string; email: string; phone: string; jobTitle: string; status: "pending" | "approved" | "rejected"; createdAt: Date | string };

export default function RegistrationRequestsScreen() {
  return <RequireSession><RegistrationRequestsContent /></RequireSession>;
}

function RegistrationRequestsContent() {
  const { data, session, importApprovedRegistration } = useDepartment();
  const { language, isRTL } = useAppLanguage();
  const currentUser = data.users.find((user) => user.id === session?.userId);
  const allowed = Boolean(currentUser?.active && (currentUser.role === "admin" || currentUser.permissions.includes("approve_registration_requests")));
  const trpcClient = useMemo(() => createTRPCClient(), []);
  const [approvalSecret, setApprovalSecret] = useState("");
  const [requests, setRequests] = useState<RegistrationRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadRequests = async () => {
    if (approvalSecret.trim().length < 16) {
      Alert.alert(language === "en" ? "Approval code required" : "رمز الاعتماد مطلوب", language === "en" ? "Enter the central approval code before loading requests." : "أدخل رمز الاعتماد المركزي قبل عرض الطلبات.");
      return;
    }
    setLoading(true);
    try {
      const results = await trpcClient.registrations.list.query({ approvalSecret: approvalSecret.trim() });
      setRequests((results as RegistrationRequestItem[]).filter((item) => item.status === "pending"));
    } catch {
      Alert.alert(language === "en" ? "Requests unavailable" : "تعذر جلب الطلبات", language === "en" ? "The code was not accepted or the central service is unavailable." : "لم يُقبل الرمز أو أن الخدمة المركزية غير متاحة.");
    } finally {
      setLoading(false);
    }
  };

  const actOnRequest = (request: RegistrationRequestItem, action: "approve" | "reject") => {
    const approving = action === "approve";
    Alert.alert(
      approving ? (language === "en" ? "Approve account" : "اعتماد الحساب") : (language === "en" ? "Reject request" : "رفض الطلب"),
      approving ? (language === "en" ? `${request.name} will be able to sign in immediately.` : `سيتمكن ${request.name} من تسجيل الدخول فورًا.`) : (language === "en" ? `${request.name} will not be able to use the account.` : `لن يتمكن ${request.name} من استخدام الحساب.`),
      [
        { text: language === "en" ? "Cancel" : "إلغاء", style: "cancel" },
        { text: approving ? (language === "en" ? "Approve" : "اعتماد") : (language === "en" ? "Reject" : "رفض"), style: approving ? "default" : "destructive", onPress: () => { void submitAction(request, action); } },
      ],
    );
  };

  const submitAction = async (request: RegistrationRequestItem, action: "approve" | "reject") => {
    if (!session) return;
    setActingId(request.id);
    try {
      if (action === "approve") {
        const account = await trpcClient.registrations.approve.mutate({ id: request.id, approvedBy: session.name, approvalSecret: approvalSecret.trim() });
        importApprovedRegistration(account);
      } else {
        await trpcClient.registrations.reject.mutate({ id: request.id, rejectedBy: session.name, approvalSecret: approvalSecret.trim() });
      }
      setRequests((current) => current.filter((item) => item.id !== request.id));
    } catch {
      Alert.alert(language === "en" ? "Action not completed" : "لم يكتمل الإجراء", language === "en" ? "Check the approval code and your network connection, then try again." : "تحقق من رمز الاعتماد واتصال الشبكة ثم حاول مرة أخرى.");
    } finally {
      setActingId(null);
    }
  };

  if (!allowed) return <View style={styles.denied}><MaterialIcons name="lock" size={34} color={palette.muted} /><Text style={[styles.deniedTitle, align(isRTL)]}>{language === "en" ? "Approval permission required" : "صلاحية اعتماد الطلبات مطلوبة"}</Text><Text style={[styles.deniedText, align(isRTL)]}>{language === "en" ? "Only administrators and authorized approvers can review central registration requests." : "تتاح مراجعة طلبات التسجيل المركزية للمشرفين والمفوّضين بالموافقة فقط."}</Text></View>;

  return <View style={styles.page}><View style={[styles.header, { flexDirection: isRTL ? "row" : "row-reverse" }]}><IconAction icon={isRTL ? "arrow-forward" : "arrow-back"} label={language === "en" ? "Back" : "رجوع"} onPress={() => router.back()} /><View style={styles.headerCopy}><Text style={[styles.title, align(isRTL)]}>{language === "en" ? "Pending registrations" : "طلبات التسجيل المعلقة"}</Text><Text style={[styles.subtitle, align(isRTL)]}>{language === "en" ? "Central requests awaiting a decision" : "طلبات مركزية تنتظر قرار الاعتماد"}</Text></View></View><View style={styles.notice}><MaterialIcons name="privacy-tip" size={20} color={palette.teal} /><Text style={[styles.noticeText, align(isRTL)]}>{language === "en" ? "This page contains registration details only. Do not enter clinical or patient information." : "تحتوي هذه الصفحة على بيانات التسجيل فقط. لا تدخل معلومات سريرية أو بيانات مرضى."}</Text></View><Text style={[styles.label, align(isRTL)]}>{language === "en" ? "Central approval code" : "رمز الاعتماد المركزي"}</Text><TextInput value={approvalSecret} onChangeText={setApprovalSecret} placeholder={language === "en" ? "Enter approval code" : "أدخل رمز الاعتماد"} placeholderTextColor="#9FB3C8" secureTextEntry textAlign={isRTL ? "right" : "left"} style={[styles.codeInput, { writingDirection: isRTL ? "rtl" : "ltr" }]} /><PrimaryButton label={loading ? (language === "en" ? "Loading…" : "جارٍ التحميل...") : (language === "en" ? "Load pending requests" : "عرض الطلبات المعلقة")} icon="refresh" onPress={() => { void loadRequests(); }} disabled={loading} /><View style={[styles.listHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}><Text style={[styles.count, align(isRTL)]}>{language === "en" ? `${requests.length} pending` : `${requests.length} طلب معلّق`}</Text><MaterialIcons name="how-to-reg" size={20} color={palette.navy} /></View><FlatList data={requests} keyExtractor={(item) => item.id} contentContainerStyle={requests.length ? styles.list : styles.empty} ListEmptyComponent={<EmptyState icon="how-to-reg" text={language === "en" ? "Enter the approval code and load pending requests." : "أدخل رمز الاعتماد ثم اعرض طلبات التسجيل المعلقة."} />} renderItem={({ item }) => <AppCard style={styles.card}><View style={[styles.cardHead, { flexDirection: isRTL ? "row-reverse" : "row" }]}><View style={styles.cardCopy}><Text style={[styles.name, align(isRTL)]}>{item.name}</Text><Text style={[styles.jobTitle, align(isRTL)]}>{item.jobTitle}</Text></View><StatusPill label={language === "en" ? "Pending" : "بانتظار الموافقة"} tone="gold" /></View><Text style={[styles.detail, align(isRTL)]}>{item.email}</Text><Text style={[styles.detail, align(isRTL)]}>{item.phone}</Text><Text style={[styles.date, align(isRTL)]}>{language === "en" ? `Requested ${formatRiyadhDate(item.createdAt, "en")}` : `تاريخ الطلب ${formatRiyadhDate(item.createdAt, "ar")}`}</Text><View style={[styles.actions, { flexDirection: isRTL ? "row-reverse" : "row" }]}><Pressable onPress={() => actOnRequest(item, "approve")} disabled={actingId !== null} style={({ pressed }) => [styles.approve, (pressed || actingId !== null) && styles.disabled]}><MaterialIcons name="verified-user" size={18} color="#FFFFFF" /><Text style={styles.approveText}>{actingId === item.id ? (language === "en" ? "Working…" : "جارٍ التنفيذ...") : (language === "en" ? "Approve" : "موافقة")}</Text></Pressable><Pressable onPress={() => actOnRequest(item, "reject")} disabled={actingId !== null} style={({ pressed }) => [styles.reject, (pressed || actingId !== null) && styles.disabled]}><MaterialIcons name="person-off" size={18} color="#B42318" /><Text style={styles.rejectText}>{language === "en" ? "Reject" : "رفض"}</Text></Pressable></View></AppCard>} /></View>;
}

function align(isRTL: boolean) { return { writingDirection: isRTL ? "rtl" as const : "ltr" as const, textAlign: isRTL ? "right" as const : "left" as const }; }

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas, paddingHorizontal: 18 }, header: { paddingTop: 20, paddingBottom: 14, alignItems: "center", gap: 12 }, headerCopy: { flex: 1 }, title: { color: palette.ink, fontSize: 20, fontWeight: "900" }, subtitle: { color: palette.muted, fontSize: 11, marginTop: 4 }, notice: { flexDirection: "row-reverse", gap: 8, alignItems: "flex-start", padding: 12, backgroundColor: palette.paleTeal, borderRadius: 14, marginBottom: 13 }, noticeText: { flex: 1, color: palette.teal, fontSize: 11, lineHeight: 17 }, label: { color: palette.ink, fontSize: 12, fontWeight: "800", marginBottom: 6 }, codeInput: { minHeight: 47, borderWidth: 1, borderColor: palette.line, borderRadius: 13, paddingHorizontal: 12, color: palette.ink, backgroundColor: "#FFFFFF", marginBottom: 10 }, listHeader: { alignItems: "center", justifyContent: "space-between", marginTop: 16, marginBottom: 8 }, count: { color: palette.navy, fontSize: 12, fontWeight: "900" }, list: { gap: 10, paddingBottom: 28 }, empty: { flexGrow: 1, justifyContent: "center", paddingBottom: 80 }, card: { padding: 14 }, cardHead: { alignItems: "flex-start", justifyContent: "space-between", gap: 8 }, cardCopy: { flex: 1 }, name: { color: palette.ink, fontSize: 15, fontWeight: "900" }, jobTitle: { color: palette.teal, fontSize: 11, fontWeight: "700", marginTop: 3 }, detail: { color: palette.muted, fontSize: 11, marginTop: 6 }, date: { color: palette.muted, fontSize: 10, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: palette.line }, actions: { gap: 8, marginTop: 12 }, approve: { flex: 1, minHeight: 43, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row-reverse", gap: 6, backgroundColor: palette.teal }, approveText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, reject: { flex: 1, minHeight: 43, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row-reverse", gap: 6, backgroundColor: "#FFF1F0", borderWidth: 1, borderColor: "#F2B8B5" }, rejectText: { color: "#B42318", fontSize: 12, fontWeight: "900" }, disabled: { opacity: 0.58 }, denied: { flex: 1, backgroundColor: palette.canvas, alignItems: "center", justifyContent: "center", padding: 36, gap: 11 }, deniedTitle: { color: palette.ink, fontSize: 18, fontWeight: "900" }, deniedText: { color: palette.muted, fontSize: 13, lineHeight: 20 },
});
