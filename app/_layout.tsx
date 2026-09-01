import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAssets } from "expo-asset";
import { useFonts } from "expo-font";
import { Text, TextInput, type TextInputProps, type TextProps } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@/lib/theme-provider";
import { DepartmentProvider, useDepartment } from "@/lib/department-store";
import { PushNotificationBootstrap } from "@/components/push-notification-bootstrap";
import { LanguageProvider } from "@/lib/language";
import { LanguageTransition } from "@/components/language-transition";
import { LogoLoading } from "@/components/logo-loading";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.setOptions({ duration: 260, fade: true });

const styledText = Text as unknown as { defaultProps?: Partial<TextProps> };
const styledTextInput = TextInput as unknown as { defaultProps?: Partial<TextInputProps> };
styledText.defaultProps = { ...styledText.defaultProps, style: [styledText.defaultProps?.style, { fontFamily: "Cairo-Regular", includeFontPadding: false }] };
styledTextInput.defaultProps = { ...styledTextInput.defaultProps, style: [styledTextInput.defaultProps?.style, { fontFamily: "Cairo-Regular", includeFontPadding: false }] };

export default function RootLayout() {
  const [visualFontsLoaded, visualFontsError] = useFonts({
    material: require("../assets/fonts/MaterialIcons.ttf"),
    "material-community": require("../assets/fonts/MaterialCommunityIcons.ttf"),
    "Cairo-Regular": require("../assets/fonts/Cairo-Regular.ttf"),
    "Cairo-SemiBold": require("../assets/fonts/Cairo-SemiBold.ttf"),
    "Cairo-Bold": require("../assets/fonts/Cairo-Bold.ttf"),
  });
  const [coreUiAssets, coreUiAssetsError] = useAssets([
    require("../assets/fonts/MaterialIcons.ttf"),
    require("../assets/fonts/MaterialCommunityIcons.ttf"),
    require("../assets/fonts/Cairo-Regular.ttf"),
    require("../assets/fonts/Cairo-SemiBold.ttf"),
    require("../assets/fonts/Cairo-Bold.ttf"),
    require("../assets/images/icon.png"),
    require("../assets/images/neurify-wordmark.png"),
    require("../assets/images/neurosurgery-department-logo.png"),
  ]);
  const visualFontsReady = visualFontsLoaded || Boolean(visualFontsError);
  const coreUiAssetsReady = Boolean(coreUiAssets) || Boolean(coreUiAssetsError);
  const startupAssetsReady = visualFontsReady && coreUiAssetsReady;

  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><ThemeProvider><LanguageProvider>{startupAssetsReady ? <LanguageTransition><DepartmentProvider><AppNavigator /></DepartmentProvider></LanguageTransition> : <LogoLoading />}</LanguageProvider></ThemeProvider></SafeAreaProvider></GestureHandlerRootView>;
}

function AppNavigator() {
  const { hydrated } = useDepartment();
  if (!hydrated) return <LogoLoading label="جارٍ تحميل بيانات القسم…" />;
  return <><PushNotificationBootstrap /><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, animation: "fade" }}><Stack.Screen name="index" /><Stack.Screen name="login" /><Stack.Screen name="(tabs)" options={{ animation: "fade_from_bottom" }} /><Stack.Screen name="team/[id]" options={{ presentation: "card" }} /><Stack.Screen name="patient/[teamId]/[caseId]" options={{ presentation: "card" }} /><Stack.Screen name="notifications" options={{ presentation: "card" }} /><Stack.Screen name="registration-requests" options={{ presentation: "card" }} /><Stack.Screen name="profile" options={{ presentation: "modal" }} /></Stack></>;
}
