import { useCallback, useEffect, useState } from "react";
import { enablePushNotifications, getPushPermissionState, type PushSetupState } from "@/lib/push-notifications";

export function usePushNotifications(staffId?: string) {
  const [state, setState] = useState<PushSetupState>("idle");
  const [message, setMessage] = useState("فعّل التنبيهات لتصلك التحديثات حتى خارج التطبيق.");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPushPermissionState().then((nextState) => {
      setState(nextState);
      if (nextState === "enabled") setMessage("الإشعارات مفعّلة على هذا الجهاز.");
      if (nextState === "unavailable") setMessage("تتطلب الإشعارات الفورية جهازاً فعلياً وتطبيقاً مثبتاً.");
    }).catch(() => undefined);
  }, []);

  const enable = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    const result = await enablePushNotifications(staffId);
    setState(result.state);
    setMessage(result.message);
    setLoading(false);
  }, [staffId]);

  return { state, message, loading, enable };
}
