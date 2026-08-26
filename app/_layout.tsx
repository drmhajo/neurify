import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider } from "@/lib/theme-provider";
import { DepartmentProvider } from "@/lib/department-store";

export default function RootLayout() {
  return <GestureHandlerRootView style={{ flex: 1 }}><ThemeProvider><DepartmentProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, animation: "fade" }}><Stack.Screen name="index" /><Stack.Screen name="login" /><Stack.Screen name="(tabs)" /><Stack.Screen name="team/[id]" options={{ presentation: "card" }} /><Stack.Screen name="profile" options={{ presentation: "modal" }} /></Stack></DepartmentProvider></ThemeProvider></GestureHandlerRootView>;
}
