import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export type PickedDiagnosticFile = {
  fileName: string;
  mimeType: string;
  localUri: string;
};

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function pickDiagnosticImagingFile(): Promise<PickedDiagnosticFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["image/*", "application/pdf"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  let localUri = asset.uri;

  if (Platform.OS !== "web" && FileSystem.documentDirectory) {
    const directory = `${FileSystem.documentDirectory}diagnostic-imaging/`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const destination = `${directory}${Date.now()}_${safeFileName(asset.name)}`;
    await FileSystem.copyAsync({ from: asset.uri, to: destination });
    localUri = destination;
  }

  return { fileName: asset.name, mimeType: asset.mimeType ?? "application/octet-stream", localUri };
}
