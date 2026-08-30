export const NEUROSURGERY_DIAGNOSIS_CODES = [
  "brain_tumor",
  "pituitary_tumor",
  "hydrocephalus",
  "traumatic_brain_injury",
  "acute_subdural_hematoma",
  "epidural_hematoma",
  "intracerebral_hemorrhage",
  "cerebral_aneurysm",
  "cerebral_avm",
  "brain_abscess",
  "spinal_cord_compression",
  "cervical_disc_disease",
  "lumbar_disc_prolapse",
  "lumbar_spinal_stenosis",
  "spinal_tumor",
  "cauda_equina_syndrome",
  "trigeminal_neuralgia",
  "other",
] as const;

export type NeurosurgeryDiagnosisCode = (typeof NEUROSURGERY_DIAGNOSIS_CODES)[number];
export type DiagnosisLanguage = "ar" | "en";

export type NeurosurgeryDiagnosisOption = {
  code: NeurosurgeryDiagnosisCode;
  arabicLabel: string;
  englishLabel: string;
};

export const NEUROSURGERY_DIAGNOSES: NeurosurgeryDiagnosisOption[] = [
  { code: "brain_tumor", arabicLabel: "ورم دماغي", englishLabel: "Brain tumor" },
  { code: "pituitary_tumor", arabicLabel: "ورم الغدة النخامية", englishLabel: "Pituitary tumor" },
  { code: "hydrocephalus", arabicLabel: "استسقاء دماغي", englishLabel: "Hydrocephalus" },
  { code: "traumatic_brain_injury", arabicLabel: "إصابة دماغية رضّية", englishLabel: "Traumatic brain injury" },
  { code: "acute_subdural_hematoma", arabicLabel: "تجمع دموي تحت الجافية حاد", englishLabel: "Acute subdural hematoma" },
  { code: "epidural_hematoma", arabicLabel: "تجمع دموي فوق الجافية", englishLabel: "Epidural hematoma" },
  { code: "intracerebral_hemorrhage", arabicLabel: "نزف دماغي", englishLabel: "Intracerebral hemorrhage" },
  { code: "cerebral_aneurysm", arabicLabel: "أم الدم الدماغية", englishLabel: "Cerebral aneurysm" },
  { code: "cerebral_avm", arabicLabel: "تشوه شرياني وريدي دماغي", englishLabel: "Cerebral arteriovenous malformation" },
  { code: "brain_abscess", arabicLabel: "خراج دماغي", englishLabel: "Brain abscess" },
  { code: "spinal_cord_compression", arabicLabel: "ضغط الحبل الشوكي", englishLabel: "Spinal cord compression" },
  { code: "cervical_disc_disease", arabicLabel: "مرض القرص العنقي", englishLabel: "Cervical disc disease" },
  { code: "lumbar_disc_prolapse", arabicLabel: "انزلاق غضروفي قطني", englishLabel: "Lumbar disc prolapse" },
  { code: "lumbar_spinal_stenosis", arabicLabel: "تضيق القناة الشوكية القطنية", englishLabel: "Lumbar spinal stenosis" },
  { code: "spinal_tumor", arabicLabel: "ورم نخاعي", englishLabel: "Spinal tumor" },
  { code: "cauda_equina_syndrome", arabicLabel: "متلازمة ذيل الفرس", englishLabel: "Cauda equina syndrome" },
  { code: "trigeminal_neuralgia", arabicLabel: "ألم العصب الخامس", englishLabel: "Trigeminal neuralgia" },
  { code: "other", arabicLabel: "تشخيص آخر", englishLabel: "Other diagnosis" },
];

export function diagnosisLabel(code: NeurosurgeryDiagnosisCode, language: DiagnosisLanguage) {
  const option = NEUROSURGERY_DIAGNOSES.find((item) => item.code === code);
  if (!option) return "";
  return language === "en" ? option.englishLabel : option.arabicLabel;
}
