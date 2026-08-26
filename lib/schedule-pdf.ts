import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export type PickedScheduleFile = { fileName: string; localUri: string; mimeType: string };

export async function pickScheduleFile(): Promise<PickedScheduleFile | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  let localUri = asset.uri;
  if (Platform.OS !== "web" && FileSystem.documentDirectory) {
    const directory = `${FileSystem.documentDirectory}schedules/`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const safeName = asset.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const destination = `${directory}${Date.now()}_${safeName}`;
    await FileSystem.copyAsync({ from: asset.uri, to: destination });
    localUri = destination;
  }
  return { fileName: asset.name, localUri, mimeType: asset.mimeType ?? (asset.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/*") };
}
