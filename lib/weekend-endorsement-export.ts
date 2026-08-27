import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { createWeekendEndorsementHtml, type WeekendEndorsementReport } from "./weekend-endorsement";

export async function exportWeekendEndorsement(report: WeekendEndorsementReport): Promise<"shared" | "printed"> {
  const html = createWeekendEndorsementHtml(report);
  if (Platform.OS === "web") {
    const windowRef = window.open("", "_blank");
    if (!windowRef) throw new Error("Print window unavailable");
    windowRef.document.write(html);
    windowRef.document.close();
    windowRef.focus();
    windowRef.print();
    return "printed";
  }
  const result = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: "application/pdf", dialogTitle: "ksmc-neurosurgery-weekend-endorsement.pdf", UTI: ".pdf" });
  return "shared";
}
