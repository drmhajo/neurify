import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AppCard, EmptyState, IconAction, palette, PrimaryButton } from "@/components/neuro-ui";
import { GENERAL_ANNOUNCEMENT_LIMITS } from "@/lib/general-announcement";
import { useDepartment } from "@/lib/department-store";
import { useAppLanguage } from "@/lib/language";

const align = (isRTL: boolean) => ({ writingDirection: isRTL ? "rtl" as const : "ltr" as const, textAlign: isRTL ? "right" as const : "left" as const });

export default function GeneralAnnouncementScreen() {
  const { data, session, sendGeneralAnnouncement } = useDepartment();
  const { language, isRTL } = useAppLanguage();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const user = data.users.find((item) => item.id === session?.userId);
  const allowed = Boolean(user?.active && user.permissions.includes("send_general_announcement"));
  const recipientCount = data.users.filter((item) => item.active).length;
  const label = language === "en" ? "General announcement" : "إشعار عام";

  const publish = () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert(language === "en" ? "Missing information" : "بيانات ناقصة", language === "en" ? "Enter an announcement title and message." : "أدخل عنوان الإشعار ونص الرسالة.");
      return;
    }
    Alert.alert(language === "en" ? "Send department-wide announcement?" : "إرسال إشعار عام للقسم؟", language === "en" ? `This will appear in the notification inbox for ${recipientCount} active users and be pushed to their registered devices.` : `سيظهر هذا التنبيه في صندوق الإشعارات لدى ${recipientCount} مستخدمين نشطين، ويرسل كتنبيه فوري إلى أجهزتهم المسجلة.`, [
      { text: language === "en" ? "Cancel" : "إلغاء", style: "cancel" },
      { text: language === "en" ? "Send announcement" : "إرسال الإشعار", onPress: () => {
        const result = sendGeneralAnnouncement({ title, message });
        if (!result.ok) {
          Alert.alert(language === "en" ? "Sending blocked" : "تم رفض الإرسال", result.reason === "permission" ? (language === "en" ? "You no longer have permission to send general announcements." : "لم تعد لديك صلاحية إرسال الإشعارات العامة.") : (language === "en" ? "Shorten the title or message and try again." : "اختصر العنوان أو الرسالة ثم أعد المحاولة."));
          return;
        }
        Alert.alert(language === "en" ? "Announcement sent" : "تم إرسال الإشعار", language === "en" ? `The announcement was added for ${result.recipientCount} active users. Push is sent to registered devices.` : `تمت إضافة الإشعار لـ ${result.recipientCount} مستخدمين نشطين، وأُرسل Push إلى الأجهزة المسجلة.`);
        router.back();
      } },
    ]);
  };

  if (!allowed) return <View style={styles.page}><View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}><IconAction icon={isRTL ? "arrow-forward" : "arrow-back"} label={language === "en" ? "Back" : "رجوع"} onPress={() => router.back()} /><Text style={[styles.title, align(isRTL)]}>{label}</Text></View><EmptyState icon="lock" text={language === "en" ? "Permission to send general announcements is required." : "يلزم توفر صلاحية إرسال الإشعارات العامة."} /></View>;

  return <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}><IconAction icon={isRTL ? "arrow-forward" : "arrow-back"} label={language === "en" ? "Back" : "رجوع"} onPress={() => router.back()} /><View style={styles.headerCopy}><Text style={[styles.title, align(isRTL)]}>{label}</Text><Text style={[styles.subtitle, align(isRTL)]}>{language === "en" ? "Send an internal notice and a Push alert to registered devices." : "أرسل تنبيهاً داخلياً وتنبيه Push إلى الأجهزة المسجلة."}</Text></View></View><AppCard style={styles.notice}><View style={[styles.noticeLine, { flexDirection: isRTL ? "row-reverse" : "row" }]}><View style={styles.noticeIcon}><MaterialIcons name="campaign" size={22} color="#FFFFFF" /></View><View style={styles.flex}><Text style={[styles.noticeTitle, align(isRTL)]}>{language === "en" ? "Department-wide notification" : "تنبيه على مستوى القسم"}</Text><Text style={[styles.noticeText, align(isRTL)]}>{language === "en" ? `It will be visible to ${recipientCount} active users. Push reaches only devices that have enabled alerts.` : `سيظهر لدى ${recipientCount} مستخدمين نشطين. يصل Push إلى الأجهزة التي فُعّلت عليها الإشعارات فقط.`}</Text></View></View></AppCard><Text style={[styles.label, align(isRTL)]}>{language === "en" ? "Title" : "العنوان"}</Text><TextInput value={title} onChangeText={setTitle} maxLength={GENERAL_ANNOUNCEMENT_LIMITS.title} placeholder={language === "en" ? "Example: Department meeting update" : "مثال: تحديث اجتماع القسم"} placeholderTextColor="#8AA0B3" style={[styles.input, align(isRTL)]} textAlign={isRTL ? "right" : "left"} /><Text style={[styles.counter, align(isRTL)]}>{title.length}/{GENERAL_ANNOUNCEMENT_LIMITS.title}</Text><Text style={[styles.label, align(isRTL)]}>{language === "en" ? "Message" : "الرسالة"}</Text><TextInput value={message} onChangeText={setMessage} maxLength={GENERAL_ANNOUNCEMENT_LIMITS.message} multiline textAlignVertical="top" placeholder={language === "en" ? "Write a concise department-wide update." : "اكتب تحديثاً موجزاً موجهاً إلى جميع أعضاء القسم."} placeholderTextColor="#8AA0B3" style={[styles.input, styles.messageInput, align(isRTL)]} textAlign={isRTL ? "right" : "left"} /><Text style={[styles.counter, align(isRTL)]}>{message.length}/{GENERAL_ANNOUNCEMENT_LIMITS.message}</Text><View style={[styles.help, { flexDirection: isRTL ? "row-reverse" : "row" }]}><MaterialIcons name="info-outline" size={18} color={palette.gold} /><Text style={[styles.helpText, align(isRTL)]}>{language === "en" ? "Use this for operational updates only. Do not include identifiable patient details." : "استخدم هذا للتحديثات التشغيلية فقط. لا تدرج بيانات تعريفية للمرضى."}</Text></View><PrimaryButton label={language === "en" ? "Send announcement" : "إرسال الإشعار"} icon="send" onPress={publish} /></ScrollView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: palette.canvas, paddingHorizontal: 18 }, content: { paddingBottom: 36 }, header: { paddingTop: 22, paddingBottom: 16, gap: 12, alignItems: "center" }, headerCopy: { flex: 1 }, title: { color: palette.ink, fontSize: 21, fontWeight: "900" }, subtitle: { color: palette.muted, fontSize: 11, marginTop: 3, lineHeight: 16 }, notice: { padding: 14, backgroundColor: palette.paleBlue, borderColor: "#B7D6EC" }, noticeLine: { gap: 11, alignItems: "center" }, noticeIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: palette.navy, alignItems: "center", justifyContent: "center" }, flex: { flex: 1 }, noticeTitle: { color: palette.navy, fontSize: 13, fontWeight: "900" }, noticeText: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }, label: { color: palette.ink, fontSize: 12, fontWeight: "900", marginTop: 18, marginBottom: 7 }, input: { minHeight: 48, borderWidth: 1, borderColor: palette.line, borderRadius: 14, backgroundColor: "#FFFFFF", paddingHorizontal: 13, color: palette.ink, fontSize: 13 }, messageInput: { minHeight: 132, paddingTop: 12 }, counter: { color: palette.muted, fontSize: 10, marginTop: 5 }, help: { gap: 8, alignItems: "flex-start", backgroundColor: "#FFF7DF", borderRadius: 14, padding: 12, marginTop: 19, marginBottom: 16 }, helpText: { flex: 1, color: "#75530D", fontSize: 11, lineHeight: 17 } });
