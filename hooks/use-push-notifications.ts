import { useCallback, useEffect, useState } from "react";
import { enablePushNotifications, getPushPermissionState, isPushDeviceRegistered, type PushSetupState } from "@/lib/push-notifications";

export function usePushNotifications(staffId?: string, pushProof?: string) {
  const [state, setState] = useState<PushSetupState>("idle");
  const [message, setMessage] = useState("فعّل التنبيهات لتصلك التحديثات حتى خارج التطبيق.");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([getPushPermissionState(), staffId ? isPushDeviceRegistered(staffId) : Promise.resolve(false)]).then(([permissionState, registered]) => {
      if (permissionState === "enabled" && registered) {
        setState("enabled");
        setMessage("الإشعارات مفعّلة على هذا الجهاز.");
      } else if (permissionState === "enabled") {
        setState("idle");
        setMessage("تم منح إذن الإشعارات. اضغط لتسجيل هذا الجهاز لتلقي التنبيهات الفورية.");
      } else {
        setState(permissionState);
        if (permissionState === "unavailable") setMessage("تتطلب الإشعارات الفورية جهازاً فعلياً وتطبيقاً مثبتاً.");
      }
    }).catch(() => undefined);
  }, [staffId]);

  const enable = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    const result = await enablePushNotifications(staffId, pushProof);
    setState(result.state);
    setMessage(result.message);
    setLoading(false);
  }, [pushProof, staffId]);

  return { state, message, loading, enable };
}
