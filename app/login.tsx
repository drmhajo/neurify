import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useDepartment } from "@/lib/department-store";
import { palette, PrimaryButton } from "@/components/neuro-ui";
import { useAppLanguage } from "@/lib/language";

export default function LoginScreen() {
  const { data, signIn, completeInitialSetup } = useDepartment();
  const { language, setLanguage, isRTL, t, localize } = useAppLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmation, setSetupConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    setSubmitting(true);
    const result = await signIn(username, password);
    setSubmitting(false);
    if (!result.ok) {
      Alert.alert(t("accessDenied"), result.message ? localize(result.message) : t("checkCredentials"));
      return;
    }
    if (result.recoveryRequired) {
      Alert.alert(language === "en" ? "Password update required" : "يلزم تحديث كلمة المرور", language === "en" ? "The administrator issued a temporary password. Update it now from your account screen." : "أصدر المشرف كلمة مرور مؤقتة. حدّثها الآن من شاشة حسابك.");
      router.replace("/profile");
      return;
    }
    router.replace("/(tabs)");
  };

  const handleInitialSetup = async () => {
    if (setupPassword !== setupConfirmation) {
      Alert.alert(language === "en" ? "Password mismatch" : "كلمتا المرور غير متطابقتين", language === "en" ? "Confirm the administrator password again." : "أعد تأكيد كلمة مرور المشرف.");
      return;
    }
    setSubmitting(true);
    const result = await completeInitialSetup(setupPassword);
    setSubmitting(false);
    if (!result.ok) {
      Alert.alert(language === "en" ? "Setup not completed" : "تعذر إكمال الإعداد", result.message ? localize(result.message) : undefined);
      return;
    }
    router.replace("/(tabs)");
  };

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.page}>
    <View style={styles.topDecoration} />
    <View style={styles.content}>
      <View style={styles.languageToggle}><Pressable onPress={() => setLanguage("ar")} style={[styles.languageButton, language === "ar" && styles.languageButtonActive]}><Text style={[styles.languageText, language === "ar" && styles.languageTextActive]}>{t("arabic")}</Text></Pressable><Pressable onPress={() => setLanguage("en")} style={[styles.languageButton, language === "en" && styles.languageButtonActive]}><Text style={[styles.languageText, language === "en" && styles.languageTextActive]}>{t("english")}</Text></Pressable></View>
      <View style={styles.mark}><Image source={require("../assets/images/icon.png")} style={styles.logo} resizeMode="contain" /></View>
      <Text style={[styles.title, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{t("department")}</Text>
      <Text style={[styles.subtitle, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{t("hospital")}</Text>
      <Text style={[styles.description, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: "center" }]}>{t("workspace")}</Text>
      <View style={styles.form}>
        {data.initialSetupCompleted ? <><Text style={[styles.formTitle, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{t("signIn")}</Text><Text style={[styles.label, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{t("username")}</Text><View style={styles.inputShell}><MaterialIcons name="person-outline" size={20} color={palette.muted} /><TextInput value={username} onChangeText={setUsername} placeholder={t("usernameHint")} placeholderTextColor="#9FB3C8" autoCapitalize="none" textAlign={isRTL ? "right" : "left"} style={[styles.input, { writingDirection: isRTL ? "rtl" : "ltr" }]} returnKeyType="next" /></View><Text style={[styles.label, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{t("password")}</Text><View style={styles.inputShell}><MaterialIcons name="lock-outline" size={20} color={palette.muted} /><TextInput value={password} onChangeText={setPassword} placeholder={t("passwordHint")} placeholderTextColor="#9FB3C8" secureTextEntry textAlign={isRTL ? "right" : "left"} style={[styles.input, { writingDirection: isRTL ? "rtl" : "ltr" }]} returnKeyType="done" onSubmitEditing={handleSignIn} /></View><PrimaryButton label={submitting ? t("verifying") : t("secureSignIn")} onPress={handleSignIn} icon="login" disabled={submitting} /><View style={styles.demoInfo}><MaterialIcons name="info-outline" size={17} color={palette.gold} /><Text style={[styles.demoText, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{t("demo")}</Text></View></> : <><Text style={[styles.formTitle, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{language === "en" ? "Administrator setup" : "تهيئة حساب المشرف"}</Text><Text style={[styles.setupText, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{language === "en" ? "Set a private administrator password to start this internal workspace. Staff accounts remain inactive until you enable them." : "عيّن كلمة مرور خاصة للمشرف لبدء مساحة العمل الداخلية. تبقى حسابات الطاقم غير مفعّلة حتى تقوم بتمكينها."}</Text><Text style={[styles.label, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{language === "en" ? "Administrator password" : "كلمة مرور المشرف"}</Text><View style={styles.inputShell}><MaterialIcons name="lock-outline" size={20} color={palette.muted} /><TextInput value={setupPassword} onChangeText={setSetupPassword} placeholder={language === "en" ? "At least 12 characters" : "12 حرفاً على الأقل"} placeholderTextColor="#9FB3C8" secureTextEntry textAlign={isRTL ? "right" : "left"} style={[styles.input, { writingDirection: isRTL ? "rtl" : "ltr" }]} returnKeyType="next" /></View><Text style={[styles.label, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{language === "en" ? "Confirm password" : "تأكيد كلمة المرور"}</Text><View style={styles.inputShell}><MaterialIcons name="verified-user" size={20} color={palette.muted} /><TextInput value={setupConfirmation} onChangeText={setSetupConfirmation} placeholder={language === "en" ? "Enter it again" : "أدخلها مرة أخرى"} placeholderTextColor="#9FB3C8" secureTextEntry textAlign={isRTL ? "right" : "left"} style={[styles.input, { writingDirection: isRTL ? "rtl" : "ltr" }]} returnKeyType="done" onSubmitEditing={handleInitialSetup} /></View><PrimaryButton label={submitting ? t("verifying") : (language === "en" ? "Set up administrator account" : "إعداد حساب المشرف")} onPress={handleInitialSetup} icon="admin-panel-settings" disabled={submitting} /></>}
      </View>
      <Text style={[styles.footnote, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{t("training")}</Text>
    </View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas },
  topDecoration: { position: "absolute", top: 0, left: 0, right: 0, height: 258, backgroundColor: palette.navy, borderBottomLeftRadius: 54, borderBottomRightRadius: 54 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 72, alignItems: "center" },
  languageToggle: { position: "absolute", top: 22, right: 22, flexDirection: "row", backgroundColor: "#FFFFFF24", padding: 3, borderRadius: 12 }, languageButton: { minWidth: 56, alignItems: "center", paddingHorizontal: 7, paddingVertical: 6, borderRadius: 9 }, languageButtonActive: { backgroundColor: "#FFFFFF" }, languageText: { color: "#D8EEF9", fontSize: 11, fontWeight: "800" }, languageTextActive: { color: palette.navy },
  mark: { width: 94, height: 94, borderRadius: 30, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "#FFFFFF55", overflow: "hidden" }, logo: { width: 88, height: 88 },
  title: { marginTop: 14, color: "#FFFFFF", fontSize: 25, fontWeight: "900", writingDirection: "rtl", textAlign: "center" },
  subtitle: { marginTop: 5, color: "#D8EEF9", fontSize: 14, fontWeight: "700", writingDirection: "rtl" },
  description: { color: "#526D82", fontSize: 14, lineHeight: 22, textAlign: "center", writingDirection: "rtl", marginTop: 52, marginBottom: 18, paddingHorizontal: 16 },
  form: { width: "100%", backgroundColor: "#FFFFFF", borderRadius: 22, padding: 20, borderWidth: 1, borderColor: palette.line, shadowColor: palette.navy, shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 9 }, elevation: 3 },
  formTitle: { color: palette.ink, fontSize: 19, fontWeight: "900", writingDirection: "rtl", textAlign: "right", marginBottom: 18 },
  setupText: { color: palette.muted, fontSize: 12, lineHeight: 18, marginBottom: 16 },
  label: { color: palette.ink, fontSize: 13, fontWeight: "800", writingDirection: "rtl", textAlign: "right", marginBottom: 7 },
  inputShell: { height: 50, borderColor: palette.line, borderWidth: 1, borderRadius: 14, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, gap: 9, marginBottom: 14 },
  input: { flex: 1, color: palette.ink, fontSize: 14, writingDirection: "rtl" },
  demoInfo: { marginTop: 14, flexDirection: "row-reverse", alignItems: "center", gap: 6, backgroundColor: "#FFF7DF", padding: 10, borderRadius: 12 },
  demoText: { color: "#75530D", fontSize: 11, lineHeight: 17, flex: 1, textAlign: "right", writingDirection: "rtl" },
  footnote: { color: palette.muted, fontSize: 11, textAlign: "center", lineHeight: 17, marginTop: 18, writingDirection: "rtl", paddingHorizontal: 12 },
});
