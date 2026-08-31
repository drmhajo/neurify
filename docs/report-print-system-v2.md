# Neurify Report Print System V2

The report system uses the same calm, clinically focused identity as the mobile interface. It preserves the official KSMC Neurosurgery emblem, while introducing a restrained Neurify signature, Cairo typography, and a compact hierarchy that remains legible when printed.

| Element | Standard |
| --- | --- |
| Typeface | Cairo, embedded locally in native PDF HTML; Cairo as the Excel preferred font |
| Primary | Indigo `#4956A6` for headers and titles |
| Accent | Jade `#168B7A` for operational cues and status emphasis |
| Surface | Lavender `#EEF0FF`, mint `#E8F7F3`, and soft canvas `#F8F8FC` |
| Tables | Indigo headers, restrained horizontal dividers, alternating soft-canvas rows |
| Direction | Arabic PDFs use `dir="rtl"`; English PDFs use `dir="ltr"` |
| Local assets | Department logo and all Cairo font weights are embedded as data URIs before native PDF rendering |

Every new report template should consume `createReportPrintCss` for PDF HTML and `applyReportWorkbookBranding` for XLSX structure. This prevents a return to isolated legacy palettes or externally loaded print assets.
