import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { palette } from "@/components/neuro-ui";
import { useAppLanguage } from "@/lib/language";

type LogoLoadingProps = {
  label?: string;
  overlay?: boolean;
};

export function LogoLoading({ label, overlay = false }: LogoLoadingProps) {
  const { language, isRTL } = useAppLanguage();
  const scale = useRef(new Animated.Value(0.94)).current;
  const opacity = useRef(new Animated.Value(0.72)).current;
  const ringRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 720, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 720, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.94, duration: 720, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.72, duration: 720, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      ]),
    ]));
    const spin = Animated.loop(Animated.timing(ringRotation, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: true }));
    pulse.start();
    spin.start();
    return () => { pulse.stop(); spin.stop(); };
  }, [opacity, ringRotation, scale]);

  const text = label ?? (language === "en" ? "Preparing securely…" : "جارٍ التجهيز بأمان…");
  const rotation = ringRotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return <View style={[styles.container, overlay && styles.overlay]} accessibilityRole="progressbar" accessibilityLabel={text}>
    <View style={styles.content}>
      <Animated.View style={[styles.ring, { transform: [{ rotate: rotation }] }]} />
      <Animated.View style={[styles.logoShell, { opacity, transform: [{ scale }] }]}>
        <Image source={require("../assets/images/icon.png")} style={styles.logo} resizeMode="contain" />
      </Animated.View>
      <Text style={[styles.label, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: "center" }]}>{text}</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.canvas, padding: 24 },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 20, backgroundColor: "#F3F7FBEF" },
  content: { minWidth: 210, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", height: 132, width: 132, borderRadius: 66, borderWidth: 3, borderColor: "#BDE5DB", borderTopColor: palette.teal },
  logoShell: { height: 104, width: 104, borderRadius: 30, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: palette.navy, shadowOpacity: 0.14, shadowRadius: 12, elevation: 3 },
  logo: { height: 88, width: 88 },
  label: { color: palette.navy, fontSize: 13, fontWeight: "800", marginTop: 28 },
});
