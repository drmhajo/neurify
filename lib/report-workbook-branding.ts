import * as XLSX from "xlsx";

export const reportWorkbookPalette = {
  navy: "4956A6",
  jade: "168B7A",
  ink: "29364B",
  muted: "6D778C",
  lavender: "EEF0FF",
  mint: "E8F7F3",
  canvas: "F8F8FC",
  line: "E2E4EF",
  white: "FFFFFF",
} as const;

type ReportSheetOptions = {
  language: "ar" | "en";
  titleRows?: number[];
  headerRow?: number;
  freezeAfterRow?: number;
};

const baseCellStyle = {
  font: { name: "Cairo", sz: 10, color: { rgb: reportWorkbookPalette.ink } },
  alignment: { vertical: "center", wrapText: true },
};

/** Applies the Neurify V2 visual hierarchy to an exported XLSX worksheet. */
export function applyReportWorkbookBranding(sheet: XLSX.WorkSheet, options: ReportSheetOptions) {
  const content = sheet as XLSX.WorkSheet & { "!views"?: unknown; "!freeze"?: unknown };
  const ref = sheet["!ref"];
  if (!ref) return;
  const range = XLSX.utils.decode_range(ref);
  const headerRow = options.headerRow;
  const titleRows = new Set(options.titleRows ?? []);
  const dataStartRow = headerRow === undefined ? 0 : headerRow + 1;

  content["!views"] = [{ showGridLines: false, rightToLeft: options.language === "ar" }];
  if (options.freezeAfterRow) content["!freeze"] = { ySplit: options.freezeAfterRow, topLeftCell: `A${options.freezeAfterRow + 1}`, activePane: "bottomLeft", state: "frozen" };

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = sheet[cellAddress];
      if (!cell) continue;
      const isTitle = titleRows.has(row);
      const isHeader = row === headerRow;
      const isStriped = headerRow !== undefined && row >= dataStartRow && (row - dataStartRow) % 2 === 1;
      cell.s = {
        ...baseCellStyle,
        alignment: { vertical: "center", horizontal: isHeader ? "center" : options.language === "ar" ? "right" : "left", wrapText: true },
        border: { bottom: { style: "thin", color: { rgb: reportWorkbookPalette.line } } },
        ...(isTitle ? {
          fill: { patternType: "solid", fgColor: { rgb: row === 0 ? reportWorkbookPalette.navy : reportWorkbookPalette.lavender } },
          font: { name: "Cairo", sz: row === 0 ? 14 : 12, bold: true, color: { rgb: row === 0 ? reportWorkbookPalette.white : reportWorkbookPalette.navy } },
        } : {}),
        ...(isHeader ? {
          fill: { patternType: "solid", fgColor: { rgb: reportWorkbookPalette.navy } },
          font: { name: "Cairo", sz: 10, bold: true, color: { rgb: reportWorkbookPalette.white } },
          border: { bottom: { style: "medium", color: { rgb: reportWorkbookPalette.navy } } },
        } : {}),
        ...(isStriped ? { fill: { patternType: "solid", fgColor: { rgb: reportWorkbookPalette.canvas } } } : {}),
      };
    }
  }
}
