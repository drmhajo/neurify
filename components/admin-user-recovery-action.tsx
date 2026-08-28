import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SectionTitle, palette } from "@/components/neuro-ui";
import type { DepartmentUser } from "@/lib/department-model";

type Props = {
  visible: boolean;
  users: DepartmentUser[];
  currentUserId?: string;
  resetPassword: (userId: string, approvalSecret?: string) => Promise<{ ok: boolean; temporaryPassword?: string; message?: string }>;
  removeUser: (userId: string) => Promise<boolean>;
  isRTL: boolean;
  language: "ar" | "en";
};

const align = (isRTL: boolean) => ({ writingDirection: isRTL ? "rtl" as const : "ltr" as const, textAlign: isRTL ? "right" as const : "left" as const });

export function AdminUserRecoveryAction({ visible, users, currentUserId, resetPassword, removeUser, isRTL, language }: Props) {
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approvalSecret, setApprovalSecret] = useState("");
  if (!visible) return null;

  const reset = async (user: DepartmentUser) => {
    const central = user.id.startsWith("remote-");
    if (central && !approvalSecret.trim()) {
      Alert.alert(language === "en" ? "Approval code required" : "رمز الاعتماد مطلوب", language === "en" ? "Enter the central approval code before resetting a central account." : "أدخل رمز الاعتماد المركزي قبل استعادة حساب مركزي.");
      return;
    }
    setBusyId(user.id);
    const result = await resetPassword(user.id, central ? approvalSecret.trim() : undefined);
    setBusyId(null);
    if (!result.ok) {
      Alert.alert(language === "en" ? "Password reset blocked" : "تم رفض استعادة كلمة المرور", result.message ?? (language === "en" ? "Only an active department administrator can reset this account." : "يمكن لمشرف القسم النشط فقط استعادة هذا الحساب."));
      return;
    }
    Alert.alert(language === "en" ? "Temporary password issued" : "تم إصدار كلمة مرور مؤقتة", language === "en" ? `Give this temporary password to ${user.name} through an approved channel: ${result.temporaryPassword}. The user must change it after sign-in.` : `سلّم كلمة المرور المؤقتة للمستخدم ${user.name} عبر قناة معتمدة: ${result.temporaryPassword}. ويجب عليه تغييرها بعد تسجيل الدخول.`);
  };

  const confirmRemove = (user: DepartmentUser) => Alert.alert(language === "en" ? "Remove this user?" : "إزالة هذا المستخدم؟", language === "en" ? `${user.name} will be removed from every assigned team. This does not delete clinical records.` : `سيُزال ${user.name} من جميع الفرق المسندة. لا تُحذف السجلات السريرية.`, [{ text: language === "en" ? "Cancel" : "إلغاء", style: "cancel" }, { text: language === "en" ? "Remove user" : "إزالة المستخدم", style: "destructive", onPress: () => { void (async () => { setBusyId(user.id); const removed = await removeUser(user.id); setBusyId(null); Alert.alert(removed ? (language === "en" ? "User removed" : "تمت إزالة المستخدم") : (language === "en" ? "Removal blocked" : "تم رفض الإزالة"), removed ? (language === "en" ? "The user has been removed from the user list and care teams." : "تمت إزالة المستخدم من القائمة والفرق العلاجية.") : (language === "en" ? "You cannot remove yourself or the final active administrator." : "لا يمكنك إزالة حسابك الحالي أو آخر مشرف نشط.")); })(); } }]);

  return <><Pressable onPress={() => setOpen(true)} style={[styles.floating, isRTL ? { right: 18 } : { left: 18 }]} accessibilityLabel={language === "en" ? "Account recovery and user removal" : "استعادة الحسابات وإزالة المستخدمين"}><MaterialIcons name="manage-accounts" size={23} color="#FFFFFF" /></Pressable><Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}><View style={styles.shade}><ScrollView style={styles.sheet} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.handle} /><SectionTitle title={language === "en" ? "Account recovery" : "استعادة الحسابات"} /><View style={[styles.notice, { flexDirection: isRTL ? "row-reverse" : "row" }]}><MaterialIcons name="verified-user" size={20} color={palette.navy} /><Text style={[styles.noticeText, align(isRTL)]}>{language === "en" ? "Verify identity through your approved department process before issuing a temporary password. Central accounts require the approval code and it is never saved on this device." : "تحقق من الهوية عبر الإجراء المعتمد في القسم قبل إصدار كلمة مرور مؤقتة. تتطلب الحسابات المركزية رمز الاعتماد ولا يُحفظ الرمز على هذا الجهاز."}</Text></View><Text style={[styles.secretLabel, align(isRTL)]}>{language === "en" ? "Central approval code" : "رمز الاعتماد المركزي"}</Text><TextInput value={approvalSecret} onChangeText={setApprovalSecret} secureTextEntry placeholder={language === "en" ? "Required for central accounts" : "مطلوب للحسابات المركزية"} placeholderTextColor="#90A4B6" style={[styles.secretInput, align(isRTL)]} textAlign={isRTL ? "right" : "left"} autoCapitalize="none" autoCorrect={false} />{users.filter((user) => user.active).map((user) => { const central = user.id.startsWith("remote-"); return <View key={user.id} style={styles.userCard}><View style={[styles.userHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}><View style={styles.avatar}><Text style={styles.avatarText}>{user.name.slice(0, 1)}</Text></View><View style={styles.userCopy}><Text style={[styles.userName, align(isRTL)]}>{user.name}</Text><Text style={[styles.username, align(isRTL)]}>@{user.username}</Text>{central ? <Text style={[styles.centralFlag, align(isRTL)]}>{language === "en" ? "Central account" : "حساب مركزي"}</Text> : null}{user.passwordRecoveryRequired ? <Text style={[styles.recoveryFlag, align(isRTL)]}>{language === "en" ? "Password update required" : "يلزم تغيير كلمة المرور"}</Text> : null}</View></View><View style={[styles.actions, { flexDirection: isRTL ? "row-reverse" : "row" }]}><Pressable disabled={busyId === user.id || (central && !approvalSecret.trim())} onPress={() => { void reset(user); }} style={({ pressed }) => [styles.resetButton, (busyId === user.id || (central && !approvalSecret.trim())) && styles.disabled, pressed && busyId !== user.id && { opacity: 0.76 }]}><MaterialIcons name="vpn-key" size={17} color={palette.navy} /><Text style={styles.resetText}>{busyId === user.id ? (language === "en" ? "Working…" : "جارٍ التنفيذ…") : (language === "en" ? "Reset password" : "استعادة كلمة المرور")}</Text></Pressable><Pressable disabled={user.id === currentUserId || busyId === user.id} onPress={() => confirmRemove(user)} style={({ pressed }) => [styles.removeButton, (user.id === currentUserId || busyId === user.id) && styles.disabled, pressed && user.id !== currentUserId && busyId !== user.id && { opacity: 0.76 }]}><MaterialIcons name="person-remove" size={17} color="#B42318" /><Text style={styles.removeText}>{language === "en" ? "Remove" : "إزالة"}</Text></Pressable></View></View>; })}</ScrollView></View></Modal></>;
}

