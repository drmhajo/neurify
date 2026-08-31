import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";

import { OFFICIAL_LOGO_URL } from "./report-branding";
import type { ReportPrintAssets } from "./report-print-styles";

let printAssetsPromise: Promise<ReportPrintAssets> | undefined;

async function dataUri(moduleId: number, mimeType: string) {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  return `data:${mimeType};base64,${base64}`;
}

/** Embeds departmental print assets locally for native PDF generation. */
export async function getReportPrintAssets(): Promise<ReportPrintAssets> {
  if (!printAssetsPromise) {
    printAssetsPromise = (async () => {
      try {
        const [logoSrc, cairoRegular, cairoSemiBold, cairoBold] = await Promise.all([
          dataUri(require("../assets/images/neurosurgery-department-logo.png"), "image/png"),
          dataUri(require("../assets/fonts/Cairo-Regular.ttf"), "font/ttf"),
          dataUri(require("../assets/fonts/Cairo-SemiBold.ttf"), "font/ttf"),
          dataUri(require("../assets/fonts/Cairo-Bold.ttf"), "font/ttf"),
        ]);
        return { logoSrc, fontCss: `@font-face{font-family:'Neurify Cairo';src:url('${cairoRegular}') format('truetype');font-style:normal;font-weight:400}@font-face{font-family:'Neurify Cairo';src:url('${cairoSemiBold}') format('truetype');font-style:normal;font-weight:600}@font-face{font-family:'Neurify Cairo';src:url('${cairoBold}') format('truetype');font-style:normal;font-weight:700}` };
      } catch {
        return { logoSrc: OFFICIAL_LOGO_URL, fontCss: "" };
      }
    })();
  }
  return printAssetsPromise;
}
