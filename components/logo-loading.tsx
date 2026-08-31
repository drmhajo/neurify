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
  const innerRingRotation = useRef(new Animated.Value(1)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkLift = useRef(new Animated.Value(8)).current;
  const firstDot = useRef(new Animated.Value(0.28)).current;
  const secondDot = useRef(new Animated.Value(0.28)).current;
  const thirdDot = useRef(new Animated.Value(0.28)).current;

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
    const innerSpin = Animated.loop(Animated.timing(innerRingRotation, { toValue: 0, duration: 3200, easing: Easing.linear, useNativeDriver: true }));
    const revealWordmark = Animated.parallel([
      Animated.timing(wordmarkOpacity, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(wordmarkLift, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    const pulseDot = (dot: Animated.Value, delay: number) => Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(dot, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.timing(dot, { toValue: 0.28, duration: 440, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    const firstDotPulse = pulseDot(firstDot, 0);
    const secondDotPulse = pulseDot(secondDot, 150);
    const thirdDotPulse = pulseDot(thirdDot, 300);
    pulse.start();
    spin.start();
    innerSpin.start();
    revealWordmark.start();
    firstDotPulse.start();
    secondDotPulse.start();
    thirdDotPulse.start();
    return () => { pulse.stop(); spin.stop(); innerSpin.stop(); revealWordmark.stop(); firstDotPulse.stop(); secondDotPulse.stop(); thirdDotPulse.stop(); };
  }, [firstDot, innerRingRotation, opacity, ringRotation, scale, secondDot, thirdDot, wordmarkLift, wordmarkOpacity]);

  const text = label ?? (language === "en" ? "Preparing securely…" : "جارٍ التجهيز بأمان…");
  const stageText = label ? (language === "en" ? "Loading your secure workspace" : "جارٍ تحميل مساحة العمل الآمنة") : (language === "en" ? "Loading interface icons and essentials" : "جارٍ تحميل أيقونات الواجهة والعناصر الأساسية");
  const rotation = ringRotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const innerRotation = innerRingRotation.interpolate({ inputRange: [0, 1], outputRange: ["-360deg", "0deg"] });
  return <View style={[styles.container, overlay && styles.overlay]} accessibilityRole="progressbar" accessibilityLabel={text}>
    <View style={styles.content}>
      <Animated.View style={[styles.ring, { transform: [{ rotate: rotation }] }]} />
      <Animated.View style={[styles.innerRing, { transform: [{ rotate: innerRotation }] }]} />
      <Animated.View style={[styles.logoShell, { opacity, transform: [{ scale }] }]}> 
        <Image source={require("../assets/images/icon.png")} style={styles.logo} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={{ opacity: wordmarkOpacity, transform: [{ translateY: wordmarkLift }] }}>
        <Image source={require("../assets/images/neurify-wordmark.png")} style={styles.wordmark} resizeMode="contain" accessibilityLabel="Neurify" />
      </Animated.View>
      <Text style={[styles.label, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: "center" }]}>{text}</Text>
      <View style={styles.progressRow} accessibilityLabel={stageText}>
        <Animated.View style={[styles.dot, { opacity: firstDot, transform: [{ scale: firstDot }] }]} />
        <Animated.View style={[styles.dot, { opacity: secondDot, transform: [{ scale: secondDot }] }]} />
        <Animated.View style={[styles.dot, { opacity: thirdDot, transform: [{ scale: thirdDot }] }]} />
      </View>
      <Text style={[styles.stage, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: "center" }]}>{stageText}</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.canvas, padding: 24 },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 20, backgroundColor: "#F3F7FBEF" },
  content: { minWidth: 236, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", height: 146, width: 146, borderRadius: 73, borderWidth: 3, borderColor: "#BDE5DB", borderTopColor: palette.teal, borderRightColor: "#D8EAF5" },
  innerRing: { position: "absolute", height: 122, width: 122, borderRadius: 61, borderWidth: 1.5, borderColor: "#D4E7F3", borderBottomColor: palette.navy, borderStyle: "dashed" },
  logoShell: { height: 104, width: 104, borderRadius: 30, backgroundColor: palette.navy, alignItems: "center", justifyContent: "center", shadowColor: palette.navy, shadowOpacity: 0.2, shadowRadius: 12, elevation: 3 },
  logo: { height: 88, width: 88 },
  wordmark: { height: 44, width: 196, marginTop: 18 },
  label: { color: palette.navy, fontSize: 13, fontWeight: "800", marginTop: 14 },
  progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 14, marginTop: 13 },
  dot: { height: 8, width: 8, borderRadius: 4, backgroundColor: palette.teal },
  stage: { color: palette.muted, fontSize: 11, fontWeight: "700", marginTop: 7 },
});
