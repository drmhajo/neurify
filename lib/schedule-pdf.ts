import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export type PickedSchedulePdf = { fileName: string; localUri: string };

export async function pickSchedulePdf(): Promise<PickedSchedulePdf | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
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
  return { fileName: asset.name, localUri };
}
