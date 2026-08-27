export const NEUROSURGERY_PROCEDURE_CODES = [
  "craniotomy_tumor_resection",
  "craniotomy_hematoma_evacuation",
  "craniotomy_aneurysm_clipping",
  "cerebral_avm_resection",
  "endoscopic_endonasal_skull_base",
  "transsphenoidal_pituitary_surgery",
  "vp_shunt",
  "external_ventricular_drain",
  "decompressive_craniectomy",
  "acdf",
  "lumbar_decompression_discectomy",
  "lumbar_fusion_instrumentation",
  "spinal_tumor_resection",
  "peripheral_nerve_decompression",
  "other",
] as const;

export type NeurosurgeryProcedureCode = (typeof NEUROSURGERY_PROCEDURE_CODES)[number];
export type ProcedureLanguage = "ar" | "en";

export type NeurosurgeryProcedureOption = {
  code: NeurosurgeryProcedureCode;
  arabicLabel: string;
  englishLabel: string;
};

export const NEUROSURGERY_PROCEDURES: NeurosurgeryProcedureOption[] = [
  { code: "craniotomy_tumor_resection", arabicLabel: "فتح القحف واستئصال ورم", englishLabel: "Craniotomy and tumor resection" },
  { code: "craniotomy_hematoma_evacuation", arabicLabel: "فتح القحف وإخلاء تجمع دموي", englishLabel: "Craniotomy and hematoma evacuation" },
  { code: "craniotomy_aneurysm_clipping", arabicLabel: "فتح القحف وربط أمّ الدم", englishLabel: "Craniotomy and aneurysm clipping" },
  { code: "cerebral_avm_resection", arabicLabel: "استئصال تشوه وعائي دماغي", englishLabel: "Cerebral AVM resection" },
  { code: "endoscopic_endonasal_skull_base", arabicLabel: "جراحة قاعدة الجمجمة بالمنظار الأنفي", englishLabel: "Endoscopic endonasal skull-base surgery" },
  { code: "transsphenoidal_pituitary_surgery", arabicLabel: "جراحة الغدة النخامية عبر الوتدي", englishLabel: "Transsphenoidal pituitary surgery" },
  { code: "vp_shunt", arabicLabel: "تحويلة بطينية صفاقية", englishLabel: "Ventriculoperitoneal shunt" },
  { code: "external_ventricular_drain", arabicLabel: "تصريف بطيني خارجي", englishLabel: "External ventricular drain" },
  { code: "decompressive_craniectomy", arabicLabel: "استئصال قحف تخفيفي", englishLabel: "Decompressive craniectomy" },
  { code: "acdf", arabicLabel: "استئصال قرص وعنق وتثبيت أمامي", englishLabel: "Anterior cervical discectomy and fusion" },
  { code: "lumbar_decompression_discectomy", arabicLabel: "توسيع قطني واستئصال غضروف", englishLabel: "Lumbar decompression and discectomy" },
  { code: "lumbar_fusion_instrumentation", arabicLabel: "تثبيت ودمج فقرات قطنية", englishLabel: "Lumbar fusion and instrumentation" },
  { code: "spinal_tumor_resection", arabicLabel: "استئصال ورم نخاعي", englishLabel: "Spinal tumor resection" },
  { code: "peripheral_nerve_decompression", arabicLabel: "تحرير عصب طرفي", englishLabel: "Peripheral nerve decompression" },
  { code: "other", arabicLabel: "إجراء آخر", englishLabel: "Other procedure" },
];

export function procedureLabel(code: NeurosurgeryProcedureCode, language: ProcedureLanguage) {
  const option = NEUROSURGERY_PROCEDURES.find((item) => item.code === code);
  if (!option) return "";
  return language === "en" ? option.englishLabel : option.arabicLabel;
}
