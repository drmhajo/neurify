import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAssets } from "expo-asset";
import { useFonts } from "expo-font";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
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
  const [materialIconsLoaded, materialIconsError] = useFonts(MaterialIcons.font);
  const [coreUiAssets, coreUiAssetsError] = useAssets([
    require("../assets/fonts/MaterialIcons.ttf"),
    require("../assets/images/icon.png"),
    require("../assets/images/neurify-wordmark.png"),
    require("../assets/images/neurosurgery-department-logo.png"),
  ]);
  const iconFontReady = materialIconsLoaded || Boolean(materialIconsError);
  const coreUiAssetsReady = Boolean(coreUiAssets) || Boolean(coreUiAssetsError);
  const startupAssetsReady = iconFontReady && coreUiAssetsReady;

  return <GestureHandlerRootView style={{ flex: 1 }}><ThemeProvider><LanguageProvider>{startupAssetsReady ? <LanguageTransition><DepartmentProvider><AppNavigator /></DepartmentProvider></LanguageTransition> : <LogoLoading />}</LanguageProvider></ThemeProvider></GestureHandlerRootView>;
}

function AppNavigator() {
  const { hydrated } = useDepartment();
  if (!hydrated) return <LogoLoading label="جارٍ تحميل بيانات القسم…" />;
  return <><PushNotificationBootstrap /><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, animation: "fade" }}><Stack.Screen name="index" /><Stack.Screen name="login" /><Stack.Screen name="(tabs)" options={{ animation: "fade_from_bottom" }} /><Stack.Screen name="team/[id]" options={{ presentation: "card" }} /><Stack.Screen name="patient/[teamId]/[caseId]" options={{ presentation: "card" }} /><Stack.Screen name="notifications" options={{ presentation: "card" }} /><Stack.Screen name="registration-requests" options={{ presentation: "card" }} /><Stack.Screen name="profile" options={{ presentation: "modal" }} /></Stack></>;
}
