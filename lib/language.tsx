import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";

export type AppLanguage = "ar" | "en";
type TranslationKey = keyof typeof translations.ar;

const translations = {
  ar: {
    department: "قسم جراحة المخ والأعصاب", hospital: "مدينة الملك سعود الطبية", workspace: "مساحة عمل داخلية لإدارة التنسيق السريري والفرق العلاجية.",
    signIn: "تسجيل الدخول", username: "اسم المستخدم", password: "كلمة المرور", usernameHint: "أدخل اسم المستخدم", passwordHint: "أدخل كلمة المرور", secureSignIn: "دخول آمن", verifying: "جارِ التحقق...", or: "أو", continueGoogle: "المتابعة باستخدام حساب Google", demo: "للعرض التجريبي: اسم المستخدم admin وكلمة المرور Neuro@2026", training: "نسخة تدريبية. لا تستخدم لإدخال بيانات المرضى الفعلية قبل اعتماد التكامل المؤسسي.",
    home: "الرئيسية", reports: "التقارير", schedules: "الجداول", teams: "الفرق", admin: "الإدارة", profile: "حسابي", language: "لغة التطبيق", arabic: "العربية", english: "English", languageHint: "يمكنك تغيير لغة عناصر الواجهة الأساسية في أي وقت.",
    morning: "صباح الخير،", operationalHub: "لوحة متابعة القسم", operationalCopy: "اطلع على العمليات والمناوبات والطلبات ذات الأولوية اليوم.", openRequests: "طلبات مفتوحة", todaySurgeries: "عمليات اليوم", admittedCases: "حالات منوّمة", activeTeams: "فرق علاجية", priorityNow: "الأولوية الآن", viewReports: "عرض التقارير", viewSchedule: "عرض الجدول", quickActions: "إجراءات سريعة", newReport: "طلب تقرير", teamRooms: "غرف الفرق", notifications: "التنبيهات", accessDenied: "تعذر الدخول", checkCredentials: "تحقق من بيانات الدخول.",
  },
  en: {
    department: "Neurosurgery Department", hospital: "King Saud Medical City", workspace: "An internal workspace for clinical coordination and care teams.",
    signIn: "Sign in", username: "Username", password: "Password", usernameHint: "Enter your username", passwordHint: "Enter your password", secureSignIn: "Secure sign in", verifying: "Verifying…", or: "or", continueGoogle: "Continue with Google", demo: "Demo access: username admin, password Neuro@2026", training: "Training version. Do not enter real patient data before institutional approval.",
    home: "Home", reports: "Reports", schedules: "Schedules", teams: "Teams", admin: "Admin", profile: "My account", language: "App language", arabic: "العربية", english: "English", languageHint: "You can change the primary interface language at any time.",
    morning: "Good morning,", operationalHub: "Department command center", operationalCopy: "Review today’s surgeries, shifts, and priority requests.", openRequests: "Open requests", todaySurgeries: "Today’s surgeries", admittedCases: "Admitted cases", activeTeams: "Care teams", priorityNow: "Priority now", viewReports: "View reports", viewSchedule: "View schedule", quickActions: "Quick actions", newReport: "New report", teamRooms: "Team rooms", notifications: "Alerts", accessDenied: "Sign-in unavailable", checkCredentials: "Check your sign-in details.",
  },
} as const;

