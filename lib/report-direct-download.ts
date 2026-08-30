import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const DOWNLOAD_DIRECTORY_KEY = "neurify.report-download-directory.v1";

export type DirectReportDownloadResult = "downloaded" | "unavailable";

async function getAndroidDownloadDirectory(): Promise<string | null> {
  const savedDirectory = await AsyncStorage.getItem(DOWNLOAD_DIRECTORY_KEY);
  if (savedDirectory) return savedDirectory;

  const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted || !permission.directoryUri) return null;
  await AsyncStorage.setItem(DOWNLOAD_DIRECTORY_KEY, permission.directoryUri);
  return permission.directoryUri;
}

async function writeAndroidDownload(directoryUri: string, fileName: string, mimeType: string, base64: string): Promise<boolean> {
  try {
    const destination = await FileSystem.StorageAccessFramework.createFileAsync(directoryUri, fileName, mimeType);
    await FileSystem.writeAsStringAsync(destination, base64, { encoding: FileSystem.EncodingType.Base64 });
    return true;
  } catch {
    return false;
  }
}

export async function saveReportBase64ToDevice(input: { base64: string; fileName: string; mimeType: string }): Promise<DirectReportDownloadResult> {
  if (Platform.OS !== "android") return "unavailable";
  const directoryUri = await getAndroidDownloadDirectory();
  if (!directoryUri) return "unavailable";

  const saved = await writeAndroidDownload(directoryUri, input.fileName, input.mimeType, input.base64);
  if (saved) return "downloaded";

  await AsyncStorage.removeItem(DOWNLOAD_DIRECTORY_KEY);
  const replacementDirectory = await getAndroidDownloadDirectory();
  if (!replacementDirectory) return "unavailable";
  return (await writeAndroidDownload(replacementDirectory, input.fileName, input.mimeType, input.base64)) ? "downloaded" : "unavailable";
}

export async function saveReportUriToDevice(input: { uri: string; fileName: string; mimeType: string }): Promise<DirectReportDownloadResult> {
  if (Platform.OS !== "android") return "unavailable";
  const base64 = await FileSystem.readAsStringAsync(input.uri, { encoding: FileSystem.EncodingType.Base64 });
  return saveReportBase64ToDevice({ ...input, base64 });
}
