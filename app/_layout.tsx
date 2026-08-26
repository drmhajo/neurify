import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider } from "@/lib/theme-provider";
import { DepartmentProvider } from "@/lib/department-store";
import { PushNotificationBootstrap } from "@/components/push-notification-bootstrap";
import { LanguageProvider } from "@/lib/language";
import { LanguageTransition } from "@/components/language-transition";

export default function RootLayout() {
  return <GestureHandlerRootView style={{ flex: 1 }}><ThemeProvider><LanguageProvider><LanguageTransition><DepartmentProvider><PushNotificationBootstrap /><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, animation: "fade" }}><Stack.Screen name="index" /><Stack.Screen name="login" /><Stack.Screen name="(tabs)" /><Stack.Screen name="team/[id]" options={{ presentation: "card" }} /><Stack.Screen name="patient/[teamId]/[caseId]" options={{ presentation: "card" }} /><Stack.Screen name="notifications" options={{ presentation: "card" }} /><Stack.Screen name="profile" options={{ presentation: "modal" }} /></Stack></DepartmentProvider></LanguageTransition></LanguageProvider></ThemeProvider></GestureHandlerRootView>;
}
