import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { backupFileName, parseDepartmentBackup, type DepartmentBackup } from "@/lib/department-backup";

export async function exportDepartmentBackup(backup: DepartmentBackup): Promise<"shared" | "downloaded" | "unavailable"> {
  const json = JSON.stringify(backup, null, 2);
  const name = backupFileName(backup);
  if (Platform.OS === "web") {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = name; anchor.click();
    URL.revokeObjectURL(url);
    return "downloaded";
  }
  if (!FileSystem.documentDirectory || !(await Sharing.isAvailableAsync())) return "unavailable";
  const folder = `${FileSystem.documentDirectory}backups/`;
  await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
  const uri = `${folder}${name}`;
  await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });
  await Sharing.shareAsync(uri, { mimeType: "application/json", dialogTitle: "حفظ النسخة الاحتياطية" });
  return "shared";
}

export async function pickDepartmentBackup(): Promise<{ ok: true; backup: DepartmentBackup } | { ok: false; cancelled?: boolean; error: string }> {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/json", "text/json"], copyToCacheDirectory: true, multiple: false });
    if (result.canceled) return { ok: false, cancelled: true, error: "" };
    const asset = result.assets[0];
    const text = Platform.OS === "web" && asset.file ? await asset.file.text() : await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
    return parseDepartmentBackup(text);
  } catch { return { ok: false, error: "تعذر فتح ملف النسخة الاحتياطية." }; }
}
