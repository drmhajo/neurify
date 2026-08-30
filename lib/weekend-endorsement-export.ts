import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import * as XLSX from "xlsx";
import { saveReportBase64ToDevice, saveReportUriToDevice } from "./report-direct-download";
import { createWeekendEndorsementHtml, type WeekendEndorsementReport } from "./weekend-endorsement";
import { createWeekendEndorsementWorkbook, weekendEndorsementExportFileName, type WeekendEndorsementExportLanguage } from "./weekend-endorsement-export-data";

export { createWeekendEndorsementWorkbook, weekendEndorsementExcelRows, weekendEndorsementExportFileName } from "./weekend-endorsement-export-data";
export type { WeekendEndorsementExportLanguage } from "./weekend-endorsement-export-data";
export type WeekendEndorsementExportResult = "shared" | "downloaded" | "print-opened" | "unavailable";

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportWeekendEndorsementPdf(report: WeekendEndorsementReport): Promise<WeekendEndorsementExportResult> {
  const html = createWeekendEndorsementHtml(report);
  const fileName = weekendEndorsementExportFileName(report, "pdf");
  if (Platform.OS === "web") {
    const popup = window.open("", "_blank");
    if (!popup) return "unavailable";
    popup.document.write(html);
    popup.document.close();
    window.setTimeout(() => { popup.focus(); popup.print(); }, 180);
    return "print-opened";
  }
  const result = await Print.printToFileAsync({ html });
  if (Platform.OS === "android") return saveReportUriToDevice({ uri: result.uri, fileName, mimeType: "application/pdf" });
  if (!(await Sharing.isAvailableAsync())) return "unavailable";
  await Sharing.shareAsync(result.uri, { mimeType: "application/pdf", dialogTitle: fileName, UTI: ".pdf" });
  return "shared";
}

export async function exportWeekendEndorsementExcel(report: WeekendEndorsementReport, language: WeekendEndorsementExportLanguage): Promise<WeekendEndorsementExportResult> {
  const fileName = weekendEndorsementExportFileName(report, "xlsx");
  const base64 = XLSX.write(createWeekendEndorsementWorkbook(report, language), { bookType: "xlsx", type: "base64", compression: true });
  const mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (Platform.OS === "web") {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    downloadBlob(new Blob([bytes], { type: mimeType }), fileName);
    return "downloaded";
  }
  if (Platform.OS === "android") return saveReportBase64ToDevice({ base64, fileName, mimeType });
  if (!FileSystem.documentDirectory || !(await Sharing.isAvailableAsync())) return "unavailable";
  const folder = `${FileSystem.documentDirectory}exports/`;
  await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
  const uri = `${folder}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  await Sharing.shareAsync(uri, { mimeType, dialogTitle: fileName, UTI: "org.openxmlformats.spreadsheetml.sheet" });
  return "shared";
}

/** @deprecated Use exportWeekendEndorsementPdf for an explicit PDF action. */
export const exportWeekendEndorsement = exportWeekendEndorsementPdf;
