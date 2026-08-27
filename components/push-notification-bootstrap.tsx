import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";

export function PushNotificationBootstrap() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    const openNotification = (notification: Notifications.Notification) => {
      const destination = notification.request.content.data?.url;
      if (destination === "/notifications") { router.push("/notifications"); return; }
      const teamId = notification.request.content.data?.teamId;
      if (typeof teamId === "string") router.push({ pathname: "/team/[id]", params: { id: teamId } });
    };
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification) openNotification(response.notification);
    }).catch(() => undefined);
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => openNotification(response.notification));
    return () => subscription.remove();
  }, []);

  return null;
}
