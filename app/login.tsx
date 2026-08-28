import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Alert, Animated, Easing, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useDepartment } from "@/lib/department-store";
import { palette, PrimaryButton } from "@/components/neuro-ui";
import { useAppLanguage } from "@/lib/language";

const loginColors = {
  navy: "#163F66",
  navySoft: "#2B5F81",
  teal: "#168D93",
  tealPale: "#E7F5F3",
  gold: "#D4B62E",
  goldPale: "#FBF6D8",
  canvas: "#F5F8F5",
  line: "#B9D8D5",
  ink: "#16334D",
  muted: "#5E778A",
};

export default function LoginScreen() {
  const { signIn, requestRegistration } = useDepartment();
  const { language, setLanguage, isRTL, t, localize } = useAppLanguage();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registration, setRegistration] = useState({ name: "", phone: "", jobTitle: "", email: "", password: "", confirmation: "" });
  const [submitting, setSubmitting] = useState(false);
  const [dashboardTransitioning, setDashboardTransitioning] = useState(false);
  const dashboardTransitionOpacity = useState(() => new Animated.Value(0))[0];

  const transitionToDashboard = () => {
    setDashboardTransitioning(true);
    dashboardTransitionOpacity.setValue(0);
    Animated.timing(dashboardTransitionOpacity, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished) router.replace("/(tabs)");
    });
  };

  const handleSignIn = async () => {
    setSubmitting(true);
    const result = await signIn(identifier, password);
    setSubmitting(false);
    if (!result.ok) {
      Alert.alert(t("accessDenied"), result.message ? localize(result.message) : t("checkCredentials"));
      return;
    }
    if (result.recoveryRequired) {
      router.replace("/profile");
      return;
    }
    transitionToDashboard();
  };

  const handleRegistration = async () => {
    if (!registration.name.trim() || !registration.phone.trim() || !registration.jobTitle.trim() || !registration.email.trim()) {
      Alert.alert(language === "en" ? "Details required" : "بيانات مطلوبة", language === "en" ? "Enter your name, phone number, job title, and email." : "أدخل الاسم ورقم الهاتف والمسمى الوظيفي والبريد الإلكتروني.");
      return;
    }
    if (registration.password.length < 12 || registration.password !== registration.confirmation) {
      Alert.alert(language === "en" ? "Check your password" : "تحقق من كلمة المرور", language === "en" ? "Use a password with at least 12 characters and enter it identically twice." : "استخدم كلمة مرور من 12 حرفًا على الأقل وأدخلها متطابقة مرتين.");
      return;
    }
    setSubmitting(true);
    const result = await requestRegistration(registration);
    setSubmitting(false);
    if (!result.ok) {
      const message = result.reason === "pending" ? (language === "en" ? "A request with this email is already waiting for approval." : "يوجد طلب بهذا البريد الإلكتروني بانتظار الموافقة بالفعل.") : result.reason === "existing" ? (language === "en" ? "This email already has a registration record. Contact a department approver." : "يوجد سجل تسجيل لهذا البريد الإلكتروني. تواصل مع مسؤول الموافقة في القسم.") : (language === "en" ? "The central registration service is unavailable. Check the network and try again." : "خدمة التسجيل المركزية غير متاحة. تحقق من الشبكة وحاول مرة أخرى.");
      Alert.alert(language === "en" ? "Registration not submitted" : "تعذر إرسال الطلب", message);
      return;
    }
    setRegistrationOpen(false);
    setRegistration({ name: "", phone: "", jobTitle: "", email: "", password: "", confirmation: "" });
    Alert.alert(language === "en" ? "Request submitted" : "تم إرسال الطلب", language === "en" ? "Your account remains unavailable until a department administrator or authorized approver reviews it." : "سيبقى الحساب غير متاح حتى يراجعه ويعتمده مشرف القسم أو المفوض بالموافقات.");
  };

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.page}>
    <View style={styles.topDecoration} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.languageToggle}><Pressable onPress={() => setLanguage("ar")} style={[styles.languageButton, language === "ar" && styles.languageButtonActive]}><Text style={[styles.languageText, language === "ar" && styles.languageTextActive]}>{t("arabic")}</Text></Pressable><Pressable onPress={() => setLanguage("en")} style={[styles.languageButton, language === "en" && styles.languageButtonActive]}><Text style={[styles.languageText, language === "en" && styles.languageTextActive]}>{t("english")}</Text></Pressable></View>
      <View style={styles.mark}><Image source={require("../assets/images/neurosurgery-department-logo.png")} style={styles.logo} resizeMode="contain" accessibilityLabel="Neurosurgery Department, King Saud Medical City" /></View>
      <Text style={[styles.title, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{t("department")}</Text>
      <Text style={[styles.subtitle, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{t("hospital")}</Text>
      <Text style={[styles.description, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{t("workspace")}</Text>
      <View style={styles.form}>
        <Text style={[styles.formTitle, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{t("signIn")}</Text>
        <Text style={[styles.label, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{language === "en" ? "Administrator username or approved email" : "اسم مستخدم المشرف أو البريد الإلكتروني المعتمد"}</Text>
        <View style={styles.inputShell}><MaterialIcons name="person-outline" size={20} color={palette.muted} /><TextInput value={identifier} onChangeText={setIdentifier} placeholder={language === "en" ? "Enter admin or approved email" : "أدخل admin أو البريد المعتمد"} placeholderTextColor="#9FB3C8" autoCapitalize="none" autoCorrect={false} textAlign={isRTL ? "right" : "left"} style={[styles.input, { writingDirection: isRTL ? "rtl" : "ltr" }]} returnKeyType="next" /></View>
        <Text style={[styles.label, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{t("password")}</Text>
        <View style={styles.inputShell}><MaterialIcons name="lock-outline" size={20} color={palette.muted} /><TextInput value={password} onChangeText={setPassword} placeholder={t("passwordHint")} placeholderTextColor="#9FB3C8" secureTextEntry textAlign={isRTL ? "right" : "left"} style={[styles.input, { writingDirection: isRTL ? "rtl" : "ltr" }]} returnKeyType="done" onSubmitEditing={handleSignIn} /></View>
        <PrimaryButton label={submitting ? t("verifying") : t("secureSignIn")} onPress={handleSignIn} icon="login" disabled={submitting || dashboardTransitioning} />
        <Pressable onPress={() => setRegistrationOpen(true)} style={({ pressed }) => [styles.registrationButton, pressed && { opacity: 0.76 }]}><MaterialIcons name="person-add-alt-1" size={18} color={palette.teal} /><Text style={styles.registrationButtonText}>{language === "en" ? "New user? Request an account" : "مستخدم جديد؟ اطلب إنشاء حساب"}</Text></Pressable>
        <View style={styles.centralInfo}><MaterialIcons name="verified-user" size={17} color={palette.teal} /><Text style={[styles.centralInfoText, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{language === "en" ? "All accounts are verified centrally. New devices never create a local administrator." : "تُتحقق جميع الحسابات مركزيًا. لا يمكن لأي جهاز جديد إنشاء مشرف محلي."}</Text></View>
      </View>
      <Image source={require("../assets/images/neurify-wordmark.png")} style={styles.neurifyWordmark} resizeMode="contain" accessibilityLabel="Neurify" />
      <Text style={[styles.footnote, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{t("training")}</Text>
    </ScrollView>
    <Modal visible={registrationOpen} transparent animationType="slide" onRequestClose={() => setRegistrationOpen(false)}><View style={styles.modalShade}><ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled"><View style={styles.handle} /><Text style={[styles.sheetTitle, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{language === "en" ? "Request a new account" : "طلب تسجيل مستخدم جديد"}</Text><Text style={[styles.sheetText, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{language === "en" ? "Your request is held centrally until a department administrator or authorized approver confirms it." : "يُحفظ طلبك مركزيًا بانتظار اعتماد مشرف القسم أو المستخدم المفوض بالموافقات."}</Text><RegisterField label={language === "en" ? "Full name" : "الاسم الكامل"} value={registration.name} onChangeText={(value) => setRegistration({ ...registration, name: value })} placeholder={language === "en" ? "Your full name" : "اكتب الاسم الكامل"} isRTL={isRTL} /><RegisterField label={language === "en" ? "Phone number" : "رقم الهاتف"} value={registration.phone} onChangeText={(value) => setRegistration({ ...registration, phone: value })} placeholder="05XXXXXXXX" isRTL={isRTL} keyboardType="phone-pad" /><RegisterField label={language === "en" ? "Job title" : "المسمى الوظيفي"} value={registration.jobTitle} onChangeText={(value) => setRegistration({ ...registration, jobTitle: value })} placeholder={language === "en" ? "e.g. Resident" : "مثال: طبيب مقيم"} isRTL={isRTL} /><RegisterField label={language === "en" ? "Email" : "البريد الإلكتروني"} value={registration.email} onChangeText={(value) => setRegistration({ ...registration, email: value })} placeholder="name@hospital.sa" isRTL={isRTL} keyboardType="email-address" autoCapitalize="none" /><RegisterField label={language === "en" ? "Password" : "كلمة المرور"} value={registration.password} onChangeText={(value) => setRegistration({ ...registration, password: value })} placeholder={language === "en" ? "At least 12 characters" : "12 حرفًا على الأقل"} isRTL={isRTL} secureTextEntry /><RegisterField label={language === "en" ? "Confirm password" : "تأكيد كلمة المرور"} value={registration.confirmation} onChangeText={(value) => setRegistration({ ...registration, confirmation: value })} placeholder={language === "en" ? "Enter it again" : "أدخلها مرة أخرى"} isRTL={isRTL} secureTextEntry /><PrimaryButton label={submitting ? (language === "en" ? "Submitting…" : "جارٍ الإرسال...") : (language === "en" ? "Submit registration request" : "إرسال طلب التسجيل")} icon="how-to-reg" onPress={handleRegistration} disabled={submitting} /><Pressable onPress={() => setRegistrationOpen(false)} style={styles.cancelRegistration}><Text style={styles.cancelRegistrationText}>{language === "en" ? "Cancel" : "إلغاء"}</Text></Pressable></ScrollView></View></Modal>
    {dashboardTransitioning && <Animated.View style={[styles.dashboardTransition, { opacity: dashboardTransitionOpacity }]} pointerEvents="auto"><View style={styles.dashboardTransitionCard}><MaterialIcons name="verified-user" size={34} color={loginColors.teal} /><Text style={[styles.dashboardTransitionTitle, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{language === "en" ? "Access confirmed" : "تم تأكيد الدخول"}</Text><Text style={[styles.dashboardTransitionText, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{language === "en" ? "Opening the department dashboard…" : "جارٍ فتح لوحة القسم…"}</Text></View></Animated.View>}
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: loginColors.canvas }, topDecoration: { position: "absolute", top: 0, left: 0, right: 0, height: 292, backgroundColor: loginColors.navy, borderBottomLeftRadius: 54, borderBottomRightRadius: 54 }, content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 58, paddingBottom: 30, alignItems: "center" }, languageToggle: { position: "absolute", top: 22, right: 22, flexDirection: "row", backgroundColor: "#FFFFFF24", padding: 3, borderRadius: 12 }, languageButton: { minWidth: 56, alignItems: "center", paddingHorizontal: 7, paddingVertical: 6, borderRadius: 9 }, languageButtonActive: { backgroundColor: "#FFFFFF" }, languageText: { color: "#D9F0F0", fontSize: 11, fontWeight: "800" }, languageTextActive: { color: loginColors.navy }, mark: { width: 124, height: 124, borderRadius: 32, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: loginColors.gold, overflow: "hidden" }, logo: { width: 116, height: 116 }, title: { marginTop: 12, color: "#FFFFFF", fontSize: 24, fontWeight: "900", textAlign: "center" }, subtitle: { marginTop: 5, color: "#D9F0F0", fontSize: 14, fontWeight: "700" }, description: { color: loginColors.muted, fontSize: 14, lineHeight: 22, textAlign: "center", marginTop: 66, marginBottom: 18, paddingHorizontal: 16 }, form: { width: "100%", backgroundColor: "#FFFFFF", borderRadius: 22, padding: 20, borderWidth: 1, borderColor: loginColors.line, shadowColor: loginColors.navy, shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 9 }, elevation: 3 }, formTitle: { color: loginColors.ink, fontSize: 19, fontWeight: "900", marginBottom: 18 }, label: { color: loginColors.ink, fontSize: 13, fontWeight: "800", marginBottom: 7 }, inputShell: { height: 50, borderColor: loginColors.line, borderWidth: 1, borderRadius: 14, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, gap: 9, marginBottom: 14 }, input: { flex: 1, color: loginColors.ink, fontSize: 14 }, registrationButton: { minHeight: 45, marginTop: 11, backgroundColor: loginColors.tealPale, borderColor: "#9ACCC7", borderWidth: 1, borderRadius: 13, alignItems: "center", justifyContent: "center", flexDirection: "row-reverse", gap: 8 }, registrationButtonText: { color: loginColors.teal, fontSize: 12, fontWeight: "900" }, centralInfo: { marginTop: 14, flexDirection: "row-reverse", alignItems: "center", gap: 6, backgroundColor: loginColors.goldPale, padding: 10, borderRadius: 12 }, centralInfoText: { color: "#6C5D17", fontSize: 11, lineHeight: 17, flex: 1 }, neurifyWordmark: { width: 106, height: 32, marginTop: 17, opacity: 0.82 }, modalShade: { flex: 1, backgroundColor: "#163F6678", justifyContent: "flex-end" }, sheet: { maxHeight: "91%", backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28 }, sheetContent: { padding: 20, paddingBottom: 38 }, handle: { width: 40, height: 4, borderRadius: 3, backgroundColor: loginColors.line, alignSelf: "center", marginBottom: 15 }, sheetTitle: { color: loginColors.ink, fontSize: 20, fontWeight: "900" }, sheetText: { color: loginColors.muted, fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 7 }, registerFieldLabel: { color: loginColors.ink, fontSize: 12, fontWeight: "800", marginTop: 11, marginBottom: 5 }, registerFieldInput: { minHeight: 47, borderWidth: 1, borderColor: loginColors.line, borderRadius: 12, paddingHorizontal: 12, color: loginColors.ink, fontSize: 13, backgroundColor: "#FCFEFE" }, cancelRegistration: { minHeight: 42, marginTop: 8, alignItems: "center", justifyContent: "center" }, cancelRegistrationText: { color: loginColors.muted, fontSize: 13, fontWeight: "800" }, footnote: { color: loginColors.muted, fontSize: 11, textAlign: "center", lineHeight: 17, marginTop: 8, paddingHorizontal: 12 }, dashboardTransition: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "#163F66E8", padding: 28 }, dashboardTransitionCard: { width: "100%", maxWidth: 292, alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 24, borderWidth: 1, borderColor: "#D4B62E", paddingHorizontal: 24, paddingVertical: 28, shadowColor: "#061E31", shadowOpacity: 0.28, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 }, dashboardTransitionTitle: { marginTop: 13, color: loginColors.ink, fontSize: 18, fontWeight: "900", textAlign: "center" }, dashboardTransitionText: { marginTop: 7, color: loginColors.muted, fontSize: 13, lineHeight: 20, textAlign: "center" },
});

function RegisterField({ label, value, onChangeText, placeholder, isRTL, keyboardType, autoCapitalize, secureTextEntry }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; isRTL: boolean; keyboardType?: "default" | "email-address" | "phone-pad"; autoCapitalize?: "none"; secureTextEntry?: boolean }) {
  return <View><Text style={[styles.registerFieldLabel, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9FB3C8" keyboardType={keyboardType} autoCapitalize={autoCapitalize} secureTextEntry={secureTextEntry} textAlign={isRTL ? "right" : "left"} style={[styles.registerFieldInput, { writingDirection: isRTL ? "rtl" : "ltr" }]} /></View>;
}
