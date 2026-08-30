import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { NEUROSURGERY_DIAGNOSES, diagnosisLabel, type DiagnosisLanguage } from "@/lib/neurosurgery-diagnosis-catalog";
import { palette } from "@/components/neuro-ui";

type DiagnosisPickerProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  language: DiagnosisLanguage;
  isRTL: boolean;
  placeholder: string;
  multiline?: boolean;
};

export function NeurosurgeryDiagnosisPicker({ label, value, onChangeText, language, isRTL, placeholder, multiline = false }: DiagnosisPickerProps) {
  const [showOptions, setShowOptions] = useState(false);
  return <View>
    <View style={[styles.labelRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
      <Text style={[styles.label, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showOptions }} accessibilityLabel={language === "en" ? "Show common neurosurgery diagnoses" : "عرض التشخيصات الشائعة في جراحة المخ والأعصاب"} onPress={() => setShowOptions((current) => !current)} style={({ pressed }) => [styles.catalogButton, pressed && styles.pressed]}>
        <MaterialIcons name={showOptions ? "expand-less" : "format-list-bulleted"} size={16} color={palette.teal} />
        <Text style={styles.catalogButtonText}>{language === "en" ? "Common diagnoses" : "تشخيصات شائعة"}</Text>
      </Pressable>
    </View>
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9FB3C8" multiline={multiline} textAlign={isRTL ? "right" : "left"} style={[styles.input, multiline && styles.multilineInput, { writingDirection: isRTL ? "rtl" : "ltr" }]} />
    {showOptions ? <View style={styles.catalog}>
      <Text style={[styles.catalogHint, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{language === "en" ? "Select a diagnosis or enter another diagnosis above." : "اختر تشخيصًا أو اكتب تشخيصًا آخر في الحقل أعلاه."}</Text>
      <View style={[styles.options, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        {NEUROSURGERY_DIAGNOSES.map((option) => {
          const optionLabel = diagnosisLabel(option.code, language);
          const selected = value.trim() === optionLabel;
          return <Pressable key={option.code} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={optionLabel} onPress={() => { onChangeText(optionLabel); setShowOptions(false); }} style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}>
            <Text style={[styles.optionText, selected && styles.optionTextSelected, { writingDirection: isRTL ? "rtl" : "ltr" }]}>{optionLabel}</Text>
          </Pressable>;
        })}
      </View>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  labelRow: { alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 11, marginBottom: 5 },
  label: { color: palette.ink, flex: 1, fontSize: 12, fontWeight: "800" },
  catalogButton: { minHeight: 32, alignItems: "center", flexDirection: "row", gap: 4, paddingHorizontal: 8, borderRadius: 9, backgroundColor: palette.paleTeal },
  catalogButtonText: { color: palette.teal, fontSize: 10, fontWeight: "900" },
  input: { borderWidth: 1, borderColor: palette.line, borderRadius: 13, minHeight: 46, paddingHorizontal: 12, color: palette.ink },
  multilineInput: { minHeight: 76, textAlignVertical: "top", paddingTop: 10 },
  catalog: { marginTop: 7, padding: 10, borderRadius: 12, backgroundColor: "#F5FBFA", borderWidth: 1, borderColor: "#BDE5DB" },
  catalogHint: { color: palette.muted, fontSize: 10, lineHeight: 15, marginBottom: 8 },
  options: { flexWrap: "wrap", gap: 7 },
  option: { minHeight: 32, borderRadius: 10, borderWidth: 1, borderColor: "#BDE5DB", backgroundColor: "#FFFFFF", justifyContent: "center", paddingHorizontal: 9 },
  optionSelected: { backgroundColor: palette.teal, borderColor: palette.teal },
  optionText: { color: palette.teal, fontSize: 10, fontWeight: "800" },
  optionTextSelected: { color: "#FFFFFF" },
  pressed: { opacity: 0.74 },
});
