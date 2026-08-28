import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider } from "@/lib/theme-provider";
import { DepartmentProvider, useDepartment } from "@/lib/department-store";
import { PushNotificationBootstrap } from "@/components/push-notification-bootstrap";
import { LanguageProvider } from "@/lib/language";
import { LanguageTransition } from "@/components/language-transition";
import { LogoLoading } from "@/components/logo-loading";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.setOptions({ duration: 260, fade: true });

export default function RootLayout() {
  return <GestureHandlerRootView style={{ flex: 1 }}><ThemeProvider><LanguageProvider><LanguageTransition><DepartmentProvider><AppNavigator /></DepartmentProvider></LanguageTransition></LanguageProvider></ThemeProvider></GestureHandlerRootView>;
}

function AppNavigator() {
  const { hydrated } = useDepartment();
  if (!hydrated) return <LogoLoading label="جارٍ تحميل بيانات القسم…" />;
  return <><PushNotificationBootstrap /><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, animation: "fade" }}><Stack.Screen name="index" /><Stack.Screen name="login" /><Stack.Screen name="(tabs)" /><Stack.Screen name="team/[id]" options={{ presentation: "card" }} /><Stack.Screen name="patient/[teamId]/[caseId]" options={{ presentation: "card" }} /><Stack.Screen name="notifications" options={{ presentation: "card" }} /><Stack.Screen name="registration-requests" options={{ presentation: "card" }} /><Stack.Screen name="profile" options={{ presentation: "modal" }} /></Stack></>;
}
