import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useDepartment } from "@/lib/department-store";
import { palette, PrimaryButton } from "@/components/neuro-ui";

export default function LoginScreen() {
  const { signIn, signInWithGoogleDemo } = useDepartment();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    setSubmitting(true);
    const result = await signIn(username, password);
    setSubmitting(false);
    if (!result.ok) {
      Alert.alert("تعذر الدخول", result.message ?? "تحقق من بيانات الدخول.");
      return;
    }
    router.replace("/(tabs)");
  };

  const handleGoogle = async () => {
    await signInWithGoogleDemo();
    router.replace("/(tabs)");
  };

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.page}>
    <View style={styles.topDecoration} />
    <View style={styles.content}>
      <View style={styles.mark}><MaterialIcons name="medical-services" size={42} color="#FFFFFF" /></View>
      <Text style={styles.title}>قسم جراحة المخ والأعصاب</Text>
      <Text style={styles.subtitle}>مدينة الملك سعود الطبية</Text>
      <Text style={styles.description}>مساحة عمل داخلية لإدارة التنسيق السريري والفرق العلاجية.</Text>
      <View style={styles.form}>
        <Text style={styles.formTitle}>تسجيل الدخول</Text>
        <Text style={styles.label}>اسم المستخدم</Text>
        <View style={styles.inputShell}><MaterialIcons name="person-outline" size={20} color={palette.muted} /><TextInput value={username} onChangeText={setUsername} placeholder="أدخل اسم المستخدم" placeholderTextColor="#9FB3C8" autoCapitalize="none" textAlign="right" style={styles.input} returnKeyType="next" /></View>
        <Text style={styles.label}>كلمة المرور</Text>
        <View style={styles.inputShell}><MaterialIcons name="lock-outline" size={20} color={palette.muted} /><TextInput value={password} onChangeText={setPassword} placeholder="أدخل كلمة المرور" placeholderTextColor="#9FB3C8" secureTextEntry textAlign="right" style={styles.input} returnKeyType="done" onSubmitEditing={handleSignIn} /></View>
        <PrimaryButton label={submitting ? "جارِ التحقق..." : "دخول آمن"} onPress={handleSignIn} icon="login" disabled={submitting} />
        <View style={styles.orLine}><View style={styles.line} /><Text style={styles.orText}>أو</Text><View style={styles.line} /></View>
        <Pressable onPress={handleGoogle} style={({ pressed }) => [styles.googleButton, pressed && { opacity: 0.78 }]}><MaterialIcons name="account-circle" size={21} color={palette.navy} /><Text style={styles.googleText}>المتابعة باستخدام حساب Google</Text></Pressable>
        <View style={styles.demoInfo}><MaterialIcons name="info-outline" size={17} color={palette.gold} /><Text style={styles.demoText}>للعرض التجريبي: اسم المستخدم admin وكلمة المرور Neuro@2026</Text></View>
      </View>
      <Text style={styles.footnote}>نسخة تدريبية. لا تستخدم لإدخال بيانات المرضى الفعلية قبل اعتماد التكامل المؤسسي.</Text>
    </View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.canvas },
  topDecoration: { position: "absolute", top: 0, left: 0, right: 0, height: 250, backgroundColor: palette.navy, borderBottomLeftRadius: 48, borderBottomRightRadius: 48 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 72, alignItems: "center" },
  mark: { width: 82, height: 82, borderRadius: 28, backgroundColor: palette.teal, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "#FFFFFF55" },
  title: { marginTop: 14, color: "#FFFFFF", fontSize: 25, fontWeight: "900", writingDirection: "rtl", textAlign: "center" },
  subtitle: { marginTop: 5, color: "#D8EEF9", fontSize: 14, fontWeight: "700", writingDirection: "rtl" },
  description: { color: "#526D82", fontSize: 14, lineHeight: 22, textAlign: "center", writingDirection: "rtl", marginTop: 52, marginBottom: 18, paddingHorizontal: 16 },
  form: { width: "100%", backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: palette.line, shadowColor: "#102A43", shadowOpacity: 0.09, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  formTitle: { color: palette.ink, fontSize: 19, fontWeight: "900", writingDirection: "rtl", textAlign: "right", marginBottom: 18 },
  label: { color: palette.ink, fontSize: 13, fontWeight: "800", writingDirection: "rtl", textAlign: "right", marginBottom: 7 },
  inputShell: { height: 50, borderColor: palette.line, borderWidth: 1, borderRadius: 14, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, gap: 9, marginBottom: 14 },
  input: { flex: 1, color: palette.ink, fontSize: 14, writingDirection: "rtl" },
  orLine: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 17 },
  line: { flex: 1, height: 1, backgroundColor: palette.line },
  orText: { color: palette.muted, fontSize: 12, fontWeight: "700" },
  googleButton: { height: 48, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 9, borderColor: "#BED4E6", borderWidth: 1, borderRadius: 14, backgroundColor: "#FFFFFF" },
  googleText: { color: palette.navy, fontSize: 14, fontWeight: "800", writingDirection: "rtl" },
  demoInfo: { marginTop: 14, flexDirection: "row-reverse", alignItems: "center", gap: 6, backgroundColor: "#FFF7DF", padding: 10, borderRadius: 12 },
  demoText: { color: "#75530D", fontSize: 11, lineHeight: 17, flex: 1, textAlign: "right", writingDirection: "rtl" },
  footnote: { color: palette.muted, fontSize: 11, textAlign: "center", lineHeight: 17, marginTop: 18, writingDirection: "rtl", paddingHorizontal: 12 },
});