const englishTerms: Record<string, string> = {
  "جديد": "New", "قيد الإعداد": "In progress", "مكتمل": "Completed", "عاجل": "Urgent", "عادي": "Standard", "متابعة": "Follow-up", "مؤكد": "Confirmed", "قيد التحضير": "Preparing", "بانتظار مراجعة": "Awaiting review", "منوّم": "Admitted", "جاهز للخروج": "Ready for discharge", "صباحي": "Morning", "مسائي": "Evening", "ليلي": "Night",
  "التقارير الطبية": "Medical reports", "طلب تقرير جديد": "New report request", "إضافة تقرير": "Add report", "تحديث الحالة": "Update status", "لا توجد تقارير": "No reports found", "الجداول التشغيلية": "Operational schedules", "المناوبات": "Shifts", "الأسبوعي": "Weekly", "العمليات": "Surgeries", "إضافة مناوبة": "Add shift", "إضافة عملية": "Add surgery", "حفظ في الجدول": "Save to schedule", "ملفات الجدول المرجعية": "Schedule source files", "مرجع PDF": "PDF source", "الفرق العلاجية": "Care teams", "غرف الفريق": "Team rooms", "استشارة جديدة": "New consultation", "حالة منوّمة جديدة": "New admitted case", "إضافة استشارة": "Add consultation", "إضافة حالة": "Add case", "الملف الطبي": "Medical record", "الملف": "Record", "الأشعة": "Imaging", "الدردشة": "Chat", "ملخص الحالة": "Case summary", "تعديل الملف": "Edit record", "رقم الملف": "Medical record no.", "اسم المريض": "Patient name", "العمر": "Age", "التاريخ المرضي": "Medical history", "الاختبارات السريرية": "Clinical findings", "التشخيص": "Diagnosis", "إضافة أشعة": "Add imaging", "مرفقات تشخيصية": "Diagnostic attachments", "إضافة أشعة تشخيصية": "Add diagnostic imaging", "إضافة إلى الملف": "Add to record", "الدردشة الخاصة": "Private chat", "بدء أول رسالة": "Start the first message", "إرسال": "Send", "العودة للفرق": "Back to teams", "تعديل الملف الطبي": "Edit medical record", "حفظ التعديلات": "Save changes",
  "لوحة تحكم القسم": "Department admin", "نظرة عامة": "Overview", "المستخدمون": "Users", "الأدوار": "Roles", "إدارة الوصول التشغيلية": "Operational access management", "إدارة المستخدمين": "User management", "مصفوفة الصلاحيات": "Permission matrix", "ملخص الفرق العلاجية": "Care teams summary", "عرض الكل": "View all", "إضافة مستخدم جديد": "Add user", "إنشاء المستخدم": "Create user", "حالة الحساب": "Account status", "إسناد الفرق": "Team assignment", "حفظ الوصول والصلاحيات": "Save access & permissions", "إنشاء فريق طبي": "Create care team", "تعديل الفريق الطبي": "Edit care team", "حفظ تعديلات الفريق": "Save team changes", "الإشعارات": "Notifications", "تحديد الكل كمقروء": "Mark all as read", "لا توجد إشعارات": "No notifications", "الانتماءات": "Membership", "نطاق الوصول": "Access scope", "الإشعارات الفورية": "Push notifications", "الخصوصية": "Privacy", "تسجيل الخروج": "Sign out", "رجوع": "Back", "إضافة": "Add", "تعديل": "Edit", "حفظ": "Save", "إلغاء": "Cancel", "بيانات ناقصة": "Missing information", "فريق مطلوب": "Team required", "غير موثق": "Not documented", "الآن": "Now", "اليوم": "Today", "غداً": "Tomorrow",
};

type LanguageContextValue = { language: AppLanguage; setLanguage: (language: AppLanguage) => void; isRTL: boolean; t: (key: TranslationKey) => string; localize: (value: string) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);
const LANGUAGE_KEY = "ksmc-neuro.language.v1";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("ar");
  useEffect(() => { AsyncStorage.getItem(LANGUAGE_KEY).then((value) => { if (value === "ar" || value === "en") setLanguageState(value); }).catch(() => undefined); }, []);
  useEffect(() => { if (Platform.OS === "web" && typeof document !== "undefined") { document.documentElement.lang = language; document.documentElement.dir = language === "ar" ? "rtl" : "ltr"; } }, [language]);
  const value = useMemo<LanguageContextValue>(() => ({ language, isRTL: language === "ar", setLanguage: (next) => { setLanguageState(next); AsyncStorage.setItem(LANGUAGE_KEY, next).catch(() => undefined); }, t: (key) => translations[language][key], localize: (value) => language === "en" ? englishTerms[value] ?? value : value }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useAppLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useAppLanguage must be used inside LanguageProvider");
  return context;
}
