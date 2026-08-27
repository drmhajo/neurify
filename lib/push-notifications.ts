import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { createTRPCClient } from "@/lib/trpc";

const PUSH_REGISTRATION_KEY_PREFIX = "ksmc.neuro.push-registration.";

export type PushSetupState = "idle" | "enabled" | "denied" | "unavailable" | "needs_build" | "error";

export type PushSetupResult = {
  state: PushSetupState;
  message: string;
  token?: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return Constants.easConfig?.projectId ?? extra?.eas?.projectId;
}

export async function getPushPermissionState(): Promise<PushSetupState> {
  if (Platform.OS === "web") return "unavailable";
  const settings = await Notifications.getPermissionsAsync();
  return settings.status === "granted" ? "enabled" : "idle";
}

export async function isPushDeviceRegistered(staffId: string): Promise<boolean> {
  return (await AsyncStorage.getItem(`${PUSH_REGISTRATION_KEY_PREFIX}${staffId}`)) === "registered";
}

export async function enablePushNotifications(staffId: string): Promise<PushSetupResult> {
  if (Platform.OS === "web") {
    return { state: "unavailable", message: "تتطلب الإشعارات الفورية تثبيت التطبيق على جهاز iPhone أو Android فعلي." };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("department-alerts", {
      name: "تنبيهات قسم جراحة المخ والأعصاب",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 150, 200],
      lightColor: "#075985",
      sound: "default",
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let finalStatus = current.status;
  if (finalStatus !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }
  if (finalStatus !== "granted") {
    return { state: "denied", message: "لم يتم منح إذن الإشعارات. يمكنك تفعيله لاحقاً من إعدادات الجهاز." };
  }

  const projectId = getProjectId();
  if (!projectId) {
    return { state: "needs_build", message: "يلزم ربط الحزمة بمعرّف مشروع Expo ثم إصدار نسخة تطبيق جديدة لتسجيل هذا الجهاز للإشعارات الفورية." };
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const client = createTRPCClient();
    const registration = await client.push.register.mutate({ staffId, token, platform: Platform.OS === "ios" ? "ios" : "android" });
    if (!registration.persisted) return { state: "error", message: "تعذر حفظ تسجيل الجهاز في خدمة الإشعارات. حاول مرة أخرى لاحقاً." };
    await AsyncStorage.setItem(`${PUSH_REGISTRATION_KEY_PREFIX}${staffId}`, "registered");
    return { state: "enabled", message: "تم تفعيل التنبيهات الفورية على هذا الجهاز.", token };
  } catch {
    return { state: "error", message: "تعذر تسجيل الجهاز حالياً. تحقق من الاتصال بالشبكة وحاول مرة أخرى." };
  }
}

export async function dispatchTeamPush(input: {
  teamId: string;
  recipientIds: string[];
  type: "consultation" | "admitted_case";
}): Promise<void> {
  if (Platform.OS === "web") return;
  const title = input.type === "consultation" ? "استشارة جديدة في غرفة الفريق" : "حالة منوّمة جديدة في غرفة الفريق";
  const body = input.type === "consultation" ? "تمت إضافة استشارة جديدة. افتح غرفة الفريق للمتابعة." : "تمت إضافة حالة منوّمة جديدة. افتح غرفة الفريق للمتابعة.";
  try {
    const client = createTRPCClient();
    await client.push.sendTeam.mutate({
      teamId: input.teamId,
      recipientIds: input.recipientIds,
      type: input.type,
      title,
      body,
    });
  } catch {
    // يبقى التنبيه الداخلي متاحاً حتى تتم إعادة المحاولة في التحديث المؤسسي للخادم.
  }
}

export async function dispatchGeneralPush(input: {
  recipientIds: string[];
  title: string;
  body: string;
}): Promise<void> {
  try {
    const client = createTRPCClient();
    await client.push.sendGeneral.mutate(input);
  } catch {
    // يبقى الإعلان الداخلي محفوظاً، وتُعاد محاولة Push عند الإعلان التالي أو بعد تفعيل الجهاز.
  }
}
