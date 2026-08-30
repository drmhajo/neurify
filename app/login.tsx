import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Animated, Easing, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette, PrimaryButton } from "@/components/neuro-ui";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useDepartment } from "@/lib/department-store";
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
  error: "#B42318",
};

export default function LoginScreen() {
  const { signIn, requestPasswordRecovery, confirmPasswordRecovery, requestRegistration } = useDepartment();
  const { language, setLanguage, isRTL, t, localize } = useAppLanguage();
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [credentialError, setCredentialError] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [registration, setRegistration] = useState({ name: "", phone: "", jobTitle: "", email: "", password: "", confirmation: "" });
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryStage, setRecoveryStage] = useState<"request" | "confirm">("request");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryConfirmation, setRecoveryConfirmation] = useState("");
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dashboardTransitioning, setDashboardTransitioning] = useState(false);
  const dashboardTransitionOpacity = useState(() => new Animated.Value(0))[0];

  const contentTopPadding = Math.max(layout.loginTopPadding, insets.top + 18);
  const contentBottomPadding = Math.max(layout.contentBottomPadding, insets.bottom + 16);
  const textDirection = isRTL ? "rtl" : "ltr";
  const textAlign = isRTL ? "right" : "left";

  const transitionToDashboard = () => {
    setDashboardTransitioning(true);
    dashboardTransitionOpacity.setValue(0);
    Animated.timing(dashboardTransitionOpacity, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished) router.replace("/(tabs)");
    });
  };

  const handleSignIn = async () => {
    if (!identifier.trim() || !password) {
      setCredentialError(language === "en" ? "Enter your username or approved email and password." : "أدخل اسم المستخدم أو البريد المعتمد وكلمة المرور.");
      return;
    }
    setCredentialError("");
    setSubmitting(true);
    const result = await signIn(identifier, password);
    setSubmitting(false);
    if (!result.ok) {
      const message = result.message ? localize(result.message) : t("checkCredentials");
      setCredentialError(message);
      Alert.alert(t("accessDenied"), message);
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

  const closeRecovery = () => {
    setRecoveryOpen(false);
    setRecoveryStage("request");
    setRecoveryCode("");
    setRecoveryPassword("");
    setRecoveryConfirmation("");
    setRecoveryBusy(false);
  };

  const handleRecoveryRequest = async () => {
    setRecoveryBusy(true);
    const result = await requestPasswordRecovery(recoveryEmail);
    setRecoveryBusy(false);
    if (!result.ok) {
      Alert.alert(language === "en" ? "Recovery request not sent" : "تعذر إرسال طلب الاستعادة", result.message ? localize(result.message) : (language === "en" ? "Enter your approved email and try again." : "أدخل بريدك المعتمد وحاول مرة أخرى."));
      return;
    }
    setRecoveryStage("confirm");
    Alert.alert(language === "en" ? "Check your email" : "تحقق من بريدك الإلكتروني", language === "en" ? "If this is an approved account, a six-digit recovery code has been sent. The code expires in 15 minutes." : "إذا كان البريد تابعًا لحساب معتمد، فقد أُرسل رمز استعادة من ستة أرقام. تنتهي صلاحيته خلال 15 دقيقة.");
  };

  const handleRecoveryConfirm = async () => {
    if (recoveryPassword.length < 12 || recoveryPassword !== recoveryConfirmation) {
      Alert.alert(language === "en" ? "Check your new password" : "تحقق من كلمة المرور الجديدة", language === "en" ? "Use at least 12 characters and enter the same password twice." : "استخدم 12 حرفًا على الأقل وأدخل كلمة المرور نفسها مرتين.");
      return;
    }
    setRecoveryBusy(true);
    const result = await confirmPasswordRecovery({ email: recoveryEmail, code: recoveryCode, newPassword: recoveryPassword });
    setRecoveryBusy(false);
    if (!result.ok) {
      Alert.alert(language === "en" ? "Recovery code not accepted" : "تعذر قبول رمز الاستعادة", result.message ? localize(result.message) : (language === "en" ? "The code is invalid or has expired. Request a new code." : "الرمز غير صحيح أو انتهت صلاحيته. اطلب رمزًا جديدًا."));
      return;
    }
    setIdentifier(recoveryEmail);
    closeRecovery();
    Alert.alert(language === "en" ? "Password updated" : "تم تحديث كلمة المرور", language === "en" ? "You can now sign in with your new password." : "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.");
  };

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.page}>
    <View style={[styles.topDecoration, { height: layout.loginHeaderHeight }]} />
    <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: layout.screenPadding, paddingTop: contentTopPadding, paddingBottom: contentBottomPadding }]} keyboardShouldPersistTaps="handled">
      <View style={[styles.languageToggle, { top: insets.top + 10 }]}>
        <Pressable onPress={() => setLanguage("ar")} style={[styles.languageButton, language === "ar" && styles.languageButtonActive]}><Text style={[styles.languageText, language === "ar" && styles.languageTextActive]}>{t("arabic")}</Text></Pressable>
        <Pressable onPress={() => setLanguage("en")} style={[styles.languageButton, language === "en" && styles.languageButtonActive]}><Text style={[styles.languageText, language === "en" && styles.languageTextActive]}>{t("english")}</Text></Pressable>
      </View>
      <View style={[styles.mark, { width: layout.loginLogoSize, height: layout.loginLogoSize, borderRadius: layout.loginLogoRadius }]}><Image source={require("../assets/images/neurosurgery-department-logo.png")} style={{ width: layout.loginLogoImageSize, height: layout.loginLogoImageSize }} resizeMode="contain" accessibilityLabel="Neurosurgery Department, King Saud Medical City" /></View>
      <Text style={[styles.title, { fontSize: layout.loginTitleSize, writingDirection: textDirection }]}>{t("department")}</Text>
      <Text style={[styles.subtitle, { writingDirection: textDirection }]}>{t("hospital")}</Text>
      <Text style={[styles.description, { marginTop: layout.loginDescriptionTopMargin, marginBottom: layout.loginDescriptionBottomMargin, writingDirection: textDirection }]}>{t("workspace")}</Text>

      <View style={[styles.form, { padding: layout.cardPadding }]}>
        <Text style={[styles.formTitle, { writingDirection: textDirection, textAlign }]}>{t("signIn")}</Text>
        <Text style={[styles.label, { writingDirection: textDirection, textAlign }]}>{language === "en" ? "Username or approved email" : "اسم المستخدم أو البريد المعتمد"}</Text>
        <View style={[styles.inputShell, credentialError && credentialStyles.inputShell]}><MaterialIcons name="person-outline" size={20} color={credentialError ? loginColors.error : palette.muted} /><TextInput value={identifier} onChangeText={(value) => { setIdentifier(value); if (credentialError) setCredentialError(""); }} placeholder={language === "en" ? "Enter username or approved email" : "أدخل اسم المستخدم أو البريد المعتمد"} placeholderTextColor="#9FB3C8" autoCapitalize="none" autoCorrect={false} textAlign={textAlign} style={[styles.input, { writingDirection: textDirection }]} returnKeyType="next" accessibilityLabel={language === "en" ? "Username or approved email" : "اسم المستخدم أو البريد المعتمد"} /></View>
        <Text style={[styles.label, { writingDirection: textDirection, textAlign }]}>{t("password")}</Text>
        <View style={[styles.inputShell, credentialError && credentialStyles.inputShell]}><MaterialIcons name="lock-outline" size={20} color={credentialError ? loginColors.error : palette.muted} /><TextInput value={password} onChangeText={(value) => { setPassword(value); if (credentialError) setCredentialError(""); }} placeholder={t("passwordHint")} placeholderTextColor="#9FB3C8" secureTextEntry={!passwordVisible} textAlign={textAlign} style={[styles.input, { writingDirection: textDirection }]} returnKeyType="done" onSubmitEditing={handleSignIn} accessibilityLabel={t("password")} /><Pressable onPress={() => setPasswordVisible((visible) => !visible)} accessibilityRole="button" accessibilityLabel={passwordVisible ? (language === "en" ? "Hide password" : "إخفاء كلمة المرور") : (language === "en" ? "Show password" : "إظهار كلمة المرور")} accessibilityHint={language === "en" ? "Toggles password visibility" : "تبديل إظهار كلمة المرور"} hitSlop={8} style={({ pressed }) => [styles.passwordVisibility, pressed && { opacity: 0.64 }]}><MaterialIcons name={passwordVisible ? "visibility-off" : "visibility"} size={21} color={loginColors.navySoft} /></Pressable></View>
        <Pressable onPress={() => setRecoveryOpen(true)} accessibilityRole="button" accessibilityLabel={language === "en" ? "Forgot password" : "نسيت كلمة المرور"} style={({ pressed }) => [credentialStyles.forgotButton, { flexDirection: isRTL ? "row-reverse" : "row" }, pressed && { opacity: 0.7 }]}><MaterialIcons name="lock-reset" size={17} color={loginColors.teal} /><Text style={credentialStyles.forgotText}>{language === "en" ? "Forgot password?" : "نسيت كلمة المرور؟"}</Text></Pressable>
        {credentialError ? <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[credentialStyles.notice, { flexDirection: isRTL ? "row-reverse" : "row" }]}><MaterialIcons name="error-outline" size={18} color={loginColors.error} /><Text style={[credentialStyles.noticeText, { writingDirection: textDirection, textAlign }]}>{credentialError}</Text></View> : null}
        <PrimaryButton label={submitting ? t("verifying") : t("secureSignIn")} onPress={handleSignIn} icon="login" disabled={submitting || dashboardTransitioning} />
        <Pressable onPress={() => setRegistrationOpen(true)} style={({ pressed }) => [styles.registrationButton, pressed && { opacity: 0.76 }]}><MaterialIcons name="person-add-alt-1" size={18} color={palette.teal} /><Text style={styles.registrationButtonText}>{language === "en" ? "New user? Request an account" : "مستخدم جديد؟ اطلب إنشاء حساب"}</Text></Pressable>
        <View style={[styles.centralInfo, { flexDirection: isRTL ? "row-reverse" : "row" }]}><MaterialIcons name="verified-user" size={17} color={palette.teal} /><Text style={[styles.centralInfoText, { writingDirection: textDirection, textAlign }]}>{language === "en" ? "All accounts are verified centrally. New devices never create a local administrator." : "تُتحقق جميع الحسابات مركزيًا. لا يمكن لأي جهاز جديد إنشاء مشرف محلي."}</Text></View>
      </View>
      <Image source={require("../assets/images/neurify-wordmark.png")} style={[styles.neurifyWordmark, { width: layout.loginWordmarkWidth, height: layout.loginWordmarkHeight }]} resizeMode="contain" accessibilityLabel="Neurify" />
      <Text style={[styles.footnote, { writingDirection: textDirection }]}>{t("training")}</Text>
    </ScrollView>

    <Modal visible={recoveryOpen} transparent animationType="slide" onRequestClose={closeRecovery}>
      <View style={styles.modalShade}><ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled"><View style={styles.handle} /><Text style={[styles.sheetTitle, { writingDirection: textDirection, textAlign }]}>{language === "en" ? "Recover your password" : "استعادة كلمة المرور"}</Text>{recoveryStage === "request" ? <><Text style={[styles.sheetText, { writingDirection: textDirection, textAlign }]}>{language === "en" ? "Enter the approved email for your account. If it is eligible, we will send a six-digit code that expires in 15 minutes." : "أدخل البريد الإلكتروني المعتمد للحساب. إذا كان مؤهلًا، سنرسل رمزًا من ستة أرقام تنتهي صلاحيته خلال 15 دقيقة."}</Text><RegisterField label={language === "en" ? "Approved email" : "البريد الإلكتروني المعتمد"} value={recoveryEmail} onChangeText={setRecoveryEmail} placeholder="name@hospital.sa" isRTL={isRTL} keyboardType="email-address" autoCapitalize="none" /><PrimaryButton label={recoveryBusy ? (language === "en" ? "Sending…" : "جارٍ الإرسال…") : (language === "en" ? "Send recovery code" : "إرسال رمز الاستعادة")} icon="email" onPress={handleRecoveryRequest} disabled={recoveryBusy} /></> : <><Text style={[styles.sheetText, { writingDirection: textDirection, textAlign }]}>{language === "en" ? "Enter the code sent to your approved email, then set a new password." : "أدخل الرمز المرسل إلى بريدك المعتمد، ثم عيّن كلمة مرور جديدة."}</Text><RegisterField label={language === "en" ? "Six-digit code" : "رمز الاستعادة المكوّن من ستة أرقام"} value={recoveryCode} onChangeText={setRecoveryCode} placeholder="123456" isRTL={isRTL} /><RegisterField label={language === "en" ? "New password" : "كلمة المرور الجديدة"} value={recoveryPassword} onChangeText={setRecoveryPassword} placeholder={language === "en" ? "At least 12 characters" : "12 حرفًا على الأقل"} isRTL={isRTL} secureTextEntry /><RegisterField label={language === "en" ? "Confirm new password" : "تأكيد كلمة المرور الجديدة"} value={recoveryConfirmation} onChangeText={setRecoveryConfirmation} placeholder={language === "en" ? "Enter it again" : "أدخلها مرة أخرى"} isRTL={isRTL} secureTextEntry /><PrimaryButton label={recoveryBusy ? (language === "en" ? "Updating…" : "جارٍ التحديث…") : (language === "en" ? "Update password" : "تحديث كلمة المرور")} icon="vpn-key" onPress={handleRecoveryConfirm} disabled={recoveryBusy} /><Pressable onPress={() => setRecoveryStage("request")} style={styles.cancelRegistration}><Text style={styles.cancelRegistrationText}>{language === "en" ? "Request a new code" : "طلب رمز جديد"}</Text></Pressable></>}<Pressable onPress={closeRecovery} style={styles.cancelRegistration}><Text style={styles.cancelRegistrationText}>{language === "en" ? "Cancel" : "إلغاء"}</Text></Pressable></ScrollView></View>
    </Modal>

    <Modal visible={registrationOpen} transparent animationType="slide" onRequestClose={() => setRegistrationOpen(false)}>
      <View style={styles.modalShade}><ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled"><View style={styles.handle} /><Text style={[styles.sheetTitle, { writingDirection: textDirection, textAlign }]}>{language === "en" ? "Request a new account" : "طلب تسجيل مستخدم جديد"}</Text><Text style={[styles.sheetText, { writingDirection: textDirection, textAlign }]}>{language === "en" ? "Your request is held centrally until a department administrator or authorized approver confirms it." : "يُحفظ طلبك مركزيًا بانتظار اعتماد مشرف القسم أو المستخدم المفوض بالموافقات."}</Text><RegisterField label={language === "en" ? "Full name" : "الاسم الكامل"} value={registration.name} onChangeText={(value) => setRegistration({ ...registration, name: value })} placeholder={language === "en" ? "Your full name" : "اكتب الاسم الكامل"} isRTL={isRTL} /><RegisterField label={language === "en" ? "Phone number" : "رقم الهاتف"} value={registration.phone} onChangeText={(value) => setRegistration({ ...registration, phone: value })} placeholder="05XXXXXXXX" isRTL={isRTL} keyboardType="phone-pad" /><RegisterField label={language === "en" ? "Job title" : "المسمى الوظيفي"} value={registration.jobTitle} onChangeText={(value) => setRegistration({ ...registration, jobTitle: value })} placeholder={language === "en" ? "e.g. Resident" : "مثال: طبيب مقيم"} isRTL={isRTL} /><RegisterField label={language === "en" ? "Email" : "البريد الإلكتروني"} value={registration.email} onChangeText={(value) => setRegistration({ ...registration, email: value })} placeholder="name@hospital.sa" isRTL={isRTL} keyboardType="email-address" autoCapitalize="none" /><RegisterField label={language === "en" ? "Password" : "كلمة المرور"} value={registration.password} onChangeText={(value) => setRegistration({ ...registration, password: value })} placeholder={language === "en" ? "At least 12 characters" : "12 حرفًا على الأقل"} isRTL={isRTL} secureTextEntry /><RegisterField label={language === "en" ? "Confirm password" : "تأكيد كلمة المرور"} value={registration.confirmation} onChangeText={(value) => setRegistration({ ...registration, confirmation: value })} placeholder={language === "en" ? "Enter it again" : "أدخلها مرة أخرى"} isRTL={isRTL} secureTextEntry /><PrimaryButton label={submitting ? (language === "en" ? "Submitting…" : "جارٍ الإرسال...") : (language === "en" ? "Submit registration request" : "إرسال طلب التسجيل")} icon="how-to-reg" onPress={handleRegistration} disabled={submitting} /><Pressable onPress={() => setRegistrationOpen(false)} style={styles.cancelRegistration}><Text style={styles.cancelRegistrationText}>{language === "en" ? "Cancel" : "إلغاء"}</Text></Pressable></ScrollView></View>
    </Modal>
    {dashboardTransitioning && <Animated.View style={[styles.dashboardTransition, { opacity: dashboardTransitionOpacity }]} pointerEvents="auto"><View style={styles.dashboardTransitionCard}><MaterialIcons name="verified-user" size={34} color={loginColors.teal} /><Text style={[styles.dashboardTransitionTitle, { writingDirection: textDirection }]}>{language === "en" ? "Access confirmed" : "تم تأكيد الدخول"}</Text><Text style={[styles.dashboardTransitionText, { writingDirection: textDirection }]}>{language === "en" ? "Opening the department dashboard…" : "جارٍ فتح لوحة القسم…"}</Text></View></Animated.View>}
  </KeyboardAvoidingView>;
}