const styles = StyleSheet.create({
  floating: { position: "absolute", bottom: 86, width: 52, height: 52, borderRadius: 17, backgroundColor: palette.gold, alignItems: "center", justifyContent: "center", shadowColor: palette.gold, shadowOpacity: 0.24, shadowRadius: 10, elevation: 4 }, shade: { flex: 1, justifyContent: "flex-end", backgroundColor: "#102A4370" }, sheet: { maxHeight: "91%", backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28 }, content: { padding: 20, paddingBottom: 38 }, handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: palette.line, marginBottom: 3 }, notice: { gap: 9, alignItems: "flex-start", backgroundColor: palette.paleBlue, borderRadius: 14, padding: 12, marginTop: 10, marginBottom: 12 }, noticeText: { flex: 1, color: palette.navy, fontSize: 11, lineHeight: 17 }, secretLabel: { color: palette.ink, fontSize: 11, fontWeight: "900", marginBottom: 6 }, secretInput: { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: palette.line, color: palette.ink, paddingHorizontal: 11, marginBottom: 14, fontSize: 13 }, userCard: { borderWidth: 1, borderColor: palette.line, borderRadius: 16, padding: 12, marginBottom: 10, backgroundColor: "#FFFFFF" }, userHeader: { alignItems: "center", gap: 10 }, avatar: { width: 38, height: 38, borderRadius: 13, backgroundColor: palette.navy, alignItems: "center", justifyContent: "center" }, avatarText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" }, userCopy: { flex: 1 }, userName: { color: palette.ink, fontSize: 13, fontWeight: "900" }, username: { color: palette.muted, fontSize: 10, marginTop: 2 }, centralFlag: { color: palette.teal, fontSize: 10, marginTop: 4, fontWeight: "800" }, recoveryFlag: { color: palette.gold, fontSize: 10, marginTop: 4, fontWeight: "800" }, actions: { gap: 8, marginTop: 12 }, resetButton: { flex: 1, minHeight: 39, borderRadius: 11, backgroundColor: palette.paleBlue, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 }, resetText: { color: palette.navy, fontSize: 10, fontWeight: "900" }, removeButton: { minHeight: 39, paddingHorizontal: 12, borderRadius: 11, backgroundColor: "#FFF1F1", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 5 }, removeText: { color: "#B42318", fontSize: 10, fontWeight: "900" }, disabled: { opacity: 0.42 },
});
