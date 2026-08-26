import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export type PickedChatAttachment = { fileName: string; mimeType: string; localUri: string; kind: "video" | "file" };

export async function pickChatAttachment(): Promise<PickedChatAttachment | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  let localUri = asset.uri;
  if (Platform.OS !== "web" && FileSystem.documentDirectory) {
    const directory = `${FileSystem.documentDirectory}patient-chat/`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const name = asset.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const destination = `${directory}${Date.now()}_${name}`;
    await FileSystem.copyAsync({ from: asset.uri, to: destination });
    localUri = destination;
  }
  const mimeType = asset.mimeType ?? "application/octet-stream";
  return { fileName: asset.name, mimeType, localUri, kind: mimeType.startsWith("video/") ? "video" : "file" };
}
