import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing } from "react-native";
import { useAppLanguage } from "@/lib/language";

export function LanguageTransition({ children }: { children: ReactNode }) {
  const { language, isRTL } = useAppLanguage();
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    opacity.setValue(0.82);
    translateX.setValue(isRTL ? 12 : -12);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [isRTL, language, opacity, translateX]);

  return <Animated.View style={{ flex: 1, opacity, transform: [{ translateX }] }}>{children}</Animated.View>;
}
