import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import type { DailyShiftReport } from "./department-model";
import { saveReportUriToDevice } from "./report-direct-download";
import { createShiftReportHtml } from "./shift-endorsement";
import { getReportPrintAssets } from "./report-print-theme";

export async function exportShiftReport(report: DailyShiftReport): Promise<"shared" | "downloaded" | "unavailable"> {
  const html = createShiftReportHtml(report, await getReportPrintAssets());
  const fileName = `ksmc-neurosurgery-shift-report-${report.reportDate}.pdf`;
  if (Platform.OS === "web") {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName.replace(/\.pdf$/, ".html");
    anchor.click();
    URL.revokeObjectURL(url);
    return "downloaded";
  }
  const result = await Print.printToFileAsync({ html });
  if (Platform.OS === "android") return saveReportUriToDevice({ uri: result.uri, fileName, mimeType: "application/pdf" });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: "application/pdf", dialogTitle: fileName, UTI: ".pdf" });
  return "shared";
}
