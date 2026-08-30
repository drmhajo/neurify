export const STANDARD_WARDS = [
  "200A", "200B", "200G", "200D", "200H", "200L",
  "300A", "300B", "300G", "300M", "300D", "300L", "300H",
  "400A", "400B", "400D", "400H", "400L", "400M",
  "500A", "500B", "500G",
  "Truma ICU", "T1A1", "T1B1", "T1A2", "T1B2", "T1A4", "T1B4",
  "MDU", "T1A5", "T1B5", "T1A6", "T1B6", "PICU", "NICU", "Pedia5", "Pedia4",
] as const;

export type StandardWard = (typeof STANDARD_WARDS)[number];

function wardKey(value: string) {
  return value.trim().toLocaleUpperCase().replace(/[^A-Z0-9]/g, "");
}

const WARD_BY_KEY = new Map(STANDARD_WARDS.map((ward) => [wardKey(ward), ward]));
WARD_BY_KEY.set("TRAUMAICU", "Truma ICU");

export function canonicalWard(value?: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  return WARD_BY_KEY.get(wardKey(trimmed)) ?? trimmed;
}

export function searchStandardWards(query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return [...STANDARD_WARDS];
  return STANDARD_WARDS.filter((ward) => ward.toLocaleLowerCase().includes(normalized) || wardKey(ward).includes(wardKey(normalized)));
}
