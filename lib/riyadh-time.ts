export const RIYADH_TIME_ZONE = "Asia/Riyadh";

function asDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function localeFor(language: "ar" | "en") {
  return language === "ar" ? "ar-SA" : "en-GB";
}

export function formatRiyadhDate(value: string | Date, language: "ar" | "en" = "en") {
  return new Intl.DateTimeFormat(localeFor(language), { timeZone: RIYADH_TIME_ZONE, day: "2-digit", month: "short", year: "numeric" }).format(asDate(value));
}

export function formatRiyadhDateTime(value: string | Date, language: "ar" | "en" = "en") {
  return new Intl.DateTimeFormat(localeFor(language), { timeZone: RIYADH_TIME_ZONE, dateStyle: "medium", timeStyle: "short", hour12: false }).format(asDate(value));
}

export function getRiyadhDateKey(value = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: RIYADH_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
