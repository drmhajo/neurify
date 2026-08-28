import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { EmptyState, palette } from "@/components/neuro-ui";
import { useDepartment } from "@/lib/department-store";
import { useAppLanguage } from "@/lib/language";
import type { GeneralDiscussionMessage } from "@/lib/department-model";

export default function GeneralDiscussionsScreen() {
  const { data, session, addGeneralDiscussionMessage, markGeneralDiscussionRead } = useDepartment();
  const { language, isRTL } = useAppLanguage();
  const [draft, setDraft] = useState("");
  const messages = useMemo(() => data.generalDiscussionMessages ?? [], [data.generalDiscussionMessages]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) markGeneralDiscussionRead();
  }, [isFocused, markGeneralDiscussionRead, messages.length]);

  const sendMessage = () => {
    if (!draft.trim()) return;
    if (!addGeneralDiscussionMessage(draft)) {
      Alert.alert(language === "en" ? "Message unavailable" : "تعذر الإرسال", language === "en" ? "Only active department members can post in this discussion." : "يمكن للمستخدمين النشطين في القسم فقط الكتابة في هذه المساحة.");
      return;
    }
    setDraft("");
  };

  const renderMessage = ({ item }: { item: GeneralDiscussionMessage }) => {
    const isOwn = item.senderId === session?.userId;
    return <View style={[styles.message, isOwn ? styles.ownMessage : styles.memberMessage]}>
      <Text style={[styles.sender, isOwn ? styles.ownSender : styles.memberSender, { textAlign: isRTL ? "right" : "left", writingDirection: isRTL ? "rtl" : "ltr" }]}>{item.senderName}</Text>
      <Text style={[styles.messageText, isOwn && styles.ownText, { textAlign: isRTL ? "right" : "left", writingDirection: isRTL ? "rtl" : "ltr" }]}>{item.text}</Text>
      <Text style={[styles.timestamp, isOwn && styles.ownTimestamp, { textAlign: isRTL ? "right" : "left" }]}>{language === "en" ? (item.sentAt === "الآن" ? "Now" : item.sentAt) : item.sentAt}</Text>
    </View>;
  };

  return <ScreenContainer edges={["top", "left", "right"]} className="px-4">
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.page} keyboardVerticalOffset={0}>
      <View style={[styles.header, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={styles.headerIcon}><MaterialIcons name="forum" size={24} color="#FFFFFF" /></View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { textAlign: isRTL ? "right" : "left", writingDirection: isRTL ? "rtl" : "ltr" }]}>{language === "en" ? "General discussions" : "النقاشات العامة"}</Text>
          <Text style={[styles.subtitle, { textAlign: isRTL ? "right" : "left", writingDirection: isRTL ? "rtl" : "ltr" }]}>{language === "en" ? "A fixed department-wide operational space" : "مساحة ثابتة للنقاشات التشغيلية لجميع أعضاء القسم"}</Text>
        </View>
      </View>
      <View style={[styles.notice, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <MaterialIcons name="privacy-tip" size={19} color={palette.teal} />
        <Text style={[styles.noticeText, { textAlign: isRTL ? "right" : "left", writingDirection: isRTL ? "rtl" : "ltr" }]}>{language === "en" ? "For operational discussion only. Do not include patient names, record numbers, or clinical details here." : "للنقاش التشغيلي فقط. لا تكتب أسماء المرضى أو أرقام ملفاتهم أو تفاصيلهم السريرية في هذه المساحة."}</Text>
      </View>
      <View style={styles.messageArea}>
        <FlatList
          style={styles.list}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={messages.length ? styles.messageList : styles.emptyList}
          ListEmptyComponent={<EmptyState icon="forum" text={language === "en" ? "Start the department’s first general discussion." : "ابدأ أول نقاش عام للقسم."} />}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      </View>
      <View style={[styles.composer, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={language === "en" ? "Write an operational message…" : "اكتب رسالة تشغيلية عامة..."}
          placeholderTextColor="#8AA0B3"
          multiline
          maxLength={600}
          textAlign={isRTL ? "right" : "left"}
          style={[styles.input, { writingDirection: isRTL ? "rtl" : "ltr" }]}
          accessibilityLabel={language === "en" ? "General discussion message" : "رسالة النقاش العام"}
        />
        <Pressable onPress={sendMessage} disabled={!draft.trim()} style={({ pressed }) => [styles.send, !draft.trim() && styles.sendDisabled, pressed && draft.trim() ? styles.sendPressed : null]} accessibilityLabel={language === "en" ? "Send message" : "إرسال الرسالة"}>
          <MaterialIcons name="send" size={21} color="#FFFFFF" />
        </Pressable>
      </View>
      <Text style={[styles.footer, { textAlign: isRTL ? "right" : "left", writingDirection: isRTL ? "rtl" : "ltr" }]}>{language === "en" ? "Patient-specific discussion remains inside each medical record." : "تبقى دردشة الحالة الخاصة داخل الملف الطبي للمريض فقط."}</Text>
    </KeyboardAvoidingView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  page: { flex: 1, minHeight: 0 },
  header: { alignItems: "center", gap: 11, paddingTop: 10, paddingBottom: 14 },
  headerIcon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: palette.navy },
  headerCopy: { flex: 1 },
  title: { color: palette.ink, fontWeight: "900", fontSize: 20 },
  subtitle: { color: palette.muted, fontSize: 11, marginTop: 3, lineHeight: 16 },
  notice: { gap: 8, alignItems: "flex-start", padding: 12, borderRadius: 14, backgroundColor: palette.paleTeal, marginBottom: 12 },
  noticeText: { flex: 1, color: palette.teal, fontSize: 11, lineHeight: 17, fontWeight: "700" },
  messageArea: { flex: 1, minHeight: 0 },
  list: { flex: 1, minHeight: 0 },
  messageList: { flexGrow: 1, paddingTop: 4, paddingBottom: 16, gap: 9 },
  emptyList: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingBottom: 28 },
  message: { maxWidth: "88%", padding: 12, borderRadius: 16 },
  ownMessage: { alignSelf: "flex-end", backgroundColor: palette.navy, borderBottomRightRadius: 5 },
  memberMessage: { alignSelf: "flex-start", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line, borderBottomLeftRadius: 5 },
  sender: { fontSize: 11, fontWeight: "900" },
  ownSender: { color: "#A9E4DE" },
  memberSender: { color: palette.teal },
  messageText: { fontSize: 13, lineHeight: 20, marginTop: 4, color: palette.ink },
  ownText: { color: "#FFFFFF" },
  timestamp: { color: palette.muted, fontSize: 9, marginTop: 6 },
  ownTimestamp: { color: "#CEE6F3" },
  composer: { flexShrink: 0, alignItems: "flex-end", gap: 9, borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 12, paddingBottom: 10, backgroundColor: palette.canvas },
  input: { flex: 1, minHeight: 46, maxHeight: 100, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 10, color: palette.ink, textAlignVertical: "top" },
  send: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: palette.navy },
  sendDisabled: { backgroundColor: "#9CB1C2" },
  sendPressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  footer: { color: palette.muted, fontSize: 10, lineHeight: 15, paddingBottom: 3 },
});
