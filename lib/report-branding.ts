/** Department-approved visual identity used only in PDF and print report headers. */
export const OFFICIAL_LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663029677493/faAuaUHZiRmxbDab.png";

function escape(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export function createOfficialReportHeaderHtml(input: { title: string; subtitle: string; language?: "ar" | "en"; logoSrc?: string }) {
  const direction = input.language === "ar" ? "rtl" : "ltr";
  const logo = input.logoSrc ?? OFFICIAL_LOGO_URL;
  return `<header class="official-header" dir="${direction}"><img class="official-logo" src="${logo}" alt="Neurosurgery Department logo" /><div class="official-identity"><p class="official-hospital">مدينة الملك سعود الطبية <span>King Saud Medical City</span></p><h1 class="official-department">قسم جراحة المخ والأعصاب <span>Neurosurgery Department</span></h1></div><div class="official-report"><strong>${escape(input.title)}</strong><span>${escape(input.subtitle)}</span><span class="report-mark"><i>N</i>Neurify</span></div></header>`;
}
