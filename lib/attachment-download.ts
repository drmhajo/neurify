import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { hasSaveableAttachmentUri, sanitizeAttachmentFileName } from "@/lib/attachment-download-utils";

export type DownloadResult = "ready" | "unavailable" | "missing";

export async function saveAttachmentToDevice(input: { uri: string; fileName: string; mimeType: string }): Promise<DownloadResult> {
  if (!hasSaveableAttachmentUri(input.uri)) return "missing";
  if (Platform.OS === "web") return "unavailable";
  if (!FileSystem.documentDirectory) return "unavailable";
  const directory = `${FileSystem.documentDirectory}downloads/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const safeName = sanitizeAttachmentFileName(input.fileName);
  const destination = `${directory}${Date.now()}_${safeName}`;
  if (input.uri.startsWith("http://") || input.uri.startsWith("https://")) {
    await FileSystem.downloadAsync(input.uri, destination);
  } else {
    await FileSystem.copyAsync({ from: input.uri, to: destination });
  }
  if (!(await Sharing.isAvailableAsync())) return "unavailable";
  await Sharing.shareAsync(destination, { dialogTitle: "حفظ المرفق", mimeType: input.mimeType });
  return "ready";
}