const credentialStyles = StyleSheet.create({
  inputShell: { borderColor: loginColors.error, backgroundColor: "#FFF7F6" },
  notice: { alignItems: "flex-start", gap: 7, backgroundColor: "#FFF1F0", borderColor: "#F2B8B5", borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9, marginTop: 4, marginBottom: 12 },
  noticeText: { color: loginColors.error, flex: 1, fontSize: 11, fontWeight: "700", lineHeight: 16 },
  forgotButton: { alignSelf: "flex-start", minHeight: 36, alignItems: "center", justifyContent: "center", gap: 6, marginTop: -8, marginBottom: 5 },
  forgotText: { color: loginColors.teal, fontSize: 12, fontWeight: "800" },
});

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: loginColors.canvas },
  topDecoration: { position: "absolute", top: 0, left: 0, right: 0, height: 292, backgroundColor: loginColors.navy, borderBottomLeftRadius: 54, borderBottomRightRadius: 54 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 58, paddingBottom: 30, alignItems: "center" },
  languageToggle: { position: "absolute", right: 22, flexDirection: "row", backgroundColor: "#FFFFFF24", padding: 3, borderRadius: 12 },
  languageButton: { minWidth: 56, alignItems: "center", paddingHorizontal: 7, paddingVertical: 6, borderRadius: 9 },
  languageButtonActive: { backgroundColor: "#FFFFFF" },
  languageText: { color: "#D9F0F0", fontSize: 11, fontWeight: "800" },
  languageTextActive: { color: loginColors.navy },
  mark: { backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: loginColors.gold, padding: 6, overflow: "hidden" },
  title: { marginTop: 12, color: "#FFFFFF", fontWeight: "900", textAlign: "center" },
  subtitle: { marginTop: 5, color: "#D9F0F0", fontSize: 14, fontWeight: "700" },
  description: { color: loginColors.muted, fontSize: 14, lineHeight: 22, textAlign: "center", paddingHorizontal: 16 },
  form: { width: "100%", backgroundColor: "#FFFFFF", borderRadius: 22, borderWidth: 1, borderColor: loginColors.line, shadowColor: loginColors.navy, shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 9 }, elevation: 3 },
  formTitle: { color: loginColors.ink, fontSize: 19, fontWeight: "900", marginBottom: 18 },
  label: { color: loginColors.ink, fontSize: 13, fontWeight: "800", marginBottom: 7 },
  inputShell: { height: 50, borderColor: loginColors.line, borderWidth: 1, borderRadius: 14, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, gap: 9, marginBottom: 14 },
  input: { flex: 1, color: loginColors.ink, fontSize: 14 },
  passwordVisibility: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 17 },
  registrationButton: { minHeight: 45, marginTop: 11, backgroundColor: loginColors.tealPale, borderColor: "#9ACCC7", borderWidth: 1, borderRadius: 13, alignItems: "center", justifyContent: "center", flexDirection: "row-reverse", gap: 8 },
  registrationButtonText: { color: loginColors.teal, fontSize: 12, fontWeight: "900" },
  centralInfo: { marginTop: 14, alignItems: "center", gap: 6, backgroundColor: loginColors.goldPale, padding: 10, borderRadius: 12 },
  centralInfoText: { color: "#6C5D17", fontSize: 11, lineHeight: 17, flex: 1 },
  neurifyWordmark: { width: 106, height: 32, marginTop: 17, opacity: 0.82 },
  modalShade: { flex: 1, backgroundColor: "#163F6678", justifyContent: "flex-end" },
  sheet: { maxHeight: "91%", backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheetContent: { padding: 20, paddingBottom: 38 },
  handle: { width: 40, height: 4, borderRadius: 3, backgroundColor: loginColors.line, alignSelf: "center", marginBottom: 15 },
  sheetTitle: { color: loginColors.ink, fontSize: 20, fontWeight: "900" },
  sheetText: { color: loginColors.muted, fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 7 },
  registerFieldLabel: { color: loginColors.ink, fontSize: 12, fontWeight: "800", marginTop: 11, marginBottom: 5 },
  registerFieldInput: { minHeight: 47, borderWidth: 1, borderColor: loginColors.line, borderRadius: 12, paddingHorizontal: 12, color: loginColors.ink, fontSize: 13, backgroundColor: "#FCFEFE" },
  cancelRegistration: { minHeight: 42, marginTop: 8, alignItems: "center", justifyContent: "center" },
  cancelRegistrationText: { color: loginColors.muted, fontSize: 13, fontWeight: "800" },
  footnote: { color: loginColors.muted, fontSize: 11, textAlign: "center", lineHeight: 17, marginTop: 8, paddingHorizontal: 12 },
  dashboardTransition: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "#163F66E8", padding: 28 },
  dashboardTransitionCard: { width: "100%", maxWidth: 292, alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 24, borderWidth: 1, borderColor: "#D4B62E", paddingHorizontal: 24, paddingVertical: 28, shadowColor: "#061E31", shadowOpacity: 0.28, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  dashboardTransitionTitle: { marginTop: 13, color: loginColors.ink, fontSize: 18, fontWeight: "900", textAlign: "center" },
  dashboardTransitionText: { marginTop: 7, color: loginColors.muted, fontSize: 13, lineHeight: 20, textAlign: "center" },
});

function RegisterField({ label, value, onChangeText, placeholder, isRTL, keyboardType, autoCapitalize, secureTextEntry }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; isRTL: boolean; keyboardType?: "default" | "email-address" | "phone-pad"; autoCapitalize?: "none"; secureTextEntry?: boolean }) {
  return <View><Text style={[styles.registerFieldLabel, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9FB3C8" keyboardType={keyboardType} autoCapitalize={autoCapitalize} secureTextEntry={secureTextEntry} textAlign={isRTL ? "right" : "left"} style={[styles.registerFieldInput, { writingDirection: isRTL ? "rtl" : "ltr" }]} /></View>;
}
