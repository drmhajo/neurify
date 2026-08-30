import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { palette } from "@/components/neuro-ui";
import { searchStandardWards } from "@/lib/ward-catalog";

type WardPickerProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  language: "ar" | "en";
  isRTL: boolean;
};

export function WardPicker({ label, value, onChangeText, language, isRTL }: WardPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wards = useMemo(() => searchStandardWards(query), [query]);
  const chooseWard = (ward: string) => { onChangeText(ward); setQuery(""); setOpen(false); };
  const close = () => { setQuery(""); setOpen(false); };
  const prompt = language === "en" ? "Select a standardized ward" : "اختر جناحًا موحدًا";
  return <View>
    <Text style={[styles.label, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={language === "en" ? "Select ward" : "اختيار الجناح"} onPress={() => setOpen(true)} style={({ pressed }) => [styles.selector, { flexDirection: isRTL ? "row-reverse" : "row" }, pressed && styles.pressed]}>
      <MaterialIcons name="hotel" size={19} color={palette.teal} />
      <Text style={[styles.selectorText, !value && styles.placeholder, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]} numberOfLines={1}>{value || prompt}</Text>
      <MaterialIcons name={isRTL ? "keyboard-arrow-left" : "keyboard-arrow-right"} size={22} color={palette.navy} />
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.shade} onPress={close}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={[styles.sheetHead, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={styles.sheetTitleGroup}><Text style={[styles.sheetTitle, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{language === "en" ? "Select ward" : "اختيار الجناح"}</Text><Text style={[styles.sheetHint, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{language === "en" ? "Search the standard ward list" : "ابحث في قائمة الأجنحة الموحدة"}</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel={language === "en" ? "Close ward list" : "إغلاق قائمة الأجنحة"} onPress={close} style={styles.close}><MaterialIcons name="close" size={20} color={palette.navy} /></Pressable>
          </View>
          <View style={[styles.search, { flexDirection: isRTL ? "row-reverse" : "row" }]}><MaterialIcons name="search" size={19} color={palette.teal} /><TextInput value={query} onChangeText={setQuery} placeholder={language === "en" ? "Search ward" : "ابحث عن جناح"} placeholderTextColor="#7890A2" autoFocus returnKeyType="search" style={[styles.searchInput, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]} /></View>
          {value ? <Pressable accessibilityRole="button" onPress={() => chooseWard("")} style={[styles.clear, { flexDirection: isRTL ? "row-reverse" : "row" }]}><MaterialIcons name="filter-alt-off" size={16} color={palette.muted} /><Text style={styles.clearText}>{language === "en" ? "Clear ward" : "مسح الجناح"}</Text></Pressable> : null}
          <FlatList data={wards} keyExtractor={(ward) => ward} keyboardShouldPersistTaps="handled" style={styles.list} contentContainerStyle={styles.listContent} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityState={{ selected: value === item }} onPress={() => chooseWard(item)} style={({ pressed }) => [styles.option, { flexDirection: isRTL ? "row-reverse" : "row" }, value === item && styles.optionSelected, pressed && styles.pressed]}><MaterialIcons name={value === item ? "check-circle" : "hotel"} size={18} color={value === item ? "#FFFFFF" : palette.teal} /><Text style={[styles.optionText, value === item && styles.optionTextSelected]}>{item}</Text></Pressable>} ListEmptyComponent={<Text style={[styles.empty, { writingDirection: isRTL ? "rtl" : "ltr", textAlign: isRTL ? "right" : "left" }]}>{language === "en" ? "No ward matches this search." : "لا يوجد جناح يطابق البحث."}</Text>} />
        </Pressable>
      </Pressable>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  label: { color: palette.ink, fontSize: 12, fontWeight: "800", marginTop: 11, marginBottom: 5 },
  selector: { minHeight: 46, borderWidth: 1, borderColor: palette.line, borderRadius: 13, alignItems: "center", gap: 9, paddingHorizontal: 12, backgroundColor: "#FFFFFF" },
  selectorText: { color: palette.ink, flex: 1, fontSize: 13, fontWeight: "700" }, placeholder: { color: "#9FB3C8", fontWeight: "400" },
  shade: { flex: 1, backgroundColor: "#102A4370", justifyContent: "flex-end" }, sheet: { maxHeight: "78%", padding: 18, paddingBottom: 24, backgroundColor: "#FFFFFF", borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  sheetHead: { alignItems: "center", gap: 10, marginBottom: 13 }, sheetTitleGroup: { flex: 1 }, sheetTitle: { color: palette.ink, fontSize: 17, fontWeight: "900" }, sheetHint: { color: palette.muted, fontSize: 10, marginTop: 3 },
  close: { height: 36, width: 36, borderRadius: 12, backgroundColor: palette.paleBlue, alignItems: "center", justifyContent: "center" },
  search: { minHeight: 45, alignItems: "center", gap: 8, paddingHorizontal: 11, borderRadius: 13, borderWidth: 1, borderColor: "#BDE5DB", backgroundColor: "#F7FCFB" }, searchInput: { flex: 1, minHeight: 44, color: palette.ink, fontSize: 13 },
  clear: { alignSelf: "flex-start", minHeight: 31, marginTop: 8, alignItems: "center", gap: 4, paddingHorizontal: 8, borderRadius: 9, backgroundColor: palette.paleBlue }, clearText: { color: palette.muted, fontSize: 10, fontWeight: "800" },
  list: { marginTop: 10 }, listContent: { gap: 7, paddingBottom: 4 }, option: { minHeight: 44, alignItems: "center", gap: 9, borderRadius: 12, borderWidth: 1, borderColor: "#D6E4EB", paddingHorizontal: 12, backgroundColor: "#FFFFFF" }, optionSelected: { backgroundColor: palette.teal, borderColor: palette.teal }, optionText: { color: palette.ink, flex: 1, fontSize: 13, fontWeight: "800" }, optionTextSelected: { color: "#FFFFFF" }, empty: { color: palette.muted, paddingVertical: 24, fontSize: 12 }, pressed: { opacity: 0.72 },
});
